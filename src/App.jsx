import React, { useState, useEffect, lazy, Suspense, useContext } from 'react'
import Crops from './modules/Crops'
// Helper function to retry failed lazy loads (important for Android Chrome)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const createLazyLoadFailureModule = (error) => ({
  default: function LazyLoadFailure() {
    return (
      <div style={{
        padding: '24px',
        margin: '12px 0',
        borderRadius: '12px',
        border: '1px solid #fecaca',
        background: '#fef2f2',
        color: '#7f1d1d'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Module failed to load</h3>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
          The module chunk could not be loaded right now. This no longer forces an app restart.
          Please try switching tabs and opening the module again.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '12px',
            background: '#991b1b',
            color: 'white',
            border: 'none',
            padding: '10px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          Reload app
        </button>
        {import.meta.env.DEV && error?.message && (
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.85 }}>
            Details: {error.message}
          </p>
        )}
      </div>
    )
  }
})

const lazyWithRetry = (importFunc, retries = 2) => {
  return lazy(async () => {
    let lastError = null
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await importFunc()
      } catch (error) {
        lastError = error
        console.error(`Module load attempt ${attempt + 1} failed:`, error)
        if (attempt < retries) {
          await wait((attempt + 1) * 800)
        }
      }
    }

    // Return an inline fallback module so the app remains stable.
    return createLazyLoadFailureModule(lastError)
  })
}
// Defer heavy Firebase imports until after initial render
// import { requestNotificationPermission, listenForMessages } from './lib/firebaseMessaging'
// Avoid importing theme provider/hooks and AppViewContext at module load
// to prevent them from being bundled into the initial chunk. We'll read
// theme colors from CSS variables at render time and obtain the
// `AppViewContext` from `window` after the dynamic provider is loaded.
// Lazy load heavy components to reduce initial bundle
const OfflineIndicator = lazyWithRetry(() => import('./components/OfflineIndicator'))
const InAppNotification = lazyWithRetry(() => import('./components/InAppNotification'))
const BottomNav = lazyWithRetry(() => import('./components/BottomNav'))
const KeyboardShortcutsHelp = lazyWithRetry(() => import('./components/KeyboardShortcutsHelp'))
const GlobalSearch = lazyWithRetry(() => import('./components/GlobalSearch'))
// AppViewContext will be available on `window.AppViewContext` after
// `main.jsx` dynamically imports the provider. Use a fallback context
// when not present to keep hooks stable.
import SwipeHandler from './components/SwipeHandler'
import ErrorBoundary from './components/ErrorBoundary'
// Defer DataLayer and error handler to avoid heavy initialization
// import { DataLayer } from './lib/dataLayer'
// import { initGlobalErrorHandler } from './lib/errorHandler'
import ToastContainer from './components/ToastContainer'
import useUISettings from './hooks/useUISettings'
import Header from './components/Header'
import useAuthInit from './hooks/useAuthInit'
import { useTheme } from './lib/theme'
import AudioEnableBanner from './components/AudioEnableBanner'
import { getLivestockQualityScores } from './lib/livestockPhase1'
// Lazy load stores to improve initial load time
// import { useAnimalStore, useCropStore, useFinanceStore, useTaskStore, useInventoryStore, useUIStore } from './stores'

const GoatModule = lazyWithRetry(() => import('./modules/GoatModule'))
const Notes = lazyWithRetry(() => import('./modules/Notes'))



// Lazy load all modules with retry logic
const Dashboard = lazyWithRetry(() => import('./modules/Dashboard'))
const NotificationCenter = lazyWithRetry(() => import('./modules/NotificationCenter'))
// Load Animals lazily to reduce initial bundle
const Animals = lazyWithRetry(() => import('./modules/Animals'))
const Tasks = lazyWithRetry(() => import('./modules/Tasks'))
const Finance = lazyWithRetry(() => import('./modules/Finance'))
const EmploymentManager = lazyWithRetry(() => import('./modules/EmploymentManager'))
const Schedules = lazyWithRetry(() => import('./modules/Schedules'))
const Inventory = lazyWithRetry(() => import('./modules/Inventory'))
const Pastures = lazyWithRetry(() => import('./modules/Pastures'))
const HealthSystem = lazyWithRetry(() => import('./modules/HealthSystem'))
const Login = lazyWithRetry(() => import('./modules/Login'))
// AuditLog import removed
const BackupRestore = lazyWithRetry(() => import('./modules/BackupRestore'))
const SyncSettings = lazyWithRetry(() => import('./modules/SyncSettings'))
const EnhancedSettings = lazyWithRetry(() => import('./modules/EnhancedSettings'))
const CanineManagement = lazyWithRetry(() => import('./modules/CanineManagement'))
const PoultryManagement = lazyWithRetry(() => import('./modules/PoultryManagement'))
const BSFFarming = lazyWithRetry(() => import('./modules/BSFFarming'))
const CalendarView = lazyWithRetry(() => import('./modules/CalendarView'))
const SmartAlerts = lazyWithRetry(() => import('./modules/SmartAlerts'))
const TimelinePlanner = lazyWithRetry(() => import('./modules/TimelinePlanner'))
const PhotoGalleryAdvanced = lazyWithRetry(() => import('./modules/PhotoGalleryAdvanced'))
// const GeospatialMap = lazyWithRetry(() => import('./modules/GeospatialMap')) // Module removed
// const PredictiveAnalytics = lazyWithRetry(() => import('./modules/PredictiveAnalytics')) // Module removed
// Removed for startup performance: const AdvancedBatchOps = lazyWithRetry(() => import('./modules/AdvancedBatchOps'))
const CustomReportBuilder = lazyWithRetry(() => import('./modules/CustomReportBuilder'))
// const AIInsightsDashboard = lazyWithRetry(() => import('./modules/AIInsightsDashboard'))
const AlertCenter = lazyWithRetry(() => import('./modules/AlertCenter'))
const MobileSettings = lazyWithRetry(() => import('./modules/MobileSettings'))
// const DashboardBuilder = lazyWithRetry(() => import('./modules/DashboardBuilder')) // Module removed
const ActivityFeed = lazyWithRetry(() => import('./modules/ActivityFeed'))


const HealthAnalyticsDashboard = lazyWithRetry(() => import('./modules/HealthAnalyticsDashboard'))
// const StoreDemo = lazyWithRetry(() => import('./modules/StoreDemo')) // Module removed
const Marketplace = lazyWithRetry(() => import('./modules/Marketplace'))



// Phase 2: Smart Features UI Modules
const AlertRules = lazyWithRetry(() => import('./modules/AlertRules'))
// const DiseaseDetection = lazyWithRetry(() => import('./modules/DiseaseDetection')) // Module removed
// const PredictiveDashboard = lazyWithRetry(() => import('./modules/PredictiveDashboard')) // Module removed

// Phase 3: Reports & Analytics


// Loading fallback component with timeout detection
const LoadingFallback = () => {
  const [showError, setShowError] = React.useState(false)
  
  React.useEffect(() => {
    // If loading takes more than 10 seconds, show error
    const timer = setTimeout(() => {
      setShowError(true)
    }, 10000)
    return () => clearTimeout(timer)
  }, [])
  
  if (showError) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ color: '#dc2626', marginBottom: '12px' }}>Module Failed to Load</h3>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: '20px' }}>
          This module is taking too long to load. This might be due to:
        </p>
        <ul style={{ textAlign: 'left', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
          <li>Slow internet connection</li>
          <li>Browser compatibility issue</li>
          <li>Module is too large for mobile device</li>
        </ul>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#059669',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    )
  }
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      flexDirection: 'column',
      gap: '16px',
      padding: '40px 20px'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #e5e7eb',
        borderTopColor: '#059669',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}></div>
      <div style={{ 
        color: '#059669', 
        fontSize: '16px', 
        fontWeight: '600',
        textAlign: 'center'
      }}>Loading module...</div>
      <div style={{ 
        color: '#9ca3af', 
        fontSize: '13px',
        textAlign: 'center',
        maxWidth: '300px'
      }}>Please wait, this may take a few seconds</div>
    </div>
  )
}

// Import critical auth/settings functions (needed immediately)
import { getCurrentUserName, getCurrentUserRole } from './lib/auth'
// Defer heavy lib imports to dynamic loading when possible
// import { logAction, ACTIONS, ENTITIES } from './lib/audit'
// import { startReminderChecker, stopReminderChecker, getUnreadCount } from './lib/notifications'
// import { checkAllAutoNotifications } from './lib/autoNotifications'
// import { initSync, setupAutoSync } from './lib/sync'
// import { alertRuleEngine } from './lib/alertRuleEngine'
// import { installAllRules } from './lib/farmAlertRules'

