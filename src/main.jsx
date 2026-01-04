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

// Console coalescer: reduce repetitive noisy messages without hiding real errors.
// Runtime control: set `window.__VERBOSE_CONSOLE__ = true` to disable suppression.
(function() {
  const NOISY_PATTERNS = [
    /Firestore diagnostic/i,
    /\bSTORES\b/,
    /✅\s*Synced|🔄\s*Updated|\bSynced\b|\bUpdated\b/i,
    /Skipping item in .* without an ID/i,
    /installHook|@firebase/i,
    /Quota exceeded|maximum backoff|backoff delay/i,
    /getSnapshot should be cached|Maximum update depth exceeded|\bdeprecated\b/i,
    /\[vite\]\s*server connection lost/i,
    /Polling for restart/i,
    /server connection lost/i,
  ];

  const THROTTLE_MS = 30 * 1000; // suppress identical noisy messages for 30s
  const recent = new Map();

  function getTextFromArg(arg) {
    try {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message + '\n' + (arg.stack || '');
      return JSON.stringify(arg, getCircularReplacer());
    } catch (e) {
      return String(arg);
    }
  }

  function getKey(args) {
    return args.map(getTextFromArg).join(' | ').slice(0, 1600);
  }

  function matchesNoisy(text) {
    if (typeof window !== 'undefined' && window.__VERBOSE_CONSOLE__) return false;
    return NOISY_PATTERNS.some(r => r.test(text));
  }

  function getCircularReplacer() {
    const seen = new WeakSet();
    return (k, v) => {
      if (v && typeof v === 'object') {
        if (seen.has(v)) return '[Circular]';
        seen.add(v);
      }
      return v;
    };
  }

  function makeWrapper(methodName) {
    const original = console[methodName].bind(console);
    return function(...args) {
      try {
        const key = getKey(args);
        if (matchesNoisy(key)) {
          const now = Date.now();
          const last = recent.get(key) || 0;
          if (now - last < THROTTLE_MS) {
            // skip duplicate noisy message
            return;
          }
          recent.set(key, now);
          // allow the first occurrence through
        }
      } catch (e) {
        // If our filter throws, don't break console
      }
      return original(...args);
    };
  }

  // Replace console methods safely
  ['log', 'info', 'warn', 'error'].forEach(m => {
    try { console[m] = makeWrapper(m) } catch (e) {}
  });

  // Expose a small API to toggle verbosity at runtime
  try {
    Object.defineProperty(window, '__VERBOSE_CONSOLE__', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: !!window.__VERBOSE_CONSOLE__
    });
    window.setConsoleVerbose = (v) => { window.__VERBOSE_CONSOLE__ = !!v; console.info('Console verbose:', !!v) };
  } catch (e) {}
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
]).then(async ([{ ThemeProvider, ThemeToggleButton }, { AppViewProvider, AppViewContext }]) => {
  // Expose the context object globally so the App can reference it without
  // importing the module eagerly (helps keep the initial bundle smaller).
  if (typeof window !== 'undefined' && AppViewContext) {
    try { window.AppViewContext = AppViewContext } catch(e) {}
  }
  if (typeof window !== 'undefined' && ThemeToggleButton) {
    try { window.ThemeToggleButton = ThemeToggleButton } catch(e) {}
  }
  clearTimeout(loadingTimeout);

      // Kick off Firestore sync (noop if Firebase not configured)
  try {
    // Diagnostic probe: log Firebase auth state and configured STORES, and delay sync until auth ready
    try {
      const firebaseMod = await import('./lib/firebase')
      const storageMod = await import('./lib/storage')
      const { auth } = firebaseMod
      const { STORES } = storageMod
          const _shouldLogFirestore = import.meta.env.DEV || !!window.DEBUG_FIRESTORE
          if (_shouldLogFirestore) console.debug('Firestore diagnostic - STORES:', Object.keys(STORES))
      if (auth) {
        const user = auth.currentUser
            if (_shouldLogFirestore) console.debug('Firestore diagnostic - currentUser:', user ? { uid: user.uid, email: user.email } : null)
        try {
          // Start sync only after a user is authenticated to avoid permission-denied errors
          const unsubscribe = auth.onAuthStateChanged(u => {
                if (_shouldLogFirestore) console.debug('Firestore diagnostic - onAuthStateChanged:', u ? { uid: u.uid, email: u.email } : null)
            if (u) {
              try { import('./lib/firebaseSync').then(m => m.startFirestoreSync()).catch(e => console.warn('startFirestoreSync failed:', e)) } catch (e) { console.warn('Firestore sync start failed:', e) }
              try { if (typeof unsubscribe === 'function') unsubscribe() } catch (e) {}
            } else {
                  if (_shouldLogFirestore) console.debug('Skipping Firestore sync: user not authenticated yet.')
            }
          })
        } catch (e) {
          console.warn('Failed to attach auth listener for Firestore diagnostic:', e)
          // Fallback: attempt to start sync (non-ideal) so app can function in some environments
          try { import('./lib/firebaseSync').then(m => m.startFirestoreSync()).catch(e => console.warn('startFirestoreSync failed (fallback):', e)) } catch (e2) { console.warn('Firestore sync start failed (fallback):', e2) }
        }
      } else {
        console.info('Firestore diagnostic - auth not initialized; skipping sync')
      }
    } catch (probeErr) {
      console.warn('Firestore diagnostic probe failed:', probeErr)
      // If probe fails, attempt to start sync as a best-effort fallback
      try { startFirestoreSync() } catch (e) { console.warn('Firestore sync start failed (probe fallback):', e) }
    }
  } catch (syncErr) {
    console.warn('Firestore sync not started:', syncErr);
  }

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

// If running inside Codespaces / app.github.dev preview, warn about the preview proxy
if (isCodespaces) {
  const msg = 'Running in Codespaces preview: open the forwarded port using the Codespaces "Open in Browser" link or make the port public so asset requests are allowed. See CODESPACES_PREVIEW.md for details.'
  try {
    console.warn(msg)
    if (!document.getElementById('codespaces-preview-warning')) {
      const b = document.createElement('div')
      b.id = 'codespaces-preview-warning'
      b.style = 'position:fixed;left:0;right:0;top:0;z-index:9999;padding:8px 12px;background:#f59e0b;color:#111;font-weight:600;text-align:center;font-family:system-ui;-webkit-font-smoothing:antialiased;'
      b.textContent = msg
      document.addEventListener('DOMContentLoaded', () => {
        try { document.body.appendChild(b) } catch (e) {}
      })
      // if DOM already ready
      try { if (document.body) document.body.appendChild(b) } catch(e){}
    }
  } catch (e) {}
}

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
