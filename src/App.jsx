import React, { useState, useEffect, lazy, Suspense, useContext } from 'react'
import { requestNotificationPermission, listenForMessages } from './lib/firebaseMessaging'
import { ThemeProvider, useTheme, ThemeToggleButton } from './lib/theme'
import OfflineIndicator from './components/OfflineIndicator'
import InAppNotification from './components/InAppNotification'
import BottomNav from './components/BottomNav'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import { AppViewProvider, AppViewContext } from './lib/AppViewContext.jsx';
import SwipeHandler from './components/SwipeHandler'
import ErrorBoundary from './components/ErrorBoundary'
import GlobalSearch from './components/GlobalSearch'
import { DataLayer } from './lib/dataLayer'
import { initGlobalErrorHandler } from './lib/errorHandler'
import ToastContainer from './components/ToastContainer'
import { useAnimalStore, useCropStore, useFinanceStore, useTaskStore, useInventoryStore, useUIStore } from './stores'

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

// Lazy load all modules with retry logic
const Dashboard = lazyWithRetry(() => import('./modules/Dashboard'))
const NotificationCenter = lazyWithRetry(() => import('./modules/NotificationCenter'))
// Load Animals synchronously to avoid dynamic import timeouts in Codespaces
import Animals from './modules/Animals'
const Tasks = lazyWithRetry(() => import('./modules/Tasks'))
const Finance = lazyWithRetry(() => import('./modules/Finance'))
const Schedules = lazyWithRetry(() => import('./modules/Schedules'))
const Crops = lazyWithRetry(() => import('./modules/CropsWithSubsections'))
const Reports = lazyWithRetry(() => import('./modules/Reports'))
const Inventory = lazyWithRetry(() => import('./modules/Inventory'))
const Groups = lazyWithRetry(() => import('./modules/Groups'))
const Pastures = lazyWithRetry(() => import('./modules/Pastures'))
const HealthSystem = lazyWithRetry(() => import('./modules/HealthSystem'))
const Login = lazyWithRetry(() => import('./modules/Login'))
const AuditLog = lazyWithRetry(() => import('./modules/AuditLog'))
const BackupRestore = lazyWithRetry(() => import('./modules/BackupRestore'))
const SyncSettings = lazyWithRetry(() => import('./modules/SyncSettings'))
const AdvancedAnalytics = lazyWithRetry(() => import('./modules/AdvancedAnalytics'))
const EnhancedSettings = lazyWithRetry(() => import('./modules/EnhancedSettings'))
const BulkOperations = lazyWithRetry(() => import('./modules/BulkOperations'))
const AdditionalReports = lazyWithRetry(() => import('./modules/AdditionalReports'))
const PetManagement = lazyWithRetry(() => import('./modules/PetManagement'))
const CanineManagement = lazyWithRetry(() => import('./modules/CanineManagement'))
const CalendarView = lazyWithRetry(() => import('./modules/CalendarView'))
const FarmMap = lazyWithRetry(() => import('./modules/FarmMap'))
const SmartAlerts = lazyWithRetry(() => import('./modules/SmartAlerts'))
const VoiceCommandCenter = lazyWithRetry(() => import('./modules/VoiceCommandCenter'))
const WeatherDashboard = lazyWithRetry(() => import('./modules/WeatherDashboard'))
const IoTDevices = lazyWithRetry(() => import('./modules/IoTDevices'))
const MarketPrices = lazyWithRetry(() => import('./modules/MarketPrices'))
const Farm3D = lazyWithRetry(() => import('./modules/Farm3D'))
const TimelinePlanner = lazyWithRetry(() => import('./modules/TimelinePlanner'))
const PhotoGalleryAdvanced = lazyWithRetry(() => import('./modules/PhotoGalleryAdvanced'))
const GeospatialMap = lazyWithRetry(() => import('./modules/GeospatialMap'))
const PredictiveAnalytics = lazyWithRetry(() => import('./modules/PredictiveAnalytics'))
const AdvancedBatchOps = lazyWithRetry(() => import('./modules/AdvancedBatchOps'))
const CustomReportBuilder = lazyWithRetry(() => import('./modules/CustomReportBuilder'))
const AIInsightsDashboard = lazyWithRetry(() => import('./modules/AIInsightsDashboard'))
const AlertCenter = lazyWithRetry(() => import('./modules/AlertCenter'))
const MobileSettings = lazyWithRetry(() => import('./modules/MobileSettings'))
const DashboardBuilder = lazyWithRetry(() => import('./modules/DashboardBuilder'))
const ActivityFeed = lazyWithRetry(() => import('./modules/ActivityFeed'))
const IoTSensorDashboard = lazyWithRetry(() => import('./modules/IoTSensorDashboard'))
const AnimalHealthTracker = lazyWithRetry(() => import('./modules/AnimalHealthTracker'))
const HealthAnalyticsDashboard = lazyWithRetry(() => import('./modules/HealthAnalyticsDashboard'))
const StoreDemo = lazyWithRetry(() => import('./modules/StoreDemo'))
const Marketplace = lazyWithRetry(() => import('./modules/Marketplace'))
const Community = lazyWithRetry(() => import('./modules/Community'))
const KnowledgeBase = lazyWithRetry(() => import('./modules/KnowledgeBase'))

