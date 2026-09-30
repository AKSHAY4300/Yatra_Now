/**
 * Yatra Now - Bus Owner & Government Bus Depot Management Portal
 * Fleet Command, Bus Registration with Sequential Stops, Driver/Conductor Assignment, Incident Log
 */

import { busDataStore } from './busData.js';
import { cryptoService } from './cryptoService.js';

class OwnerPortal {
  constructor() {
    this.container = null;
    this.newBusStops = [];
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.render();
    this.bindEvents();
  }

  render() {
    const buses = busDataStore.getBuses();
    const incidents = busDataStore.getIncidents();
    const runningCount = buses.filter(b => b.status === 'running').length;
    const idleCount = buses.filter(b => b.status !== 'running').length;

    this.container.innerHTML = `
      <div class="portal-header">
        <div class="portal-title-block">
          <h2>🏢 Bus Depot & Fleet Command Console</h2>
          <p>Real-time depot operations, bus schedule builder, crew rosters, and incident telemetry</p>
        </div>
        <button id="btn-open-add-bus-modal" class="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Register / Add Bus
        </button>
      </div>

      <!-- Fleet Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box running">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
            </svg>
          </div>
          <div class="metric-data">
            <h4>Buses Running (Live GPS)</h4>
            <div class="metric-val" style="color:var(--color-ontime);">${runningCount}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box idle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="metric-data">
            <h4>Idle / In-Maintenance</h4>
            <div class="metric-val" style="color:var(--color-warning);">${idleCount}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box breakdown">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="metric-data">
            <h4>Active Incident Reports</h4>
            <div class="metric-val" style="color:var(--color-delayed);">${incidents.length}</div>
          </div>
        </div>
      </div>

      <!-- Fleet Overview Table -->
      <div class="portal-card">
        <div class="portal-card-header">
          <div class="portal-card-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--primary-brand)">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z"/>
            </svg>
            Assigned Fleet & Crew Telemetry
          </div>
        </div>
        <div class="table-responsive">
          <table class="yatra-table">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Bus Name & Route</th>
                <th>Status</th>
                <th>Assigned Driver</th>
                <th>Assigned Conductor</th>
                <th>Speed & Delay</th>
              </tr>
            </thead>
            <tbody>
              ${buses.map(bus => `
                <tr>
                  <td><strong>${bus.registrationNumber}</strong><br/><small style="color:var(--text-muted);">${bus.depotName}</small></td>
                  <td><strong>${bus.name} (#${bus.busNumber})</strong><br/><small>${bus.origin} ➔ ${bus.destination}</small></td>
                  <td>
                    ${bus.status === 'running' 
                      ? '<span class="badge badge-ontime">🟢 Running</span>' 
                      : '<span class="badge" style="background:#f3f4f6;color:#6b7280;">⚪ Idle</span>'}
                  </td>
                  <td>${bus.driver.name}<br/><small style="color:var(--text-muted);">${bus.driver.mobile}</small></td>
                  <td>${bus.conductor.name}<br/><small style="color:var(--text-muted);">${bus.conductor.mobile}</small></td>
                  <td>
                    <span>${bus.speed} km/h</span><br/>
                    ${bus.delayMinutes > 0 
                      ? `<span style="color:var(--color-delayed);font-weight:700;">Delayed: ${bus.delayMinutes}m</span>` 
                      : '<span style="color:var(--color-ontime);font-weight:700;">On Schedule</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Driver & Conductor Incident Reports Section -->
      <div class="portal-card">
        <div class="portal-card-header">
          <div class="portal-card-title" style="color:var(--color-delayed);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Live Crew Breakdown & Issue Reports
          </div>
          <span style="font-size:0.8rem;color:var(--text-muted);">Updated by Drivers & Conductors in Real-Time</span>
        </div>
        <div class="table-responsive">
          <table class="yatra-table">
            <thead>
              <tr>
                <th>Bus Reg & Name</th>
                <th>Issue Type</th>
                <th>Incident Details</th>
                <th>Reported By</th>
                <th>Timestamp</th>
                <th>Public Alert</th>
              </tr>
            </thead>
            <tbody>
              ${incidents.map(inc => `
                <tr>
                  <td><strong>${inc.regNumber}</strong><br/><small>${inc.busName}</small></td>
                  <td><span class="badge badge-delayed">${inc.type}</span></td>
                  <td>${inc.description}</td>
                  <td>${inc.reportedBy}</td>
                  <td>${inc.timestamp}</td>
                  <td>
                    ${inc.visibleToPublic 
                      ? '<span class="badge badge-delayed">Active on Public App</span>' 
                      : '<span class="badge badge-brand">Internal Depot Only</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const btnAdd = document.getElementById('btn-open-add-bus-modal');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        this.openAddBusModal();
      });
    }
  }

  openAddBusModal() {
    const modalBackdrop = document.getElementById('add-bus-modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.classList.add('active');
    }
  }
}

export const ownerPortal = new OwnerPortal();
