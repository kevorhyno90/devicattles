# Devins Farm — Dairy & Farm Management (PWA)

This repository now contains a minimal Progressive Web App scaffold for "Devins Farm" — a starter PWA for dairy & farm management. It is a front-end-only demo that stores data in `localStorage` and is installable as a PWA.

Quick start

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open the app in your browser at the URL printed by Vite (usually `http://localhost:5173`).

Build & preview:

```bash
npm run build
npm run preview
```

Notes & next steps

- The app is a starter shell with Animals list (localStorage-backed), simple navigation, and a basic service worker for offline caching.
- To connect real data, add a backend API and replace localStorage calls with fetch/XHR and auth.
- If you want the old compiled Android bundle removed from the repo entirely, confirm and I will delete it (this is destructive).

Potential follow-ups:
- Add mapping for pastures (Mapbox or Leaflet) and CRUD for pastures.
- Add finance ledger and export/import.
- Add authentication and sync (optional).
