import React, { useState } from 'react'
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

  return (
    <div className="app">
      <header>
        <h1>Cattalytics</h1>
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
            <p>Brand: Cattalytics</p>
            <button onClick={()=>{ if(confirm('Clear local demo data?')){ localStorage.clear(); location.reload() }}}>Clear demo data</button>
          </section>
        )}
      </main>

      <footer>
        <small>© Cattalytics — Dairy & Farm Management</small>
      </footer>
    </div>
  )
}
