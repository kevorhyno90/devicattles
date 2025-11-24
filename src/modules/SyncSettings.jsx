import React, { useState, useEffect } from 'react'
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

  useEffect(() => {
    setConfigured(isFirebaseConfigured())
    setSyncEnabledState(isSyncEnabled())
    setSyncStatus(getSyncStatus())
    setFirebaseUser(getCurrentFirebaseUser())
    
    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(getSyncStatus())
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

  async function handlePushAll() {
    if (!confirm('Push all local data to Firebase? This will overwrite cloud data.')) return
    
    setPushing(true)
    try {
      const result = await pushAllToFirebase()
      setPushing(false)
      alert(`✅ Success! Pushed ${result.count} collections (${result.itemCount} items) to cloud.`)
    } catch (error) {
      setPushing(false)
      alert(`❌ Push failed: ${error.message}`)
    }
  }

  async function handlePullAll() {
    if (!confirm('Pull all data from Firebase? This will overwrite local data.')) return
    
    setPulling(true)
    try {
      const result = await pullAllFromFirebase()
      setPulling(false)
      alert(`✅ Success! Pulled ${result.count} collections from cloud. Refresh the page to see changes.`)
      // Give user option to refresh
      if (confirm('Refresh page now to see the updated data?')) {
        window.location.reload()
      }
    } catch (error) {
      setPulling(false)
      alert(`❌ Pull failed: ${error.message}`)
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

            {/* Sync Status */}
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
