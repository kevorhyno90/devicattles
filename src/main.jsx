import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './lib/theme';
import { AppViewProvider } from './lib/AppViewContext.jsx';
import { initializeAudio } from './lib/notifications.js';
import './styles.css'

// Verify React is available
if (!React || !React.version) {
  console.error('❌ Critical Error: React is not properly loaded')
  document.body.innerHTML = '<div style="padding: 20px; background: #dc2626; color: white;"><h1>Error</h1><p>Failed to load application. Please refresh the page.</p></div>'
  throw new Error('React is not available')
}

// Initialize the audio context for notification sounds
try {
  initializeAudio();
} catch (e) {
  console.warn('⚠️ Audio initialization failed (optional):', e)
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found')
  throw new Error('Root element with id="root" not found in index.html')
}

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <ThemeProvider>
          <AppViewProvider>
            <App />
          </AppViewProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
} catch (e) {
  console.error('❌ Failed to render React app:', e)
  document.body.innerHTML = '<div style="padding: 20px; background: #dc2626; color: white;"><h1>Error</h1><p>Failed to load application. Error: ' + e.message + '</p></div>'
  throw e
}

// Register service worker for PWA support
// Only in production or when explicitly enabled
const isDev = import.meta.env.DEV
const isCodespaces = window.location.hostname.includes('github.dev') || window.location.hostname.includes('githubpreview.dev')

if ('serviceWorker' in navigator && !isDev && !isCodespaces) {
  window.addEventListener('load', async () => {
    try {
      // First, unregister any existing service workers to clear stale cache
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (let reg of registrations) {
        try {
          await reg.unregister()
          console.log('🔄 Unregistered old service worker')
        } catch (e) {
          console.warn('Failed to unregister service worker:', e)
        }
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        for (let cacheName of cacheNames) {
          await caches.delete(cacheName)
          console.log(`🔄 Cleared cache: ${cacheName}`)
        }
      }
      
      // Now register the fresh service worker
      const reg = await navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js', {
        scope: import.meta.env.BASE_URL
      })
      
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
    } catch (err) {
      console.info('ℹ️ Service worker not available in this environment')
    }
  })
} else {
  console.info('ℹ️ Service Worker skipped - development mode or Codespaces environment')
}

// PWA Install Prompt Handler
window.deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  if (!isDev && !isCodespaces) {
    console.log('💾 PWA install prompt available');
    e.preventDefault();
    window.deferredInstallPrompt = e;
    // Dispatch event for any active listeners to update UI
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  }
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
    if (!isDev && !isCodespaces) {
      console.info('ℹ️ PWA install prompt not available');
    }
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
