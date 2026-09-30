/**
 * Yatra Now - Leaflet OpenStreetMap Engine
 * Optimized for Low-End Smartphones using HTML5 Canvas Rendering
 * Real-time bus animation, route polylines, nearest stop locator, pin selector
 */

import { busDataStore } from './busData.js';

class MapService {
  constructor() {
    this.map = null;
    this.busMarkers = {};
    this.routePolyline = null;
    this.stopMarkers = [];
    this.userLocationMarker = null;
    this.pinSelectMode = null; // 'origin' | 'destination' | null
    this.onPinSelectedCallback = null;
    this.onBusSelectedCallback = null;
  }

  init(containerId) {
    // Canvas mode to drastically lower memory on 1GB-2GB RAM phones
    this.map = L.map(containerId, {
      center: [12.9716, 77.5946], // Bangalore central coords
      zoom: 13,
      preferCanvas: true,
      zoomControl: false
    });

    // Add zoom control at top right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Free OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | Yatra Now'
    }).addTo(this.map);

    // Click handler for "Select Place on Map"
    this.map.on('click', (e) => {
      if (this.pinSelectMode && this.onPinSelectedCallback) {
        this.onPinSelectedCallback(this.pinSelectMode, e.latlng);
        this.setPinSelectMode(null);
      }
    });

    // Render Initial Buses
    this.refreshBuses();

    // Start Real-Time Bus Telemetry Simulation
    this.startLiveSimulation();
  }

  setPinSelectMode(mode, callback) {
    this.pinSelectMode = mode;
    this.onPinSelectedCallback = callback;
    const container = this.map.getContainer();
    if (mode) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
  }

  createBusIcon(bus) {
    const isDelayed = bus.delayMinutes > 0;
    const badgeColor = isDelayed ? '#dc2626' : '#ba5a0b';
    const html = `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        background: #ffffff;
        border: 2.5px solid ${badgeColor};
        border-radius: 50%;
        box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        transform: rotate(${bus.bearing || 0}deg);
        transition: transform 0.4s ease;
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="${badgeColor}">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
        ${isDelayed ? '<span style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#dc2626;border-radius:50%;border:2px solid #fff;"></span>' : ''}
      </div>
    `;

    return L.divIcon({
      className: 'custom-bus-marker',
      html: html,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
  }

  refreshBuses() {
    const buses = busDataStore.getBuses();
    buses.forEach(bus => {
      if (bus.status === 'running') {
        if (!this.busMarkers[bus.id]) {
          const marker = L.marker(bus.currentPosition, {
            icon: this.createBusIcon(bus)
          }).addTo(this.map);

          marker.on('click', () => {
            if (this.onBusSelectedCallback) {
              this.onBusSelectedCallback(bus);
            }
          });

          this.busMarkers[bus.id] = marker;
        } else {
          this.busMarkers[bus.id].setLatLng(bus.currentPosition);
          this.busMarkers[bus.id].setIcon(this.createBusIcon(bus));
        }
      } else {
        // Remove idle bus from active tracking map
        if (this.busMarkers[bus.id]) {
          this.map.removeLayer(this.busMarkers[bus.id]);
          delete this.busMarkers[bus.id];
        }
      }
    });
  }

  showRouteOnMap(bus) {
    this.clearRoute();
    if (!bus.stops || bus.stops.length === 0) return;

    const latlngs = bus.stops.map(st => [st.lat, st.lng]);

    // Draw Route Polyline in Primary Brand Color #ba5a0b
    this.routePolyline = L.polyline(latlngs, {
      color: '#ba5a0b',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8'
    }).addTo(this.map);

    // Add Stop Markers
    bus.stops.forEach((stop, index) => {
      const isStart = index === 0;
      const isEnd = index === bus.stops.length - 1;
      const markerHtml = `
        <div style="
          width: ${isStart || isEnd ? '20px' : '14px'};
          height: ${isStart || isEnd ? '20px' : '14px'};
          border-radius: 50%;
          background: ${isStart ? '#16a34a' : isEnd ? '#dc2626' : '#ffffff'};
          border: 3px solid #ba5a0b;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `;

      const stopMarker = L.marker([stop.lat, stop.lng], {
        icon: L.divIcon({
          className: 'stop-pin-icon',
          html: markerHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(this.map);

      stopMarker.bindPopup(`
        <div style="font-family:'Outfit',sans-serif;padding:4px;">
          <strong style="color:#ba5a0b;">${stop.name}</strong><br/>
          <small>Scheduled: ${stop.scheduledTime}</small><br/>
          ${stop.delay > 0 ? `<span style="color:#dc2626;font-weight:bold;">Delayed by ${stop.delay} mins</span>` : '<span style="color:#16a34a;font-weight:bold;">On Time</span>'}
        </div>
      `);

      this.stopMarkers.push(stopMarker);
    });

    // Fit map view smoothly to full route
    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50] });
  }

  clearRoute() {
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }
    this.stopMarkers.forEach(m => this.map.removeLayer(m));
    this.stopMarkers = [];
  }

  /**
   * Finds Nearest Bus Stop to coordinates using Haversine formula
   */
  findNearestStop(userLat, userLng) {
    const allStops = [];
    busDataStore.getBuses().forEach(b => {
      b.stops.forEach(s => {
        if (!allStops.some(existing => existing.name === s.name)) {
          allStops.push(s);
        }
      });
    });

    let nearest = null;
    let minDistance = Infinity;

    allStops.forEach(stop => {
      const d = this.calculateDistance(userLat, userLng, stop.lat, stop.lng);
      if (d < minDistance) {
        minDistance = d;
        nearest = { ...stop, distanceKm: d.toFixed(2) };
      }
    });

    return nearest;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Smooth live GPS simulator for buses
  startLiveSimulation() {
    setInterval(() => {
      const buses = busDataStore.getBuses();
      buses.forEach(bus => {
        if (bus.status === 'running' && bus.stops && bus.stops.length > 1) {
          // Subtle incremental movement
          const latJitter = (Math.random() - 0.48) * 0.0006;
          const lngJitter = (Math.random() - 0.48) * 0.0006;
          bus.currentPosition[0] += latJitter;
          bus.currentPosition[1] += lngJitter;

          // Vary speed dynamically around 35-55 km/h
          bus.speed = Math.min(65, Math.max(25, bus.speed + Math.floor(Math.random() * 5) - 2));

          if (this.busMarkers[bus.id]) {
            this.busMarkers[bus.id].setLatLng(bus.currentPosition);
          }
        }
      });
    }, 3000); // 3-second update throttle (saves low-end phone battery)
  }
}

export const mapService = new MapService();
