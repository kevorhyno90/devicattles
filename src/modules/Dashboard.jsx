import React, { useState, useEffect } from 'react'
import {
  getDashboardData,
  getAnimalsByType,
  getFinancialSummary,
  getUpcomingTasks,
  getHealthAlerts,
  getInventoryAlerts,
  getFeedCostTrends
} from '../lib/analytics'

export default function Dashboard({ onNavigate }) {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadDashboard()
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboard, 60000) // Refresh every minute
      return () => clearInterval(interval)
    }
  }, [period, autoRefresh])

  const loadDashboard = () => {
    setLoading(true)
    try {
      const data = getDashboardData()
      setDashboardData(data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
    setLoading(false)
  }

  if (loading || !dashboardData) {
    return <div className="loading">Loading dashboard...</div>
  }

  const { animals, breeding, health, tasks, finance, feedCosts, inventory, milkProduction } = dashboardData

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 Farm Dashboard</h1>
        <div className="dashboard-controls">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button onClick={loadDashboard} className="btn-secondary">🔄 Refresh</button>
        </div>
      </div>

      {/* PWA Install Banner */}
      {typeof window !== 'undefined' && window.installPWA && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
              📱 Install Devins Farm App
            </div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              Access the farm management system offline from your home screen
            </div>
          </div>
          <button
            onClick={async () => {
              const installed = await window.installPWA?.()
              if (installed) loadDashboard()
            }}
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            Install Now
          </button>
        </div>
      )}

      {/* Service Worker Status */}
      {typeof window !== 'undefined' && 'serviceWorker' in navigator && (
        <div style={{
          background: navigator.serviceWorker.controller ? '#ecfdf5' : '#fef3c7',
          color: navigator.serviceWorker.controller ? '#065f46' : '#92400e',
          padding: '8px 12px',
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {navigator.serviceWorker.controller ? '✅' : '⚠️'}
          {navigator.serviceWorker.controller 
            ? 'App is ready to work offline' 
            : 'Offline mode not available - refresh page to activate'}
        </div>
      )}

      {/* Alert Bar */}
      {(tasks.overdue > 0 || health.totalAlerts > 0 || inventory.criticalStock > 0) && (
        <div className="alert-bar urgent">
          <strong>⚠️ Attention Required:</strong>
          {tasks.overdue > 0 && <span> {tasks.overdue} overdue task(s)</span>}
          {health.totalAlerts > 0 && <span> • {health.totalAlerts} health alert(s)</span>}
          {inventory.criticalStock > 0 && <span> • {inventory.criticalStock} critical inventory item(s)</span>}
        </div>
      )}

      {/* KPI Cards Row 1 */}
      <div className="kpi-grid">
        {/* Animals Overview */}
        <div className="kpi-card" onClick={() => onNavigate && onNavigate('animals')}>
          <div className="kpi-icon">🐄</div>
          <div className="kpi-content">
            <h3>Total Animals</h3>
            <div className="kpi-value">{animals.total}</div>
            <div className="kpi-details">
              {Object.entries(animals.byType).map(([type, count]) => (
                <div key={type} className="kpi-detail-item">
                  <span>{type}:</span> <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks Overview */}
        <div className="kpi-card" onClick={() => onNavigate && onNavigate('tasks')}>
          <div className="kpi-icon">✅</div>
          <div className="kpi-content">
            <h3>Tasks</h3>
            <div className="kpi-value">{tasks.inProgress + tasks.pending}</div>
            <div className="kpi-subtitle">Active</div>
            <div className="kpi-details">
              <div className="kpi-detail-item">
                <span>Due Today:</span> <strong className={tasks.dueToday > 0 ? 'text-warning' : ''}>{tasks.dueToday}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>This Week:</span> <strong>{tasks.dueThisWeek}</strong>
              </div>
              {tasks.overdue > 0 && (
                <div className="kpi-detail-item text-danger">
                  <span>Overdue:</span> <strong>{tasks.overdue}</strong>
                </div>
              )}
              <div className="kpi-detail-item">
                <span>Completion:</span> <strong>{tasks.completionRate}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="kpi-card" onClick={() => onNavigate && onNavigate('finance')}>
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>Finance (This Month)</h3>
            <div className="kpi-value" style={{ color: finance.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
              ${finance.netProfit.toLocaleString()}
            </div>
            <div className="kpi-subtitle">Net Profit</div>
            <div className="kpi-details">
              <div className="kpi-detail-item">
                <span>Income:</span> <strong className="text-success">${finance.income.toLocaleString()}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>Expenses:</span> <strong className="text-danger">${finance.expenses.toLocaleString()}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>Profit Margin:</span> <strong>{finance.profitMargin}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Health Alerts */}
        <div className="kpi-card" onClick={() => onNavigate && onNavigate('health')}>
          <div className="kpi-icon">🏥</div>
          <div className="kpi-content">
            <h3>Health Status</h3>
            <div className="kpi-value" style={{ color: health.totalAlerts > 0 ? '#f59e0b' : '#10b981' }}>
              {health.totalAlerts}
            </div>
            <div className="kpi-subtitle">Alerts</div>
            <div className="kpi-details">
              <div className="kpi-detail-item">
                <span>Under Treatment:</span> <strong>{health.underTreatment}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>Due Treatments:</span> <strong className={health.dueTreatments > 0 ? 'text-warning' : ''}>{health.dueTreatments}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>Needs Vaccination:</span> <strong>{health.needsVaccination}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="kpi-grid">
        {/* Breeding */}
        <div className="kpi-card" onClick={() => onNavigate && onNavigate('breeding')}>
          <div className="kpi-icon">🤰</div>
          <div className="kpi-content">
            <h3>Breeding</h3>
            <div className="kpi-value">{breeding.totalPregnant}</div>
            <div className="kpi-subtitle">Pregnant</div>
            <div className="kpi-details">
              <div className="kpi-detail-item">
                <span>Due Next Month:</span> <strong>{breeding.dueNextMonth}</strong>
              </div>
              {breeding.overdue > 0 && (
                <div className="kpi-detail-item text-danger">
                  <span>Overdue:</span> <strong>{breeding.overdue}</strong>
                </div>
              )}
              <div className="kpi-detail-item">
                <span>Success Rate:</span> <strong>{breeding.successRate}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="kpi-card" onClick={() => onNavigate && onNavigate('inventory')}>
          <div className="kpi-icon">📦</div>
          <div className="kpi-content">
            <h3>Inventory</h3>
            <div className="kpi-value" style={{ color: inventory.totalAlerts > 0 ? '#f59e0b' : '#10b981' }}>
              {inventory.totalAlerts}
            </div>
            <div className="kpi-subtitle">Alerts</div>
            <div className="kpi-details">
              {inventory.criticalStock > 0 && (
                <div className="kpi-detail-item text-danger">
                  <span>Critical:</span> <strong>{inventory.criticalStock}</strong>
                </div>
              )}
              <div className="kpi-detail-item text-warning">
                <span>Low Stock:</span> <strong>{inventory.lowStock}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>Out of Stock:</span> <strong>{inventory.outOfStock}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Milk Production */}
        {milkProduction.totalMilk > 0 && (
          <div className="kpi-card">
            <div className="kpi-icon">🥛</div>
            <div className="kpi-content">
              <h3>Milk Production</h3>
              <div className="kpi-value">{milkProduction.totalMilk.toFixed(1)}</div>
              <div className="kpi-subtitle">Liters (This Month)</div>
              <div className="kpi-details">
                <div className="kpi-detail-item">
                  <span>Avg Daily:</span> <strong>{milkProduction.avgDaily.toFixed(1)} L</strong>
                </div>
                <div className="kpi-detail-item">
                  <span>Producing:</span> <strong>{milkProduction.producingAnimals} animals</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feed Costs */}
        <div className="kpi-card">
          <div className="kpi-icon">🌾</div>
          <div className="kpi-content">
            <h3>Feed Costs</h3>
            <div className="kpi-value" style={{ 
              color: feedCosts.trend === 'increasing' ? '#ef4444' : 
                     feedCosts.trend === 'decreasing' ? '#10b981' : '#3b82f6'
            }}>
              ${feedCosts.avgMonthly ? feedCosts.avgMonthly.toFixed(0) : '0'}
            </div>
            <div className="kpi-subtitle">Monthly Average</div>
            <div className="kpi-details">
              <div className="kpi-detail-item">
                <span>Last 6 Months:</span> <strong>${feedCosts.totalCost ? feedCosts.totalCost.toLocaleString() : '0'}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>Trend:</span> 
                <strong style={{ 
                  color: feedCosts.trend === 'increasing' ? '#ef4444' : 
                         feedCosts.trend === 'decreasing' ? '#10b981' : '#6b7280'
                }}>
                  {feedCosts.trend === 'increasing' ? '📈 ' : feedCosts.trend === 'decreasing' ? '📉 ' : '➡️ '} 
                  {feedCosts.trend || 'stable'} 
                  {feedCosts.trendPercent ? ` (${feedCosts.trendPercent}%)` : ''}
                </strong>
              </div>
              <div className="kpi-detail-item">
                <span>Per Animal/Day:</span> 
                <strong>
                  ${animals.total > 0 && feedCosts.avgMonthly 
                    ? ((feedCosts.avgMonthly / 30) / animals.total).toFixed(2) 
                    : '0.00'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Cost Chart - Enhanced */}
      {feedCosts.monthlyData && feedCosts.monthlyData.length > 0 && (
        <div className="chart-container" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>📈 Feed Cost Analysis</h3>
            <div style={{ fontSize: 12, color: '#666' }}>
              <span style={{ marginRight: 12 }}>
                <strong>Total Transactions:</strong> {feedCosts.monthlyData.reduce((sum, m) => sum + (m.count || 0), 0)}
              </span>
              <span>
                <strong>Avg per Month:</strong> ${feedCosts.avgMonthly ? feedCosts.avgMonthly.toFixed(0) : '0'}
              </span>
            </div>
          </div>
          
          <div className="bar-chart" style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            justifyContent: 'space-around',
            height: 280,
            gap: 8,
            padding: '16px 0',
            borderBottom: '2px solid #333',
            position: 'relative'
          }}>
            {/* Y-axis labels */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 32,
              width: 50,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontSize: 10,
              color: '#666',
              paddingRight: 8,
              textAlign: 'right'
            }}>
              {(() => {
                const maxAmount = Math.max(...feedCosts.monthlyData.map(m => m.amount || 0), 1)
                return [maxAmount, maxAmount * 0.75, maxAmount * 0.5, maxAmount * 0.25, 0].map((val, i) => (
                  <div key={i}>${val.toFixed(0)}</div>
                ))
              })()}
            </div>

            {/* Bars */}
            <div style={{ 
              display: 'flex', 
              flex: 1, 
              alignItems: 'flex-end', 
              justifyContent: 'space-around',
              gap: 8,
              marginLeft: 60
            }}>
              {feedCosts.monthlyData.map((month, index) => {
                const maxAmount = Math.max(...feedCosts.monthlyData.map(m => m.amount || 0), 1)
                const height = maxAmount > 0 ? ((month.amount || 0) / maxAmount) * 100 : 0
                const isHighest = month.amount === maxAmount && maxAmount > 0
                const isLowest = month.amount === Math.min(...feedCosts.monthlyData.map(m => m.amount || 0))
                
                return (
                  <div 
                    key={index} 
                    className="bar-chart-item" 
                    style={{ 
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative'
                    }}
                    title={`${month.month}: $${(month.amount || 0).toFixed(2)} (${month.count || 0} transactions)`}
                  >
                    <div 
                      className="bar-chart-bar" 
                      style={{ 
                        height: `${height}%`,
                        minHeight: height > 0 ? '4px' : '0',
                        width: '100%',
                        background: isHighest ? 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)' :
                                   isLowest && month.amount > 0 ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' :
                                   'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scaleY(1.05)'
                        e.currentTarget.style.opacity = '0.8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scaleY(1)'
                        e.currentTarget.style.opacity = '1'
                      }}
                    >
                      {height > 15 && (
                        <span 
                          className="bar-chart-value" 
                          style={{ 
                            position: 'absolute',
                            top: -20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: 10,
                            fontWeight: 'bold',
                            color: '#111',
                            whiteSpace: 'nowrap',
                            background: 'rgba(255,255,255,0.9)',
                            padding: '2px 4px',
                            borderRadius: 3,
                            border: '1px solid #ddd'
                          }}
                        >
                          ${(month.amount || 0).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <div 
                      className="bar-chart-label" 
                      style={{ 
                        marginTop: 8,
                        fontSize: 10,
                        color: '#666',
                        textAlign: 'center',
                        fontWeight: isHighest || isLowest ? 'bold' : 'normal'
                      }}
                    >
                      {month.month}
                    </div>
                    {(month.count || 0) > 0 && (
                      <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>
                        {month.count} tx
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginTop: 16,
            padding: 12,
            background: '#f9fafb',
            borderRadius: 8
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Highest Month</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#ef4444' }}>
                {(() => {
                  const highest = feedCosts.monthlyData.reduce((max, m) => m.amount > max.amount ? m : max, feedCosts.monthlyData[0])
                  return `${highest.month}: $${(highest.amount || 0).toFixed(0)}`
                })()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Lowest Month</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#10b981' }}>
                {(() => {
                  const lowest = feedCosts.monthlyData.reduce((min, m) => m.amount < min.amount ? m : min, feedCosts.monthlyData[0])
                  return `${lowest.month}: $${(lowest.amount || 0).toFixed(0)}`
                })()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Cost per Animal (Monthly)</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#3b82f6' }}>
                ${animals.total > 0 && feedCosts.avgMonthly 
                  ? (feedCosts.avgMonthly / animals.total).toFixed(2)
                  : '0.00'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Projected Next Month</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#6366f1' }}>
                ${(() => {
                  if (feedCosts.monthlyData.length < 2) return feedCosts.avgMonthly ? feedCosts.avgMonthly.toFixed(0) : '0'
                  const recent = feedCosts.monthlyData.slice(-3)
                  const avgRecent = recent.reduce((sum, m) => sum + (m.amount || 0), 0) / recent.length
                  return avgRecent.toFixed(0)
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="quick-actions-grid">
          <button onClick={() => onNavigate && onNavigate('animals')} className="btn-primary">
            ➕ Add Animal
          </button>
          <button onClick={() => onNavigate && onNavigate('tasks')} className="btn-primary">
            📝 New Task
          </button>
          <button onClick={() => onNavigate && onNavigate('finance')} className="btn-primary">
            💳 Add Transaction
          </button>
          <button onClick={() => onNavigate && onNavigate('inventory')} className="btn-primary">
            📦 Update Inventory
          </button>
        </div>
      </div>

      <div className="dashboard-footer">
        <small>Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}</small>
      </div>
    </div>
  )
}
