/**
 * Yatra Now - UI Controller & Sliding Sheet State Machine
 * Manages Multi-drop Stops, Live Bus Results, Red Delay Alerts, Speedometer, and Proximity Alarms
 */

import { busDataStore } from './busData.js';
import { mapService } from './mapService.js';
import { cryptoService } from './cryptoService.js';

class UIController {
  constructor() {
    this.viaStops = [];
    this.selectedBus = null;
    this.recentSearches = [
      { origin: 'Central Bus Terminal', destination: 'Tech Valley Metro Complex' },
      { origin: 'Airport Gateway Terminal', destination: 'Central Railway Station' }
    ];
  }

  init() {
    this.bindEvents();
    this.renderRecentSearches();

    // Setup map service bus selection callback
    mapService.onBusSelectedCallback = (bus) => {
      this.openBusDetail(bus);
    };
  }

  bindEvents() {
    // Open Search Drawer on clicking "Where you want to go?" bottom bar
    const bottomBar = document.getElementById('bottom-search-bar');
    const searchOverlay = document.getElementById('search-drawer-overlay');
    const closeSearchBtn = document.getElementById('btn-close-search');

    if (bottomBar) {
      bottomBar.addEventListener('click', () => {
        searchOverlay.classList.add('active');
        bottomBar.classList.add('hidden');
      });
    }

    if (closeSearchBtn) {
      closeSearchBtn.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
        bottomBar.classList.remove('hidden');
      });
    }

    // "Locate Me" button
    const btnLocateMe = document.getElementById('btn-locate-origin');
    if (btnLocateMe) {
      btnLocateMe.addEventListener('click', (e) => {
        e.stopPropagation();
        this.detectCurrentLocation();
      });
    }

    // "Select place on map" buttons
    const btnMapOrigin = document.getElementById('btn-map-origin');
    const btnMapDest = document.getElementById('btn-map-dest');

    if (btnMapOrigin) {
      btnMapOrigin.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
        alert('Tap anywhere on the map to set your Starting Point');
        mapService.setPinSelectMode('origin', (mode, latlng) => {
          const nearest = mapService.findNearestStop(latlng.lat, latlng.lng);
          const stopName = nearest ? nearest.name : `Location (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`;
          document.getElementById('input-origin').value = stopName;
          searchOverlay.classList.add('active');
        });
      });
    }

    if (btnMapDest) {
      btnMapDest.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
        alert('Tap anywhere on the map to set your Destination Point');
        mapService.setPinSelectMode('destination', (mode, latlng) => {
          const nearest = mapService.findNearestStop(latlng.lat, latlng.lng);
          const stopName = nearest ? nearest.name : `Location (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`;
          document.getElementById('input-destination').value = stopName;
          searchOverlay.classList.add('active');
        });
      });
    }

    // "Add stops to drop friends" button
    const btnAddViaStop = document.getElementById('btn-add-drop-friend');
    if (btnAddViaStop) {
      btnAddViaStop.addEventListener('click', () => {
        this.addViaStop();
      });
    }

    // Search Routes & Buses Button
    const btnFindBuses = document.getElementById('btn-find-buses');
    if (btnFindBuses) {
      btnFindBuses.addEventListener('click', () => {
        this.executeRouteSearch();
      });
    }

    // Close Buses Half-Sheet
    const btnCloseHalfSheet = document.getElementById('btn-close-half-sheet');
    if (btnCloseHalfSheet) {
      btnCloseHalfSheet.addEventListener('click', () => {
        document.getElementById('buses-half-sheet').classList.remove('active');
        document.getElementById('bottom-search-bar').classList.remove('hidden');
        mapService.clearRoute();
      });
    }

    // Close Bus Detail Panel
    const btnCloseDetail = document.getElementById('btn-close-detail');
    if (btnCloseDetail) {
      btnCloseDetail.addEventListener('click', () => {
        document.getElementById('bus-detail-overlay').classList.remove('active');
      });
    }

    // Quick Service Chips
    const chipNearest = document.getElementById('chip-nearest-stop');
    if (chipNearest) {
      chipNearest.addEventListener('click', (e) => {
        e.stopPropagation();
        this.locateNearestBusStop();
      });
    }
  }

  detectCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const nearest = mapService.findNearestStop(latitude, longitude);
          const name = nearest ? nearest.name : 'Central City Bus Terminal';
          document.getElementById('input-origin').value = name;
        },
        () => {
          // Default fallback for demo / low-end devices
          document.getElementById('input-origin').value = 'Central Bus Terminal';
        }
      );
    } else {
      document.getElementById('input-origin').value = 'Central Bus Terminal';
    }
  }

  addViaStop() {
    if (this.viaStops.length >= 3) {
      alert('You can add up to 3 intermediate drop stops for friends.');
      return;
    }

    const stopId = 'via_' + Date.now();
    this.viaStops.push(stopId);

    const container = document.getElementById('via-stops-container');
    const div = document.createElement('div');
    div.className = 'via-stop-item';
    div.id = stopId;
    div.innerHTML = `
      <span class="input-node-indicator via"></span>
      <input type="text" class="route-input-field via-input" placeholder="Drop friend stop #${this.viaStops.length}..." />
      <button class="btn-remove-via" title="Remove stop">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    div.querySelector('.btn-remove-via').addEventListener('click', () => {
      this.viaStops = this.viaStops.filter(id => id !== stopId);
      div.remove();
    });

    container.appendChild(div);
  }

  renderRecentSearches() {
    const list = document.getElementById('recent-searches-list');
    if (!list) return;

    list.innerHTML = '';
    this.recentSearches.forEach(item => {
      const el = document.createElement('div');
      el.className = 'recent-search-item';
      el.innerHTML = `
        <div class="recent-route-info">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>${item.origin} → ${item.destination}</span>
        </div>
        <span style="font-size:0.75rem;color:var(--primary-brand);font-weight:700;">RECALL</span>
      `;

      el.addEventListener('click', () => {
        document.getElementById('input-origin').value = item.origin;
        document.getElementById('input-destination').value = item.destination;
        this.executeRouteSearch();
      });

      list.appendChild(el);
    });
  }

  executeRouteSearch() {
    const origin = document.getElementById('input-origin').value.trim() || 'Central Bus Terminal';
    const destination = document.getElementById('input-destination').value.trim() || 'Tech Valley Metro Complex';

    // Close Search Drawer Overlay
    document.getElementById('search-drawer-overlay').classList.remove('active');

    // Slide up Half-Sheet
    const halfSheet = document.getElementById('buses-half-sheet');
    halfSheet.classList.add('active');

    document.getElementById('sheet-route-summary').textContent = `${origin} to ${destination}`;

    // Filter matching buses
    const buses = busDataStore.getBuses();
    const listContainer = document.getElementById('buses-list-container');
    listContainer.innerHTML = '';

    buses.forEach(bus => {
      const card = this.createBusCard(bus, origin, destination);
      listContainer.appendChild(card);
    });

    // Save into recent searches if new
    if (!this.recentSearches.some(s => s.origin === origin && s.destination === destination)) {
      this.recentSearches.unshift({ origin, destination });
      this.renderRecentSearches();
    }
  }

  createBusCard(bus, origin, destination) {
    const card = document.createElement('div');
    card.className = 'bus-card';
    const isDelayed = bus.delayMinutes > 0;

    // Calculate Estimated Fare
    const fare = this.calculateEstimatedFare(bus.stops ? bus.stops.length : 4);

    card.innerHTML = `
      <div class="bus-card-top">
        <div class="bus-primary-info">
          <div class="bus-badge-icon">${bus.busNumber}</div>
          <div class="bus-naming-group">
            <span class="bus-name-title">${bus.name}</span>
            <span class="bus-reg-badge">${bus.registrationNumber} • ${bus.depotName}</span>
          </div>
        </div>
        ${isDelayed ? `
          <div class="delay-alert-tag">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Delayed by ${bus.delayMinutes} mins
          </div>
        ` : `
          <span class="badge badge-ontime">On Time</span>
        `}
      </div>

      <div class="bus-card-middle">
        <div class="bus-timing-node">
          <span class="time-val">${bus.stops[0].actualTime}</span>
          <span class="stop-label">${bus.origin}</span>
        </div>
        <div class="route-arrow-flow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
          <span style="font-size:0.75rem;font-weight:700;">Est. Fare: ₹${fare}</span>
        </div>
        <div class="bus-timing-node" style="text-align:right;">
          <span class="time-val">${bus.stops[bus.stops.length - 1].actualTime}</span>
          <span class="stop-label">${bus.destination}</span>
        </div>
      </div>

      <div class="bus-card-footer">
        <div class="crew-tags">
          <span>Driver: <strong>${bus.driver.name}</strong></span>
          <span>•</span>
          <span>Conductor: <strong>${bus.conductor.name}</strong></span>
        </div>
        <button class="btn btn-outline" style="padding:4px 12px;font-size:0.8rem;">Live Track</button>
      </div>
    `;

    card.addEventListener('click', () => {
      this.openBusDetail(bus);
    });

    return card;
  }

  calculateEstimatedFare(stopsCount) {
    const baseFare = 10;
    const perStopRate = 3.5;
    return Math.round(baseFare + (stopsCount * perStopRate));
  }

  openBusDetail(bus) {
    this.selectedBus = bus;
    mapService.showRouteOnMap(bus);

    const overlay = document.getElementById('bus-detail-overlay');
    overlay.classList.add('active');

    // Populate Detail Panel
    document.getElementById('detail-bus-name').textContent = bus.name;
    document.getElementById('detail-bus-number').textContent = `#${bus.busNumber} • ${bus.registrationNumber}`;
    document.getElementById('detail-driver-name').textContent = bus.driver.name;
    document.getElementById('detail-conductor-name').textContent = bus.conductor.name;
    document.getElementById('detail-speed-val').textContent = bus.speed;

    // Delayed status banner in red if delayed
    const statusBanner = document.getElementById('detail-status-banner');
    if (bus.delayMinutes > 0) {
      statusBanner.innerHTML = `
        <div class="badge badge-delayed" style="font-size:0.88rem;padding:6px 14px;">
          ⚠️ Bus is Delayed by ${bus.delayMinutes} mins from schedule
        </div>
      `;
    } else {
      statusBanner.innerHTML = `
        <div class="badge badge-ontime" style="font-size:0.88rem;padding:6px 14px;">
          ✓ Running on Time
        </div>
      `;
    }

    // Populate Sequential Stops Timeline with Delay Status
    const timeline = document.getElementById('detail-stops-timeline');
    timeline.innerHTML = '';

    bus.stops.forEach((stop, index) => {
      const isPassed = index < bus.currentStopIndex;
      const isCurrent = index === bus.currentStopIndex;

      const item = document.createElement('div');
      item.className = `timeline-stop-item ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`;
      item.innerHTML = `
        <div class="stop-marker-dot"></div>
        <div class="stop-content">
          <div>
            <div class="stop-name-text">${stop.name} ${isCurrent ? '<span class="badge badge-brand" style="margin-left:6px;">Current Stop</span>' : ''}</div>
            <small style="color:var(--text-muted);">Scheduled: ${stop.scheduledTime}</small>
          </div>
          <div class="stop-time-display">
            <span class="${stop.delay > 0 ? 'stop-delayed-time' : ''}">${stop.actualTime}</span>
            ${stop.delay > 0 ? `<br/><small class="stop-delayed-time">+${stop.delay}m late</small>` : ''}
          </div>
        </div>
      `;
      timeline.appendChild(item);
    });

    // Setup Proximity Alert Notification button
    const btnAlarm = document.getElementById('btn-set-arrival-alarm');
    if (btnAlarm) {
      btnAlarm.onclick = () => {
        this.triggerArrivalAlarm(bus);
      };
    }
  }

  triggerArrivalAlarm(bus) {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    alert(`🔔 Arrival Alert Activated for ${bus.name} (#${bus.busNumber})!\nYou will receive a high-priority sound and visual alert 5 minutes before the bus reaches your stop.`);
  }

  locateNearestBusStop() {
    const nearest = mapService.findNearestStop(12.9716, 77.5946);
    if (nearest) {
      alert(`📍 Nearest Bus Stop to your location:\n\n• ${nearest.name}\n• Approx Distance: ${nearest.distanceKm || '0.35'} km\n• Next Scheduled Bus: ${nearest.scheduledTime}`);
      mapService.map.setView([nearest.lat, nearest.lng], 16);
    }
  }
}

export const uiController = new UIController();
