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
  const defaultSettings = { backgroundOn: true, background: 'bg-farm.svg', logo: 'logo-badge.svg', uploadedLogo: '' }
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(()=>{
    try{
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
      if(s) setSettings(prev=> ({ ...prev, ...s }))
    }catch(e){}
  }, [])

  useEffect(()=>{ try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }catch(e){} }, [settings])

  return (
    <div className={`app ${settings.backgroundOn? 'bg-on' : ''}`} style={ settings.backgroundOn && settings.background ? { backgroundImage: `url('/assets/${settings.background}')` } : {} }>
      <header>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {settings.logo ? (
            <img
              src={ settings.logo === 'uploaded' && settings.uploadedLogo ? settings.uploadedLogo : `/assets/${settings.logo}` }
              className="logo"
              alt="Devins Farm logo"
              style={{ height:36 }}
              onError={()=> setSettings(s=> ({ ...s, logo: '' }))}
            />
          ) : null}
          {/* show textual title only when no logo is selected or logo failed to load */}
          {!settings.logo ? <h1>Devins Farm</h1> : null}
        </div>
        <nav>
          <button className={view==='dashboard'? 'active':''} onClick={()=>setView('dashboard')}>Dashboard</button>
          <button className={view==='animals'? 'active':''} onClick={()=>setView('animals')}>Animals</button>
          <button className={view==='tasks'? 'active':''} onClick={()=>setView('tasks')}>Tasks</button>
          <button className={view==='schedules'? 'active':''} onClick={()=>setView('schedules')}>Schedules</button>
          <button className={view==='crops'? 'active':''} onClick={()=>setView('crops')}>Crops</button>
          <button className={view==='resources'? 'active':''} onClick={()=>setView('resources')}>Resources</button>
          <button className={view==='farmmap'? 'active':''} onClick={()=>setView('farmmap')}>Farm Map</button>
          <button className={view==='reports'? 'active':''} onClick={()=>setView('reports')}>Reports</button>
          <button className={view==='finance'? 'active':''} onClick={()=>setView('finance')}>Finance</button>
          <button className={view==='settings'? 'active':''} onClick={()=>setView('settings')}>Settings</button>
        </nav>
      </header>

      <main>
        {view === 'dashboard' && (
          <section>
            <h2>Overview</h2>
            <p>Animals, pastures and finance modules are editable. Use the navigation to manage your data.</p>
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
            <h2>Settings</h2>
            <div style={{ display:'grid', gap:10, maxWidth:640 }}>
              <label>
                <input type="checkbox" checked={settings.backgroundOn} onChange={e=>setSettings(s=> ({ ...s, backgroundOn: e.target.checked }))} /> Enable background
              </label>

              <label>
                Background
                <select value={settings.background} onChange={e=>setSettings(s=> ({ ...s, background: e.target.value }))}>
                  <option value="">None</option>
                  <option value="bg-farm.svg">Farm (default)</option>
                  <option value="bg-fields.svg">Fields</option>
                </select>
              </label>

              <label>
                Logo
                <select value={settings.logo} onChange={e=>setSettings(s=> ({ ...s, logo: e.target.value }))}>
                  <option value="logo-wordmark.svg">Wordmark</option>
                  <option value="logo-badge.svg">Badge</option>
                  <option value="logo-icon.svg">Icon</option>
                  <option value="uploaded">Uploaded SVG</option>
                </select>
              </label>

              <label>
                Upload SVG logo (optional)
                <input type="file" accept="image/svg+xml" onChange={e=>{
                  const f = e.target.files && e.target.files[0]
                  if(!f) return
                  const reader = new FileReader()
                  reader.onload = ev => { const data = ev.target.result; setSettings(s=> ({ ...s, uploadedLogo: data, logo: 'uploaded' })) }
                  reader.readAsDataURL(f)
                }} />
              </label>

              <div>
                <button onClick={()=>{ if(confirm('Clear local demo data?')){ localStorage.clear(); location.reload() }}}>Clear demo data</button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer>
        <small>© Devins Farm — Dairy & Farm Management</small>
      </footer>
    </div>
  )
}
