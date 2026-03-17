import React, { useState, useEffect, useRef } from 'react'
import { isFirebaseConfigured } from '../lib/firebase'
import { isFirebaseAuthAvailable, loginWithFirebase, registerWithFirebase, logoutFromFirebase, getCurrentFirebaseUser, onFirebaseAuthChange, getFirebaseRememberSessionPreference, setFirebaseRememberSessionPreference } from '../lib/firebaseAuth'
import { 
  isSyncEnabled, 
  setSyncEnabled, 
  pushAllToFirebase, 
  pullAllFromFirebase,
  getSyncStatus,
  initSync
} from '../lib/sync'

export default function SyncSettings() {
  const LAST_FIREBASE_EMAIL_KEY = 'devinsfarm:firebase:lastEmail'
  const canEnablePersistenceInCurrentEnv = !import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEV_FIRESTORE_PERSISTENCE === 'true'
  const [configured, setConfigured] = useState(false)
  const [syncEnabled, setSyncEnabledState] = useState(false)
  const [syncStatus, setSyncStatus] = useState('offline')
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [syncError, setSyncError] = useState('')
  const retryTimeoutRef = useRef(null)
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  // Register form
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerError, setRegisterError] = useState('')
  
  const [pushing, setPushing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [pendingQueue, setPendingQueue] = useState(0)
  const [queueItems, setQueueItems] = useState([])
  const [persistencePref, setPersistencePref] = useState('default')
  const [persistenceMode, setPersistenceMode] = useState(typeof window !== 'undefined' ? (window.__firestorePersistenceMode || 'unknown') : 'unknown')
  const [rememberSession, setRememberSession] = useState(true)

  useEffect(() => {
    setConfigured(isFirebaseConfigured())
    setSyncEnabledState(isSyncEnabled())
    setSyncStatus(getSyncStatus())
    // Get last sync time from localStorage
    setLastSyncTime(localStorage.getItem('devinsfarm:lastSyncTime'))
    setSyncError(localStorage.getItem('devinsfarm:lastSyncError') || '')
    setFirebaseUser(getCurrentFirebaseUser())
    setRememberSession(getFirebaseRememberSessionPreference())
    try {
      const rememberedEmail = localStorage.getItem(LAST_FIREBASE_EMAIL_KEY) || ''
      if (rememberedEmail) {
        setLoginEmail(rememberedEmail)
      }
    } catch (e) {}
    try {
      const pref = localStorage.getItem('devinsfarm:firestore:persistence')
      setPersistencePref(pref === 'enabled' || pref === 'disabled' ? pref : 'default')
    } catch (e) {
      setPersistencePref('default')
    }
    try {
      setPersistenceMode(window.__firestorePersistenceMode || 'unknown')
    } catch (e) {
      setPersistenceMode('unknown')
    }
    
    const unsubscribeAuth = onFirebaseAuthChange((user) => {
      setFirebaseUser(user)

      try {
        if (user?.email) {
          localStorage.setItem(LAST_FIREBASE_EMAIL_KEY, user.email)
        }
      } catch (e) {}

      if (user) {
        // Always enable sync when a user is signed in so push/pull
        // work without requiring the toggle to be manually flipped.
        setSyncEnabled(true)
        initSync()
        setSyncEnabledState(true)
        setSyncStatus(getSyncStatus())
      } else {
        setSyncEnabledState(false)
        setSyncStatus('offline')
      }
    })

    // Update sync status periodically
    const interval = setInterval(() => {
      const nextSyncStatus = getSyncStatus()
      const nextLastSync = localStorage.getItem('devinsfarm:lastSyncTime')
      const nextSyncError = localStorage.getItem('devinsfarm:lastSyncError') || ''

      setSyncStatus(prev => (prev === nextSyncStatus ? prev : nextSyncStatus))
      setLastSyncTime(prev => (prev === nextLastSync ? prev : nextLastSync))
      setSyncError(prev => (prev === nextSyncError ? prev : nextSyncError))
      try {
        const nextPersistence = window.__firestorePersistenceMode || 'unknown'
        setPersistenceMode(prev => (prev === nextPersistence ? prev : nextPersistence))
      } catch (e) {}

      try {
        if (window.__firestoreQueueLength) {
          const nextPending = Number(window.__firestoreQueueLength() || 0)
          setPendingQueue(prev => (prev === nextPending ? prev : nextPending))
        }
        if (window.__firestoreQueueItems) {
          const nextItems = Array.from(window.__firestoreQueueItems())
          setQueueItems(prev => (JSON.stringify(prev) === JSON.stringify(nextItems) ? prev : nextItems))
        }
      } catch (e) {}
    }, 10000)
    
    return () => {
      clearInterval(interval)
      try { unsubscribeAuth() } catch (e) {}
    }
  }, [])

  function handlePersistenceChange(nextValue) {
    try {
      if (nextValue === 'enabled' && !canEnablePersistenceInCurrentEnv) {
        alert('Firestore persistence enable is blocked in development/Codespaces for stability. It remains enabled by default in production. Set VITE_ALLOW_DEV_FIRESTORE_PERSISTENCE=true only if you need to test it locally.')
        return
      }

      if (nextValue === 'default') {
        localStorage.removeItem('devinsfarm:firestore:persistence')
      } else {
        localStorage.setItem('devinsfarm:firestore:persistence', nextValue)
      }
      setPersistencePref(nextValue)
      const label = nextValue === 'default' ? 'default policy' : nextValue
      if (window.confirm(`Firestore persistence set to ${label}. Reload now to apply?`)) {
        window.location.reload()
      }
    } catch (e) {
      alert('Failed to save persistence preference: ' + (e.message || e))
    }
  }

  async function handleRememberSessionToggle() {
    const nextValue = !rememberSession
    const result = await setFirebaseRememberSessionPreference(nextValue)
    if (result.success) {
      setRememberSession(nextValue)
      alert(nextValue
        ? '✅ This device will keep you signed in and auto-resume sync.'
        : '⚠️ This device will stop keeping a long-lived Firebase session after you sign out or close the session.')
    } else {
      alert('Failed to update sign-in persistence: ' + result.error)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    
    const result = await loginWithFirebase(loginEmail, loginPassword)
    if (result.success) {
      try { localStorage.setItem(LAST_FIREBASE_EMAIL_KEY, loginEmail) } catch (e) {}
      setFirebaseUser(getCurrentFirebaseUser())
      setShowLogin(false)
      initSync()
      setSyncEnabled(true)
      setSyncEnabledState(true)
      setSyncStatus(getSyncStatus())
      alert('✅ Logged in successfully! Sync has been enabled for this device.')
    } else {
      setLoginError(result.error)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setRegisterError('')
    
    const result = await registerWithFirebase(registerEmail, registerPassword, registerName)
    if (result.success) {
      try { localStorage.setItem(LAST_FIREBASE_EMAIL_KEY, registerEmail) } catch (e) {}
      setFirebaseUser(getCurrentFirebaseUser())
      setShowRegister(false)
      initSync()
      setSyncEnabled(true)
      setSyncEnabledState(true)
      setSyncStatus(getSyncStatus())
      alert('✅ Account created successfully! Sync has been enabled for this device.')
    } else {
      setRegisterError(result.error)
    }
  }

  async function handleLogout() {
    const result = await logoutFromFirebase()
    if (result.success) {
      setFirebaseUser(null)
      setSyncEnabledState(false)
      setSyncEnabled(false)
      alert('✅ Logged out successfully')
    }
  }

  function handleToggleSync() {
    const newState = !syncEnabled
    setSyncEnabled(newState)
    setSyncEnabledState(newState)
    
    if (newState) {
      alert('✅ Sync enabled! Your data will now sync across devices automatically.')
    } else {
      alert('⚠️ Sync disabled. Your data will only be stored locally.')
    }
  }

  async function handlePushAll(retryCount = 0) {
    if (!confirm('Push all local data to Firebase? This will overwrite cloud data.')) return
    setPushing(true)
    setSyncStatus('syncing')
    setSyncError('')
    try {
      const result = await pushAllToFirebase()
      setPushing(false)
      setSyncStatus('synced')
      const now = new Date().toLocaleString()
      localStorage.setItem('devinsfarm:lastSyncTime', now)
      localStorage.removeItem('devinsfarm:lastSyncError')
      setLastSyncTime(now)
      setSyncError('')
      alert(`✅ Success! Pushed ${result.count} collections (${result.itemCount} items) to cloud.`)
    } catch (error) {
      setPushing(false)
      setSyncStatus(getSyncStatus())
      localStorage.setItem('devinsfarm:lastSyncError', error.message)
      setSyncError(error.message)
      alert(`❌ Push failed: ${error.message}\n\nTroubleshooting tips:\n- Check your internet connection\n- Make sure you are logged in\n- Try again later\n- If on mobile, try a different browser (Chrome may block sync)`)
      // Auto-retry logic (max 3 attempts)
      if (retryCount < 2) {
        retryTimeoutRef.current = setTimeout(() => handlePushAll(retryCount + 1), 10000)
      }
    }
  }

  async function handlePullAll(retryCount = 0) {
    if (!confirm('Pull all data from Firebase? This will overwrite local data.')) return
    setPulling(true)
    setSyncStatus('syncing')
    setSyncError('')
    try {
      const result = await pullAllFromFirebase()
      setPulling(false)
      setSyncStatus('synced')
      const now = new Date().toLocaleString()
      localStorage.setItem('devinsfarm:lastSyncTime', now)
      localStorage.removeItem('devinsfarm:lastSyncError')
      setLastSyncTime(now)
      setSyncError('')
      alert(`✅ Success! Pulled ${result.count} collections from cloud. Refresh the page to see changes.`)
      if (confirm('Refresh page now to see the updated data?')) {
        window.location.reload()
      }
    } catch (error) {
      setPulling(false)
      setSyncStatus(getSyncStatus())
      localStorage.setItem('devinsfarm:lastSyncError', error.message)
      setSyncError(error.message)
      alert(`❌ Pull failed: ${error.message}\n\nTroubleshooting tips:\n- Check your internet connection\n- Make sure you are logged in\n- Try again later\n- If on mobile, try a different browser (Chrome may block sync)`)
      // Auto-retry logic (max 3 attempts)
      if (retryCount < 2) {
        retryTimeoutRef.current = setTimeout(() => handlePullAll(retryCount + 1), 10000)
      }
    }
  }

  async function handleExport() {
    if (!confirm('Export all local data to a JSON file?')) return
    try {
      const all = {}
      // Gather each store
      for (const key of Object.keys(window.STORES || {})) {
        try {
          const data = localStorage.getItem(key) || null
          all[key] = data ? JSON.parse(data) : []
        } catch (e) {
          all[key] = []
        }
      }
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data: all }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `devinsfarm-export-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      alert('✅ Export started (check your downloads)')
    } catch (e) {
      alert('Export failed: ' + e.message)
    }
  }

  async function handleImport(file) {
    if (!file) return
    if (!confirm('Importing will overwrite local data for the included stores. Proceed?')) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const data = parsed && parsed.data ? parsed.data : parsed
      // Write each store
      for (const [key, value] of Object.entries(data)) {
        try {
          // value expected to be array
          if (Array.isArray(value)) {
            // call global saveData if available
            if (window.saveData && typeof window.saveData === 'function') {
              window.saveData(key, value)
            } else {
              localStorage.setItem(key, JSON.stringify(value))
            }
          }
        } catch (e) {}
      }
      alert('✅ Import completed. Refresh to load imported data.')
    } catch (e) {
      alert('Import failed: ' + (e.message || e))
    }
  }

  const baseButtonStyle = {
    border: 'none',
    borderRadius: 6,
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    transition: 'opacity 0.2s ease'
  }

  const buttonVariants = {
    neutral: {
      background: 'var(--bg-tertiary, #e5e7eb)',
      color: 'var(--text-primary, #1f2937)'
    },
    success: {
      background: '#059669',
      color: '#ffffff'
    },
    danger: {
      background: '#dc2626',
      color: '#ffffff'
    },
    info: {
      background: '#0f766e',
      color: '#ffffff'
    },
    primary: {
      background: '#2563eb',
      color: '#ffffff'
    },
    softDanger: {
      background: 'rgba(239, 68, 68, 0.14)',
      border: '1px solid rgba(239, 68, 68, 0.45)',
      color: 'var(--text-primary, #1f2937)'
    }
  }

  const getButtonStyle = (variant = 'neutral', disabled = false, extra = {}) => ({
    ...baseButtonStyle,
    ...(buttonVariants[variant] || buttonVariants.neutral),
    ...(disabled ? { opacity: 0.55, cursor: 'not-allowed' } : {}),
    ...extra
  })

  const statusBadgeVariants = {
    synced: {
      background: 'rgba(16, 185, 129, 0.18)',
      border: '1px solid rgba(16, 185, 129, 0.45)',
      color: '#d1fae5'
    },
    syncing: {
      background: 'rgba(245, 158, 11, 0.18)',
      border: '1px solid rgba(245, 158, 11, 0.45)',
      color: '#fef3c7'
    },
    error: {
      background: 'rgba(239, 68, 68, 0.18)',
      border: '1px solid rgba(239, 68, 68, 0.45)',
      color: '#fee2e2'
    },
    offline: {
      background: 'rgba(107, 114, 128, 0.22)',
      border: '1px solid rgba(148, 163, 184, 0.35)',
      color: 'var(--text-primary, #e5e7eb)'
    }
  }

  const getSyncStatusBadgeStyle = (status) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    ...(statusBadgeVariants[status] || statusBadgeVariants.offline)
  })

  if (!configured) {
    return (
      <section>
        <h2>🔄 Cloud Sync Settings</h2>
        <div style={{ 
          background: 'rgba(251, 146, 60, 0.14)', 
          border: '1px solid rgba(251, 146, 60, 0.45)', 
          color: 'var(--text-primary, #1f2937)',
          padding: 20, 
          borderRadius: 8,
          marginTop: 20 
        }}>
          <h3 style={{ marginTop: 0 }}>⚠️ Firebase Not Configured</h3>
          <p>To enable cloud sync, you need to configure Firebase:</p>
          <ol style={{ lineHeight: 1.8 }}>
            <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener">Firebase Console</a></li>
            <li>Create a new project (or use existing)</li>
            <li>Add a Web app to your project</li>
            <li>Copy the Firebase configuration</li>
            <li>Edit <code>src/lib/firebase.js</code> and paste your config</li>
            <li>Enable Firestore Database in Firebase Console</li>
            <li>Enable Authentication &gt; Email/Password</li>
            <li>Rebuild your app: <code>npm run build</code></li>
          </ol>
          <p style={{ marginBottom: 0 }}>
            <strong>Note:</strong> Firebase is free for up to 1GB storage and 10GB bandwidth per month.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2>🔄 Cloud Sync Settings</h2>

      {/* Firebase Status */}
      <div style={{ 
        background: 'rgba(16, 185, 129, 0.16)', 
        border: '1px solid rgba(16, 185, 129, 0.45)', 
        color: 'var(--text-primary, #1f2937)',
        padding: 15, 
        borderRadius: 8,
        marginTop: 20 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <div>
            <strong>Firebase Configured</strong>
            <div style={{ fontSize: 13, color: 'var(--text-secondary, #4b5563)' }}>
              Cloud sync is available
            </div>
          </div>
        </div>
      </div>

      {/* Firestore Persistence Controls */}
      <div style={{ marginTop: 20, padding: 15, border: '1px solid var(--border-primary, #cbd5e1)', borderRadius: 8, background: 'var(--bg-secondary, #f8fafc)', color: 'var(--text-primary, #1f2937)' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>💾 Firestore Persistence</h3>
        <div style={{ fontSize: 13, color: 'var(--text-secondary, #475569)', marginBottom: 10 }}>
          Current runtime mode: <strong>{persistenceMode}</strong>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => handlePersistenceChange('enabled')}
            style={getButtonStyle(persistencePref === 'enabled' ? 'success' : 'neutral')}
          >
            Enable
          </button>
          <button
            onClick={() => handlePersistenceChange('disabled')}
            style={getButtonStyle(persistencePref === 'disabled' ? 'danger' : 'neutral')}
          >
            Disable
          </button>
          <button
            onClick={() => handlePersistenceChange('default')}
            style={getButtonStyle(persistencePref === 'default' ? 'info' : 'neutral')}
          >
            Use Default
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary, #4b5563)', marginTop: 10 }}>
          Applies after reload. Default policy: enabled in production, disabled in dev/Codespaces.
        </div>
        {!canEnablePersistenceInCurrentEnv && (
          <div style={{ fontSize: 12, color: 'var(--text-primary, #1f2937)', marginTop: 6 }}>
            Dev safety is active: Enable is blocked in this environment to prevent restart loops.
          </div>
        )}
      </div>

      {/* Authentication Section */}
      <div style={{ marginTop: 30 }}>
        <h3>🔐 Authentication</h3>
        <div style={{ marginTop: 12, marginBottom: 18, padding: 14, background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: 8, color: 'var(--text-primary, #1f2937)' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={rememberSession}
              onChange={handleRememberSessionToggle}
              style={{ width: 18, height: 18, marginTop: 2 }}
            />
            <span>
              <strong>Always keep me signed in on this device</strong>
              <div style={{ fontSize: 13, color: 'var(--text-secondary, #4b5563)', marginTop: 4 }}>
                Keeps your Firebase session on this browser/device and helps auto-resume sync after reload.
              </div>
            </span>
          </label>
        </div>
        {!firebaseUser ? (
          <div>
            <p>You must be logged in to enable sync.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLogin(true)} style={getButtonStyle('primary')}>Login</button>
              <button onClick={() => setShowRegister(true)} style={getButtonStyle('neutral')}>Create Account</button>
            </div>

            {/* Login Form */}
            {showLogin && (
              <div style={{ 
                marginTop: 20, 
                padding: 20, 
                background: 'var(--bg-secondary, #f9fafb)', 
                borderRadius: 8,
                border: '1px solid var(--border-primary, #e5e7eb)',
                color: 'var(--text-primary, #1f2937)'
              }}>
                <h4 style={{ marginTop: 0 }}>Login</h4>
                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: 15 }}>
                    <label>Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                      style={{ display: 'block', width: '100%', marginTop: 5 }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label>Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                      style={{ display: 'block', width: '100%', marginTop: 5 }}
                    />
                  </div>
                  {loginError && (
                    <div style={{ color: 'var(--action-danger, #dc2626)', marginBottom: 15, fontSize: 14 }}>
                      {loginError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" style={getButtonStyle('primary')}>Login</button>
                    <button type="button" onClick={() => setShowLogin(false)} style={getButtonStyle('neutral')}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Register Form */}
            {showRegister && (
              <div style={{ 
                marginTop: 20, 
                padding: 20, 
                background: 'var(--bg-secondary, #f9fafb)', 
                borderRadius: 8,
                border: '1px solid var(--border-primary, #e5e7eb)',
                color: 'var(--text-primary, #1f2937)'
              }}>
                <h4 style={{ marginTop: 0 }}>Create Account</h4>
                <form onSubmit={handleRegister}>
                  <div style={{ marginBottom: 15 }}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={registerName}
                      onChange={e => setRegisterName(e.target.value)}
                      required
                      style={{ display: 'block', width: '100%', marginTop: 5 }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label>Email</label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={e => setRegisterEmail(e.target.value)}
                      required
                      style={{ display: 'block', width: '100%', marginTop: 5 }}
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label>Password (min 6 characters)</label>
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={e => setRegisterPassword(e.target.value)}
                      required
                      minLength={6}
                      style={{ display: 'block', width: '100%', marginTop: 5 }}
                    />
                  </div>
                  {registerError && (
                    <div style={{ color: 'var(--action-danger, #dc2626)', marginBottom: 15, fontSize: 14 }}>
                      {registerError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" style={getButtonStyle('success')}>Create Account</button>
                    <button type="button" onClick={() => setShowRegister(false)} style={getButtonStyle('neutral')}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ 
              padding: 15, 
              background: 'var(--bg-secondary, #f9fafb)', 
              borderRadius: 8,
              border: '1px solid var(--border-primary, #e5e7eb)',
              color: 'var(--text-primary, #1f2937)',
              marginBottom: 15
            }}>
              <strong>Logged in as:</strong> {firebaseUser.email}
              <button 
                onClick={handleLogout}
                style={getButtonStyle('neutral', false, { marginLeft: 15, fontSize: 12, padding: '4px 12px' })}
              >
                Logout
              </button>
            </div>

            {/* Sync Toggle */}
            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={syncEnabled}
                  onChange={handleToggleSync}
                  style={{ width: 20, height: 20 }}
                />
                <div>
                  <strong>Enable Auto-Sync</strong>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary, #4b5563)' }}>
                    Automatically sync data across all your devices in real-time
                  </div>
                </div>
              </label>
            </div>

            {/* Sync Status with last sync time and error details */}
            <div style={{ marginTop: 20 }}>
              <strong>Sync Status:</strong>{' '}
              <span style={getSyncStatusBadgeStyle(syncStatus)}>
                {syncStatus === 'synced' && '✅ Synced'}
                {syncStatus === 'syncing' && '🔄 Syncing...'}
                {syncStatus === 'error' && '❌ Error'}
                {syncStatus === 'offline' && '⏸️ Offline'}
              </span>
              {lastSyncTime && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary, #4b5563)', marginTop: 4 }}>
                  <span>Last sync: {lastSyncTime}</span>
                </div>
              )}
              {syncError && (
                <div style={{ fontSize: 12, color: 'var(--action-danger, #991b1b)', marginTop: 4 }}>
                  <span>Error: {syncError}</span>
                </div>
              )}
            </div>

            {/* Manual Sync Controls */}
            <div style={{ marginTop: 30 }}>
              <h3>Manual Sync</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary, #4b5563)' }}>
                Use these if you need to manually sync data between devices
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button 
                  onClick={handlePushAll} 
                    disabled={pushing || !firebaseUser}
                    style={getButtonStyle('success', !firebaseUser || pushing)}
                >
                  {pushing ? '⏳ Pushing...' : '⬆️ Push All to Cloud'}
                </button>
                <button 
                  onClick={handlePullAll} 
                    disabled={pulling || !firebaseUser}
                    style={getButtonStyle('info', !firebaseUser || pulling)}
                >
                  {pulling ? '⏳ Pulling...' : '⬇️ Pull All from Cloud'}
                </button>
                <button onClick={handleExport} style={getButtonStyle('primary')}>📤 Export Local Data</button>
                <label style={{ display: 'inline-block' }}>
                  <input type="file" accept="application/json" style={{ display: 'none' }} onChange={e => handleImport(e.target.files && e.target.files[0])} />
                  <button style={getButtonStyle('neutral')}>📥 Import Data</button>
                </label>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary, #4b5563)' }}>Pending queue: <strong>{pendingQueue}</strong></div>
                <button onClick={() => { if (window.__firestoreFlushQueue) { window.__firestoreFlushQueue(); setTimeout(() => { try { setPendingQueue(window.__firestoreQueueLength()) } catch(e){} }, 1000) } }} style={getButtonStyle('neutral')}>Flush Queue</button>
                <button onClick={() => { if (window.__firestoreClearQueue) { window.__firestoreClearQueue(); setPendingQueue(0) } }} style={getButtonStyle('softDanger')}>Clear Queue</button>
              </div>
              {/* Admin: Inspect queued ops */}
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: '8px 0' }}>Queued Operations</h4>
                {queueItems && queueItems.length ? (
                  <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid var(--border-primary, #e5e7eb)', padding: 8, borderRadius: 6, background: 'var(--bg-elevated, #ffffff)', color: 'var(--text-primary, #1f2937)' }}>
                    {queueItems.map((op, idx) => (
                      <div key={idx} style={{ borderBottom: '1px dashed var(--border-primary, #e5e7eb)', padding: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 13 }}><strong>{op.storeName}</strong> — {Array.isArray(op.items) ? op.items.length : 0} item(s)</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { try { alert(JSON.stringify(op, null, 2)) } catch(e){} }} style={getButtonStyle('neutral')}>Inspect</button>
                            <button
                              onClick={() => {
                                if (window.__firestoreClearOp) {
                                  window.__firestoreClearOp(idx);
                                  setTimeout(() => {
                                    setQueueItems(window.__firestoreQueueItems());
                                    setPendingQueue(window.__firestoreQueueLength());
                                  }, 250);
                                }
                              }}
                              style={getButtonStyle('softDanger')}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary, #4b5563)' }}>No queued operations</div>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary, #4b5563)', marginTop: 10 }}>
                <strong>Note:</strong> Push overwrites cloud data. Pull overwrites local data and reloads the app.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div style={{ 
        marginTop: 40, 
        padding: 20, 
        background: 'rgba(59, 130, 246, 0.12)', 
        borderRadius: 8,
        border: '1px solid rgba(59, 130, 246, 0.45)',
        color: 'var(--text-primary, #1f2937)'
      }}>
        <h3 style={{ marginTop: 0 }}>ℹ️ How Sync Works</h3>
        <ul style={{ lineHeight: 1.8, marginBottom: 0 }}>
          <li><strong>Real-time:</strong> Changes sync instantly across all logged-in devices</li>
          <li><strong>Offline-first:</strong> Works offline, syncs when back online</li>
          <li><strong>Secure:</strong> Data encrypted and only accessible to you</li>
          <li><strong>Free:</strong> 1GB storage on Firebase free tier (enough for years of farm data)</li>
          <li><strong>Private:</strong> No one else can access your data</li>
        </ul>
      </div>
    </section>
  )
}
