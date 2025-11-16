import React, { useState, useEffect } from 'react'
import Animals from './modules/Animals'
import Tasks from './modules/Tasks'
import Finance from './modules/Finance'
import Schedules from './modules/Schedules'
import Crops from './modules/Crops'
import Resources from './modules/Resources'
import FarmMap from './modules/FarmMap'
import Reports from './modules/Reports'

export default function App() {
  const [view, setView] = useState('dashboard')

  // UI branding/settings persisted in localStorage
  const SETTINGS_KEY = 'devinsfarm:ui:settings'
  // prefer a compact badge by default so header shows a clear logo
  const defaultSettings = { backgroundOn: false, background: 'bg-farm.svg', logo: 'logo-badge.svg', uploadedLogo: '', theme: 'catalytics' }
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(()=>{
    try{
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
      if(s) setSettings(prev=> ({ ...prev, ...s }))
    }catch(e){}
  }, [])

  useEffect(()=>{ try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }catch(e){} }, [settings])

  return (
    <div className={`app ${settings.backgroundOn? 'bg-on' : ''} theme-${settings.theme || 'bold'}`} style={ settings.backgroundOn && settings.background ? { backgroundImage: `url('/assets/${settings.background}')` } : {} }>
      <header>
        <div style={{ display:'flex', alignItems:'center', gap:12 }} className="brand">
          <div className="logo-wrap" aria-hidden>
            <img
              src={ settings.logo === 'uploaded' && settings.uploadedLogo ? settings.uploadedLogo : `/assets/${settings.logo}` }
              className="logo"
              alt="Devins Farm - Comprehensive Farm Management"
              onError={()=> setSettings(s=> ({ ...s, logo: '' }))}
            />
          </div>
          <div>
            <div className="brand-wordmark">Devins Farm</div>
            <div className="brand-tag">Comprehensive Farm Management</div>
          </div>
        </div>
        <nav>
          <button className={view==='dashboard'? 'active':''} onClick={()=>setView('dashboard')}>Dashboard</button>
          <button className={view==='animals'? 'active':''} onClick={()=>setView('animals')}>Livestock</button>
          <button className={view==='crops'? 'active':''} onClick={()=>setView('crops')}>Crops</button>
          <button className={view==='tasks'? 'active':''} onClick={()=>setView('tasks')}>Tasks</button>
          <button className={view==='schedules'? 'active':''} onClick={()=>setView('schedules')}>Schedules</button>
          <button className={view==='resources'? 'active':''} onClick={()=>setView('resources')}>Resources</button>
          <button className={view==='finance'? 'active':''} onClick={()=>setView('finance')}>Finance</button>
          <button className={view==='farmmap'? 'active':''} onClick={()=>setView('farmmap')}>Farm Map</button>
          <button className={view==='reports'? 'active':''} onClick={()=>setView('reports')}>Reports</button>
          <button className={view==='settings'? 'active':''} onClick={()=>setView('settings')}>Settings</button>
        </nav>
      </header>

      <main>
        {view === 'dashboard' && (
          <section>
            <h2>Farm Overview</h2>
            <p>Welcome to your comprehensive farm management system. Manage livestock, crops, finances, tasks, and operations all in one place. Use the navigation to access different modules and manage your farm data efficiently.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '24px' }}>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--green)' }}>🐄 Livestock</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>Animal breeding, health tracking, feeding schedules, and milk yield monitoring</p>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--green)' }}>🌾 Crops</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>Crop planning, treatment tracking, yield recording, and field management</p>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--green)' }}>💰 Finance</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>Income tracking, expense management, profit analysis, and financial reporting</p>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--green)' }}>✅ Tasks</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>Daily operations, scheduled activities, staff assignments, and progress tracking</p>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--green)' }}>🗺️ Resources</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>Equipment management, facility tracking, and resource allocation</p>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--green)' }}>📊 Reports</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>Performance analytics, productivity reports, and operational insights</p>
              </div>
            </div>
          </section>
        )}

        {view === 'animals' && (
          <Animals />
        )}

        {view === 'tasks' && (
          <Tasks />
        )}

        {view === 'schedules' && (
          <Schedules />
        )}

        {view === 'crops' && (
          <Crops />
        )}

        {view === 'resources' && (
          <Resources />
        )}

        {view === 'farmmap' && (
          <FarmMap />
        )}

        {view === 'reports' && (
          <Reports />
        )}

        {view === 'finance' && (
          <Finance />
        )}

        {view === 'settings' && (
          <section>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>Settings</h2>
              <p style={{ color: 'var(--muted)', margin: 0 }}>Customize your application appearance and preferences</p>
            </div>
            
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
          </section>
        )}
      </main>

      <footer>
        <small>© Devins Farm — Comprehensive Farm Management System</small>
      </footer>
    </div>
  )
}
