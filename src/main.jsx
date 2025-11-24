import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './lib/theme.jsx'
import { initializeAudio } from './lib/notifications.js';
import './styles.css'

// Initialize the audio context for notification sounds
initializeAudio();

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
window.deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('💾 PWA install prompt available');
  e.preventDefault();
  window.deferredInstallPrompt = e;
  // Dispatch event for any active listeners to update UI
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed successfully');
  // Clear the prompt once installed
  window.deferredInstallPrompt = null;
  // Dispatch event to hide the install button
  window.dispatchEvent(new CustomEvent('pwa-install-hidden'));
});

// Expose install function globally
window.installPWA = async () => {
  if (!window.deferredInstallPrompt) {
    console.warn('⚠️ PWA install prompt not available');
    return false;
  }
  
  const prompt = window.deferredInstallPrompt;
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  
  console.log(`PWA install outcome: ${outcome}`);
  
  // The prompt can only be used once, so clear it.
  window.deferredInstallPrompt = null;
  
  // Dispatch event to hide the button
  window.dispatchEvent(new CustomEvent('pwa-install-hidden'));
  
  return outcome === 'accepted';
};
