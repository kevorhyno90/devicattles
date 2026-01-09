import React, { useState, useEffect } from 'react'

export default function Header({
  settings,
  setSettings,
  showInstallPrompt,
  handleInstallClick,
  editMode,
  setEditMode,
  unreadNotifications,
  setView,
  handleLogout,
  getCurrentUserName,
  getCurrentUserRole
}) {
  const [queueCount, setQueueCount] = useState(0)
  const [queueProcessing, setQueueProcessing] = useState(false)
  const [persistenceMode, setPersistenceMode] = useState(typeof window !== 'undefined' ? window.__firestorePersistenceMode || 'unknown' : 'unknown')

  useEffect(() => {
    let mounted = true
    const update = () => {
      try {
        if (window.__firestoreQueueLength) setQueueCount(Number(window.__firestoreQueueLength() || 0))
        if (window.__firestoreQueueProcessing) setQueueProcessing(Boolean(window.__firestoreQueueProcessing()))
        else if (window.__firestoreQueueLength && window.__firestoreFlushQueue) setQueueProcessing(false)
        try { setPersistenceMode(window.__firestorePersistenceMode || 'unknown') } catch (e) {}
      } catch (e) {}
    }
    update()
    const iv = setInterval(update, 2000)
    return () => { mounted = false; clearInterval(iv) }
  }, [])
  return (
    <header style={{
      background: 'var(--header-bg, transparent)',
      borderBottom: `2px solid var(--border-primary, #e5e7eb)`,
      boxShadow: 'var(--shadow-md, none)'
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
            letterSpacing:'0.5px'
          }}>JR FARM</h2>
          <p style={{ margin:0, fontSize:'0.75rem' }}>Comprehensive Farm Management</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showInstallPrompt && (
          <button
            onClick={handleInstallClick}
            style={{ padding: '6px 12px', background: '#10b981', border: 'none', color: 'white', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            title="Install app on your device"
          >
            📥 Install App
          </button>
        )}
        <label title="Toggle edit mode" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: 6 }}>
          <input type="checkbox" checked={editMode} onChange={e=>setEditMode(e.target.checked)} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{editMode ? 'Edit Mode: ON' : 'Edit Mode: OFF'}</span>
        </label>
        {unreadNotifications > 0 && (
          <div 
            onClick={() => setView('notifications')}
            style={{ position: 'relative', cursor: 'pointer', padding: '6px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}
            title="View notifications"
          >
            🔔
            <span style={{ background: '#ef4444', color: 'white', borderRadius: 10, padding: '2px 6px', fontSize: 11, fontWeight: '600' }}>{unreadNotifications}</span>
          </div>
        )}
        {/* Queue badge */}
        <div title="Sync queue" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {queueProcessing ? <span style={{ fontSize: 14 }}>⏳</span> : null}
          <div style={{ background: queueCount ? '#f59e0b' : 'rgba(255,255,255,0.12)', color: 'white', borderRadius: 10, padding: '4px 8px', fontSize: 12 }}>
            Q:{queueCount}
          </div>
        </div>
        <div title={`Firestore persistence: ${persistenceMode}`} style={{ marginLeft: 8 }}>
          <div style={{ background: persistenceMode && persistenceMode.startsWith('indexeddb') ? '#06b6d4' : '#6b7280', color: 'white', borderRadius: 8, padding: '3px 8px', fontSize: 11 }}>
            {persistenceMode}
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', textAlign: 'right' }}>
          <div style={{ fontWeight: 600 }}>{getCurrentUserName()}</div>
          <div style={{ fontSize: 11 }}>{getCurrentUserRole()}</div>
        </div>
        <button 
          onClick={handleLogout}
          style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
        >
          Logout
        </button>
      </div>
    </header>
  )
}