// App content component that uses theme
function AppContent() {
  const appSafeMode = typeof window !== 'undefined' && window.__APP_SAFE_MODE__ === true
  const getColorsFromCSS = () => {
    if (typeof window === 'undefined' || !window.getComputedStyle) return {
      bg: { primary: '#ffffff', secondary: '#f9fafb', tertiary: '#f3f4f6', elevated: '#ffffff' },
      text: { primary: '#1f2937', secondary: '#6b7280', tertiary: '#9ca3af', inverse: '#ffffff' },
      border: { primary: '#e5e7eb', secondary: '#d1d5db', focus: '#3b82f6' },
      action: { primary: '#3b82f6', primaryHover: '#2563eb', success: '#10b981', successHover: '#059669', danger: '#ef4444', dangerHover: '#dc2626', warning: '#f59e0b', warningHover: '#d97706', purple: '#8b5cf6', purpleHover: '#7c3aed' },
      shadow: { sm: '0 1px 2px 0 rgba(0,0,0,0.05)', md: '0 4px 6px -1px rgba(0,0,0,0.1)', lg: '0 10px 15px -3px rgba(0,0,0,0.1)', xl: '0 20px 25px -5px rgba(0,0,0,0.1)' },
      chart: { primary: '#3b82f6', secondary: '#10b981', tertiary: '#f59e0b', quaternary: '#ef4444', quinary: '#8b5cf6', senary: '#06b6d4' }
    }

    const s = getComputedStyle(document.documentElement)
    const v = (name, fallback='') => s.getPropertyValue(name).trim() || fallback

    return {
      bg: { primary: v('--bg-primary', '#ffffff'), secondary: v('--bg-secondary', '#f9fafb'), tertiary: v('--bg-tertiary', '#f3f4f6'), elevated: v('--bg-elevated', '#ffffff') },
      text: { primary: v('--text-primary', '#1f2937'), secondary: v('--text-secondary', '#6b7280'), tertiary: v('--text-tertiary', '#9ca3af'), inverse: v('--text-inverse', '#ffffff') },
      border: { primary: v('--border-primary', '#e5e7eb'), secondary: v('--border-secondary', '#d1d5db'), focus: v('--border-focus', '#3b82f6') },
      action: { primary: v('--action-primary', '#3b82f6'), primaryHover: v('--action-primary-hover', '#2563eb'), success: v('--action-success', '#10b981'), successHover: v('--action-success-hover', '#059669'), danger: v('--action-danger', '#ef4444'), dangerHover: v('--action-danger-hover', '#dc2626'), warning: v('--action-warning', '#f59e0b'), warningHover: v('--action-warning-hover', '#d97706'), purple: v('--action-purple', '#8b5cf6'), purpleHover: v('--action-purple-hover', '#7c3aed') },
      shadow: { sm: v('--shadow-sm', '0 1px 2px 0 rgba(0,0,0,0.05)'), md: v('--shadow-md', '0 4px 6px -1px rgba(0,0,0,0.1)'), lg: v('--shadow-lg', '0 10px 15px -3px rgba(0,0,0,0.1)'), xl: v('--shadow-xl', '0 20px 25px -5px rgba(0,0,0,0.1)') },
      chart: { primary: v('--chart-primary', '#3b82f6'), secondary: v('--chart-secondary', '#10b981'), tertiary: v('--chart-tertiary', '#f59e0b'), quaternary: v('--chart-quaternary', '#ef4444'), quinary: v('--chart-quinary', '#8b5cf6'), senary: v('--chart-senary', '#06b6d4') }
    }
  }

  const colors = getColorsFromCSS();

  const AppViewContextLocal = (typeof window !== 'undefined' && window.AppViewContext) ? window.AppViewContext : React.createContext({ view: 'landing', setView: () => {}, editMode: false, setEditMode: () => {} });
  const { view, setView, editMode, setEditMode } = useContext(AppViewContextLocal);
  const ThemeToggle = (typeof window !== 'undefined' && window.ThemeToggleButton) ? window.ThemeToggleButton : null;
  // Authentication state is managed via hook
  const { authenticated, currentUser, handleLoginSuccess, handleLogout } = useAuthInit({ onLogout: () => setView('landing') })
  const [animals, setAnimals] = useState([]);
  const [crops, setCrops] = useState([]);
  const [finance, setFinance] = useState([]);
  // Stores are lazy-loaded only when needed by specific modules
  // const crops = useCropStore(state => state.crops || [])
  // const finance = useFinanceStore(state => state.transactions || [])
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [deniedStores, setDeniedStores] = useState([]);
  const [showNavMore, setShowNavMore] = useState(false);
  const [livestockCounts, setLivestockCounts] = useState({ dairy: 0, goats: 0, canines: 0, poultry: 0, bsf: 0 });
  const [animalsInitialTab, setAnimalsInitialTab] = useState('list');
  const [goatInitialView, setGoatInitialView] = useState('goats');
  const [poultryInitialView, setPoultryInitialView] = useState('flocks');
  const [canineInitialTab, setCanineInitialTab] = useState('list');
  const [bsfInitialTab, setBsfInitialTab] = useState('colonies');
  const [cropsInitialTab, setCropsInitialTab] = useState('list');
  const [cropsInitialSubmodule, setCropsInitialSubmodule] = useState('all');
  const [employmentInitialTab, setEmploymentInitialTab] = useState('registry');
  const [inventoryInitialView, setInventoryInitialView] = useState('supplies');
  const [animalsRecordSource, setAnimalsRecordSource] = useState(null);
  const [goatRecordSource, setGoatRecordSource] = useState(null);
  const [poultryRecordSource, setPoultryRecordSource] = useState(null);
  const [canineRecordSource, setCanineRecordSource] = useState(null);
  const [bsfRecordSource, setBsfRecordSource] = useState(null);
  const [cropsRecordSource, setCropsRecordSource] = useState(null);
  const [employmentRecordSource, setEmploymentRecordSource] = useState(null);

  const openCropOS = () => {
    setCropsInitialTab('portfolio')
    setCropsInitialSubmodule('all')
    setCropsRecordSource(null)
    setView('crops')
  }
  
  // UI branding/settings - use hook to load/save from localStorage
  const SETTINGS_KEY = 'devinsfarm:ui:settings'
  const defaultSettings = { backgroundOn: false, background: 'bg-farm.svg', logo: 'jr-farm-logo.svg', uploadedLogo: '' }
  const [settings, setSettings] = useUISettings(SETTINGS_KEY, defaultSettings)
  const previewLogoSrc = settings.logo === 'uploaded' && settings.uploadedLogo
    ? settings.uploadedLogo
    : `/assets/${settings.logo || 'jr-farm-logo.svg'}`

  // Cleanup stale data from removed Market Prices feature.
  useEffect(() => {
    try {
      const removedKeys = [
        'cattalytics:market:prices',
        'cattalytics:market:history',
        'cattalytics:market:targets'
      ]
      removedKeys.forEach((key) => localStorage.removeItem(key))
    } catch {
      // localStorage may be unavailable in restricted contexts
    }
  }, [])

  // Initialize error handler and data layer on mount (dynamically imported for better performance)
  useEffect(() => {
    // Defer heavy initialization to not block initial render
    Promise.all([
      import('./lib/errorHandler').then(m => m.initGlobalErrorHandler()),
      import('./lib/dataLayer').then(m => m.DataLayer.initialize())
    ]).catch(console.error);
  }, []);

  // Keyboard shortcut for global search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cross-module navigation bridge (e.g., Marketplace -> Inventory Orders)
  useEffect(() => {
    const handleNavigate = (event) => {
      const detail = event?.detail || {}
      const targetView = detail.view

      if (!targetView) return

      if (targetView === 'inventory') {
        const nextSubView = detail.subView || 'supplies'
        setInventoryInitialView(nextSubView)
      }

      setView(targetView)
    }

    window.addEventListener('cattalytics:navigate', handleNavigate)
    return () => window.removeEventListener('cattalytics:navigate', handleNavigate)
  }, [setView])

  // PWA Install Prompt
  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Only prevent default if we're not in standalone mode (not already installed)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return; // App is already installed, don't show prompt
      }
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Poll for any Firestore permission-denied stores to show aggregated banner
  useEffect(() => {
    let mounted = true
    let lastDeniedKey = ''

    const updateDeniedStores = (arr) => {
      if (!mounted) return
      const safe = Array.isArray(arr) ? arr : []
      const nextKey = safe.slice().sort().join('|')
      if (nextKey !== lastDeniedKey) {
        lastDeniedKey = nextKey
        setDeniedStores(safe)
      }
    }

    const checkDenied = async () => {
      try {
        if (typeof window !== 'undefined' && window.__firestorePermissionDeniedStores) {
          const arr = Array.from(window.__firestorePermissionDeniedStores || [])
          updateDeniedStores(arr)
          return
        }
        const mod = await import('./lib/firebaseSync').catch(() => null)
        if (mod && typeof mod.getFirestorePermissionDeniedStores === 'function') {
          const arr = mod.getFirestorePermissionDeniedStores() || []
          updateDeniedStores(arr)
        }
      } catch (e) {
        // ignore
      }
    }
    checkDenied()
    if (typeof window !== 'undefined' && window.__deniedStoresPollInterval) {
      clearInterval(window.__deniedStoresPollInterval)
    }
    const iv = setInterval(checkDenied, 15000)
    if (typeof window !== 'undefined') {
      window.__deniedStoresPollInterval = iv
    }
    return () => {
      mounted = false
      clearInterval(iv)
      if (typeof window !== 'undefined' && window.__deniedStoresPollInterval === iv) {
        window.__deniedStoresPollInterval = null
      }
    }
  }, [])

  // Handle install button click
  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          window.showToast && window.showToast('App installation started!', 'success');
        } else {
          window.showToast && window.showToast('App installation dismissed.', 'info');
        }
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      });
    }
  };

  // Request notification permission and listen for messages on startup (lazy loaded)
  // NOTE: Only initialize listener if permission already granted
  // Don't auto-request permission (must be user-initiated)
  useEffect(() => {
    // Defer to not block initial render
    const timer = setTimeout(() => {
      // Check if permission already granted
      if ('Notification' in window && Notification.permission === 'granted') {
        // Dynamically import Firebase messaging to reduce initial bundle
        import('./lib/firebaseMessaging').then(({ requestNotificationPermission, listenForMessages }) => {
          requestNotificationPermission().then(token => {
            if (token) {
              listenForMessages((payload) => {
                console.log('📬 Foreground notification:', payload);
              });
            }
          });
        }).catch(err => console.warn('Firebase messaging not available:', err));
      }
    }, 1000); // Defer by 1 second
    
    return () => clearTimeout(timer);
  }, []);

  // Authentication is handled by `useAuthInit` hook; no local auth initialization here.

  // Start notification/reminder checker and sync (deferred for performance)
  useEffect(() => {
    if (authenticated && !appSafeMode) {
      let disposed = false
      let countInterval = null
      let autoCheckInterval = null
      let alertInterval = null
      let alertInitTimeout = null
      let stopReminder = null
      let unreadListener = null

      // Defer heavy initialization by 500ms to let UI render first
      const initTimeout = setTimeout(async () => {
        // Dynamically import all notification/sync modules
        const [
          { checkAllAutoNotifications },
          { startReminderChecker, stopReminderChecker, getUnreadCount },
          { initSync, setupAutoSync },
          { alertRuleEngine },
          { installAllRules }
        ] = await Promise.all([
          import('./lib/autoNotifications'),
          import('./lib/notifications'),
          import('./lib/sync'),
          import('./lib/alertRuleEngine'),
          import('./lib/farmAlertRules')
        ]);

        if (disposed) return

        // Always stop any previous reminder checker before starting a new one
        stopReminderChecker();

        // Run initial check
        checkAllAutoNotifications();

        startReminderChecker();
        stopReminder = stopReminderChecker

        // Update unread count
        const updateUnreadCount = () => {
          if (disposed) return
          setUnreadNotifications(getUnreadCount());
        };

        updateUnreadCount();
        countInterval = setInterval(updateUnreadCount, 30000); // Every 30 seconds

        // Check auto notifications based on settings (defaults to 60 minutes).
        let lastAutoCheckAt = Date.now()
        autoCheckInterval = setInterval(async () => {
          if (disposed) return
          try {
            const { getEnhancedSettings } = await import('./lib/enhancedSettings')
            const prefs = getEnhancedSettings()?.notifications || {}
            const frequencyMinutes = Math.max(1, Number(prefs.autoNotificationFrequency) || 60)
            const due = (Date.now() - lastAutoCheckAt) >= frequencyMinutes * 60 * 1000
            if (due) {
              checkAllAutoNotifications()
              lastAutoCheckAt = Date.now()
            }
          } catch (error) {
            // Fallback behavior if settings are unavailable.
            checkAllAutoNotifications()
            lastAutoCheckAt = Date.now()
          }
        }, 60 * 1000)

        // Listen for new notifications
        unreadListener = updateUnreadCount
        window.addEventListener('newNotification', unreadListener);

        // Initialize sync if configured - wrapped in try-catch
        try {
          initSync();
          setupAutoSync();
        } catch (error) {
          console.warn('Sync initialization failed (optional feature):', error);
        }

        // Phase 2: Initialize smart alert rules (deferred)
        alertInitTimeout = setTimeout(() => {
          if (disposed) return
          try {
            installAllRules(alertRuleEngine);
            alertRuleEngine.evaluateAllRules();
            alertInterval = setInterval(() => {
              alertRuleEngine.evaluateAllRules();
            }, 5 * 60 * 1000); // Every 5 minutes
          } catch (error) {
            console.warn('Alert rules initialization failed (optional feature):', error);
          }
        }, 2000); // Defer alerts by 2 seconds
      }, 500);

      return () => {
        disposed = true
        clearTimeout(initTimeout);
        clearTimeout(alertInitTimeout)
        if (typeof stopReminder === 'function') {
          stopReminder()
        }
        if (countInterval) {
          clearInterval(countInterval)
        }
        if (autoCheckInterval) {
          clearInterval(autoCheckInterval)
        }
        if (alertInterval) {
          clearInterval(alertInterval)
        }
        if (unreadListener) {
          window.removeEventListener('newNotification', unreadListener)
        }
      };
    }
  }, [authenticated, appSafeMode]);

  // Load animals for passing to health system and groups.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cattalytics:animals');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAnimals(Array.isArray(parsed) ? parsed : []);
      } else {
        setAnimals([]);
      }
    } catch (e) {
      setAnimals([]);
    }
  }, [view]); // Reload when view changes to keep animals fresh

  useEffect(() => {
    const sameCounts = (a, b) => (
      a.dairy === b.dairy &&
      a.goats === b.goats &&
      a.canines === b.canines &&
      a.poultry === b.poultry &&
      a.bsf === b.bsf
    )

    const refreshLivestockCounts = () => {
      try {
        const goats = JSON.parse(localStorage.getItem('cattalytics:goats') || '[]')
        const flocks = JSON.parse(localStorage.getItem('cattalytics:flocks') || '[]')
        const poultry = JSON.parse(localStorage.getItem('cattalytics:poultry') || '[]')
        const bsf = JSON.parse(localStorage.getItem('cattalytics:bsf:colonies') || '[]')

        const nextCounts = {
          dairy: animals.filter(animal => animal.groupId === 'G-001').length,
          goats: goats.length,
          canines: animals.filter(animal => animal.groupId === 'G-008').length,
          poultry: flocks.length || poultry.length,
          bsf: bsf.length
        }

        setLivestockCounts(prev => sameCounts(prev, nextCounts) ? prev : nextCounts)
      } catch (error) {
        const fallback = { dairy: 0, goats: 0, canines: 0, poultry: 0, bsf: 0 }
        setLivestockCounts(prev => sameCounts(prev, fallback) ? prev : fallback)
      }
    }

    refreshLivestockCounts()
    const interval = setInterval(refreshLivestockCounts, 15000)
    return () => clearInterval(interval)
  }, [animals])
  


  // Global toast notification function
  useEffect(() => {
    window.showToast = (message, type = 'info') => {
      // Create toast element
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(toast);
      
      // Remove after 3 seconds
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    };
  }, []);

  

  if (view === 'landing') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(140deg, #f7fce8 0%, #ecfeff 45%, #fff7ed 100%)', color: '#102a43' }}>
        <section style={{ maxWidth: 1150, margin: '0 auto', padding: '48px 22px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 26 }}>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.03em', color: '#064e3b' }}>DEVINS FARM</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setView(authenticated ? 'dashboard' : 'dashboard')} style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>
                {authenticated ? 'Open Dashboard' : 'Get Started'}
              </button>
              <button onClick={() => setView('animals')} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid #cbd5e1', borderRadius: 999, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>
                Preview Livestock
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'stretch' }}>
            <div style={{ background: 'radial-gradient(130% 180% at 0% 0%, #dcfce7 0%, #dbeafe 45%, #ffffff 100%)', borderRadius: 24, border: '1px solid #bbf7d0', padding: '34px 30px', boxShadow: '0 20px 60px rgba(16,185,129,0.12)' }}>
              <div style={{ display: 'inline-block', background: '#065f46', color: '#ecfdf5', borderRadius: 999, padding: '6px 12px', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', marginBottom: 14 }}>
                OFFLINE-FIRST SMART FARM OS
              </div>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)', lineHeight: 1.06, margin: '4px 0 14px', color: 'var(--text-primary)', maxWidth: 760 }}>
                Run your farm with clarity, speed, and confidence.
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: '#334155', maxWidth: 690, marginBottom: 22 }}>
                Track livestock, feeding, treatment, breeding, milk yield, finances, and alerts in one beautiful workspace built for real daily operations.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setView('dashboard')} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 18px', fontWeight: 800, cursor: 'pointer' }}>
                  Enter Command Center
                </button>
                <button onClick={() => setView('settings')} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid #cbd5e1', borderRadius: 12, padding: '12px 18px', fontWeight: 800, cursor: 'pointer' }}>
                  Customize Experience
                </button>
              </div>
            </div>

            <div style={{ background: '#ffffffcc', backdropFilter: 'blur(4px)', borderRadius: 24, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 16px 40px rgba(2,6,23,0.09)' }}>
              <h3 style={{ marginTop: 0, marginBottom: 12, color: 'var(--text-primary)' }}>What You Can Manage</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  ['Livestock Records', 'Dairy, goats, poultry, canines, BSF'],
                  ['Health and Treatment', 'Vaccines, treatments, diagnostics'],
                  ['Breeding and Production', 'Breeding cycles and milk yield'],
                  ['Finance and Inventory', 'Costs, revenue, stock and operations'],
                  ['Smart Alerts', 'Proactive reminders and risk flags']
                ].map(([title, desc]) => (
                  <div key={title} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px', background: 'var(--bg-elevated)' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              ['Realtime Snapshot', 'Instant module summaries across your farm'],
              ['Mobile Friendly', 'Designed for in-field usage'],
              ['Offline Support', 'Keep working even without internet'],
              ['Cloud Sync Ready', 'Secure sync when authenticated']
            ].map(([title, desc]) => (
              <div key={title} style={{ background: 'var(--bg-elevated)', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  // Show login if not authenticated
  if (!authenticated) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    )
  }

  const livestockQualityScores = getLivestockQualityScores()

  const LIVESTOCK_RECORD_CATALOG = {
    animals: {
      Registry: ['Master List', 'Identification', 'Grouping', 'Ownership', 'Lineage', 'Photos', 'QR Tags'],
      Production: ['Milk Yield', 'Lactation', 'Peak Yield', 'Egg Production', 'Meat Yield', 'Growth Metrics', 'Performance Scores'],
      Health: ['Vaccinations', 'Treatments', 'Diagnoses', 'Vet Visits', 'Allergies', 'Chronic Conditions', 'Quarantine'],
      Breeding: ['Heat Events', 'Service Records', 'Pregnancy Checks', 'Expected Due Dates', 'Calving Events', 'Offspring Tracking'],
      Nutrition: ['Feeding Events', 'Ration Plans', 'Supplements', 'Water Intake', 'Feed Conversion Ratio'],
      Measurements: ['Weight Logs', 'Body Condition Score', 'Body Measurements', 'Growth Curves'],
      Finance: ['Acquisition Cost', 'Feed Cost', 'Vet Cost', 'Revenue', 'ROI', 'Profit/Loss'],
      Compliance: ['Insurance', 'Certificates', 'Movement Permits', 'Registration Papers', 'Audit Trail']
    },
    goats: {
      Registry: ['Goat Profiles', 'Tag Numbers', 'Breed Records', 'Parentage', 'Age Groups', 'Photos'],
      Health: ['Health Events', 'Disease Cases', 'Deworming', 'Vaccinations', 'Treatments', 'Mortality Records'],
      Breeding: ['Mating Records', 'Buck Usage', 'Pregnancy Tracking', 'Kidding Records', 'Litter Size', 'Breeding Performance'],
      Kids: ['Kid Registry', 'Birth Weight', 'Colostrum Intake', 'Navel Care', 'Weaning Logs', 'Kid Health'],
      Nutrition: ['Feed Plans', 'Grazing Notes', 'Supplementation', 'Mineral Intake', 'Feed Costs'],
      Production: ['Milk by Doe', 'Meat Growth', 'Body Weight Trend', 'Cull/Sale Records'],
      Housing: ['Pen Allocation', 'Movement History', 'Pasture Rotation', 'Biosecurity Status']
    },
    canines: {
      Registry: ['Dog Profiles', 'Role Assignment', 'Breed & Sex', 'Age Records', 'Working Group'],
      Health: ['Health Checks', 'Conditions', 'Treatments', 'Vet Notes', 'Emergency Incidents'],
      Vaccination: ['Vaccine Schedule', 'Rabies', 'Boosters Due', 'Vaccination Certificates'],
      Husbandry: ['Feeding Log', 'Housing Conditions', 'Exercise Log', 'Grooming Log', 'Supplements'],
      Work: ['Duty Type', 'Training Level', 'Task Performance', 'Patrol/Guard Rounds'],
      Breeding: ['Breeding Pairing', 'Heat Tracking', 'Pregnancy', 'Puppy Outcome']
    },
    poultry: {
      Flocks: ['Flock Registry', 'Batch Intake', 'Housing Type', 'Mortality', 'Flock Status'],
      Birds: ['Bird Profiles', 'Tagging', 'Sex Ratio', 'Breed Tracking', 'Growth Monitoring'],
      Eggs: ['Daily Collection', 'Broken Eggs', 'Sold Eggs', 'Used Eggs', 'Egg Revenue'],
      Health: ['Vaccinations', 'Disease Events', 'Treatments', 'Medication', 'Biosecurity Checks'],
      Feeding: ['Feed Types', 'Feed Quantity', 'Feed Cost', 'Conversion Rate', 'Water Monitoring'],
      Production: ['Layer Performance', 'Broiler Growth', 'FCR', 'Output Trend'],
      Compliance: ['Vaccination Program', 'Batch Records', 'Farm Audit Entries']
    },
    bsf: {
      Colonies: ['Colony Registry', 'Population Estimates', 'Colony Status', 'Lifecycle Stage'],
      Feeding: ['Substrate Type', 'Feeding Amount', 'Feed Cost', 'Feeding Frequency'],
      Environment: ['Temperature', 'Humidity', 'Location', 'Environmental Deviations'],
      Harvest: ['Harvest Type', 'Quantity', 'Weight', 'Quality Grade', 'Purpose'],
      Processing: ['Drying/Bagging', 'Frass Output', 'Storage Records', 'Batch Tracking'],
      Finance: ['Production Cost', 'Sales Revenue', 'Unit Economics', 'Profitability']
    }
  }

  const flattenCatalog = (catalog) => Object.values(catalog || {}).flat()
  const getAnimalsTabForRecord = (domain, item) => {
    const d = String(domain || '').toLowerCase()
    const i = String(item || '').toLowerCase()

    if (d.includes('group') || i.includes('group')) return 'addGroup'
    if (d === 'health' && i.includes('treatment')) return 'treatment'
    if (i.includes('treatment')) return 'treatment'
    if (d === 'nutrition' || i.includes('diet') || i.includes('feed') || i.includes('ration') || i.includes('water')) return 'feeding'
    if (d === 'measurements' || i.includes('weight') || i.includes('body condition') || i.includes('measurement')) return 'measurement'
    if (d === 'breeding' || i.includes('pregnancy') || i.includes('calving') || i.includes('service') || i.includes('heat')) return 'breeding'
    if (d === 'health' || i.includes('vaccin') || i.includes('diagnos') || i.includes('vet') || i.includes('allerg') || i.includes('quarantine')) return 'health'
    if (d === 'production' || i.includes('milk') || i.includes('lactation') || i.includes('yield')) return 'milkyield'
    return 'list'
  }

  const getGoatViewForRecord = (domain, item) => {
    const d = String(domain || '').toLowerCase()
    const i = String(item || '').toLowerCase()

    if (d.includes('kid') || i.includes('kid') || i.includes('wean') || i.includes('colostrum')) return 'kids'
    if (d === 'breeding' || i.includes('mating') || i.includes('kidding') || i.includes('pregnan')) return 'breeding'
    if (d === 'health' || i.includes('health') || i.includes('vaccine') || i.includes('deworm') || i.includes('treatment')) return 'health'
    return 'goats'
  }

  const getPoultryViewForRecord = (domain, item) => {
    const d = String(domain || '').toLowerCase()
    const i = String(item || '').toLowerCase()

    if (d === 'eggs' || i.includes('egg')) return 'eggs'
    if (d === 'birds' || i.includes('bird') || i.includes('sex ratio') || i.includes('growth')) return 'birds'
    if (d === 'health' || d === 'compliance' || i.includes('vaccine') || i.includes('disease') || i.includes('medication') || i.includes('biosecurity')) return 'health'
    return 'flocks'
  }

  const getCanineTabForRecord = (domain, item) => {
    const d = String(domain || '').toLowerCase()
    const i = String(item || '').toLowerCase()

    if (d === 'vaccination' || i.includes('vaccine') || i.includes('rabies') || i.includes('booster')) return 'vaccines'
    if (d === 'husbandry' || i.includes('groom') || i.includes('exercise') || i.includes('feeding')) return 'husbandry'
    if (d === 'health' || i.includes('health') || i.includes('vet') || i.includes('treatment')) return 'health'
    return 'list'
  }

  const getBsfTabForRecord = (domain, item) => {
    const d = String(domain || '').toLowerCase()
    const i = String(item || '').toLowerCase()

    if (d === 'feeding' || i.includes('feed') || i.includes('substrate')) return 'feeding'
    if (d === 'harvest' || d === 'processing' || d === 'finance' || i.includes('harvest') || i.includes('frass') || i.includes('sales') || i.includes('revenue') || i.includes('profit')) return 'harvest'
    return 'colonies'
  }

  const getCropsTabForRecord = (subsection, storageKey) => {
    const s = String(subsection || '').toLowerCase()
    const key = String(storageKey || '').toLowerCase()

    if (s.includes('yield') || key.includes(':yields')) return 'yields'
    if (s.includes('sales') || key.includes(':sales')) return 'sales'
    if (s.includes('treatment') || key.includes(':treatments')) return 'treatments'
    if (s.includes('cost') || key.includes(':costs')) return 'profitability'
    if (key.includes(':subsections') || s.includes('banana') || s.includes('vegetable') || s.includes('herb') || s.includes('tea') || s.includes('avocado') || s.includes('fruit')) return 'subsections'
    return 'list'
  }

  const getCropSubmoduleForRecord = (subsection) => {
    const s = String(subsection || '').toLowerCase()
    if (s.includes('sweet banana')) return 'sweetBanana'
    if (s.includes('banana')) return 'banana'
    if (s.includes('vegetable')) return 'vegetables'
    if (s.includes('herb')) return 'herbs'
    if (s.includes('tea')) return 'tea'
    if (s.includes('avocado')) return 'avocadoExport'
    if (s.includes('fruit')) return 'fruits'
    return 'all'
  }

  const getEmploymentTabForRecord = (subsection, storageKey) => {
    const s = String(subsection || '').toLowerCase()
    const key = String(storageKey || '').toLowerCase()
    if (s.includes('off') || key.includes(':off')) return 'off'
    if (s.includes('leave') || key.includes(':leaves')) return 'leaves'
    if (s.includes('attendance') || key.includes(':attendance')) return 'attendance'
    return 'registry'
  }

  const openLivestockRecord = (sectionKey, domain, item) => {
    const source = { domain, item }

    if (sectionKey === 'animals') {
      setAnimalsInitialTab(getAnimalsTabForRecord(domain, item))
      setAnimalsRecordSource(source)
      setView('animals')
      return
    }

    if (sectionKey === 'goats') {
      setGoatInitialView(getGoatViewForRecord(domain, item))
      setGoatRecordSource(source)
      setView('goats')
      return
    }

    if (sectionKey === 'poultry') {
      setPoultryInitialView(getPoultryViewForRecord(domain, item))
      setPoultryRecordSource(source)
      setView('poultry')
      return
    }

    if (sectionKey === 'canines') {
      setCanineInitialTab(getCanineTabForRecord(domain, item))
      setCanineRecordSource(source)
      setView('canines')
      return
    }

    if (sectionKey === 'bsf') {
      setBsfInitialTab(getBsfTabForRecord(domain, item))
      setBsfRecordSource(source)
      setView('bsf')
      return
    }

    setView(sectionKey)
  }

  const openReportSection = (report) => {
    if (!report) return
    const moduleName = String(report.module || '').toLowerCase()
    const subsectionName = String(report.subsection || '').toLowerCase()

    if (moduleName.includes('livestock - dairy')) {
      openLivestockRecord('animals', subsectionName, report.subsection || report.storageKey || '')
      return
    }

    if (moduleName.includes('livestock - goat')) {
      openLivestockRecord('goats', subsectionName, report.subsection || report.storageKey || '')
      return
    }

    if (moduleName.includes('livestock - poultry')) {
      openLivestockRecord('poultry', subsectionName, report.subsection || report.storageKey || '')
      return
    }

    if (moduleName.includes('livestock - canine')) {
      openLivestockRecord('canines', subsectionName, report.subsection || report.storageKey || '')
      return
    }

    if (moduleName.includes('livestock - bsf')) {
      openLivestockRecord('bsf', subsectionName, report.subsection || report.storageKey || '')
      return
    }

    if (moduleName === 'crops') {
      setCropsInitialTab(getCropsTabForRecord(report.subsection, report.storageKey))
      setCropsInitialSubmodule(getCropSubmoduleForRecord(report.subsection))
      setCropsRecordSource({ domain: report.module || 'Crops', item: report.subsection || report.storageKey || '' })
      setView('crops')
      return
    }

    if (moduleName === 'employment') {
      setEmploymentInitialTab(getEmploymentTabForRecord(report.subsection, report.storageKey))
      setEmploymentRecordSource({ domain: report.module || 'Employment', item: report.subsection || report.storageKey || '' })
      setView('employment')
      return
    }

    setView('dashboard')
  }

  const scoreColor = (score) => {
    if (score >= 85) return { bg: '#dcfce7', fg: '#166534' }
    if (score >= 65) return { bg: '#fef3c7', fg: '#92400e' }
    return { bg: '#fee2e2', fg: '#991b1b' }
  }

  const livestockSections = {
    animals: {
      icon: '🥛',
      title: 'Dairy',
      description: 'Cattle records, milk tracking, breeding, treatment, and feeding.',
      subsections: flattenCatalog(LIVESTOCK_RECORD_CATALOG.animals),
      count: livestockCounts.dairy,
      countLabel: 'animals',
      quality: livestockQualityScores.dairy
    },
    goats: {
      icon: '🐐',
      title: 'Goat',
      description: 'Goat herd records, health events, breeding cycles, and kids.',
      subsections: flattenCatalog(LIVESTOCK_RECORD_CATALOG.goats),
      count: livestockCounts.goats,
      countLabel: 'goats',
      quality: livestockQualityScores.goat
    },
    canines: {
      icon: '🐕',
      title: 'Canine',
      description: 'Working dog records, vaccines, health checks, and husbandry.',
      subsections: flattenCatalog(LIVESTOCK_RECORD_CATALOG.canines),
      count: livestockCounts.canines,
      countLabel: 'dogs',
      quality: livestockQualityScores.canine
    },
    poultry: {
      icon: '🐔',
      title: 'Poultry',
      description: 'Flocks, birds, egg production, and poultry health records.',
      subsections: flattenCatalog(LIVESTOCK_RECORD_CATALOG.poultry),
      count: livestockCounts.poultry,
      countLabel: 'flocks',
      quality: livestockQualityScores.poultry
    },
    bsf: {
      icon: '🪰',
      title: 'BSF',
      description: 'Black soldier fly colonies, feed logs, harvests, and production.',
      subsections: flattenCatalog(LIVESTOCK_RECORD_CATALOG.bsf),
      count: livestockCounts.bsf,
      countLabel: 'colonies',
      quality: livestockQualityScores.bsf
    }
  }

  const renderLivestockSubNav = () => (
    <div style={{ marginBottom: '20px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      {Object.entries(livestockSections).map(([sectionKey, section]) => {
        const active = view === sectionKey
        return (
          <button
            key={sectionKey}
            onClick={() => setView(sectionKey)}
            style={{
              textAlign: 'left',
              padding: '14px 16px',
              background: active ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'var(--bg-elevated)',
              color: active ? '#ffffff' : 'var(--text-primary)',
              border: active ? '1px solid #047857' : '1px solid var(--border-primary)',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: active ? '0 4px 6px -1px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: '700' }}>{section.icon} {section.title}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 8px', borderRadius: '999px', background: active ? 'rgba(255,255,255,0.18)' : '#ecfdf5', color: active ? '#ffffff' : '#065f46' }}>
                {section.count} {section.countLabel}
              </span>
            </div>
            {section.quality && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '999px', background: active ? 'rgba(255,255,255,0.24)' : scoreColor(section.quality.score).bg, color: active ? '#ffffff' : scoreColor(section.quality.score).fg }}>
                  Quality {section.quality.score}% ({section.quality.issues} issues)
                </span>
              </div>
            )}
            <div style={{ fontSize: '12px', lineHeight: 1.5, opacity: active ? 0.95 : 0.8 }}>
              {section.description}
            </div>
          </button>
        )
      })}
    </div>
  )

  const renderLivestockShell = (sectionKey, content) => {
    const section = livestockSections[sectionKey]
    const sectionCatalog = LIVESTOCK_RECORD_CATALOG[sectionKey] || {}
    const sectionDomains = Object.entries(sectionCatalog)
    const totalSubmodules = sectionDomains.reduce((acc, [, items]) => acc + items.length, 0)

    return (
      <section>
        <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#065f46', marginBottom: '6px' }}>{section.icon} {section.title} Section</div>
              <div style={{ color: 'var(--text-secondary)', maxWidth: '760px', lineHeight: 1.6 }}>{section.description}</div>
              {section.quality && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 9px', borderRadius: '999px', background: scoreColor(section.quality.score).bg, color: scoreColor(section.quality.score).fg }}>
                    Data Quality Score: {section.quality.score}% ({section.quality.issues} issues)
                  </span>
                </div>
              )}
            </div>
            <div style={{ minWidth: '140px', padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-primary)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Current Count</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#047857' }}>{section.count}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{section.countLabel}</div>
            </div>
          </div>
          {renderLivestockSubNav()}
          <div style={{ marginTop: 14, padding: '12px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid #d1fae5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>
                Comprehensive Record Coverage
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f766e', background: '#ecfdf5', borderRadius: 999, padding: '4px 10px' }}>
                {sectionDomains.length} domains • {totalSubmodules} submodules
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {sectionDomains.map(([domain, items]) => (
                <div key={domain} style={{ border: '1px solid #e2f6ea', borderRadius: 10, padding: '10px 10px 8px', background: '#f8fffb' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#047857', marginBottom: 6 }}>{domain}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {items.map(item => (
                      <button
                        key={item}
                        onClick={() => openLivestockRecord(sectionKey, domain, item)}
                        title={`Open ${section.title} → ${item}`}
                        style={{ padding: '4px 9px', borderRadius: 999, background: 'var(--bg-elevated)', border: '1px solid #d1fae5', color: '#065f46', fontSize: 11, fontWeight: '700', cursor: 'pointer' }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ErrorBoundary>{content}</ErrorBoundary>
      </section>
    )
  }

  return (
    <div className={`app ${settings.backgroundOn? 'bg-on' : ''}`} 
      style={{
        ...(settings.backgroundOn && settings.background ? { backgroundImage: `url('/assets/${settings.background}')` } : {}),
        minHeight: '100vh',
        transition: 'background 0.3s, color 0.3s'
      }}>
      <Header
        settings={settings}
        setSettings={setSettings}
        showInstallPrompt={showInstallPrompt}
        handleInstallClick={handleInstallClick}
        editMode={editMode}
        setEditMode={setEditMode}
        unreadNotifications={unreadNotifications}
        setView={setView}
        handleLogout={handleLogout}
        getCurrentUserName={getCurrentUserName}
        getCurrentUserRole={getCurrentUserRole}
      />
      <AudioEnableBanner />
      <nav style={{ 
        background: 'var(--bg-elevated)', 
        padding: '10px 16px', 
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.08))', 
        borderBottom: '2px solid var(--border-primary)',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        alignItems: 'center',
        rowGap: '6px'
      }}>
          <button 
            className={view==='landing'? 'active':''}
            onClick={()=>setView('landing')}
            style={{
              background: view==='landing' ? '#0f766e' : '#f3f4f6',
              color: view==='landing' ? '#fff' : '#1f2937',
              order: -11,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              transition: 'all 0.2s'
            }}
          >🌟 Home</button>
          <button 
            className={view==='dashboard'? 'active':''} 
            onClick={()=>setView('dashboard')}
            style={{
              background: view==='dashboard' ? 'var(--action-success, #059669)' : 'var(--bg-tertiary)',
              color: view==='dashboard' ? 'var(--text-inverse, #fff)' : 'var(--text-primary)',
              order: -10,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              transition: 'all 0.2s'
            }}
          >🩺 ezyVet Dashboard</button>
          <button 
            className={view==='notifications'? 'active':''} 
            onClick={()=>setView('notifications')}
            style={{
              background: view==='notifications' ? 'var(--action-success, #059669)' : 'var(--bg-tertiary)',
              color: view==='notifications' ? 'var(--text-inverse, #fff)' : 'var(--text-primary)',
              order: -5,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700'
            }}
          >
            🔔 Notifications
            {unreadNotifications > 0 && (
              <span style={{
                marginLeft: 4,
                background: 'var(--header-alert-bg, #ef4444)',
                color: 'var(--header-alert-text, #ffffff)',
                borderRadius: 10,
                padding: '1px 5px',
                fontSize: 10,
                fontWeight: '800',
                border: '1px solid var(--header-chip-border, rgba(0,0,0,0.15))'
              }}>
                {unreadNotifications}
              </span>
            )}
          </button>
          <button 
            className={view==='alerts'? 'active':''} 
            onClick={()=>setView('alerts')}
            style={{
              background: view==='alerts' ? '#dc2626' : '#f3f4f6',
              color: view==='alerts' ? '#fff' : '#1f2937',
              order: -7,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700'
            }}
          >
            🔔 Smart Alerts
          </button>
          <button 
            className={view==='alert-rules'? 'active':''} 
            onClick={()=>setView('alert-rules')}
            style={{
              background: view==='alert-rules' ? '#f59e0b' : '#f3f4f6',
              color: view==='alert-rules' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700'
            }}
          >
            🔔 Alert Rules
          </button>
          {/* Farm3D button removed */}
          {showNavMore && (<button 
            className={view==='timeline'? 'active':''} 
            onClick={()=>setView('timeline')}
            style={{
              background: view==='timeline' ? '#f59e0b' : '#f3f4f6',
              color: view==='timeline' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📅 Timeline
          </button>)}
          {showNavMore && (<button 
            className={view==='photos'? 'active':''} 
            onClick={()=>setView('photos')}
            style={{
              background: view==='photos' ? '#a855f7' : '#f3f4f6',
              color: view==='photos' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📸 Photos
          </button>)}

            {showNavMore && (<button 
              className={view==='notes'? 'active':''} 
              onClick={()=>setView('notes')}
              style={{
                background: view==='notes' ? '#10b981' : '#f3f4f6',
                color: view==='notes' ? '#fff' : '#1f2937',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >🗒️ Notes</button>)}

          <button 
            className={view==='animals'? 'active':''} 
            onClick={()=>setView('animals')}
            style={{
              background: view==='animals' ? '#059669' : '#f3f4f6',
              color: view==='animals' ? '#fff' : '#1f2937',
              order: -9,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >🐄 Livestock</button>
          {showNavMore && (<button 
            className={view==='pastures'? 'active':''} 
            onClick={()=>setView('pastures')}
            style={{
              background: view==='pastures' ? '#059669' : '#f3f4f6',
              color: view==='pastures' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >🌱 Pastures</button>)}
          <button 
            className={view==='tasks'? 'active':''} 
            onClick={()=>setView('tasks')}
            style={{
              background: view==='tasks' ? '#059669' : '#f3f4f6',
              color: view==='tasks' ? '#fff' : '#1f2937',
              order: -8,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >✅ Tasks</button>
          <button
            className={view==='crops' ? 'active' : ''}
            onClick={openCropOS}
            style={{
              background: view==='crops' ? '#0f766e' : '#f3f4f6',
              color: view==='crops' ? '#fff' : '#1f2937',
              order: -8,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >🌾 Crop OS</button>
          <button
            className={view==='employment'? 'active':''}
            onClick={()=>setView('employment')}
            style={{
              background: view==='employment' ? '#0f766e' : '#f3f4f6',
              color: view==='employment' ? '#fff' : '#1f2937',
              order: -8,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >👥 Employment</button>
          {showNavMore && (<button 
            className={view==='schedules'? 'active':''} 
            onClick={()=>setView('schedules')}
            style={{
              background: view==='schedules' ? '#059669' : '#f3f4f6',
              color: view==='schedules' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >📅 Schedules</button>)}
          {showNavMore && (<button 
            className={view==='calendar'? 'active':''} 
            onClick={()=>setView('calendar')}
            style={{
              background: view==='calendar' ? '#059669' : '#f3f4f6',
              color: view==='calendar' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >📆 Calendar</button>)}
          {showNavMore && (<button 
            className={view==='inventory'? 'active':''}
            onClick={()=>setView('inventory')}
            style={{
              background: view==='inventory' ? '#059669' : '#f3f4f6',
              color: view==='inventory' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >📦 Inventory</button>)}
          <button 
            className={view==='finance'? 'active':''} 
            onClick={()=>setView('finance')}
            style={{
              background: view==='finance' ? '#059669' : '#f3f4f6',
              color: view==='finance' ? '#fff' : '#1f2937',
              order: -6,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >💰 Finance</button>
          <button
            onClick={() => setShowNavMore(v => !v)}
            style={{
              order: -4,
              background: showNavMore ? '#1f2937' : '#e5e7eb',
              color: showNavMore ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            {showNavMore ? 'Hide Modules' : 'More Modules'}
          </button>
          {/* Audit Log button removed */}
          {showNavMore && (<button 
            className={view==='backup'? 'active':''} 
            onClick={()=>setView('backup')}
            style={{
              background: view==='backup' ? '#059669' : '#f3f4f6',
              color: view==='backup' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >💾 Backup</button>)}
          <button 
            className={view==='settings'? 'active':''} 
            onClick={()=>setView('settings')}
            style={{
              background: view==='settings' ? '#059669' : '#f3f4f6',
              color: view==='settings' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >⚙️ Settings</button>
          
          {/* Theme Toggle Button */}
          <div style={{ marginLeft: 'auto' }}>
            {ThemeToggle ? <ThemeToggle /> : (
              <button onClick={() => {}} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                Theme
              </button>
            )}
          </div>
      </nav>
      <main>
        {deniedStores && deniedStores.length > 0 && (
          <div style={{ margin: '12px', padding: '12px 16px', borderRadius: 8, background: '#fffbeb', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: '#92400e', fontWeight: 600 }}>
              ⚠️ Some features disabled: {deniedStores.length} store{deniedStores.length>1?'s':''} unavailable — {deniedStores.slice(0,5).join(', ')}{deniedStores.length>5? '...' : ''}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={async () => {
                try {
                  if (typeof window !== 'undefined' && window.__firestorePermissionDeniedStores) {
                    window.__firestorePermissionDeniedStores.clear()
                  }
                  const mod = await import('./lib/firebaseSync')
                  if (mod && typeof mod.startFirestoreSync === 'function') mod.startFirestoreSync()
                  setDeniedStores([])
                } catch (e) { console.warn('Retry sync failed', e) }
              }} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Retry Sync</button>
              <button onClick={() => setView('login')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Sign in</button>
            </div>
          </div>
        )}
        <Suspense fallback={<LoadingFallback />}>
          {view === 'dashboard' && (
            <>
              <ErrorBoundary><Dashboard onNavigate={setView} /></ErrorBoundary>
            </>
          )}
          {view === 'notifications' && <ErrorBoundary><NotificationCenter /></ErrorBoundary>}

          {view === 'animals' && (
            renderLivestockShell('animals', <Animals section="dairy" initialTab={animalsInitialTab} recordSource={animalsRecordSource} />)
          )}
          {view === 'pastures' && (
            <section>
              <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>
              <ErrorBoundary><Pastures /></ErrorBoundary>
            </section>
          )}

          {view === 'goats' && (
            renderLivestockShell('goats', <GoatModule initialMainView={goatInitialView} recordSource={goatRecordSource} />)
          )}

          {view === 'canines' && (
            renderLivestockShell('canines', <CanineManagement animals={animals} setAnimals={setAnimals} initialTab={canineInitialTab} recordSource={canineRecordSource} />)
          )}

          {view === 'poultry' && (
            renderLivestockShell('poultry', <PoultryManagement initialView={poultryInitialView} recordSource={poultryRecordSource} />)
          )}

          {view === 'bsf' && (
            renderLivestockShell('bsf', <BSFFarming initialTab={bsfInitialTab} recordSource={bsfRecordSource} />)
          )}

          {view === 'animal-health' && (
            <section>
              <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>

            </section>
          )}

          {view === 'health-analytics' && (
            <section>
              <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>
              <ErrorBoundary><HealthAnalyticsDashboard onNavigate={setView} /></ErrorBoundary>
            </section>
          )}

          {/* StoreDemo view removed */}

          {view === 'marketplace' && (
            <section>
              <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>
              <ErrorBoundary><Marketplace /></ErrorBoundary>
            </section>
          )}


          {/* Community and Knowledge Base views removed */}

          {view === 'notes' && (
            <section>
              <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>
              <ErrorBoundary><Notes /></ErrorBoundary>
            </section>
          )}

          {view === 'tasks' && (
            <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><Tasks /></ErrorBoundary>
          </section>
        )}

        {view === 'schedules' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><Schedules /></ErrorBoundary>
          </section>
        )}

        {view === 'calendar' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><CalendarView /></ErrorBoundary>
          </section>
        )}

        {view === 'crops' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><Crops initialTab={cropsInitialTab} initialPlantSubmodule={cropsInitialSubmodule} recordSource={cropsRecordSource} /></ErrorBoundary>
          </section>
        )}

        {view === 'inventory' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><Inventory initialView={inventoryInitialView} /></ErrorBoundary>
          </section>
        )}


        {view === 'alerts' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><SmartAlerts onNavigate={setView} /></ErrorBoundary>
          </section>
        )}

        {/* Farm3D view removed */}

        {view === 'timeline' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><TimelinePlanner /></ErrorBoundary>
          </section>
        )}

        {view === 'photos' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><PhotoGalleryAdvanced /></ErrorBoundary>
          </section>
        )}

        {/* GeospatialMap view removed */}

        {/* PredictiveAnalytics view removed */}

        {/* Batch ops removed for startup performance
        {view === 'batchops' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><AdvancedBatchOps /></ErrorBoundary>
          </section>
        )}
        */}

        {view === 'customreports' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><CustomReportBuilder onOpenSection={openReportSection} /></ErrorBoundary>
          </section>
        )}

        {/* AIInsightsDashboard removed */}

        {view === 'alertcenter' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><AlertCenter /></ErrorBoundary>
          </section>
        )}

        {view === 'mobilesettings' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><MobileSettings /></ErrorBoundary>
          </section>
        )}

        {/* DashboardBuilder view removed */}

        {view === 'activityfeed' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><ActivityFeed /></ErrorBoundary>
          </section>
        )}



        {/* Phase 2: Smart Features UI Routes */}
        {view === 'alert-rules' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><AlertRules /></ErrorBoundary>
          </section>
        )}

        {/* ...existing code... */}

        {/* PredictiveDashboard view removed */}

        {/* Audit Log view removed */}

        {view === 'backup' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><BackupRestore /></ErrorBoundary>
          </section>
        )}

        {view === 'finance' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><Finance /></ErrorBoundary>
          </section>
        )}

        {view === 'employment' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><EmploymentManager initialTab={employmentInitialTab} recordSource={employmentRecordSource} /></ErrorBoundary>
          </section>
        )}

        {view === 'settings' && (() => {
          const activeSettingsTab = settings.settingsTab || 'enhanced'

          return (
          <section style={{ color: 'var(--text-primary, #1f2937)' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary, #1f2937)' }}>Settings</h2>
              <p style={{ color: 'var(--muted)', margin: 0 }}>Customize your application appearance and preferences</p>
            </div>
            
            {/* Tabs for Settings */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '2px solid var(--border-primary, #e5e7eb)', overflowX: 'auto' }}>
              <button
                onClick={() => setSettings(s => ({ ...s, settingsTab: 'enhanced' }))}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeSettingsTab === 'enhanced' ? '2px solid #059669' : '2px solid transparent',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontWeight: activeSettingsTab === 'enhanced' ? 600 : 400,
                  color: activeSettingsTab === 'enhanced' ? '#059669' : 'var(--text-secondary, #6b7280)',
                  whiteSpace: 'nowrap'
                }}
              >
                ⚙️ Settings
              </button>
              <button
                onClick={() => setSettings(s => ({ ...s, settingsTab: 'appearance' }))}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeSettingsTab === 'appearance' ? '2px solid #059669' : '2px solid transparent',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontWeight: activeSettingsTab === 'appearance' ? 600 : 400,
                  color: activeSettingsTab === 'appearance' ? '#059669' : 'var(--text-secondary, #6b7280)',
                  whiteSpace: 'nowrap'
                }}
              >
                🎨 Appearance
              </button>
              <button
                onClick={() => setSettings(s => ({ ...s, settingsTab: 'sync' }))}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeSettingsTab === 'sync' ? '2px solid #059669' : '2px solid transparent',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontWeight: activeSettingsTab === 'sync' ? 600 : 400,
                  color: activeSettingsTab === 'sync' ? '#059669' : 'var(--text-secondary, #6b7280)',
                  whiteSpace: 'nowrap'
                }}
              >
                🔄 Cloud Sync
              </button>
            </div>

            {/* Enhanced Settings Tab */}
            {activeSettingsTab === 'enhanced' && <ErrorBoundary><EnhancedSettings /></ErrorBoundary>}

            {/* Sync Settings Tab */}
            {activeSettingsTab === 'sync' && <ErrorBoundary><SyncSettings /></ErrorBoundary>}

            {/* Appearance Settings Tab */}
            {activeSettingsTab === 'appearance' && (
            <div className="appearance-layout">
              <div className="appearance-hero card">
                <h3>Appearance</h3>
                <p>Clean, modern farm visuals with strong contrast and readable text across all modules.</p>
                <div className="appearance-preview-row" aria-hidden="true">
                  <span className="preview-chip preview-chip-primary">Header</span>
                  <span className="preview-chip preview-chip-surface">Cards</span>
                  <span className="preview-chip preview-chip-text">Readable Text</span>
                </div>
                <div
                  className="appearance-live-preview"
                  style={settings.backgroundOn && settings.background
                    ? { backgroundImage: `url('/assets/${settings.background}')` }
                    : undefined}
                >
                  <div className="appearance-live-top">
                    <div className="appearance-live-brand">
                      <img
                        src={previewLogoSrc}
                        alt="Logo preview"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/jr-farm-logo.svg'
                        }}
                      />
                      <div>
                        <strong>JR FARM</strong>
                        <span>Comprehensive Farm Management</span>
                      </div>
                    </div>
                    <span className="appearance-live-badge">Modern Agri UI</span>
                  </div>
                  <div className="appearance-live-cards" aria-hidden="true">
                    <div>
                      <small>Herd Health</small>
                      <strong>98%</strong>
                    </div>
                    <div>
                      <small>Feed Stock</small>
                      <strong>12 days</strong>
                    </div>
                    <div>
                      <small>Tasks Today</small>
                      <strong>7</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="appearance-grid">
                <div className="appearance-card card">
                  <h4>Background</h4>
                  <p className="appearance-subtext">Choose whether the farm backdrop is displayed.</p>
                  <div className="appearance-toggle-row">
                    <input
                      type="checkbox"
                      id="backgroundToggle"
                      checked={settings.backgroundOn}
                      onChange={e=>setSettings(s=> ({ ...s, backgroundOn: e.target.checked }))}
                    />
                    <label htmlFor="backgroundToggle">Enable background image</label>
                  </div>

                  {settings.backgroundOn && (
                    <div className="appearance-field">
                      <label htmlFor="backgroundSelect">Background Image</label>
                      <select
                        id="backgroundSelect"
                        value={settings.background}
                        onChange={e=>setSettings(s=> ({ ...s, background: e.target.value }))}
                        className="appearance-input"
                      >
                        <option value="">None</option>
                        <option value="bg-farm.svg">Farm (default)</option>
                        <option value="bg-fields.svg">Fields</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="appearance-card card">
                  <h4>Branding</h4>
                  <p className="appearance-subtext">Set how your farm identity appears in the header.</p>

                  <div className="appearance-field">
                    <label htmlFor="logoSelect">Logo Style</label>
                    <select
                      id="logoSelect"
                      value={settings.logo}
                      onChange={e=>setSettings(s=> ({ ...s, logo: e.target.value }))}
                      className="appearance-input"
                    >
                      <option value="jr-farm-logo.svg">Classic Logo</option>
                      <option value="logo-wordmark.svg">Wordmark</option>
                      <option value="logo-badge.svg">Badge</option>
                      <option value="logo-icon.svg">Icon</option>
                      <option value="uploaded">Custom Upload</option>
                    </select>
                  </div>

                  <div className="appearance-field">
                    <label htmlFor="logoUpload">Upload Custom Logo</label>
                    <input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      onChange={e=>{
                        const f = e.target.files && e.target.files[0]
                        if(!f) return
                        const reader = new FileReader()
                        reader.onload = ev => { const data = ev.target.result; setSettings(s=> ({ ...s, uploadedLogo: data, logo: 'uploaded' })) }
                        reader.readAsDataURL(f)
                      }}
                      className="appearance-input"
                    />
                    <p className="appearance-hint">Supports PNG, JPG, and SVG files.</p>
                  </div>
                </div>
              </div>

              <div className="appearance-card card">
                <h4>Theme</h4>
                <p className="appearance-subtext">Switch between light and dark themes with high contrast for readability.</p>
                <div className="appearance-field">
                  <label htmlFor="themeSelect">Theme Mode</label>
                  <ThemeSelector />
                </div>
              </div>

              <div className="appearance-card card">
                <h4>Data Management</h4>
                <p className="appearance-subtext">Danger zone actions that affect all local data.</p>
                <div className="appearance-danger-box">
                  <h5>Reset Application Data</h5>
                  <p>
                    This clears all local app data on this device, including animals, tasks,
                    sync metadata, and settings.
                  </p>
                  <button
                    onClick={()=>{ if(confirm('Are you sure you want to clear all local app data on this device? This action cannot be undone.')){ localStorage.clear(); location.reload() }}}
                    className="appearance-danger-btn"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
            )}
          </section>
          )
        })()}
        </Suspense>
      </main>

      <footer style={{ 
        background: 'var(--bg-secondary)', 
        color: 'var(--text-secondary)',
        padding: '16px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-primary)'
      }}>
        <small>© Devins Farm — Comprehensive Farm Management System</small>
      </footer>

      {/* In-app notification banner */}
      <Suspense fallback={<div></div>}>
        <InAppNotification />
      </Suspense>

      {/* Global Search Modal */}
      <Suspense fallback={<div></div>}>
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </Suspense>

      {/* Keyboard Shortcuts Help */}
      <Suspense fallback={<div></div>}>
        <KeyboardShortcutsHelp />
      </Suspense>

      {/* Mobile Bottom Navigation */}
      <Suspense fallback={<div></div>}>
        <BottomNav />
      </Suspense>

      {/* Swipe gesture navigation */}
      <SwipeHandler />

      {/* Offline indicator */}
      <Suspense fallback={<div></div>}>
        <OfflineIndicator />
      </Suspense>
      
      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}

// Theme selector component for appearance settings
function ThemeSelector() {
  let theme = 'light', setThemeMode = () => {};
  try {
    const ctx = useTheme();
    theme = ctx.theme;
    setThemeMode = ctx.setThemeMode;
  } catch (e) {
    // ThemeProvider not available
  }
  
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <button
        onClick={() => setThemeMode('light')}
        style={{
          flex: '1',
          minWidth: '120px',
          padding: '12px 16px',
          borderRadius: '8px',
          border: theme === 'light' ? '2px solid var(--action-primary)' : '1px solid var(--border-primary)',
          background: theme === 'light' ? 'rgba(0, 168, 107, 0.1)' : 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        ☀️ Light
      </button>
      <button
        onClick={() => setThemeMode('dark')}
        style={{
          flex: '1',
          minWidth: '120px',
          padding: '12px 16px',
          borderRadius: '8px',
          border: theme === 'dark' ? '2px solid var(--action-primary)' : '1px solid var(--border-primary)',
          background: theme === 'dark' ? 'rgba(0, 168, 107, 0.1)' : 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        🌙 Dark
      </button>
    </div>
  );
}

// Wrapper with AppShell for fast initial render
import AppShell from './components/AppShell'

export default function App() {
  return (
    <Suspense fallback={<AppShell />}>
      <AppContent />
    </Suspense>
  )
}
