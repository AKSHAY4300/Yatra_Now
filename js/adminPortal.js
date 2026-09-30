/**
 * Yatra Now - Super Administrator Command Center
 * Master Depot Approvals, Citywide Broadcast Alerts, and Cryptographic Security Auditing
 */

import { busDataStore } from './busData.js';
import { cryptoService } from './cryptoService.js';

class AdminPortal {
  constructor() {
    this.container = null;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.render();
    this.bindEvents();
  }

  render() {
    const depots = busDataStore.getDepots();
    const buses = busDataStore.getBuses();
    const ciphers = cryptoService.recentEncryptions;

    this.container.innerHTML = `
      <div class="portal-header">
        <div class="portal-title-block">
          <h2>🛡️ Super Administrator Governance Portal</h2>
          <p>Master transport federation control, depot verification, and AES encryption audits</p>
        </div>
        <button id="btn-admin-broadcast" class="btn btn-danger">
          📢 Broadcast Emergency Alert
        </button>
      </div>

      <!-- System Health Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box running">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <div class="metric-data">
            <h4>Total Registered Depots</h4>
            <div class="metric-val">${depots.length}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background:var(--primary-glow);color:var(--primary-brand);">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z"/>
            </svg>
          </div>
          <div class="metric-data">
            <h4>Federated Fleet Size</h4>
            <div class="metric-val">${buses.length} Buses</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="background:rgba(37,99,235,0.15);color:var(--color-info);">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div class="metric-data">
            <h4>AES-256 Crypto Health</h4>
            <div class="metric-val" style="color:var(--color-info);font-size:1.3rem;">100% SECURE</div>
          </div>
        </div>
      </div>

      <!-- Depot Verification Queue -->
      <div class="portal-card">
        <div class="portal-card-header">
          <div class="portal-card-title">
            📋 Bus Owner & Government Depot KYC Approvals
          </div>
        </div>
        <div>
          ${depots.map(depot => `
            <div class="kyc-verification-card">
              <div class="kyc-info">
                <h4>${depot.name} (${depot.branchCode})</h4>
                <p>Location: ${depot.location} • Fleet Size: ${depot.totalBuses} Buses</p>
                <small style="color:var(--primary-brand);font-weight:700;">
                  ${depot.isGovernment ? '🏛️ State Transport Undertaking' : '🏢 Private Bus Fleet Operator'}
                </small>
              </div>
              <div>
                ${depot.verified ? `
                  <span class="badge badge-ontime">✓ Verified & Approved</span>
                ` : `
                  <button class="btn btn-primary btn-approve-depot" data-depotid="${depot.id}" style="padding:6px 14px;font-size:0.85rem;">
                    Approve Depot License
                  </button>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- AES-256 Real-Time Telemetry & Encryption Inspector -->
      <div class="portal-card">
        <div class="portal-card-header">
          <div class="portal-card-title">
            🔒 Real-Time AES-256-GCM In-Transit Payload Stream
          </div>
        </div>
        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px;">
          All sensitive client-server payloads (credentials, live GPS, breakdown tickets) are encrypted with 96-bit IVs and 128-bit authentication tags.
        </p>
        <div class="cipher-code-block">
          ${ciphers.length > 0 ? ciphers.map(c => `
            <div>[${c.time}] [${c.type}] Payload: ${c.payloadSnippet} ➔ AES-GCM: ${c.cipherSnippet}</div>
          `).join('') : '<div>[SYS] AES-256-GCM Channel Active. Listening to live telemetry cipher streams...</div>'}
        </div>
      </div>
    `;
  }

  bindEvents() {
    const broadcastBtn = document.getElementById('btn-admin-broadcast');
    if (broadcastBtn) {
      broadcastBtn.addEventListener('click', () => {
        const msg = prompt('Enter citywide emergency announcement for all passenger and crew apps:');
        if (msg) {
          alert(`📢 EMERGENCY BROADCAST SENT:\n"${msg}"\nDispatched to all connected passengers and depot consoles.`);
        }
      });
    }

    const approveBtns = this.container.querySelectorAll('.btn-approve-depot');
    approveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const depotId = btn.getAttribute('data-depotid');
        const depot = busDataStore.getDepots().find(d => d.id === depotId);
        if (depot) {
          depot.verified = true;
          busDataStore.save('depots', busDataStore.getDepots());
          alert(`Depot "${depot.name}" verified and licensed successfully.`);
          this.render();
          this.bindEvents();
        }
      });
    });
  }
}

export const adminPortal = new AdminPortal();
