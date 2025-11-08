import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// register a basic service worker in production only
if (import.meta.env && import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      // If there's an already-waiting SW, ask it to activate immediately
      if (reg.waiting) {
        try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }) } catch(e){}
      }

      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing
        if (!newSW) return
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            // New update available. Ask it to activate.
            try { newSW.postMessage({ type: 'SKIP_WAITING' }) } catch(e){}
          }
        })
      })

      // When the new SW takes control, reload to fetch the fresh assets
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        try { window.location.reload() } catch (e) {}
      })
    }).catch(err => {
      console.warn('Service worker registration failed:', err)
    })
  })
}
