import React, { useState, useEffect } from 'react'

const SAMPLE_FORECAST = [
  { date: '2025-11-16', high: 68, low: 52, condition: 'Partly Cloudy', precipitation: 10, humidity: 65, wind: 8, icon: '⛅' },
  { date: '2025-11-17', high: 72, low: 55, condition: 'Sunny', precipitation: 0, humidity: 55, wind: 6, icon: '☀️' },
  { date: '2025-11-18', high: 65, low: 48, condition: 'Rainy', precipitation: 80, humidity: 85, wind: 12, icon: '🌧️' },
  { date: '2025-11-19', high: 58, low: 45, condition: 'Cloudy', precipitation: 30, humidity: 70, wind: 10, icon: '☁️' },
  { date: '2025-11-20', high: 62, low: 50, condition: 'Partly Cloudy', precipitation: 20, humidity: 60, wind: 7, icon: '⛅' },
  { date: '2025-11-21', high: 70, low: 54, condition: 'Sunny', precipitation: 5, humidity: 50, wind: 5, icon: '☀️' },
  { date: '2025-11-22', high: 74, low: 58, condition: 'Sunny', precipitation: 0, humidity: 45, wind: 4, icon: '☀️' }
]

const SAMPLE_HISTORY = [
  { date: '2025-11-01', high: 65, low: 48, rainfall: 0, avgTemp: 56.5, growingDegreeDays: 6.5 },
  { date: '2025-11-02', high: 70, low: 52, rainfall: 0, avgTemp: 61, growingDegreeDays: 11 },
  { date: '2025-11-03', high: 68, low: 50, rainfall: 0.25, avgTemp: 59, growingDegreeDays: 9 },
  { date: '2025-11-04', high: 72, low: 54, rainfall: 0, avgTemp: 63, growingDegreeDays: 13 },
  { date: '2025-11-05', high: 66, low: 49, rainfall: 0.8, avgTemp: 57.5, growingDegreeDays: 7.5 },
  { date: '2025-11-06', high: 58, low: 45, rainfall: 1.2, avgTemp: 51.5, growingDegreeDays: 1.5 },
  { date: '2025-11-07', high: 62, low: 47, rainfall: 0.5, avgTemp: 54.5, growingDegreeDays: 4.5 },
  { date: '2025-11-08', high: 67, low: 50, rainfall: 0, avgTemp: 58.5, growingDegreeDays: 8.5 },
  { date: '2025-11-09', high: 71, low: 53, rainfall: 0, avgTemp: 62, growingDegreeDays: 12 },
  { date: '2025-11-10', high: 69, low: 52, rainfall: 0.1, avgTemp: 60.5, growingDegreeDays: 10.5 },
  { date: '2025-11-11', high: 64, low: 48, rainfall: 0.4, avgTemp: 56, growingDegreeDays: 6 },
  { date: '2025-11-12', high: 68, low: 51, rainfall: 0, avgTemp: 59.5, growingDegreeDays: 9.5 },
  { date: '2025-11-13', high: 70, low: 53, rainfall: 0, avgTemp: 61.5, growingDegreeDays: 11.5 },
  { date: '2025-11-14', high: 66, low: 50, rainfall: 0.2, avgTemp: 58, growingDegreeDays: 8 },
  { date: '2025-11-15', high: 67, low: 51, rainfall: 0, avgTemp: 59, growingDegreeDays: 9 }
]

const ALERTS = [
  { id: 1, type: 'Rain', severity: 'moderate', message: 'Heavy rainfall expected Wednesday - delay field operations', date: '2025-11-18', icon: '🌧️' },
  { id: 2, type: 'Frost', severity: 'low', message: 'Overnight temperatures may drop to 42°F Thursday', date: '2025-11-19', icon: '❄️' }
]

