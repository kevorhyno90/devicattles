import React, { useState, useEffect, lazy, Suspense, useContext } from 'react'
// Helper function to retry failed lazy loads (important for Android Chrome)
const lazyWithRetry = (importFunc) => {
  return lazy(() => {
    return importFunc().catch((error) => {
      console.error('Module load failed, retrying:', error)
      // Show a visible error for debugging
      if (window && window.alert) {
        window.alert('Module failed to load: ' + error.message)
      }
      // Retry after a short delay
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('Retrying module load...')
          importFunc().then(resolve).catch(reject)
        }, 1000)
      })
    })
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
// Lazy load stores to improve initial load time
// import { useAnimalStore, useCropStore, useFinanceStore, useTaskStore, useInventoryStore, useUIStore } from './stores'

const GoatModule = lazyWithRetry(() => import('./modules/GoatModule'))
const Notes = lazyWithRetry(() => import('./modules/Notes'))



// Lazy load all modules with retry logic
const Dashboard = lazyWithRetry(() => import('./modules/Dashboard'))
const NotificationCenter = lazyWithRetry(() => import('./modules/NotificationCenter'))
// Load Animals synchronously to avoid dynamic import timeouts in Codespaces
import Animals from './modules/Animals'
const Tasks = lazyWithRetry(() => import('./modules/Tasks'))
const Finance = lazyWithRetry(() => import('./modules/Finance'))
const Schedules = lazyWithRetry(() => import('./modules/Schedules'))
const Crops = lazyWithRetry(() => import('./modules/CropsWithSubsections'))
import ReportModule from './components/ReportModule.jsx'
const Inventory = lazyWithRetry(() => import('./modules/Inventory'))
const Groups = lazyWithRetry(() => import('./modules/Groups'))
const Pastures = lazyWithRetry(() => import('./modules/Pastures'))
const HealthSystem = lazyWithRetry(() => import('./modules/HealthSystem'))
const Login = lazyWithRetry(() => import('./modules/Login'))
// AuditLog import removed
const BackupRestore = lazyWithRetry(() => import('./modules/BackupRestore'))
const SyncSettings = lazyWithRetry(() => import('./modules/SyncSettings'))
const AdvancedAnalytics = lazyWithRetry(() => import('./modules/AdvancedAnalytics'))
const EnhancedSettings = lazyWithRetry(() => import('./modules/EnhancedSettings'))
const BulkOperations = lazyWithRetry(() => import('./modules/BulkOperations'))
const AdditionalReports = lazyWithRetry(() => import('./modules/AdditionalReports'))
const CanineManagement = lazyWithRetry(() => import('./modules/CanineManagement'))
const CalendarView = lazyWithRetry(() => import('./modules/CalendarView'))
const SmartAlerts = lazyWithRetry(() => import('./modules/SmartAlerts'))
const WeatherDashboard = lazyWithRetry(() => import('./modules/WeatherDashboard'))
const MarketPrices = lazyWithRetry(() => import('./modules/MarketPrices'))
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
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          This module is taking too long to load. This might be due to:
        </p>
        <ul style={{ textAlign: 'left', color: '#6b7280', marginBottom: '20px' }}>
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

  const AppViewContextLocal = (typeof window !== 'undefined' && window.AppViewContext) ? window.AppViewContext : React.createContext({ view: 'dashboard', setView: () => {}, editMode: false, setEditMode: () => {} });
  const { view, setView, editMode, setEditMode } = useContext(AppViewContextLocal);
  const ThemeToggle = (typeof window !== 'undefined' && window.ThemeToggleButton) ? window.ThemeToggleButton : null;
  // Authentication state is managed via hook
  const { authenticated, currentUser, handleLoginSuccess, handleLogout } = useAuthInit({ onLogout: () => setView('dashboard') })
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
  // Add GoatModule view
  
  // UI branding/settings - use hook to load/save from localStorage
  const SETTINGS_KEY = 'devinsfarm:ui:settings'
  const defaultSettings = { backgroundOn: false, background: 'bg-farm.svg', logo: 'jr-farm-logo.svg', uploadedLogo: '', theme: 'catalytics' }
  const [settings, setSettings] = useUISettings(SETTINGS_KEY, defaultSettings)

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
    const checkDenied = async () => {
      try {
        if (typeof window !== 'undefined' && window.__firestorePermissionDeniedStores) {
          const arr = Array.from(window.__firestorePermissionDeniedStores || [])
          if (mounted) setDeniedStores(arr)
          return
        }
        const mod = await import('./lib/firebaseSync').catch(() => null)
        if (mod && typeof mod.getFirestorePermissionDeniedStores === 'function') {
          const arr = mod.getFirestorePermissionDeniedStores() || []
          if (mounted) setDeniedStores(arr)
        }
      } catch (e) {
        // ignore
      }
    }
    checkDenied()
    const iv = setInterval(checkDenied, 2000)
    return () => { mounted = false; clearInterval(iv) }
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
    if (authenticated) {
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

        // Always stop any previous reminder checker before starting a new one
        stopReminderChecker();

        // Run initial check
        checkAllAutoNotifications();

        const intervalId = startReminderChecker();

        // Update unread count
        const updateUnreadCount = () => {
          setUnreadNotifications(getUnreadCount());
        };

        updateUnreadCount();
        const countInterval = setInterval(updateUnreadCount, 30000); // Every 30 seconds

        // Check auto notifications every hour
        const autoCheckInterval = setInterval(checkAllAutoNotifications, 60 * 60 * 1000);

        // Listen for new notifications
        window.addEventListener('newNotification', updateUnreadCount);

        // Initialize sync if configured - wrapped in try-catch
        try {
          initSync();
          setupAutoSync();
        } catch (error) {
          console.warn('Sync initialization failed (optional feature):', error);
        }

        // Phase 2: Initialize smart alert rules (deferred)
        setTimeout(() => {
          try {
            installAllRules(alertRuleEngine);
            alertRuleEngine.evaluateAllRules();
            const alertInterval = setInterval(() => {
              alertRuleEngine.evaluateAllRules();
            }, 5 * 60 * 1000); // Every 5 minutes

            // Store alert interval for cleanup
            window.__alertInterval = alertInterval;
          } catch (error) {
            console.warn('Alert rules initialization failed (optional feature):', error);
          }
        }, 2000); // Defer alerts by 2 seconds

        // Store intervals for cleanup
        window.__notificationIntervals = { intervalId, countInterval, autoCheckInterval, stopReminderChecker };
      }, 500);

      return () => {
        clearTimeout(initTimeout);
        if (window.__notificationIntervals) {
          const { countInterval, autoCheckInterval, stopReminderChecker } = window.__notificationIntervals;
          stopReminderChecker();
          clearInterval(countInterval);
          clearInterval(autoCheckInterval);
          window.removeEventListener('newNotification', () => setUnreadNotifications(0));
        }
        if (window.__alertInterval) {
          clearInterval(window.__alertInterval);
        }
      };
    }
  }, [authenticated]);

  // Load animals for passing to health system and groups (deferred)
  useEffect(() => {
    // Defer animal loading to not block initial render
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem('cattalytics:animals');
        if (stored) {
          const parsed = JSON.parse(stored);
          setAnimals(parsed);
        }
      } catch (e) {
        setAnimals([]);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [view]); // Reload when view changes to keep animals fresh
  


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

  

  // Show login if not authenticated
  if (!authenticated) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    )
  }

  return (
    <div className={`app ${settings.backgroundOn? 'bg-on' : ''} theme-${settings.theme || 'bold'}`} 
      style={{
        ...(settings.backgroundOn && settings.background ? { backgroundImage: `url('/assets/${settings.background}')` } : {}),
        background: colors.bg.primary,
        color: colors.text.primary,
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
      <nav style={{ 
        background: colors.bg.elevated, 
        padding: '12px 20px', 
        boxShadow: colors.shadow.sm, 
        borderBottom: `2px solid ${colors.border.primary}`,
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
          <button 
            className={view==='dashboard'? 'active':''} 
            onClick={()=>setView('dashboard')}
            style={{
              background: view==='dashboard' ? colors.action.success : colors.bg.tertiary,
              color: view==='dashboard' ? colors.text.inverse : colors.text.primary,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >📊 Dashboard</button>
          <button 
            className={view==='notifications'? 'active':''} 
            onClick={()=>setView('notifications')}
            style={{
              background: view==='notifications' ? colors.action.success : colors.bg.tertiary,
              color: view==='notifications' ? colors.text.inverse : colors.text.primary,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔔 Notifications
            {unreadNotifications > 0 && (
              <span style={{
                marginLeft: 4,
                background: '#ef4444',
                color: 'white',
                borderRadius: 10,
                padding: '1px 5px',
                fontSize: 10,
                fontWeight: '600'
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
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
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
              fontWeight: '500'
            }}
          >
            🔔 Alert Rules
          </button>

          <button 
            className={view==='weather'? 'active':''} 
            onClick={()=>setView('weather')}
            style={{
              background: view==='weather' ? '#0ea5e9' : '#f3f4f6',
              color: view==='weather' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🌤️ Weather
          </button>

          <button 
            className={view==='market'? 'active':''} 
            onClick={()=>setView('market')}
            style={{
              background: view==='market' ? '#10b981' : '#f3f4f6',
              color: view==='market' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            💰 Market Prices
          </button>
          {/* Farm3D button removed */}
          <button 
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
          </button>
          <button 
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
          </button>

            <button 
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
            >🗒️ Notes</button>

          <button 
            className={view==='animals'? 'active':''} 
            onClick={()=>setView('animals')}
            style={{
              background: view==='animals' ? '#059669' : '#f3f4f6',
              color: view==='animals' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >🐄 Livestock</button>
          <button
            className={view==='goats' ? 'active' : ''}
            onClick={() => setView('goats')}
            style={{
              background: view==='goats' ? '#059669' : '#f3f4f6',
              color: view==='goats' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >🐐 Goats</button>
          <button 
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
          >🌱 Pastures</button>
          <button 
            className={view==='crops'? 'active':''} 
            onClick={()=>setView('crops')}
            style={{
              background: view==='crops' ? '#059669' : '#f3f4f6',
              color: view==='crops' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >🌾 Crops</button>
          <button 
            className={view==='tasks'? 'active':''} 
            onClick={()=>setView('tasks')}
            style={{
              background: view==='tasks' ? '#059669' : '#f3f4f6',
              color: view==='tasks' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >✅ Tasks</button>
          <button 
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
          >📅 Schedules</button>
          <button 
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
          >📆 Calendar</button>
          <button 
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
          >📦 Inventory</button>
          <button 
            className={view==='finance'? 'active':''} 
            onClick={()=>setView('finance')}
            style={{
              background: view==='finance' ? '#059669' : '#f3f4f6',
              color: view==='finance' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >💰 Finance</button>
          <button 
            className={view==='reports'? 'active':''} 
            onClick={()=>setView('reports')}
            style={{
              background: view==='reports' ? '#059669' : '#f3f4f6',
              color: view==='reports' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >📊 Reports</button>

          <button 
            className={view==='analytics'? 'active':''} 
            onClick={()=>setView('analytics')}
            style={{
              background: view==='analytics' ? '#059669' : '#f3f4f6',
              color: view==='analytics' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >📈 Analytics</button>
          <button 
            className={view==='additionalReports'? 'active':''} 
            onClick={()=>setView('additionalReports')}
            style={{
              background: view==='additionalReports' ? '#059669' : '#f3f4f6',
              color: view==='additionalReports' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >🏥 Health Reports</button>
          <button 
            className={view==='bulk'? 'active':''} 
            onClick={()=>setView('bulk')}
            style={{
              background: view==='bulk' ? '#059669' : '#f3f4f6',
              color: view==='bulk' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >⚡ Bulk Ops</button>
          {/* Audit Log button removed */}
          <button 
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
          >💾 Backup</button>
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
              <button onClick={() => {}} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: colors.bg.tertiary, color: colors.text.primary }}>
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
            <section>
              <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>
              {/* Sub-navigation for Livestock */}
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => setView('animals')} style={{ padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                  🐄 Livestock
                </button>
                {/* Poultry button removed */}
                <button onClick={() => setView('canines')} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  🐕 Canines
                </button>
              </div>
              <ErrorBoundary><Animals /></ErrorBoundary>
            </section>
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
            <section>
              <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>
              <ErrorBoundary><GoatModule /></ErrorBoundary>
            </section>
          )}

          {view === 'canines' && (
            <section>
              <button onClick={() => setView('animals')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Livestock
              </button>
              <ErrorBoundary><CanineManagement animals={animals} setAnimals={setAnimals} /></ErrorBoundary>
            </section>
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
            <ErrorBoundary><Crops /></ErrorBoundary>
          </section>
        )}

        {view === 'inventory' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><Inventory /></ErrorBoundary>
          </section>
        )}


        {view === 'reports' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><ReportModule /></ErrorBoundary>
          </section>
        )}



        {view === 'analytics' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><AdvancedAnalytics /></ErrorBoundary>
          </section>
        )}

        {view === 'additionalReports' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><AdditionalReports /></ErrorBoundary>
          </section>
        )}

        {view === 'bulk' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><BulkOperations /></ErrorBoundary>
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


        {view === 'weather' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><WeatherDashboard onNavigate={setView} /></ErrorBoundary>
          </section>
        )}


        {view === 'market' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><MarketPrices /></ErrorBoundary>
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
            <ErrorBoundary><CustomReportBuilder /></ErrorBoundary>
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

        {view === 'settings' && (
          <section>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>Settings</h2>
              <p style={{ color: 'var(--muted)', margin: 0 }}>Customize your application appearance and preferences</p>
            </div>
            
            {/* Tabs for Settings */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '2px solid #e5e7eb', overflowX: 'auto' }}>
              <button
                onClick={() => setSettings(s => ({ ...s, settingsTab: 'enhanced' }))}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: (settings.settingsTab || 'enhanced') === 'enhanced' ? '2px solid #059669' : '2px solid transparent',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontWeight: (settings.settingsTab || 'enhanced') === 'enhanced' ? 600 : 400,
                  color: (settings.settingsTab || 'enhanced') === 'enhanced' ? '#059669' : '#6b7280',
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
                  borderBottom: settings.settingsTab === 'appearance' ? '2px solid #059669' : '2px solid transparent',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontWeight: settings.settingsTab === 'appearance' ? 600 : 400,
                  color: settings.settingsTab === 'appearance' ? '#059669' : '#6b7280',
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
                  borderBottom: settings.settingsTab === 'sync' ? '2px solid #059669' : '2px solid transparent',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontWeight: settings.settingsTab === 'sync' ? 600 : 400,
                  color: settings.settingsTab === 'sync' ? '#059669' : '#6b7280',
                  whiteSpace: 'nowrap'
                }}
              >
                🔄 Cloud Sync
              </button>
            </div>

            {/* Enhanced Settings Tab */}
            {(settings.settingsTab || 'enhanced') === 'enhanced' && <ErrorBoundary><EnhancedSettings /></ErrorBoundary>}

            {/* Sync Settings Tab */}
            {settings.settingsTab === 'sync' && <ErrorBoundary><SyncSettings /></ErrorBoundary>}

            {/* Appearance Settings Tab */}
            {(settings.settingsTab || 'appearance') === 'appearance' && (
            <div style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
              
              {/* Appearance Section */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px', color: 'inherit' }}>Appearance</h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                  
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{ fontWeight: '500', color: 'inherit', fontSize: '14px' }}>
                      Theme
                    </label>
                    <select 
                      value={settings.theme || 'catalytics'} 
                      onChange={e=>setSettings(s=> ({ ...s, theme: e.target.value }))}
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '500' }}
                    >
                      <option value="catalytics">Catalytics (Clean & Modern)</option>
                      <option value="light">Light</option>
                      <option value="bold">Bold Colorful</option>
                      <option value="calm">Calm Green</option>
                      <option value="contrast">High Contrast</option>
                      <option value="evolution">Evolution X (dark neon)</option>
                      <option value="cyberpunk">Cyberpunk (neon)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
                    <input 
                      type="checkbox" 
                      id="backgroundToggle"
                      checked={settings.backgroundOn} 
                      onChange={e=>setSettings(s=> ({ ...s, backgroundOn: e.target.checked }))}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <label htmlFor="backgroundToggle" style={{ fontWeight: '500', color: 'inherit', fontSize: '14px' }}>
                      Enable background image
                    </label>
                  </div>

                  {settings.backgroundOn && (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <label style={{ fontWeight: '500', color: 'inherit', fontSize: '14px' }}>
                        Background Image
                      </label>
                      <select 
                        value={settings.background} 
                        onChange={e=>setSettings(s=> ({ ...s, background: e.target.value }))}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '500' }}
                      >
                        <option value="">None</option>
                        <option value="bg-farm.svg">Farm (default)</option>
                        <option value="bg-fields.svg">Fields</option>
                      </select>
                    </div>
                  )}

                </div>
              </div>

              {/* Branding Section */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px', color: 'inherit' }}>Branding</h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                  
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{ fontWeight: '500', color: 'inherit', fontSize: '14px' }}>
                      Logo Style
                    </label>
                    <select 
                      value={settings.logo} 
                      onChange={e=>setSettings(s=> ({ ...s, logo: e.target.value }))}
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '500' }}
                    >
                      <option value="logo-wordmark.svg">Wordmark</option>
                      <option value="logo-badge.svg">Badge</option>
                      <option value="logo-icon.svg">Icon</option>
                      <option value="uploaded">Custom Upload</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{ fontWeight: '500', color: 'inherit', fontSize: '14px' }}>
                      Upload Custom Logo
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e=>{
                        const f = e.target.files && e.target.files[0]
                        if(!f) return
                        const reader = new FileReader()
                        reader.onload = ev => { const data = ev.target.result; setSettings(s=> ({ ...s, uploadedLogo: data, logo: 'uploaded' })) }
                        reader.readAsDataURL(f)
                      }}
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', fontWeight: '500' }}
                    />
                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                      Supports PNG, JPG, and SVG files
                    </p>
                  </div>

                </div>
              </div>

              {/* Data Management Section */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px', color: 'inherit' }}>Data Management</h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  
                  <div style={{ padding: '16px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: '#92400e' }}>Reset Application Data</h4>
                    <p style={{ fontSize: '14px', margin: '0 0 12px 0', color: '#92400e' }}>
                      This will clear all your local demo data including animals, tasks, and settings.
                    </p>
                    <button 
                      onClick={()=>{ if(confirm('Are you sure you want to clear all local demo data? This action cannot be undone.')){ localStorage.clear(); location.reload() }}}
                      style={{ 
                        background: '#dc2626', 
                        color: '#ffffff', 
                        border: 'none', 
                        padding: '10px 16px', 
                        borderRadius: '6px', 
                        fontSize: '14px', 
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Clear All Data
                    </button>
                  </div>

                </div>
              </div>

            </div>
            )}
          </section>
        )}
        </Suspense>
      </main>

      <footer style={{ 
        background: colors.bg.secondary, 
        color: colors.text.secondary,
        padding: '16px',
        textAlign: 'center',
        borderTop: `1px solid ${colors.border.primary}`
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

// Wrapper with AppShell for fast initial render
import AppShell from './components/AppShell'

export default function App() {
  return (
    <Suspense fallback={<AppShell />}>
      <AppContent />
    </Suspense>
  )
}
