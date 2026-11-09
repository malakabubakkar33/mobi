# MobiView 📱

> *"Your Website. Your Mobile. Your Preview."*

MobiView is a minimalist, lightweight browser-style website and mobile testing application built for web developers. It allows you to enter any website URL — from local dev servers (`localhost:5173`, `localhost:3000`, etc.) to deployed websites — and immediately open that website in a clean, full-page browsing experience with real iPhone Safari LAN pairing.

---

## 🎨 Design Philosophy

- **Theme:** Clean, modern light theme.
- **Palette:**
  - Background: `#FFFFFF`
  - Primary Green: `#168447`
  - Light Green Accent: `#E8F6EC`
  - Text: Dark Charcoal (`#20252D`) & Muted (`#737B85`)
  - Border: Subtle Grey (`#E8EBE9`)
- **Minimalist:** No cluttered dashboards, no unnecessary analytics charts, no dark themes, and zero fake stats.

---

## 🚀 Key Features

### 1. Minimalist Home Screen
- Clean centered branding with quick input.
- Supports `http://localhost:5173`, `http://localhost:3000`, `192.168.x.x`, and public HTTPS domains.
- **Active Dev Server Scanner:** Automatically detects running dev servers on common ports (`5173`, `3000`, `8080`, `4173`, `8000`, etc.) and shows quick launch badges.
- Live Local Bridge connection indicator with host LAN IP.

### 2. Full-Page Browser Experience
- Minimalist browser toolbar: Back, Forward, Reload, Home, Address Bar with protocol & copy badges, Go button, Fullscreen toggle.
- **Responsive Viewport Switcher:**
  - Fluid (100% window)
  - iPhone 15 Pro (393 × 852 pt)
  - iPhone SE (375 × 667 pt)
  - iPad Mini (768 × 1024 pt)
  - Desktop Preset (1280 × 800 px)
  - Portrait / Landscape orientation rotation.
- **True Rendering Surface:** Smart reverse proxy with automatic header stripping (`X-Frame-Options` and `Content-Security-Policy` `frame-ancestors`) to preview any website without embedding blocks.

### 3. Node.js Local Bridge Agent
- **LAN Discovery:** Automatically detects the host machine's local network IP.
- **Reverse Proxy:** Bridges `localhost` so external devices on the same Wi-Fi can reach the development machine.
- **WebSocket HMR Proxy:** Preserves Vite Hot Module Replacement and Next.js Fast Refresh on connected devices.
- **Security:** Secure temporary pairing tokens (4-hour expiration) without exposing host filesystem or shell.

### 4. iPhone Connection & Mobile Safari Companion
- Instant pairing via high-contrast QR code.
- Direct preview URL (`http://<LAN_IP>:4800/preview/<token>`).
- Real-time device detection via WebSocket heartbeat.
- **Mobile Companion Toolbar:** Floating toolbar inside iPhone Safari with:
  - 🟢 Live connection status
  - Viewport dimension reader (`width × height`)
  - 🔄 Reload website
  - ↗ Direct Safari access
  - 📋 Copy preview link
  - ✕ Minimize toggle

### 5. Desktop Electron Shell Ready
- Ready for desktop app execution with Electron and native Chromium rendering.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
git clone https://github.com/malakabubakkar33/mobi.git
cd mobi
npm install
```

### Running MobiView
```bash
# Start the Local Bridge and application:
npm run start

# In development mode (Vite):
npm run dev

# Build for production:
npm run build

# Launch Desktop Electron Shell:
npm run electron
```

---

## 📄 License
ISC
