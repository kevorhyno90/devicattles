# Devins Farm — Dairy & Farm Management (PWA)

This repository now contains a minimal Progressive Web App scaffold for "Devins Farm" — a starter PWA for dairy & farm management. It is a front-end-only demo that stores data in `localStorage` and is installable as a PWA.

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

## Features

*   **Dashboard:** Get a quick overview of your farm's key metrics, including animal status, feed costs, and low stock alerts.
*   **Animal Management:** Track individual animal details, including breed, date of birth, and health status for various animal types like cattle and poultry.
*   **Breeding Records:** Monitor pregnancies and due dates.
*   **Task Management:** Keep track of your daily farm tasks.
*   **Financial Tracking:** Record transactions to monitor income and expenses.
*   **Inventory Control:** Manage stock levels for feed, medicine, and other supplies.
*   **Progressive Web App (PWA):** Install the app on your device for offline access and a native-like experience.

## Deployment

Deploy to Vercel (recommended), Firebase Hosting, or GitHub Pages:

```bash
# Build production files
npm run build

# Deploy to Vercel (recommended)
npm run deploy:vercel

# Or deploy to Firebase Hosting
npm run deploy:firebase

# Or deploy to GitHub Pages
npm run deploy:gh-pages
```

See `DEPLOYMENT_GUIDE.md` for complete instructions and `ARCHITECTURE_EXPLAINED.md` to understand why Firebase is optional.