export default function Weather(){
  const [forecast] = useState(SAMPLE_FORECAST)
  const [history] = useState(SAMPLE_HISTORY)
  const [alerts] = useState(ALERTS)
  const [view, setView] = useState('forecast')
  
  const totalRainfall = history.reduce((sum, day) => sum + (day.rainfall || 0), 0)
  const avgTemp = history.reduce((sum, day) => sum + (day.avgTemp || 0), 0) / history.length
  const totalGDD = history.reduce((sum, day) => sum + (day.growingDegreeDays || 0), 0)

  return (
    <div>
      <div className="health-header">
        <div>
          <h2>🌤️ Weather & Climate</h2>
          <p className="muted">Monitor weather conditions and plan farm activities</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={view === 'forecast' ? 'tab-btn active' : 'tab-btn'} onClick={() => setView('forecast')}>
            7-Day Forecast
          </button>
          <button className={view === 'history' ? 'tab-btn active' : 'tab-btn'} onClick={() => setView('history')}>
            Historical Data
          </button>
          <button className={view === 'analytics' ? 'tab-btn active' : 'tab-btn'} onClick={() => setView('analytics')}>
            Analytics
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          {alerts.map(alert => (
            <div key={alert.id} className="card" style={{ 
              padding: '16px', 
              background: alert.severity === 'high' ? '#fee2e2' : alert.severity === 'moderate' ? '#fef3c7' : '#e0f2fe',
              borderLeft: `4px solid ${alert.severity === 'high' ? '#dc2626' : alert.severity === 'moderate' ? '#f59e0b' : '#3b82f6'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>{alert.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{alert.type} Alert</div>
                  <div>{alert.message}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                    Expected: {new Date(alert.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'forecast' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          {forecast.map((day, index) => (
            <div key={day.date} className="card" style={{ 
              padding: '20px', 
              textAlign: 'center',
              background: index === 0 ? 'var(--green)' : '#fff',
              color: index === 0 ? '#fff' : '#000'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: index === 0 ? 0.9 : 0.7 }}>
                {index === 0 ? 'TODAY' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </div>
              <div style={{ fontSize: '48px', margin: '12px 0' }}>{day.icon}</div>
              <div style={{ fontSize: '14px', marginBottom: '12px', fontWeight: '500' }}>{day.condition}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                <span>{day.high}°</span>
                <span style={{ opacity: 0.6 }}>/</span>
                <span style={{ opacity: 0.7 }}>{day.low}°</span>
              </div>
              <div style={{ marginTop: '12px', fontSize: '13px', opacity: index === 0 ? 0.9 : 0.7 }}>
                <div>💧 {day.precipitation}%</div>
                <div>💨 {day.wind} mph</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'history' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '16px', background: '#eff6ff' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Avg Temperature (15 days)</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{avgTemp.toFixed(1)}°F</div>
            </div>
            <div className="card" style={{ padding: '16px', background: '#e0f2fe' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Rainfall</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0ea5e9' }}>{totalRainfall.toFixed(2)}"</div>
            </div>
            <div className="card" style={{ padding: '16px', background: '#fef3c7' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Growing Degree Days</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{totalGDD.toFixed(0)}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3>Historical Weather Data (Last 15 Days)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--green)' }}>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Date</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>High</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Low</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Avg</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Rainfall</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>GDD</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(day => (
                    <tr key={day.date} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px' }}>{new Date(day.date).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'center', padding: '12px', color: '#dc2626', fontWeight: '600' }}>{day.high}°F</td>
                      <td style={{ textAlign: 'center', padding: '12px', color: '#2563eb', fontWeight: '600' }}>{day.low}°F</td>
                      <td style={{ textAlign: 'center', padding: '12px' }}>{day.avgTemp}°F</td>
                      <td style={{ textAlign: 'center', padding: '12px', color: '#0ea5e9', fontWeight: '600' }}>
                        {day.rainfall > 0 ? `${day.rainfall}"` : '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px', color: '#f59e0b', fontWeight: '600' }}>{day.growingDegreeDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'analytics' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3>Climate Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Temperature Range</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {Math.min(...history.map(d => d.low))}°F - {Math.max(...history.map(d => d.high))}°F
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Last 15 days</div>
              </div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Rainy Days</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {history.filter(d => d.rainfall > 0).length} / {history.length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  ({((history.filter(d => d.rainfall > 0).length / history.length) * 100).toFixed(0)}%)
                </div>
              </div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Avg Daily GDD</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {(totalGDD / history.length).toFixed(1)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Growing degree days</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3>Farm Activity Recommendations</h3>
            <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #059669' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>✅ Excellent Conditions for Field Work</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Monday, Tuesday: Low precipitation, moderate temperatures ideal for planting, harvesting, or maintenance
                </div>
              </div>
              <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ Delay Outdoor Operations</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Wednesday: Heavy rain expected (80% chance) - avoid field operations, plan indoor maintenance
                </div>
              </div>
              <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🌱 Good Growing Conditions</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Average {(totalGDD / history.length).toFixed(1)} GDD/day - excellent for crop development and pasture growth
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3>Seasonal Trends</h3>
            <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#374151' }}>
              <p><strong>Temperature:</strong> Current average of {avgTemp.toFixed(1)}°F is within normal range for mid-November. Expect gradual cooling as winter approaches.</p>
              <p><strong>Precipitation:</strong> Total of {totalRainfall.toFixed(2)}" over 15 days provides adequate moisture for pastures and winter crops.</p>
              <p><strong>Growing Season:</strong> Accumulated {totalGDD.toFixed(0)} growing degree days suggest good conditions for cool-season forages and winter cover crops.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
