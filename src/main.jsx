import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './lib/theme.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'service-worker.js').then(reg => {
      console.log('✅ Service Worker registered successfully')
      
      // If there's an already-waiting SW, ask it to activate immediately
      if (reg.waiting) {
        try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }) } catch(e){}
      }

      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing
        if (!newSW) return
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New service worker update available')
            // New update available. Ask it to activate.
            try { newSW.postMessage({ type: 'SKIP_WAITING' }) } catch(e){}
          }
        })
      })

      // When the new SW takes control, reload to fetch the fresh assets
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Reloading page with new service worker')
        try { window.location.reload() } catch (e) {}
      })
    }).catch(err => {
      console.warn('⚠️ Service worker registration failed:', err)
    })
  })
}

// PWA Install Prompt Handler
let deferredPrompt = null

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('💾 PWA install prompt available')
  e.preventDefault()
  deferredPrompt = e
  
  // Show install button in the UI
  const installEvent = new CustomEvent('pwa-install-available', { detail: e })
  window.dispatchEvent(installEvent)
})

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed successfully')
  deferredPrompt = null
})

// Expose install function globally
window.installPWA = async () => {
  if (!deferredPrompt) {
    console.warn('⚠️ PWA install prompt not available')
    return false
  }
  
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  console.log(`PWA install outcome: ${outcome}`)
  deferredPrompt = null
  return outcome === 'accepted'
}
