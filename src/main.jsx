import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
// Defer ThemeProvider and AppViewProvider to reduce initial bundle
// import { ThemeProvider } from './lib/theme';
// import { AppViewProvider } from './lib/AppViewContext.jsx';
// Defer audio initialization to avoid blocking initial render
// import { initializeAudio } from './lib/notifications.js';
import './styles.css'

// Suppress Zustand and other deprecation warnings before any modules load
(function() {
  const zustandWarningRegex = /\[DEPRECATED\].*Zustand|Default export is deprecated.*zustand/i;
  
  const suppressWarning = function(originalMethod) {
    return function(...args) {
      const message = String(args[0] || '');
      if (zustandWarningRegex.test(message)) {
        return; // Suppress Zustand deprecation warning
      }
      return originalMethod.apply(console, args);
    };
  };
  
  // Intercept all console methods to filter warnings
  console.warn = suppressWarning(console.warn);
  console.log = suppressWarning(console.log);
  console.info = suppressWarning(console.info);
  
  // Also suppress in error for safety
  const originalError = console.error;
  console.error = function(...args) {
    const message = String(args[0] || '');
    if (!zustandWarningRegex.test(message)) {
      originalError.apply(console, args);
    }
  };
})();

// Verify React is available
if (!React || !React.version) {
  console.error('❌ Critical Error: React is not properly loaded')
  document.body.innerHTML = '<div style="padding: 20px; background: #dc2626; color: white;"><h1>Error</h1><p>Failed to load application. Please refresh the page.</p></div>'
  throw new Error('React is not available')
}

// Defer audio initialization to after app loads
setTimeout(() => {
  import('./lib/notifications.js').then(({ initializeAudio }) => {
    try {
      initializeAudio();
    } catch (e) {
      console.warn('⚠️ Audio initialization failed (optional):', e)
    }
  }).catch(() => {});
}, 100);

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found')
  throw new Error('Root element with id="root" not found in index.html')
}

// Initial minimal render to show UI immediately
const root = createRoot(rootElement);


let loadingTimeout;
try {
  root.render(
    <React.StrictMode>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div id="initial-loading" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#059669',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
          <div id="loading-message" style={{ color: '#059669', fontSize: '16px', fontWeight: '600' }}>Loading...</div>
        </div>
      </BrowserRouter>
    </React.StrictMode>
  );
  // If providers take >2s, show a more informative message
  loadingTimeout = setTimeout(() => {
    const msg = document.getElementById('loading-message');
    if (msg) {
      msg.textContent = 'Still loading... (slow network or large modules)';
    }
  }, 2000);

  // Dynamically load providers after initial paint for faster load
Promise.all([
  import('./lib/theme'),
  import('./lib/AppViewContext.jsx')
]).then(([{ ThemeProvider }, { AppViewProvider }]) => {
  clearTimeout(loadingTimeout);
  root.render(
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
}).catch(err => {
  clearTimeout(loadingTimeout);
  console.error('❌ Failed to load app providers:', err)
  document.body.innerHTML = '<div style="padding: 20px; background: #dc2626; color: white;"><h1>Error</h1><p>Failed to load providers. Please refresh.</p></div>'
});
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
  // Defer SW registration even more to not interfere with hard reloads
  window.addEventListener('load', () => {
    // Skip SW registration completely on hard reload to speed up
    if (window.__HARD_RELOAD__) {
      console.log('⚡ Skipping SW registration on hard reload for speed');
      return;
    }
    
    // Use setTimeout to ensure SW registration doesn't block rendering
    setTimeout(async () => {
      try {
        // Check if we need to clear old caches (only on first install or major update)
        const SW_VERSION = '1.0.0';
        const storedVersion = localStorage.getItem('sw-version');
      
      if (storedVersion !== SW_VERSION) {
        console.log('🔄 Clearing old caches for update');
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (let reg of registrations) {
          try {
            await reg.unregister()
          } catch (e) {
            console.warn('Failed to unregister service worker:', e)
          }
        }
        
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          for (let cacheName of cacheNames) {
            await caches.delete(cacheName)
          }
        }
        localStorage.setItem('sw-version', SW_VERSION);
      }
      
      // Register the service worker
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
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
            // Show user-friendly update notification
            if (window.showToast) {
              window.showToast('Update available! Reload to get the latest version.', 'info');
            }
          }
        })
      })

      // Only reload on controller change if user initiated it
      let userInitiatedReload = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (userInitiatedReload) {
          window.location.reload()
        }
      })
      
      // Check for updates periodically
      setInterval(() => {
        reg.update().catch(() => {});
      }, 60 * 60 * 1000); // Check every hour
      
      } catch (err) {
        console.warn('⚠️ Service worker registration failed:', err)
      }
    }, 1000); // Delay SW registration by 1 second
  })
} else {
  if (import.meta.env.PROD) {
    console.info('ℹ️ Service Worker skipped - non-supported environment')
  }
}

// PWA Install Prompt Handler
window.deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  if (!isDev && !isCodespaces) {
    if (import.meta.env.PROD) {
      console.log('💾 PWA install prompt available');
    }
    e.preventDefault();
    window.deferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  }
});

window.addEventListener('appinstalled', () => {
  if (import.meta.env.PROD) {
    console.log('✅ PWA installed successfully');
  }
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
  
  if (import.meta.env.PROD) {
    console.log(`PWA install outcome: ${outcome}`);
  }
  
  // The prompt can only be used once, so clear it.
  window.deferredInstallPrompt = null;
  
  // Dispatch event to hide the button
  window.dispatchEvent(new CustomEvent('pwa-install-hidden'));
  
  return outcome === 'accepted';
};
