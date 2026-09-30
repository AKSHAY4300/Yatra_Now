# 🚌 Yatra Now — Master Engineering & Implementation Plan

> **Application Overview**: A next-generation, high-performance local bus transportation and fleet management ecosystem built for commuters, bus owners/government depots, drivers/conductors, and super administrators. Featuring real-time GPS tracking, dual-tier 2FA authentication, client-server AES-256-GCM data encryption, and extreme optimization for low-end mobile devices via Progressive Web App (PWA) & cross-platform Flutter architecture.

---

## 📑 Table of Contents
1. [Core Architectural Blueprint & Technology Stack](#1-core-architectural-blueprint--technology-stack)
2. [Role-Based Access Control (RBAC) & Dedicated Portals](#2-role-based-access-control-rbac--dedicated-portals)
3. [End-to-End Security Architecture (2FA + AES-256 Payload Encryption)](#3-end-to-end-security-architecture-2fa--aes-256-payload-encryption)
4. [UI/UX Design System & Interactive Motion Specs](#4-uiux-design-system--interactive-motion-specs)
5. [Frontend First Architecture & Phased Delivery Roadmap](#5-frontend-first-architecture--phased-delivery-roadmap)
6. [Backend, Database & Real-Time Telemetry Pipeline](#6-backend-database--real-time-telemetry-pipeline)
7. [📱 Low-End Mobile Hardware Specification & Compatibility Report](#7--low-end-mobile-hardware-specification--compatibility-report)

---

## 1. Core Architectural Blueprint & Technology Stack

To satisfy the user requirement of **strict separation between frontend and backend**, zero subscription cost (100% free & open-source stack), and smooth 60fps operation on low-end budget smartphones, the ecosystem follows a decoupled modular architecture:

```
d:/Projects/Yatra_Now/
├── frontend/                     # Web & Mobile PWA (Frontend First)
│   ├── public/
│   │   ├── assets/               # Brand logos (Bus silhouette, Wordmark), sound effects
│   │   ├── icons/                # PWA icons (48x48 to 512x512 maskable)
│   │   ├── manifest.json         # PWA Manifest (standalone, orientation, theme colors)
│   │   └── sw.js                 # Service Worker (offline cache, background sync)
│   ├── src/
│   │   ├── assets/               # SVG bus markers, route icons, branding
│   │   ├── components/
│   │   │   ├── common/           # Navbar, ProfileModal, SettingsModal, 2FAModal
│   │   │   ├── map/              # Leaflet/OpenStreetMap engine, GPS simulator, route polylines
│   │   │   ├── sheets/           # Slide-up search sheet, multi-drop sheet, bus list half-sheet
│   │   │   └── security/         # AES-256 Crypto wrapper, 2FA OTP verification components
│   │   ├── portals/
│   │   │   ├── public/           # Passenger application (Track, Search, Stops, Fare, Speed)
│   │   │   ├── owner/            # Depot & Private Bus Owner fleet dashboard
│   │   │   ├── crew/             # Driver & Conductor live console & breakdown reporting
│   │   │   └── admin/            # Super Administrator management & verification portal
│   │   ├── services/
│   │   │   ├── cryptoService.js  # AES-256-GCM browser crypto engine
│   │   │   ├── authService.js    # 2FA Auth & session management
│   │   │   ├── locationService.js# Geolocation & nearest stop finder (Haversine formula)
│   │   │   └── busService.js     # Bus schedules, delay calculators, route data
│   │   ├── styles/
│   │   │   ├── theme.css         # #ba5a0b & #ffeee0 tokens, dark mode tokens
│   │   │   └── index.css         # Global animations, glassmorphism, responsive sheet layouts
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Secure REST & WebSocket Telemetry Server
│   ├── src/
│   │   ├── config/               # Supabase/PostgreSQL free DB connection, JWT secrets
│   │   ├── controllers/          # AuthController, BusController, DepotController, IssueController
│   │   ├── middleware/           # aesDecryptionMiddleware.js, rbacGuard.js, rateLimiter.js
│   │   ├── models/               # Bus, Route, Stop, User, IncidentReport, Depot
│   │   ├── routes/               # API routes with strict AES payload validation
│   │   ├── sockets/              # Socket.IO live GPS broadcast room per bus/route
│   │   └── utils/
│   │       ├── cryptoUtils.js    # Node.js crypto AES-256-GCM cipher
│   │       └── otpGenerator.js   # 2FA OTP engine (TOTP / Secure Email SMS token)
│   ├── package.json
│   └── server.js
│
└── mobile_flutter/               # Optional native Flutter wrapper (PWA-first hybrid bridge)
    └── ...                       # Material 3 UI consuming identical backend APIs & AES pipes
```

### Free & Open-Source Stack Matrix:
| Component | Technology | Free / Open-Source Justification |
| :--- | :--- | :--- |
| **Frontend Core** | React / Vanilla Vite + PWA Service Worker | Ultra-lightweight (~80KB gzip), lightning initial render on 2GB RAM phones |
| **Mapping Engine** | Leaflet.js + OpenStreetMap (OSM) / CARTO CartoDB tiles | 100% Free, no Google Maps API billing quotas or credit card locks |
| **UI Aesthetics** | Modern Vanilla CSS Design System with CSS Variables | Zero Tailwind overhead, instant load, native GPU acceleration |
| **Real-Time Layer** | WebSockets / Socket.IO | Instant sub-100ms GPS updates from Driver to Commuter |
| **Database** | Supabase (Free Tier PostgreSQL + PostGIS) or SQLite Cloud | Generous 500MB free database, built-in row level security & geospatial indexing |
| **Security Layer** | Web Crypto API (SubtleCrypto) + Node `crypto` (AES-256-GCM) | Native hardware-accelerated AES encryption on both browser and server |

---

## 2. Role-Based Access Control (RBAC) & Dedicated Portals

> ⚠️ **Strict Constraint**: There is **NO role-switching dropdown in the user navigation bar**. Each user role enters through dedicated authentication boundaries, and the UI remains purely focused on that persona.

### Detailed Role Specifications:

### 1. 🚶 Public Commuter (Mobile PWA & Web App)
- **Live Bus Locator**: Interactive map displaying real-time bus icons moving along their actual road paths.
- **Dynamic Search Drawer**:
  - Starts with bottom floating card: *"Where do you want to go?"*
  - Tapping opens smooth sliding container: Origin (auto-detect current stop or select on map), Destination, and **"Add stops to drop friends"** (multi-stop route search).
  - Recent searches list with one-tap recall.
- **Bus Schedule & Arrival Feed**:
  - Horizontal & vertical drawer listing matching buses with Bus Name, Number, Registration Number, Origin/Destination timings.
  - **Color-coded delay badges**: Green (`On Time`) vs Bright Red (`Delayed by X mins` calculated from expected stopping time).
- **In-Bus Mode**:
  - Real-time speedometer gauge monitoring current bus speed via GPS telemetry.
  - Proximity sound and visual notifications as the bus approaches boarding and destination stops.
- **Estimated Fare Calculator**: Fare calculation based on stage count or exact distance between boarding and dropping stops.

### 2. 🏢 Bus Owners & Government Bus Depots (Web & Mobile Console)
- **Fleet Command Center**: Real-time counter of total buses:
  - 🟢 **Running (Active on Route)** with live GPS telemetry.
  - 🔴 **Idle / Maintenance (Not Running)**.
- **Bus & Route Registration**:
  - Register new bus: Name, Route No, Reg No (e.g. `DL-01-AB-1234`), Starting Station, Ending Station.
  - Interactive Route Stop Builder: Add sequential stops with scheduled arrival/departure times.
  - Assign primary Driver and Conductor to specific bus registrations.
- **Depot Locations & Branches**: Multi-depot selector for government state transport corporations and large fleet owners.
- **Damage & Incident Log**: Dedicated live feed of breakdown, tire puncture, mechanical, or ticketing alerts filed by drivers/conductors with timestamp and GPS coordinates.
- **Verification Workflow**: KYC/Document upload for Depot authorization.

### 3. 🧑‍✈️ Bus Driver & Conductor (Mobile App / PWA)
- **Daily Duty Check-In**:
  - Select Depot / Owner Branch.
  - Select assigned Bus by Registration Number and Route.
- **Live Trip Broadcaster**:
  - One-tap "Start Trip" toggle that starts broadcasting device GPS coordinates and speed to the public socket room.
  - Next stop announcement button.
- **Incident & Emergency Reporter**:
  - One-tap quick incident alerts (`Vehicle Breakdown`, `Traffic Jam Delay`, `Accident`, `Medical Emergency`).
  - Breakdown status automatically broadcasts an alert flag to all commuters waiting for that bus and files an immediate ticket to the depot dashboard.

### 4. 🛡️ Super Administrator (Dedicated Web Dashboard `admin.yatranow.com`)
- Isolated login portal with mandatory 2FA.
- Master fleet telemetry and nationwide/citywide heatmaps.
- Verification and approval of Bus Owner KYC & Government Depot applications.
- System-wide broadcast alerts (e.g., weather disruptions, route diversions, strike notices).
- Security audit logs (failed logins, encryption verification checks, active socket connections).

---

## 3. End-to-End Security Architecture (2FA + AES-256 Payload Encryption)

### A. Two-Step Verification (2FA) Flow
1. User enters Email/Mobile + Password.
2. Credentials encrypted via AES-256-GCM and sent to `/api/auth/login`.
3. Server validates credentials and sends a 6-digit one-time password (OTP) valid for 5 minutes.
4. User enters OTP on the secure 2FA modal.
5. Upon verification, an authenticated role-scoped JWT token is generated.

### B. AES-256-GCM Data Encryption Standard
- **Key Derivation**: PBKDF2 (SHA-256, 100,000 iterations) with cryptographic salt.
- **Cipher**: `AES-256-GCM` providing authenticated encryption (confidentiality + integrity).
- **Scope**: Every sensitive transit payload (registration, 2FA codes, GPS telemetry broadcasts, incident reports, license uploads) is encrypted before dispatch.

---

## 4. UI/UX Design System & Interactive Motion Specs

### Mandatory Brand Color Palette:
| Role | Color Hex | CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `#ba5a0b` | `--primary-brand` | Primary buttons, active bus icons, headers, accents |
| **Primary Light / Hover** | `#d46912` | `--primary-hover` | Button hover states, active tab indicators |
| **Light Mode Background**| `#ffeee0` | `--bg-main` | Page backgrounds, card fills in light theme |
| **Light Mode Card Surface**| `#ffffff` | `--bg-card` | Clean elevated content containers, modals |
| **Dark Mode Background** | `#140d07` | `--bg-dark-main` | Deep warm dark theme background |
| **Dark Mode Card Surface**| `#1e140d` | `--bg-dark-card` | Dark cards, floating drawers, bottom sheets |
| **Late / Delayed Accent** | `#dc2626` | `--color-delayed` | Red delay text (`Delayed by 12 mins`), breakdown badges |
| **On-Time Accent** | `#16a34a` | `--color-ontime` | Green on-time badge (`On Time`), running bus status |

### Universal Navbar Specs (No Role Selector):
- **Left**: Custom Yatra Now Brand Logo (Bus silhouette graphic + typography).
- **Center**: Current Section / Route Info or Status Pill.
- **Right Action Bar**:
  - **Theme Toggle**: One-click switch between Light Mode (`#ffeee0`) and Dark Mode (`#140d07`).
  - **Settings Icon**: Opens modal with Help, About Yatra Now, Privacy Policy, Logout.
  - **Profile Avatar**: Opens comprehensive profile drawer.

### User Profile Schema:
- Profile Photo (Upload & Preview)
- Full Name (as per Government ID)
- Gender (`Male`, `Female`, `Other`)
- Mobile Number (Verified via 2FA)
- Email ID (Verified)
- Date of Birth (`DD/MM/YYYY`)
- Role (`Commuter`, `Bus Owner`, `Bus Depot Manager`, `Driver`, `Conductor`, `Super Admin`)
- Role-Adaptive Field: Address for Commuters; Driving License / Depot ID for Crew & Owners.

---

## 5. 📱 Low-End Mobile Hardware Specification & Compatibility Report

| Tier | Category | Minimum Specifications | Target Performance | Optimization Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Ultra Budget / Low-End)** | Android Go Edition, JioPhone Next, Redmi A-series, older Samsung Galaxy M/J series | **1 GB – 2 GB RAM**, Quad-core 1.3GHz (Cortex-A53), Android 8.1 (Oreo) – Android 13 Go, 16GB eMMC storage | **45–60 FPS**, < 45MB RAM footprint, page loads in < 1.8s on 3G/4G | PWA cached shell, DOM recycling, Leaflet Canvas rendering mode, 3-second GPS throttling |
| **Tier 2 (Mid-Range Standard)** | Realme, Poco, Vivo, Samsung Galaxy A, Moto G | **3 GB – 6 GB RAM**, Octa-core 2.0GHz, Android 10+, 64GB storage | **60 FPS** fluid animations, real-time map transitions | Full vector tiles, smooth interpolated bus animations, instant local caching |
| **Tier 3 (iOS Devices)** | iPhone 7, 8, SE (2020), iPhone 11 and newer | **2 GB – 4 GB RAM**, Apple A10 Fusion or later, iOS 14.0+ | **60 FPS** Safari PWA native-like performance | WebKit hardware-accelerated transforms, Apple Touch Icon & standalone display mode |
