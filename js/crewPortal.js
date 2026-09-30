/**
 * Yatra Now - Bus Driver & Conductor Mobile Console
 * Daily Duty Bus Selection, Live Trip Broadcaster, and Instant Breakdown/Damage Reporter
 */

import { busDataStore } from './busData.js';
import { cryptoService } from './cryptoService.js';
import { authService } from './authService.js';

class CrewPortal {
  constructor() {
    this.container = null;
    this.selectedBusId = 'bus_101';
    this.isTripActive = false;
    this.tripInterval = null;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.render();
    this.bindEvents();
  }

  render() {
    const buses = busDataStore.getBuses();
    const depots = busDataStore.getDepots();
    const currentBus = buses.find(b => b.id === this.selectedBusId) || buses[0];

    this.container.innerHTML = `
      <div class="crew-console-wrapper">
        <div class="trip-status-hero">
          <span class="badge ${this.isTripActive ? 'badge-ontime' : 'badge-brand'}" style="font-size:0.9rem;padding:6px 16px;">
            ${this.isTripActive ? '📡 Live Broadcasting GPS to Passengers' : '⏸️ Trip Off Duty'}
          </span>
          <h2 style="font-size:1.8rem;font-weight:900;margin-top:12px;color:var(--text-main);">${currentBus.name}</h2>
          <p style="font-size:1rem;color:var(--primary-brand);font-weight:700;">Reg No: ${currentBus.registrationNumber} (Route #${currentBus.busNumber})</p>
          <p style="font-size:0.85rem;color:var(--text-muted);">${currentBus.origin} ➔ ${currentBus.destination}</p>

          <button id="btn-toggle-trip" class="trip-toggle-btn ${this.isTripActive ? 'btn-danger' : 'btn-primary'}">
            ${this.isTripActive ? '🛑 STOP CURRENT TRIP' : '▶️ START TODAY\'S TRIP'}
          </button>
        </div>

        <!-- Daily Duty Selection (Depot & Bus Registration) -->
        <div class="duty-selector-box">
          <h3 style="font-size:1rem;font-weight:800;color:var(--text-main);margin-bottom:12px;">
            📋 Daily Duty Registration
          </h3>
          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label">Select Operating Depot Branch</label>
            <select id="crew-depot-select" class="form-select">
              ${depots.map(d => `
                <option value="${d.id}">${d.name} (${d.location})</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Select Assigned Bus Registration</label>
            <select id="crew-bus-select" class="form-select">
              ${buses.map(b => `
                <option value="${b.id}" ${b.id === this.selectedBusId ? 'selected' : ''}>
                  ${b.registrationNumber} - ${b.name} (#${b.busNumber})
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Real-Time Speed & Telemetry Preview -->
        <div class="duty-selector-box" style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h4 style="font-size:0.85rem;color:var(--text-muted);">Current Telemetry Speed</h4>
            <div style="font-size:2rem;font-weight:900;color:var(--primary-brand);">${currentBus.speed} <small style="font-size:0.9rem;">km/h</small></div>
          </div>
          <button id="btn-announce-stop" class="btn btn-outline" style="font-size:0.85rem;">
            🔊 Announce Next Stop
          </button>
        </div>

        <!-- Emergency Incident & Vehicle Breakdown Reporting -->
        <div class="duty-selector-box">
          <h3 style="font-size:1rem;font-weight:800;color:var(--color-delayed);display:flex;align-items:center;gap:6px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Instant Issue & Breakdown Reporter
          </h3>
          <p style="font-size:0.82rem;color:var(--text-muted);">
            Broadcasting a breakdown immediately displays red delay alerts on passenger apps and notifies the depot master.
          </p>

          <div class="incident-report-grid">
            <button class="incident-btn" data-issue="Vehicle Breakdown">
              ⚠️ Vehicle Breakdown
            </button>
            <button class="incident-btn" data-issue="Tire Puncture / Flat">
              ⚙️ Tire Puncture
            </button>
            <button class="incident-btn" data-issue="Traffic Gridlock (Late)">
              ⏱️ Traffic Delay (+20m)
            </button>
            <button class="incident-btn" data-issue="Accident / Obstruction">
              🚨 Road Obstruction
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const busSelect = document.getElementById('crew-bus-select');
    if (busSelect) {
      busSelect.addEventListener('change', (e) => {
        this.selectedBusId = e.target.value;
        this.render();
        this.bindEvents();
      });
    }

    const toggleBtn = document.getElementById('btn-toggle-trip');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleTrip();
      });
    }

    const incidentBtns = this.container.querySelectorAll('.incident-btn');
    incidentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const issueType = btn.getAttribute('data-issue');
        this.reportIncident(issueType);
      });
    });

    const announceBtn = document.getElementById('btn-announce-stop');
    if (announceBtn) {
      announceBtn.addEventListener('click', () => {
        const bus = busDataStore.getBuses().find(b => b.id === this.selectedBusId);
        const nextStop = bus && bus.stops ? bus.stops[bus.currentStopIndex || 0] : null;
        alert(`📢 Voice Announcement Broadcasted:\n"Next approaching bus stop: ${nextStop ? nextStop.name : 'Central Hub'}. Please prepare for deboarding."`);
      });
    }
  }

  async toggleTrip() {
    this.isTripActive = !this.isTripActive;
    const bus = busDataStore.getBuses().find(b => b.id === this.selectedBusId);
    if (bus) {
      bus.status = this.isTripActive ? 'running' : 'idle';
      busDataStore.save('buses', busDataStore.getBuses());
    }

    // Encrypt status change
    await cryptoService.encrypt({
      busId: this.selectedBusId,
      status: this.isTripActive ? 'running' : 'idle',
      timestamp: Date.now()
    });

    this.render();
    this.bindEvents();

    if (this.isTripActive) {
      alert(`Trip Started! Live GPS telemetry is now transmitting to passenger apps for Bus ${bus.registrationNumber}.`);
    } else {
      alert('Trip Concluded. Bus is marked as Idle.');
    }
  }

  async reportIncident(issueType) {
    const bus = busDataStore.getBuses().find(b => b.id === this.selectedBusId);
    const user = authService.getUser();

    const incident = {
      id: 'inc_' + Date.now(),
      busId: bus.id,
      busName: bus.name,
      busNumber: bus.busNumber,
      regNumber: bus.registrationNumber,
      type: issueType,
      description: `Reported by crew member ${user.name}: Immediate technical attention requested.`,
      reportedBy: `${user.name} (${user.role.toUpperCase()})`,
      timestamp: 'Just now',
      status: 'active',
      visibleToPublic: true
    };

    // Mark bus delay
    bus.delayMinutes = 25;
    busDataStore.addIncident(incident);

    // Encrypt payload via AES-256
    await cryptoService.encrypt(incident);

    alert(`🚨 ALERT SENT!\n${issueType} broadcasted to passengers and submitted to ${bus.depotName}. Bus status updated to Delayed (+25m).`);
    this.render();
    this.bindEvents();
  }
}

export const crewPortal = new CrewPortal();
