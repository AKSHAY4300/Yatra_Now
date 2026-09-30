# 🚌 Yatra Now — Real-Time Smart Bus Transit & Fleet Network

Yatra Now is an open-source, high-performance local bus transportation and fleet management ecosystem built for commuters, bus owners/government depots, drivers/conductors, and super administrators.

Featuring real-time GPS tracking on an open-source map, dual-tier Two-Step Verification (2FA), client-server AES-256-GCM data encryption, native Android APK packaging, and extreme optimization for low-end mobile devices via Progressive Web App (PWA) architecture.

---

## 🎨 Design System & Color Tokens
- **Primary Brand**: `#ba5a0b`
- **Light Theme Background**: `#ffeee0`
- **Dark Theme Background**: `#140d07` (One-click toggle in Navbar & Settings)
- **Late / Delayed Alert**: `#dc2626` (Strictly highlighted in vibrant red)
- **On-Time Status**: `#16a34a` (Vibrant green)

---

## 📱 Android APK (Native Mobile Application)
The standalone installable Android APK is built and signed:
- **Root APK File**: [`d:\Projects\Yatra_Now\YatraNow.apk`](file:///d:/Projects/Yatra_Now/YatraNow.apk) (6.51 MB)
- **Web Download Link**: Direct download from the web interface at `http://localhost:3000/YatraNow.apk` or via the **Download Android APK** option in the application settings drawer.
- **Package Details**:
  - App Name: `Yatra Now`
  - Package ID: `com.yatranow.app`
  - Permissions: `INTERNET`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_NETWORK_STATE`, `VIBRATE`.
  - Signature: SHA256withRSA 2048-bit key verified with JDK 17 `jarsigner`.

---

## ☁️ Running the Backend on Supabase

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and create a free project.
2. Go to the **SQL Editor** tab.
3. Open [`supabase/schema.sql`](file:///d:/Projects/Yatra_Now/supabase/schema.sql) in this repository and paste its entire content into the SQL Editor.
4. Click **Run**. This creates:
   - Tables: `users`, `depots`, `buses`, `route_stops`, `incident_reports`, `two_factor_challenges`.
   - Row-Level Security (RLS) policies allowing public read access for routes, stops, and alerts.
   - Realtime Postgres replication enabled for live GPS tracking.
   - Initial seed dataset with 4 buses, 3 depots, and route waypoints.
5. In Yatra Now, open **Settings ➔ Supabase Cloud Database**, enter your **Project URL** and **Anon API Key**, and click **Save & Sync**. The application will automatically stream live fleet updates directly from Supabase!

---

## 🚀 Deploying the Website to Vercel

The application is pre-configured for one-click deployment on [Vercel](https://vercel.com/):
- **Configuration File**: [`vercel.json`](file:///d:/Projects/Yatra_Now/vercel.json)
- **Deployment Steps**:
  1. Push this repository to GitHub or GitLab.
  2. Import the repository in your Vercel Dashboard.
  3. No build command is required (`Output Directory: frontend` or root with static preset).
  4. Vercel automatically deploys the website, configures PWA headers (`Service-Worker-Allowed: /`), and serves `YatraNow.apk` as a direct download.

---

## 🔒 Security, Two-Step Verification (2FA) & AES-256 Encryption

1. **Dedicated Portal Gateway Modal**:
   - Replaced browser prompts with a role-selection card interface for **Public Commuter**, **Bus Owner / Depot**, **Crew (Driver & Conductor)**, and **Super Administrator**.
2. **Two-Step Verification (2FA)**:
   - Dynamic 6-digit OTP verification.
   - Paste-to-fill handler: Pasting a 6-digit code auto-populates all inputs and triggers validation.
   - One-tap demo helper badge (`[TAP TO FILL]`) for test evaluation.
   - Real-time countdown timer (05:00 minutes) and resend code functionality.
3. **AES-256-GCM Data Transmission**:
   - Dual-pipeline encryption: All transit payloads (credentials, telemetry, incident reports) are encrypted client-side using `cryptoService.js` (Web Crypto API).
   - If the Python server or backend is active, payloads are verified over HTTP; if running statically on Vercel, client cryptography ensures uninterrupted operation.
   - Inspect live in-transit ciphertext streams anytime via the **AES-256 Inspector** in the universal navbar.

---

## 🏃 Running Locally

### 1. Run the Frontend PWA & Web App:
```powershell
& "D:\Core\Python\python.exe" -m http.server 3000 --directory "d:\Projects\Yatra_Now\frontend"
```
Open **`http://localhost:3000/`** in your browser.

### 2. Run the Backend REST & Telemetry Server:
```powershell
& "D:\Core\Python\python.exe" "d:\Projects\Yatra_Now\backend\server.py"
```

### 3. Run Automated Security & 2FA Tests:
```powershell
& "D:\Core\Python\python.exe" "d:\Projects\Yatra_Now\backend\test_backend.py"
```
