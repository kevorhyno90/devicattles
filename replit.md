# Devins Farm — Dairy & Farm Management PWA

## Overview
Devins Farm is a comprehensive Progressive Web App (PWA) for dairy and farm management. This is a frontend-only application built with React and Vite that stores data locally in the browser's localStorage. The app is installable as a PWA for offline use.

**Current State:** Successfully configured for Replit environment. The application is running on port 5000 and accessible through the web preview.

## Recent Changes
- **2024-11-22:** Configured for Replit environment
  - Updated Vite configuration to use port 5000 (required for Replit webview)
  - Removed GitHub Codespaces-specific HMR configuration
  - Added `allowedHosts: true` to support Replit's iframe proxy
  - Updated npm scripts to reflect new port
  - Installed all dependencies successfully
  - Configured workflow to run development server

## Project Architecture

### Technology Stack
- **Frontend Framework:** React 18.2.0
- **Build Tool:** Vite 7.2.2
- **Charts:** Chart.js with react-chartjs-2
- **Document Generation:** docx
- **Cloud Services:** Firebase (optional sync/auth)
- **Data Storage:** Browser localStorage (no backend)

### Project Structure
```
├── src/
│   ├── modules/          # Feature modules (Animals, Crops, Finance, etc.)
│   ├── components/       # Reusable components (Charts, Calendar, PhotoGallery)
│   ├── lib/              # Utility libraries (auth, storage, sync, notifications)
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Entry point with PWA registration
│   └── styles.css        # Global styles
├── public/               # Static assets (icons, manifest, service worker)
├── assets/               # Additional assets (fonts, data files)
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies and scripts
```

### Key Features
- **Animal Management:** Track livestock, health, breeding, feeding, measurements
- **Crop Management:** Monitor crops, yields, treatments, sales
- **Finance Tracking:** Ledger and financial reports
- **Task Scheduling:** Manage farm tasks and schedules
- **Inventory:** Track resources and supplies
- **Health System:** Animal health monitoring
- **Notifications:** Automated reminders and alerts
- **Reports & Analytics:** Comprehensive farm analytics
- **Backup/Restore:** Data export/import functionality
- **Multi-user Support:** Optional authentication system
- **PWA Features:** Offline support, installable app

### Development Configuration
- **Port:** 5000 (Replit requirement for webview)
- **Host:** 0.0.0.0 (listens on all addresses)
- **Allowed Hosts:** Enabled for Replit proxy compatibility
- **HMR:** Standard WebSocket configuration (auto-configured by Vite)

## Running the Application

### Development
The application runs automatically via the configured workflow:
```bash
npm run dev
```
Access at: https://[repl-url] (automatically opens in Replit webview)

### Build for Production
```bash
npm run build
```
Output directory: `dist/`

### Preview Production Build
```bash
npm run preview
```

## Deployment Options
The project includes scripts for various deployment platforms:
- Netlify: `npm run deploy:netlify`
- Vercel: `npm run deploy:vercel`
- Firebase: `npm run deploy:firebase`

## Data Storage
- All data is stored in browser localStorage
- No backend server required
- Optional Firebase sync available for multi-device access
- Export/Import features for data backup

## Notes
- This is a frontend-only application with no backend dependencies
- The app works completely offline once cached as a PWA
- Firebase integration is optional and can be configured for cloud sync
- The service worker enables offline functionality and app installation
