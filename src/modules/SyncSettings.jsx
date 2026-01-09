import React, { useState, useEffect, useRef } from 'react'
import { isFirebaseConfigured } from '../lib/firebase'
import { isFirebaseAuthAvailable, loginWithFirebase, registerWithFirebase, logoutFromFirebase, getCurrentFirebaseUser } from '../lib/firebaseAuth'
import { 
  isSyncEnabled, 
  setSyncEnabled, 
  pushAllToFirebase, 
  pullAllFromFirebase,
  getSyncStatus,
  initSync
} from '../lib/sync'

export default function SyncSettings() {
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

  useEffect(() => {
    setConfigured(isFirebaseConfigured())
    setSyncEnabledState(isSyncEnabled())
    setSyncStatus(getSyncStatus())
    // Get last sync time from localStorage
    setLastSyncTime(localStorage.getItem('devinsfarm:lastSyncTime'))
    setSyncError(localStorage.getItem('devinsfarm:lastSyncError') || '')
    setFirebaseUser(getCurrentFirebaseUser())
    
    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(getSyncStatus())
      setLastSyncTime(localStorage.getItem('devinsfarm:lastSyncTime'))
      setSyncError(localStorage.getItem('devinsfarm:lastSyncError') || '')
      try {
        if (window.__firestoreQueueLength) setPendingQueue(Number(window.__firestoreQueueLength() || 0))
        if (window.__firestoreQueueItems) setQueueItems(Array.from(window.__firestoreQueueItems()))
      } catch (e) {}
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    
    const result = await loginWithFirebase(loginEmail, loginPassword)
    if (result.success) {
      setFirebaseUser(getCurrentFirebaseUser())
      setShowLogin(false)
      initSync()
      alert('✅ Logged in successfully! You can now enable sync.')
    } else {
      setLoginError(result.error)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setRegisterError('')
    
    const result = await registerWithFirebase(registerEmail, registerPassword, registerName)
    if (result.success) {
      setFirebaseUser(getCurrentFirebaseUser())
      setShowRegister(false)
      initSync()
      alert('✅ Account created successfully! You can now enable sync.')
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
    setSyncError('')
    try {
      const result = await pushAllToFirebase()
      setPushing(false)
      const now = new Date().toLocaleString()
      localStorage.setItem('devinsfarm:lastSyncTime', now)
      localStorage.removeItem('devinsfarm:lastSyncError')
      setLastSyncTime(now)
      setSyncError('')
      alert(`✅ Success! Pushed ${result.count} collections (${result.itemCount} items) to cloud.`)
    } catch (error) {
      setPushing(false)
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
    setSyncError('')
    try {
      const result = await pullAllFromFirebase()
      setPulling(false)
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

  if (!configured) {
    return (
      <section>
        <h2>🔄 Cloud Sync Settings</h2>
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
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
        background: '#d1fae5', 
        border: '1px solid #10b981', 
        padding: 15, 
        borderRadius: 8,
        marginTop: 20 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <div>
            <strong>Firebase Configured</strong>
            <div style={{ fontSize: 13, color: '#065f46' }}>
              Cloud sync is available
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Section */}
      <div style={{ marginTop: 30 }}>
        <h3>🔐 Authentication</h3>
        {!firebaseUser ? (
          <div>
            <p>You must be logged in to enable sync.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLogin(true)}>Login</button>
              <button onClick={() => setShowRegister(true)}>Create Account</button>
            </div>

            {/* Login Form */}
            {showLogin && (
              <div style={{ 
                marginTop: 20, 
                padding: 20, 
                background: '#f9fafb', 
                borderRadius: 8,
                border: '1px solid #e5e7eb'
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
                    <div style={{ color: '#dc2626', marginBottom: 15, fontSize: 14 }}>
                      {loginError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit">Login</button>
                    <button type="button" onClick={() => setShowLogin(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Register Form */}
            {showRegister && (
              <div style={{ 
                marginTop: 20, 
                padding: 20, 
                background: '#f9fafb', 
                borderRadius: 8,
                border: '1px solid #e5e7eb'
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
                    <div style={{ color: '#dc2626', marginBottom: 15, fontSize: 14 }}>
                      {registerError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit">Create Account</button>
                    <button type="button" onClick={() => setShowRegister(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ 
              padding: 15, 
              background: '#f9fafb', 
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              marginBottom: 15
            }}>
              <strong>Logged in as:</strong> {firebaseUser.email}
              <button 
                onClick={handleLogout}
                style={{ marginLeft: 15, fontSize: 12, padding: '4px 12px' }}
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
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    Automatically sync data across all your devices in real-time
                  </div>
                </div>
              </label>
            </div>

            {/* Sync Status with last sync time and error details */}
            <div style={{ marginTop: 20 }}>
              <strong>Sync Status:</strong>{' '}
              <span style={{
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                background: 
                  syncStatus === 'synced' ? '#d1fae5' :
                  syncStatus === 'syncing' ? '#fed7aa' :
                  syncStatus === 'error' ? '#fee2e2' :
                  '#e5e7eb',
                color:
                  syncStatus === 'synced' ? '#065f46' :
                  syncStatus === 'syncing' ? '#92400e' :
                  syncStatus === 'error' ? '#991b1b' :
                  '#374151'
              }}>
                {syncStatus === 'synced' && '✅ Synced'}
                {syncStatus === 'syncing' && '🔄 Syncing...'}
                {syncStatus === 'error' && '❌ Error'}
                {syncStatus === 'offline' && '⏸️ Offline'}
              </span>
              {lastSyncTime && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  <span>Last sync: {lastSyncTime}</span>
                </div>
              )}
              {syncError && (
                <div style={{ fontSize: 12, color: '#991b1b', marginTop: 4 }}>
                  <span>Error: {syncError}</span>
                </div>
              )}
            </div>

            {/* Manual Sync Controls */}
            <div style={{ marginTop: 30 }}>
              <h3>Manual Sync</h3>
              <p style={{ fontSize: 14, color: '#6b7280' }}>
                Use these if you need to manually sync data between devices
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button 
                  onClick={handlePushAll} 
                  disabled={pushing || !syncEnabled}
                  style={{ opacity: (!syncEnabled || pushing) ? 0.5 : 1 }}
                >
                  {pushing ? '⏳ Pushing...' : '⬆️ Push All to Cloud'}
                </button>
                <button 
                  onClick={handlePullAll} 
                  disabled={pulling || !syncEnabled}
                  style={{ opacity: (!syncEnabled || pulling) ? 0.5 : 1 }}
                >
                  {pulling ? '⏳ Pulling...' : '⬇️ Pull All from Cloud'}
                </button>
                <button onClick={handleExport}>📤 Export Local Data</button>
                <label style={{ display: 'inline-block' }}>
                  <input type="file" accept="application/json" style={{ display: 'none' }} onChange={e => handleImport(e.target.files && e.target.files[0])} />
                  <button>📥 Import Data</button>
                </label>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Pending queue: <strong>{pendingQueue}</strong></div>
                <button onClick={() => { if (window.__firestoreFlushQueue) { window.__firestoreFlushQueue(); setTimeout(() => { try { setPendingQueue(window.__firestoreQueueLength()) } catch(e){} }, 1000) } }}>Flush Queue</button>
                <button onClick={() => { if (window.__firestoreClearQueue) { window.__firestoreClearQueue(); setPendingQueue(0) } }} style={{ background: '#fee2e2' }}>Clear Queue</button>
              </div>
              {/* Admin: Inspect queued ops */}
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: '8px 0' }}>Queued Operations</h4>
                {queueItems && queueItems.length ? (
                  <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid #e5e7eb', padding: 8, borderRadius: 6 }}>
                    {queueItems.map((op, idx) => (
                      <div key={idx} style={{ borderBottom: '1px dashed #e5e7eb', padding: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 13 }}><strong>{op.storeName}</strong> — {Array.isArray(op.items) ? op.items.length : 0} item(s)</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { try { alert(JSON.stringify(op, null, 2)) } catch(e){} }}>Inspect</button>
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
                              style={{ background: '#fee2e2' }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#6b7280' }}>No queued operations</div>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>
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
        background: '#eff6ff', 
        borderRadius: 8,
        border: '1px solid #3b82f6'
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
