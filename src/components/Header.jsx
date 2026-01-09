import React from 'react'

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
