/**
 * Yatra Now - Master Application Coordinator
 * Boots PWA Service Worker, Universal Navbar, Profile/Settings Drawers, 2FA Modal, and Isolated Role Views
 */

import { authService } from './authService.js';
import { mapService } from './mapService.js';
import { uiController } from './uiController.js';
import { ownerPortal } from './ownerPortal.js';
import { crewPortal } from './crewPortal.js';
import { adminPortal } from './adminPortal.js';
import { cryptoService } from './cryptoService.js';

class YatraNowApp {
  constructor() {
    this.currentTheme = localStorage.getItem('yatranow_theme') || 'light';
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.registerPWA();
    this.setupNavbarAndModals();

    // Listen to Auth State
    authService.subscribe((user) => {
      this.updateNavbarUser(user);
      this.routeToRolePortal(user.role);
    });

    // Initialize Map on Commuter View
    mapService.init('map-viewport');
    uiController.init();
  }

  registerPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('[PWA] Service Worker registered with scope:', reg.scope))
          .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
      });
    }
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('yatranow_theme', theme);

    const toggleCheckbox = document.getElementById('theme-toggle-checkbox');
    if (toggleCheckbox) {
      toggleCheckbox.checked = (theme === 'dark');
    }
  }

  updateNavbarUser(user) {
    const avatar = document.getElementById('nav-user-avatar');
    const nameEl = document.getElementById('nav-user-name');
    if (avatar) avatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    if (nameEl) nameEl.textContent = user.name || 'User';
  }

  routeToRolePortal(role) {
    // Hide all role portals first
    const portals = ['portal-owner', 'portal-crew', 'portal-admin'];
    portals.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });

    const mapViewport = document.getElementById('map-viewport');
    const bottomBar = document.getElementById('bottom-search-bar');

    // STRICT ROLE SEPARATION (No Navbar Role Changer)
    if (role === 'owner') {
      if (mapViewport) mapViewport.style.display = 'none';
      if (bottomBar) bottomBar.style.display = 'none';
      const el = document.getElementById('portal-owner');
      if (el) {
        el.classList.add('active');
        ownerPortal.init('portal-owner');
      }
    } else if (role === 'crew') {
      if (mapViewport) mapViewport.style.display = 'none';
      if (bottomBar) bottomBar.style.display = 'none';
      const el = document.getElementById('portal-crew');
      if (el) {
        el.classList.add('active');
        crewPortal.init('portal-crew');
      }
    } else if (role === 'admin') {
      if (mapViewport) mapViewport.style.display = 'none';
      if (bottomBar) bottomBar.style.display = 'none';
      const el = document.getElementById('portal-admin');
      if (el) {
        el.classList.add('active');
        adminPortal.init('portal-admin');
      }
    } else {
      // Default: Public Commuter App
      if (mapViewport) mapViewport.style.display = 'block';
      if (bottomBar) bottomBar.style.display = 'flex';
      setTimeout(() => mapService.map.invalidateSize(), 150);
    }
  }

  setupNavbarAndModals() {
    // Theme Switch in Navbar / Settings
    const navThemeBtn = document.getElementById('btn-nav-theme');
    if (navThemeBtn) {
      navThemeBtn.addEventListener('click', () => {
        this.applyTheme(this.currentTheme === 'light' ? 'dark' : 'light');
      });
    }

    const themeCheckbox = document.getElementById('theme-toggle-checkbox');
    if (themeCheckbox) {
      themeCheckbox.addEventListener('change', (e) => {
        this.applyTheme(e.target.checked ? 'dark' : 'light');
      });
    }

    // Profile Modal Open & Close
    const btnProfile = document.getElementById('btn-nav-profile');
    const profileModal = document.getElementById('profile-modal-backdrop');
    const closeProfileBtn = document.getElementById('btn-close-profile');

    if (btnProfile) {
      btnProfile.addEventListener('click', () => {
        this.populateProfileModal();
        profileModal.classList.add('active');
      });
    }

    if (closeProfileBtn) {
      closeProfileBtn.addEventListener('click', () => {
        profileModal.classList.remove('active');
      });
    }

    // Settings Modal Open & Close
    const btnSettings = document.getElementById('btn-nav-settings');
    const settingsModal = document.getElementById('settings-modal-backdrop');
    const closeSettingsBtn = document.getElementById('btn-close-settings');

    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        settingsModal.classList.add('active');
      });
    }

    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
      });
    }

    // AES Security Inspector Pill
    const aesPill = document.getElementById('btn-aes-inspector');
    const aesModal = document.getElementById('aes-modal-backdrop');
    const closeAesBtn = document.getElementById('btn-close-aes');

    if (aesPill) {
      aesPill.addEventListener('click', () => {
        this.renderAesInspector();
        aesModal.classList.add('active');
      });
    }

    if (closeAesBtn) {
      closeAesBtn.addEventListener('click', () => {
        aesModal.classList.remove('active');
      });
    }

    // Save Profile Changes
    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
      btnSaveProfile.addEventListener('click', async () => {
        const name = document.getElementById('prof-input-name').value.trim();
        const gender = document.getElementById('prof-input-gender').value;
        const mobile = document.getElementById('prof-input-mobile').value.trim();
        const email = document.getElementById('prof-input-email').value.trim();
        const dob = document.getElementById('prof-input-dob').value;
        const address = document.getElementById('prof-input-address') ? document.getElementById('prof-input-address').value.trim() : null;
        const licenseNo = document.getElementById('prof-input-license') ? document.getElementById('prof-input-license').value.trim() : null;

        await authService.updateProfile({
          name, gender, mobile, email, dob, address, licenseNumber: licenseNo
        });

        alert('Profile saved securely with AES-256-GCM encryption.');
        profileModal.classList.remove('active');
      });
    }

    // Settings Actions: Logout / Switch Portal Login
    const btnLogout = document.getElementById('btn-settings-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        settingsModal.classList.remove('active');
        this.openLoginModal();
      });
    }

    // Login Modal Handlers
    this.setupLoginModal();

    // Supabase Cloud Modal Handlers
    this.setupSupabaseModal();

    // 2FA Verification & OTP Auto-tab/Paste Handlers
    this.setupTwoFactorModal();
  }

  setupLoginModal() {
    const loginModal = document.getElementById('login-modal-backdrop');
    const closeLoginBtn = document.getElementById('btn-close-login');
    const roleCards = document.querySelectorAll('.login-role-card');
    const inputIdentifier = document.getElementById('login-identifier');
    const btnSubmitLogin = document.getElementById('btn-submit-login-2fa');

    let selectedRole = 'public';
    let selectedName = 'Rohan Sharma';

    roleCards.forEach(card => {
      card.addEventListener('click', () => {
        roleCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedRole = card.getAttribute('data-role');
        selectedName = card.getAttribute('data-name');
        inputIdentifier.value = card.getAttribute('data-user');
      });
    });

    if (closeLoginBtn) {
      closeLoginBtn.addEventListener('click', () => {
        loginModal.classList.remove('active');
      });
    }

    if (btnSubmitLogin) {
      btnSubmitLogin.addEventListener('click', async () => {
        const identifier = inputIdentifier.value.trim() || 'user@yatranow.com';
        
        btnSubmitLogin.disabled = true;
        btnSubmitLogin.textContent = '🔒 Encrypting & Dispatching...';

        try {
          const res = await authService.initiate2FALogin({
            name: selectedName,
            role: selectedRole,
            email: identifier.includes('@') ? identifier : `${selectedRole}@yatranow.com`,
            mobile: !identifier.includes('@') ? identifier : '+91 98765 43210'
          });

          loginModal.classList.remove('active');
          this.openTwoFactorModal(selectedName, selectedRole, res.demoOtp);
        } catch (err) {
          alert('Login Error: ' + err.message);
        } finally {
          btnSubmitLogin.disabled = false;
          btnSubmitLogin.textContent = '🔐 Generate & Dispatch 2FA OTP';
        }
      });
    }
  }

  openLoginModal() {
    const loginModal = document.getElementById('login-modal-backdrop');
    if (loginModal) loginModal.classList.add('active');
  }

  setupTwoFactorModal() {
    const twofaModal = document.getElementById('twofa-modal-backdrop');
    const closeTwofaBtn = document.getElementById('btn-close-2fa');
    const btnVerifyOtp = document.getElementById('btn-submit-otp');
    const otpDemoPill = document.getElementById('otp-demo-pill');
    const btnResendOtp = document.getElementById('btn-resend-otp');

    if (closeTwofaBtn) {
      closeTwofaBtn.addEventListener('click', () => {
        twofaModal.classList.remove('active');
        if (this.twofaInterval) clearInterval(this.twofaInterval);
      });
    }

    // Tap-to-AutoFill Demo OTP
    if (otpDemoPill) {
      otpDemoPill.addEventListener('click', () => {
        const code = document.getElementById('otp-display-code').textContent.trim();
        this.fillOtpInputs(code);
      });
    }

    // Resend OTP
    if (btnResendOtp) {
      btnResendOtp.addEventListener('click', async () => {
        const currentUser = authService.pending2FA ? authService.pending2FA.tempUser : authService.getUser();
        const res = await authService.initiate2FALogin({
          name: currentUser.name,
          role: currentUser.role,
          email: currentUser.email
        });
        document.getElementById('otp-display-code').textContent = res.demoOtp;
        this.startTwoFactorCountdown();
        alert(`New 6-digit OTP Generated: ${res.demoOtp}`);
      });
    }

    // 2FA Verification Submission
    if (btnVerifyOtp) {
      btnVerifyOtp.addEventListener('click', () => this.submitTwoFactorCode());
    }

    // Setup 6-digit OTP Inputs: Auto-tab, Backspace, Paste, and Enter
    const inputs = [];
    for (let i = 1; i <= 6; i++) {
      inputs.push(document.getElementById(`otp-${i}`));
    }

    inputs.forEach((input, index) => {
      if (!input) return;

      // Handle single digit input and jump forward
      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length >= 1) {
          e.target.value = val.slice(-1); // Only keep 1 digit
          if (index < 5 && inputs[index + 1]) {
            inputs[index + 1].focus();
          }
        }
      });

      // Handle Backspace navigation
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          if (!input.value && index > 0 && inputs[index - 1]) {
            inputs[index - 1].focus();
            inputs[index - 1].value = '';
          }
        } else if (e.key === 'Enter') {
          this.submitTwoFactorCode();
        }
      });

      // Handle Paste of complete 6-digit code
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text').trim();
        if (/^\d{6}$/.test(pastedText)) {
          this.fillOtpInputs(pastedText);
          setTimeout(() => this.submitTwoFactorCode(), 150);
        }
      });
    });
  }

  fillOtpInputs(code) {
    if (!code || code.length < 6) return;
    for (let i = 1; i <= 6; i++) {
      const field = document.getElementById(`otp-${i}`);
      if (field) field.value = code.charAt(i - 1);
    }
  }

  openTwoFactorModal(name, role, demoOtp) {
    const twofaModal = document.getElementById('twofa-modal-backdrop');
    document.getElementById('twofa-target-desc').textContent = 
      `Verification OTP dispatched for ${name} (${role.toUpperCase()} Portal)`;
    document.getElementById('otp-display-code').textContent = demoOtp || '123456';

    // Clear previous inputs
    for (let i = 1; i <= 6; i++) {
      const field = document.getElementById(`otp-${i}`);
      if (field) field.value = '';
    }

    twofaModal.classList.add('active');
    setTimeout(() => {
      const firstInput = document.getElementById('otp-1');
      if (firstInput) firstInput.focus();
    }, 150);

    this.startTwoFactorCountdown();
  }

  startTwoFactorCountdown() {
    if (this.twofaInterval) clearInterval(this.twofaInterval);
    let secondsLeft = 300; // 5 minutes

    const timerDisplay = document.getElementById('twofa-timer-display');
    const updateDisplay = () => {
      const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
      const s = (secondsLeft % 60).toString().padStart(2, '0');
      if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;
      if (secondsLeft <= 0) {
        clearInterval(this.twofaInterval);
        if (timerDisplay) timerDisplay.textContent = 'Expired';
      }
      secondsLeft--;
    };

    updateDisplay();
    this.twofaInterval = setInterval(updateDisplay, 1000);
  }

  async submitTwoFactorCode() {
    const d1 = document.getElementById('otp-1').value;
    const d2 = document.getElementById('otp-2').value;
    const d3 = document.getElementById('otp-3').value;
    const d4 = document.getElementById('otp-4').value;
    const d5 = document.getElementById('otp-5').value;
    const d6 = document.getElementById('otp-6').value;
    const code = `${d1}${d2}${d3}${d4}${d5}${d6}`.trim();

    if (code.length < 6) {
      alert('Please enter all 6 digits of the verification code.');
      return;
    }

    try {
      const res = await authService.verify2FA(code);
      if (res.success) {
        if (this.twofaInterval) clearInterval(this.twofaInterval);
        document.getElementById('twofa-modal-backdrop').classList.remove('active');
        alert(`✓ Authentication Successful! Welcome, ${res.user.name} (${res.user.role.toUpperCase()} Portal Active).`);
      }
    } catch (err) {
      alert('❌ 2FA Verification Error: ' + err.message);
    }
  }

  setupSupabaseModal() {
    const btnOpenSupabase = document.getElementById('btn-open-supabase-modal');
    const supabaseModal = document.getElementById('supabase-modal-backdrop');
    const closeSupabaseBtn = document.getElementById('btn-close-supabase');
    const inputUrl = document.getElementById('input-supabase-url');
    const inputKey = document.getElementById('input-supabase-key');
    const btnTest = document.getElementById('btn-test-supabase');
    const btnSave = document.getElementById('btn-save-supabase');

    if (btnOpenSupabase) {
      btnOpenSupabase.addEventListener('click', () => {
        document.getElementById('settings-modal-backdrop').classList.remove('active');
        if (inputUrl) inputUrl.value = localStorage.getItem('yatranow_supabase_url') || '';
        if (inputKey) inputKey.value = localStorage.getItem('yatranow_supabase_anon_key') || '';
        supabaseModal.classList.add('active');
      });
    }

    if (closeSupabaseBtn) {
      closeSupabaseBtn.addEventListener('click', () => {
        supabaseModal.classList.remove('active');
      });
    }

    if (btnTest) {
      btnTest.addEventListener('click', async () => {
        const url = inputUrl.value.trim();
        const key = inputKey.value.trim();
        if (!url || !key) {
          alert('Please enter both Supabase Project URL and Anon API Key.');
          return;
        }
        btnTest.textContent = 'Testing...';
        try {
          const res = await fetch(`${url}/rest/v1/buses?select=count`, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`
            }
          });
          if (res.ok) {
            alert('✓ Supabase Connection Verified! PostgreSQL instance is responding.');
          } else {
            alert(`Connected with status ${res.status}. Check if schema.sql has been executed in SQL Editor.`);
          }
        } catch (err) {
          alert('Connection Failed: ' + err.message);
        } finally {
          btnTest.textContent = 'Test Cloud Connection';
        }
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const url = inputUrl.value.trim();
        const key = inputKey.value.trim();
        localStorage.setItem('yatranow_supabase_url', url);
        localStorage.setItem('yatranow_supabase_anon_key', key);
        alert('Supabase credentials saved. Yatra Now will sync telemetry with cloud database.');
        supabaseModal.classList.remove('active');
      });
    }
  }
}

// Instantiate and start on DOM load
window.addEventListener('DOMContentLoaded', () => {
  const app = new YatraNowApp();
  window.yatraApp = app;
  app.init();
});
