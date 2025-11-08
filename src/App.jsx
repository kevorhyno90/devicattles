import React, { useState } from 'react'
import Animals from './modules/AnimalsClean'
import Pastures from './modules/Pastures'
import Finance from './modules/Finance'

export default function App() {
  const [view, setView] = useState('dashboard')

  return (
    <div className="app">
      <header>
        <h1>Cattalytics</h1>
        <nav>
          <button className={view==='dashboard'? 'active':''} onClick={()=>setView('dashboard')}>Dashboard</button>
          <button className={view==='animals'? 'active':''} onClick={()=>setView('animals')}>Animals</button>
          <button className={view==='pastures'? 'active':''} onClick={()=>setView('pastures')}>Pastures</button>
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

        {view === 'pastures' && (
          <Pastures />
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