// Phase 2: Smart Features UI Modules
const AlertRules = lazyWithRetry(() => import('./modules/AlertRules'))
const DiseaseDetection = lazyWithRetry(() => import('./modules/DiseaseDetection'))
const PredictiveDashboard = lazyWithRetry(() => import('./modules/PredictiveDashboard'))

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
import { isAuthenticated, getCurrentSession, logout, getCurrentUserName, getCurrentUserRole } from './lib/auth'
import { logAction, ACTIONS, ENTITIES } from './lib/audit'
import { isAuthRequired, getDefaultUser } from './lib/appSettings'
import { startReminderChecker, stopReminderChecker, getUnreadCount } from './lib/notifications'
import { checkAllAutoNotifications } from './lib/autoNotifications'
import { initSync, setupAutoSync } from './lib/sync'
import { alertRuleEngine } from './lib/alertRuleEngine'
import { installAllRules } from './lib/farmAlertRules'

// App content component that uses theme
function AppContent() {
  const { theme, getThemeColors } = useTheme();
  const colors = getThemeColors();

  const { view, setView } = useContext(AppViewContext);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // UI branding/settings - must be declared before any conditional returns
  const SETTINGS_KEY = 'devinsfarm:ui:settings'
  const defaultSettings = { backgroundOn: false, background: 'bg-farm.svg', logo: 'jr-farm-logo.svg', uploadedLogo: '', theme: 'catalytics' }
  const [settings, setSettings] = useState(defaultSettings)

  // Initialize error handler and data layer on mount
  useEffect(() => {
    initGlobalErrorHandler();
    DataLayer.initialize().catch(console.error);
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
    const handleInstallPrompt = (e) => {
      setShowInstallPrompt(true)
    }
    window.addEventListener('pwa-install-available', handleInstallPrompt)
    return () => {
      window.removeEventListener('pwa-install-available', handleInstallPrompt)
    }
  }, [])

  // Request notification permission and listen for messages on startup
  // NOTE: Only initialize listener if permission already granted
  // Don't auto-request permission (must be user-initiated)
  useEffect(() => {
    // Check if permission already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      requestNotificationPermission().then(token => {
        if (token) {
          listenForMessages((payload) => {
            console.log('📬 Foreground notification:', payload);
          });
        }
      });
    } else {
      console.info('ℹ️ Notifications not yet enabled. Enable from Notification Center or Settings.');
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    // If auth is not required (personal mode), auto-login as default user
    if (!isAuthRequired()) {
      const defaultUser = getDefaultUser()
      setCurrentUser(defaultUser)
      setAuthenticated(true)
    } else if (isAuthenticated()) {
      const session = getCurrentSession()
      setCurrentUser(session)
      setAuthenticated(true)
    }
  }, [])

  // Start notification/reminder checker and sync
  useEffect(() => {
    if (authenticated) {
      // Run initial check
      checkAllAutoNotifications()
      
      const intervalId = startReminderChecker()
      
      // Update unread count
      const updateUnreadCount = () => {
        setUnreadNotifications(getUnreadCount())
      }
      
      updateUnreadCount()
      const countInterval = setInterval(updateUnreadCount, 30000) // Every 30 seconds
      
      // Check auto notifications every hour
      const autoCheckInterval = setInterval(checkAllAutoNotifications, 60 * 60 * 1000)
      
      // Listen for new notifications
      window.addEventListener('newNotification', updateUnreadCount)
      
      // Initialize sync if configured - wrapped in try-catch
      try {
        initSync()
        setupAutoSync()
      } catch (error) {
        console.warn('Sync initialization failed (optional feature):', error)
      }
      
      // Phase 2: Initialize smart alert rules
      try {
        console.log('🔔 Initializing smart alert rules...')
        installAllRules(alertRuleEngine)
        alertRuleEngine.evaluateAllRules()
        const alertInterval = setInterval(() => {
          alertRuleEngine.evaluateAllRules()
        }, 5 * 60 * 1000) // Every 5 minutes
        
        // Cleanup alert interval
        return () => {
          stopReminderChecker(intervalId)
          clearInterval(countInterval)
          clearInterval(autoCheckInterval)
          clearInterval(alertInterval)
          window.removeEventListener('newNotification', updateUnreadCount)
        }
      } catch (error) {
        console.warn('Alert rules initialization failed (optional feature):', error)
      }
      
      return () => {
        stopReminderChecker(intervalId)
        clearInterval(countInterval)
        clearInterval(autoCheckInterval)
        window.removeEventListener('newNotification', updateUnreadCount)
      }
    }
  }, [authenticated])

  // Load animals for passing to health system and groups
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cattalytics:animals');
      if (stored) setAnimals(JSON.parse(stored));
    } catch (e) {
      setAnimals([]);
    }
  }, [view]); // Reload when view changes to keep animals fresh
  
  // Load UI settings
  useEffect(()=>{
    try{
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
      if(s) setSettings(prev=> ({ ...prev, ...s }))
    }catch(e){}
  }, [])

  // Save UI settings
  useEffect(()=>{ 
    try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }
    catch(e){} 
  }, [settings])

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

  function handleLoginSuccess(user) {
    setCurrentUser(user)
    setAuthenticated(true)
  }

  function handleLogout() {
    logAction(ACTIONS.LOGOUT, ENTITIES.USER, currentUser?.userId || 'unknown', {
      username: currentUser?.username
    })
    logout()
    setAuthenticated(false)
    setCurrentUser(null)
    setView('dashboard')
  }

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
      <header style={{
        background: colors.bg.elevated,
        borderBottom: `2px solid ${colors.border.primary}`,
        boxShadow: colors.shadow.md
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }} className="brand">
          <div className="logo-wrap" aria-hidden>
            <img
              src={ settings.logo === 'uploaded' && settings.uploadedLogo ? settings.uploadedLogo : `/assets/${settings.logo}` }
              className="logo"
              alt="JR FARM - Comprehensive Farm Management"
              onError={()=> setSettings(s=> ({ ...s, logo: '' }))}
            />
          </div>
          <div>
            <h2 style={{
              margin:'0 0 4px 0', 
              fontSize:'1.4rem', 
              fontWeight:'900', 
              letterSpacing:'0.5px',
              color: colors.text.primary
            }}>JR FARM</h2>
            <p style={{
              margin:'0', 
              fontSize:'0.75rem', 
              opacity:'0.95',
              color: colors.text.secondary || colors.text.primary
            }}>Comprehensive Farm Management</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {showInstallPrompt && (
            <button
              onClick={handleInstallClick}
              style={{
                padding: '6px 12px',
                background: '#10b981',
                border: 'none',
                color: 'white',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Install app on your device"
            >
              📥 Install App
            </button>
          )}
          {unreadNotifications > 0 && (
            <div 
              onClick={() => setView('notifications')}
              style={{
                position: 'relative',
                cursor: 'pointer',
                padding: '6px 10px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="View notifications"
            >
              🔔
              <span style={{
                background: '#ef4444',
                color: 'white',
                borderRadius: 10,
                padding: '2px 6px',
                fontSize: 11,
                fontWeight: '600'
              }}>
                {unreadNotifications}
              </span>
            </div>
          )}
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>{getCurrentUserName()}</div>
            <div style={{ fontSize: 11 }}>{getCurrentUserRole()}</div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '6px 12px', 
              background: 'rgba(255,255,255,0.2)', 
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Logout
          </button>
        </div>
      </header>
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
            className={view==='voice'? 'active':''} 
            onClick={()=>setView('voice')}
            style={{
              background: view==='voice' ? '#7c3aed' : '#f3f4f6',
              color: view==='voice' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🎤 Voice Control
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
            className={view==='disease-detection'? 'active':''} 
            onClick={()=>setView('disease-detection')}
            style={{
              background: view==='disease-detection' ? '#ef4444' : '#f3f4f6',
              color: view==='disease-detection' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔬 Disease Detection
          </button>
          <button 
            className={view==='predictive-dashboard'? 'active':''} 
            onClick={()=>setView('predictive-dashboard')}
            style={{
              background: view==='predictive-dashboard' ? '#8b5cf6' : '#f3f4f6',
              color: view==='predictive-dashboard' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📊 Predictions
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
            className={view==='iot'? 'active':''} 
            onClick={()=>setView('iot')}
            style={{
              background: view==='iot' ? '#8b5cf6' : '#f3f4f6',
              color: view==='iot' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📟 IoT Devices
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
          <button 
            className={view==='farm3d'? 'active':''} 
            onClick={()=>setView('farm3d')}
            style={{
              background: view==='farm3d' ? '#ec4899' : '#f3f4f6',
              color: view==='farm3d' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🗺️ 3D Farm
          </button>
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
            className={view==='geomap'? 'active':''} 
            onClick={()=>setView('geomap')}
            style={{
              background: view==='geomap' ? '#10b981' : '#f3f4f6',
              color: view==='geomap' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🌍 GeoMap
          </button>
          <button 
            className={view==='predictions'? 'active':''} 
            onClick={()=>setView('predictions')}
            style={{
              background: view==='predictions' ? '#8b5cf6' : '#f3f4f6',
              color: view==='predictions' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔮 Predictions
          </button>
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
          <button 
            className={view==='audit'? 'active':''} 
            onClick={()=>setView('audit')}
            style={{
              background: view==='audit' ? '#059669' : '#f3f4f6',
              color: view==='audit' ? '#fff' : '#1f2937',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >📋 Audit Log</button>
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
            <ThemeToggleButton />
          </div>
        </nav>

      <main>
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
                <button onClick={() => setView('pets')} style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  🐾 Pets
                </button>
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

          {view === 'pets' && (
            <section>
              <button onClick={() => setView('animals')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Livestock
              </button>
              <ErrorBoundary><PetManagement /></ErrorBoundary>
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
              <ErrorBoundary><AnimalHealthTracker onNavigate={setView} /></ErrorBoundary>
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

          {view === 'store-demo' && (
            <section>
              <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>
              <ErrorBoundary><StoreDemo /></ErrorBoundary>
            </section>
          )}

          {view === 'marketplace' && (
            <section>
              <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>
              <ErrorBoundary><Marketplace /></ErrorBoundary>
            </section>
          )}

          {view === 'community' && (
            <section>
              <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>
              <ErrorBoundary><Community /></ErrorBoundary>
            </section>
          )}

          {view === 'knowledge' && (
            <section>
              <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                ← Back to Dashboard
              </button>
              <ErrorBoundary><KnowledgeBase /></ErrorBoundary>
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

        {view === 'farmmap' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><FarmMap /></ErrorBoundary>
          </section>
        )}

        {view === 'reports' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><Reports /></ErrorBoundary>
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

        {view === 'voice' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><VoiceCommandCenter onNavigate={setView} /></ErrorBoundary>
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

        {view === 'iot' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><IoTDevices /></ErrorBoundary>
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

        {view === 'farm3d' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><Farm3D /></ErrorBoundary>
          </section>
        )}

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

        {view === 'geomap' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><GeospatialMap /></ErrorBoundary>
          </section>
        )}

        {view === 'predictions' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><PredictiveAnalytics /></ErrorBoundary>
          </section>
        )}

        {view === 'batchops' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><AdvancedBatchOps /></ErrorBoundary>
          </section>
        )}

        {view === 'customreports' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><CustomReportBuilder /></ErrorBoundary>
          </section>
        )}

        {view === 'aiinsights' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><AIInsightsDashboard /></ErrorBoundary>
          </section>
        )}

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

        {view === 'dashboardbuilder' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><DashboardBuilder /></ErrorBoundary>
          </section>
        )}

        {view === 'activityfeed' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><ActivityFeed /></ErrorBoundary>
          </section>
        )}

        {view === 'iotsensors' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><IoTSensorDashboard /></ErrorBoundary>
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

        {view === 'disease-detection' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><DiseaseDetection /></ErrorBoundary>
          </section>
        )}

        {view === 'predictive-dashboard' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><PredictiveDashboard /></ErrorBoundary>
          </section>
        )}

        {view === 'audit' && (
          <section>
            <button onClick={() => setView('dashboard')} style={{ marginBottom: '16px', background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
            <ErrorBoundary><AuditLog /></ErrorBoundary>
          </section>
        )}

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
      <InAppNotification />

      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Swipe gesture navigation */}
      <SwipeHandler />

      {/* Offline indicator */}
      <OfflineIndicator />
      
      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}

// Wrapper component (ThemeProvider is in main.jsx)
export default function App() {
  return <AppContent />
}
