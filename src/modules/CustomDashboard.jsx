import React, { useState, useEffect } from 'react'
import { loadData } from '../lib/storage'
import { LineChart, BarChart, PieChart } from '../components/Charts'

// Dashboard stores pinned report configs in localStorage
const DASHBOARD_KEY = 'cattalytics:dashboard:pins'

export default function CustomDashboard() {
  const [pins, setPins] = useState([])
  const [data, setData] = useState({})
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(DASHBOARD_KEY) || '[]')
    setPins(saved)
    // Load data for each pin
    const allData = {}
    saved.forEach(pin => {
      if (pin.dataSource) {
        allData[pin.id] = loadData(pin.dataSource, [])
      }
    })
    setData(allData)
    // Detect mobile
    const checkMobile = () => setIsMobile(window.innerWidth <= 700)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (pins.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>
        <h2>📊 Custom Dashboard</h2>
        <p>No pinned reports or charts yet.<br/>Pin your favorite reports from the report builder!</p>
      </div>
    )
  }

  // Mobile widget: show quick stats for all pins
  const mobileStats = isMobile && pins.length > 0 ? (
    <div style={{
      background: 'linear-gradient(90deg,#f9fafb 60%,#e0e7ff 100%)',
      borderRadius: 10,
      padding: 14,
      marginBottom: 18,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 16,
      justifyContent: 'center',
      boxShadow: '0 2px 8px #0001'
    }}>
      {pins.map(pin => (
        <div key={pin.id} style={{ minWidth: 100, textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#6366f1' }}>{pin.name}</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111' }}>
            {data[pin.id] && data[pin.id].length ? data[pin.id].length : 0}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>records</div>
        </div>
      ))}
    </div>
  ) : null

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 24 }}>📊 Custom Dashboard</h2>
      {mobileStats}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {pins.map(pin => (
          <div key={pin.id} style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px #0001', padding: 18, minWidth: 280, maxWidth: 400, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{pin.name}</div>
            {/* Show chart if chartType is set */}
            {pin.chartType && data[pin.id] && data[pin.id].length > 0 ? (
              pin.chartType === 'line' ? <LineChart data={data[pin.id]} title={pin.name} /> :
              pin.chartType === 'bar' ? <BarChart data={data[pin.id]} title={pin.name} /> :
              pin.chartType === 'pie' ? <PieChart data={data[pin.id]} title={pin.name} /> : null
            ) : (
              <div style={{ color: '#888', fontSize: 13 }}>No chart data</div>
            )}
            {/* Show summary if available */}
            {pin.summary && <div style={{ marginTop: 10, color: '#6366f1', fontSize: 13 }}>{pin.summary}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
