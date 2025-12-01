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
import { getFinancialSummary as getIntegratedFinancials } from '../lib/moduleIntegration'

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
      const integratedFinance = getIntegratedFinancials() || { bySource: {}, totalIncome: 0, totalExpenses: 0, netProfit: 0 }
      // Convert bySource object to sources array for rendering
      integratedFinance.sources = Object.entries(integratedFinance.bySource || {}).map(([source, data]) => ({
        source,
        ...data
      }))
      setDashboardData({ ...data, integratedFinance })
    } catch (error) {
      console.error('Error loading dashboard:', error)
      // Set safe defaults on error
      setDashboardData({ 
        ...getDashboardData(),
        integratedFinance: { bySource: {}, totalIncome: 0, totalExpenses: 0, netProfit: 0, sources: [] }
      })
    }
    setLoading(false)
  }

  if (loading || !dashboardData) {
    return <div className="loading">Loading dashboard...</div>
  }

  const { 
    animals, breeding, health, tasks, finance, feedCosts, inventory, milkProduction, integratedFinance,
    crops, cropYield, cropSales, cropTreatments,
    azolla, bsf, poultry, canines, pets, calves,
    pastures, groups, schedules, notifications,
    measurements, treatments, feeding
  } = dashboardData
  
  // Calculate comprehensive financials
  const totalIncome = integratedFinance.totalIncome + finance.income
  const totalExpenses = integratedFinance.totalExpenses + finance.expenses
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0

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
            <h3>Total Finance</h3>
            <div className="kpi-value" style={{ color: netProfit >= 0 ? '#10b981' : '#ef4444', fontSize: '28px' }}>
              KES {netProfit.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <div className="kpi-subtitle">Net Profit/Loss</div>
            <div className="kpi-details">
              <div className="kpi-detail-item">
                <span>Total Income:</span> <strong className="text-success">KES {totalIncome.toFixed(2)}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>Total Expenses:</span> <strong className="text-danger">KES {totalExpenses.toFixed(2)}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>Profit Margin:</span> <strong style={{color: profitMargin >= 0 ? '#10b981' : '#ef4444'}}>
                  {profitMargin.toFixed(1)}%
                </strong>
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

      {/* Comprehensive Financial Breakdown */}
      {integratedFinance && integratedFinance.sources && integratedFinance.sources.length > 0 && (
        <div className="card" style={{ padding: '20px', marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💰 Income & Expense Breakdown by Source
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {integratedFinance.sources.map(source => (
              <div key={source.source} style={{ 
                padding: '16px', 
                background: source.net >= 0 ? '#f0fdf4' : '#fef2f2', 
                borderRadius: '12px', 
                border: `2px solid ${source.net >= 0 ? '#86efac' : '#fca5a5'}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '12px', color: '#1f2937' }}>
                  {source.source}
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6b7280' }}>Income:</span>
                    <span style={{ color: '#15803d', fontWeight: '600' }}>+KES {source.income.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6b7280' }}>Expenses:</span>
                    <span style={{ color: '#dc2626', fontWeight: '600' }}>-KES {source.expenses.toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '16px',
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '8px',
                    marginTop: '4px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Net:</span>
                    <span style={{ 
                      fontWeight: '700', 
                      fontSize: '18px',
                      color: source.net >= 0 ? '#059669' : '#dc2626' 
                    }}>
                      {source.net >= 0 ? '+' : ''}KES {source.net.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Summary Totals */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '2px solid #e5e7eb'
          }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#ecfdf5', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Income</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#15803d' }}>
                KES {totalIncome.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Expenses</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626' }}>
                KES {totalExpenses.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: netProfit >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Net Profit/Loss</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: netProfit >= 0 ? '#059669' : '#dc2626' }}>
                {netProfit >= 0 ? '+' : ''}KES {netProfit.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Margin: {profitMargin.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* All Farm Modules Overview - Comprehensive */}
      <div className="card" style={{ padding: '20px', marginTop: '24px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🌾 Complete Farm Overview - All Modules & Submodules
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {/* Crops Module */}
          {crops && crops.total > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #86efac', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => onNavigate && onNavigate('crops')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌱</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Crops</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#059669' }}>{crops.total}</div>
              <div style={{ fontSize: '11px', color: '#059669' }}>
                {crops.active} active • {crops.totalArea?.toFixed(1) || 0} acres
              </div>
            </div>
          )}
          
          {/* Crop Yield */}
          {cropYield && cropYield.totalRecords > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #fcd34d' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Crop Yield</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#d97706' }}>{cropYield.totalYield?.toFixed(0) || 0}</div>
              <div style={{ fontSize: '11px', color: '#d97706' }}>
                Avg: {cropYield.avgYield?.toFixed(1) || 0} per harvest
              </div>
            </div>
          )}
          
          {/* Crop Sales */}
          {cropSales && cropSales.totalSales > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #60a5fa' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💵</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Crop Sales</div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#2563eb' }}>KES {cropSales.totalRevenue?.toFixed(0) || 0}</div>
              <div style={{ fontSize: '11px', color: '#2563eb' }}>
                {cropSales.totalSales} sales
              </div>
            </div>
          )}
          
          {/* Azolla Farming */}
          {azolla && azolla.totalBeds > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #6ee7b7' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌿</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Azolla Beds</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#047857' }}>{azolla.totalBeds}</div>
              <div style={{ fontSize: '11px', color: '#047857' }}>
                {azolla.activeBeds} active • {azolla.totalProduction?.toFixed(1) || 0}kg
              </div>
            </div>
          )}
          
          {/* BSF Farming */}
          {bsf && bsf.totalUnits > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #f9a8d4' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🪰</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>BSF Units</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#be185d' }}>{bsf.totalUnits}</div>
              <div style={{ fontSize: '11px', color: '#be185d' }}>
                {bsf.activeUnits} active • {bsf.totalProduction?.toFixed(1) || 0}kg larvae
              </div>
            </div>
          )}
          
          {/* Poultry */}
          {poultry && poultry.total > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #fde047', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('poultry')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🐔</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Poultry</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#ca8a04' }}>{poultry.total}</div>
              <div style={{ fontSize: '11px', color: '#ca8a04' }}>
                {poultry.totalEggs} eggs • {poultry.activeFlocks} flocks
              </div>
            </div>
          )}
          
          {/* Canines */}
          {canines && canines.total > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #c4b5fd', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('canines')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🐕</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Canines</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#7c3aed' }}>{canines.total}</div>
              <div style={{ fontSize: '11px', color: '#7c3aed' }}>
                {canines.active} active dogs
              </div>
            </div>
          )}
          
          {/* Pets */}
          {pets && pets.total > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #fdba74', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('pets')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🐾</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Pets</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#ea580c' }}>{pets.total}</div>
              <div style={{ fontSize: '11px', color: '#ea580c' }}>
                {Object.keys(pets.byType).length} species
              </div>
            </div>
          )}
          
          {/* Calves */}
          {calves && calves.total > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #fca5a5', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('calves')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🐮</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Calves</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#dc2626' }}>{calves.total}</div>
              <div style={{ fontSize: '11px', color: '#dc2626' }}>
                {calves.byAge?.['0-3m'] || 0} young • {calves.byAge?.['12m+'] || 0} mature
              </div>
            </div>
          )}
          
          {/* Pastures */}
          {pastures && pastures.total > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #86efac', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('pastures')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌾</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Pastures</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#16a34a' }}>{pastures.total}</div>
              <div style={{ fontSize: '11px', color: '#16a34a' }}>
                {pastures.totalArea?.toFixed(1) || 0} acres • {pastures.available} available
              </div>
            </div>
          )}
          
          {/* Groups */}
          {groups && groups.totalGroups > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #a5b4fc', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('groups')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>👥</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Groups</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#4f46e5' }}>{groups.totalGroups}</div>
              <div style={{ fontSize: '11px', color: '#4f46e5' }}>
                {groups.totalAnimals} animals • Avg {groups.avgGroupSize?.toFixed(1)}
              </div>
            </div>
          )}
          
          {/* Schedules */}
          {schedules && schedules.total > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #f0abfc', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('schedules')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📅</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Schedules</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#c026d3' }}>{schedules.today}</div>
              <div style={{ fontSize: '11px', color: '#c026d3' }}>
                Today • {schedules.upcoming} upcoming
              </div>
            </div>
          )}
          
          {/* Notifications */}
          {notifications && notifications.total > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #fbbf24', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('notifications')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Notifications</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#d97706' }}>{notifications.unread}</div>
              <div style={{ fontSize: '11px', color: '#d97706' }}>
                Unread • {notifications.urgent} urgent
              </div>
            </div>
          )}
          
          {/* Measurements */}
          {measurements && measurements.total > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #7dd3fc' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📏</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Measurements</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#0284c7' }}>{measurements.total}</div>
              <div style={{ fontSize: '11px', color: '#0284c7' }}>
                Avg weight: {measurements.avgWeight?.toFixed(1) || 0}kg
              </div>
            </div>
          )}
          
          {/* Treatments */}
          {treatments && treatments.total > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #fdba74' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💊</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Treatments</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#ea580c' }}>{treatments.total}</div>
              <div style={{ fontSize: '11px', color: '#ea580c' }}>
                {treatments.active} active • {treatments.completionRate}% done
              </div>
            </div>
          )}
          
          {/* Feeding */}
          {feeding && feeding.total > 0 && (
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #fbcfe8' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🍽️</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>Feeding Records</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#db2777' }}>{feeding.total}</div>
              <div style={{ fontSize: '11px', color: '#db2777' }}>
                KES {feeding.totalCost?.toFixed(0) || 0} • {feeding.totalQuantity?.toFixed(0) || 0}kg
              </div>
            </div>
          )}
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
