import React, { useState, useEffect } from 'react'
import { useTaskStore } from '../stores'
import EditableField from '../components/EditableField'
import { LineChart } from '../components/Charts'
import { getDashboardData } from '../lib/analytics'
import { getFinancialSummary as getIntegratedFinancials } from '../lib/moduleIntegration'
import { getCacheStats } from '../lib/dataCache'
import { getPredictiveDashboard } from '../lib/predictiveAnalytics'
import { getAlertsSummary } from '../lib/smartAlerts'
import { loadData } from '../lib/storage'
import DashboardCustomizer from '../components/DashboardCustomizer'
import { exportToCSV } from '../lib/exportImport'
import { getLivestockDataQualityReport, applyLivestockAutoFix, applyAllLivestockAutoFixes, dismissLivestockQualityIssue, clearDismissedLivestockQualityIssues } from '../lib/livestockPhase1'

export default function Dashboard({ onNavigate }) {
  const addTask = useTaskStore(state => state.addTask)
    // Week 3: One-click action handlers
    const handleCreateUrgentTask = (type) => {
      let task = null
      if (type === 'runway') {
        task = {
          title: 'Review Cash Runway – Critical',
          description: 'Cash runway is below critical threshold. Review expenses, delay non-essentials, or seek funding.',
          priority: 'high',
          dueDate: new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,10),
          category: 'Finance',
          assignedTo: '',
          estimatedHours: 2
        }
      } else if (type === 'overdue') {
        task = {
          title: 'Resolve Overdue Tasks',
          description: 'There are overdue high-priority tasks. Review and resolve immediately.',
          priority: 'high',
          dueDate: new Date().toISOString().slice(0,10),
          category: 'Operations',
          assignedTo: '',
          estimatedHours: 1
        }
      } else if (type === 'inventory') {
        task = {
          title: 'Replenish Critical Inventory',
          description: 'Inventory coverage is at critical risk. Place urgent orders for at-risk items.',
          priority: 'high',
          dueDate: new Date(Date.now() + 48*60*60*1000).toISOString().slice(0,10),
          category: 'Inventory',
          assignedTo: '',
          estimatedHours: 1
        }
      }
      if (task) {
        addTask(task)
        alert('Urgent task created!')
      }
    }
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [cacheStats, setCacheStats] = useState(null)
  const [predictions, setPredictions] = useState(null)
  const [alertsSummary, setAlertsSummary] = useState(null)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [livestockQuality, setLivestockQuality] = useState(null)
  const [showBulkFixPreview, setShowBulkFixPreview] = useState(false)
  const [selectedFixCodes, setSelectedFixCodes] = useState([])
  const [quickActionsTitle, setQuickActionsTitle] = useState('🩺 ezyVet Quick Actions')
  const [qaLabels, setQaLabels] = useState({
    alerts: '🔔 Smart Alerts'
  })
  const [showWeek3Config, setShowWeek3Config] = useState(false)
  // Per-device config key
  const deviceIdKey = 'devinsfarm:deviceId'
  let deviceId = null
  try { deviceId = localStorage.getItem(deviceIdKey) } catch (e) { }
  if (!deviceId) {
    deviceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`
    try { localStorage.setItem(deviceIdKey, deviceId) } catch (e) {}
  }
  const week3ConfigKey = `cattalytics:dashboard:week3-config:${deviceId}`
  const [week3Config, setWeek3Config] = useState({
    cashWindowDays: 90,
    runwayWarningDays: 30,
    runwayCriticalDays: 14,
    taskDueHours: 48,
    inventoryRiskDays: 14
  })

  // Persist quick actions edits
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cattalytics:dashboard:qa') || 'null')
      if (saved) {
        setQuickActionsTitle(saved.title || '🩺 ezyVet Quick Actions')
        const savedLabels = saved.labels || {}
        setQaLabels({
          alerts: savedLabels.alerts || '🔔 Smart Alerts'
        })
      }
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem('cattalytics:dashboard:qa', JSON.stringify({ title: quickActionsTitle, labels: qaLabels }))
    } catch {}
  }, [quickActionsTitle, qaLabels])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(week3ConfigKey) || 'null')
      if (saved && typeof saved === 'object') {
        setWeek3Config((prev) => ({
          ...prev,
          ...saved
        }))
      }
    } catch {}
  }, [week3ConfigKey])

  useEffect(() => {
    try {
      localStorage.setItem(week3ConfigKey, JSON.stringify(week3Config))
    } catch {}
  }, [week3Config, week3ConfigKey])

  // Voice control removed

  useEffect(() => {
    loadDashboard()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDashboard()
        setCacheStats(getCacheStats())
      }, 60000) // Refresh every minute
      return () => clearInterval(interval)
    }
  }, [autoRefresh, week3Config])

  const loadDashboard = () => {
    setLoading(true)
    try {
      const data = getDashboardData({ week3: week3Config })
      const integratedFinance = getIntegratedFinancials() || { bySource: {}, totalIncome: 0, totalExpenses: 0, netProfit: 0 }
      // Convert bySource object to sources array for rendering
      integratedFinance.sources = Object.entries(integratedFinance.bySource || {}).map(([source, data]) => ({
        source,
        ...data
      }))
      setDashboardData({ ...data, integratedFinance })
      setCacheStats(getCacheStats())
      
      // Load smart alerts summary
      try {
        const alertsSum = getAlertsSummary()
        setAlertsSummary(alertsSum)
      } catch (error) {
        console.error('Error loading alerts:', error)
      }

      try {
        setLivestockQuality(getLivestockDataQualityReport({ maxIssues: 8 }))
      } catch (error) {
        console.error('Error loading livestock data quality report:', error)
      }
      
      // Load predictive analytics
      try {
        const animals = loadData('cattalytics:animals', [])
        const crops = loadData('cattalytics:crops:v2', [])
        const finance = loadData('cattalytics:finance', [])
        const milkRecords = loadData('cattalytics:animal:milkyield', [])
        const cropYields = loadData('cattalytics:crop-yield', [])
        
        const predictiveData = getPredictiveDashboard(animals, crops, finance, milkRecords, cropYields)
        setPredictions(predictiveData)
      } catch (error) {
        console.error('Error loading predictions:', error)
      }
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

  const refreshLivestockQuality = () => {
    try {
      setLivestockQuality(getLivestockDataQualityReport({ maxIssues: 8 }))
    } catch (error) {
      console.error('Error refreshing livestock data quality report:', error)
    }
  }

  const handleAutoFixIssue = (issue) => {
    const result = applyLivestockAutoFix(issue)
    if (!result.ok) {
      alert(result.message || 'Auto-fix failed')
      return
    }
    refreshLivestockQuality()
    loadDashboard()
  }

  const handleDismissIssue = (issue) => {
    if (!issue?.fingerprint) return
    dismissLivestockQualityIssue(issue.fingerprint)
    refreshLivestockQuality()
  }

  const handleClearDismissed = () => {
    clearDismissedLivestockQualityIssues()
    refreshLivestockQuality()
  }

  const handleBulkAutoFix = () => {
    if (!livestockQuality?.issues?.length) return
    const selectedIssues = livestockQuality.issues.filter((i) => i.fixable && selectedFixCodes.includes(i.code))
    if (selectedIssues.length === 0) {
      alert('No fix types selected for bulk auto-fix.')
      return
    }

    const result = applyAllLivestockAutoFixes(selectedIssues)
    alert(`Bulk auto-fix completed. Fixed: ${result.fixed}, Failed: ${result.failed}`)
    setShowBulkFixPreview(false)
    refreshLivestockQuality()
    loadDashboard()
  }

  const openBulkFixPreview = () => {
    if (!livestockQuality?.issues?.length) {
      alert('No issues available for bulk fix.')
      return
    }
    const uniqueCodes = Array.from(new Set(livestockQuality.issues.filter((i) => i.fixable).map((i) => i.code))).filter(Boolean)
    if (uniqueCodes.length === 0) {
      alert('No auto-fixable issues found.')
      return
    }
    setSelectedFixCodes(uniqueCodes)
    setShowBulkFixPreview(true)
  }

  const toggleFixCode = (code) => {
    setSelectedFixCodes((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code])
  }

  const fixCodeLabel = (code) => {
    const labels = {
      'dairy-invalid-expected-due': 'Clear invalid dairy due date',
      'goat-negative-weight': 'Clear negative goat weight',
      'canine-missing-role': 'Apply default canine role',
      'bsf-invalid-population': 'Normalize BSF population'
    }
    return labels[code] || code
  }

  const handleExportQualityCSV = () => {
    const report = getLivestockDataQualityReport({ maxIssues: 1000, includeDismissed: true, skipTrend: true })
    const rows = report.issues.map((issue) => ({
      id: issue.id,
      module: issue.module,
      severity: issue.severity,
      code: issue.code,
      message: issue.message,
      actionView: issue.actionView,
      fixable: issue.fixable ? 'Yes' : 'No',
      dismissed: issue.dismissed ? 'Yes' : 'No',
      fingerprint: issue.fingerprint,
      generatedAt: report.generatedAt
    }))
    exportToCSV(rows, `livestock-quality-issues-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  if (loading || !dashboardData) {
    return <div className="loading">Loading dashboard...</div>
  }

  const { 
    animals, breeding, health, tasks, finance, costPerAnimal, feedCosts, inventory, milkProduction, integratedFinance,
    lactation, vaccinationFocus,
    weightVelocity, inventoryReorder, milkComposition, breedingReadiness, healthRisk,
    cashRunway, taskPulse, inventoryCoverage,
    crops, cropYield, cropSales, cropTreatments,
    azolla, bsf, poultry, canines, pets, calves,
    pastures, schedules, notifications,
    measurements, treatments, feeding
  } = dashboardData
  
  // Calculate comprehensive financials
  const totalIncome = integratedFinance.totalIncome + finance.income
  const totalExpenses = integratedFinance.totalExpenses + finance.expenses
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0

  return (
    <div className="dashboard">
      <div className="dashboard-section card" style={{ marginBottom: 24, padding: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>🩺 ezyVet Clinical Focus</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          This dashboard now prioritizes day-to-day clinical operations, livestock status, tasks, finance,
          inventory, and alerts for a cleaner ezyVet-style workflow.
        </p>
      </div>
      <div className="dashboard-header">
        <h1>🩺 ezyVet Dashboard</h1>
        <div className="dashboard-controls">
          <button onClick={() => setShowCustomizer(true)} className="btn-primary" style={{ background: '#8b5cf6', marginRight: 12 }}>
            🎨 Customize
          </button>
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

      {/* Dashboard Customizer Modal */}
      {showCustomizer && (
        <DashboardCustomizer onClose={() => setShowCustomizer(false)} />
      )}

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
              background: 'var(--bg-elevated)',
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
            background: 'var(--bg-elevated)',
            color: navigator.serviceWorker.controller ? '#10b981' : '#f59e0b',
            border: `1px solid ${navigator.serviceWorker.controller ? '#10b981' : '#f59e0b'}`,
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

      {/* Week 1: Vaccination Focus */}
      {vaccinationFocus?.totals && (vaccinationFocus.totals.overdue > 0 || vaccinationFocus.totals.dueSoon > 0 || vaccinationFocus.totals.missing > 0) && (
        <div className="card" style={{ padding: '18px', marginBottom: '20px', border: '1px solid #fecaca', background: '#fff7ed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, color: '#9a3412' }}>💉 Week 1 Focus: Vaccination Triage</h3>
            <button onClick={() => onNavigate && onNavigate('health')} className="btn-secondary">Open Health</button>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10, fontSize: 13 }}>
            <span><strong>Overdue:</strong> {vaccinationFocus.totals.overdue}</span>
            <span><strong>Due Soon:</strong> {vaccinationFocus.totals.dueSoon}</span>
            <span><strong>No Record:</strong> {vaccinationFocus.totals.missing}</span>
          </div>
          {vaccinationFocus.overdue.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              {vaccinationFocus.overdue.slice(0, 3).map((item) => (
                <div key={item.animalId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 700 }}>{item.daysOverdue} days overdue</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Livestock Data Quality */}
      {livestockQuality && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px', border: `1px solid ${livestockQuality.summary.totalIssues > 0 ? '#fca5a5' : '#86efac'}`, background: 'var(--bg-elevated)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>📋 Livestock Data Quality</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={refreshLivestockQuality} className="btn-secondary">Recheck</button>
              <button onClick={handleExportQualityCSV} className="btn-secondary">Export CSV</button>
              <button onClick={openBulkFixPreview} className="btn-secondary">Bulk Auto Fix</button>
              {livestockQuality.summary.dismissedIssues > 0 && (
                <button onClick={handleClearDismissed} className="btn-secondary">Show Dismissed ({livestockQuality.summary.dismissedIssues})</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, fontSize: 14 }}>
            <span><strong>Total Issues:</strong> {livestockQuality.summary.totalIssues}</span>
            <span style={{ color: '#b91c1c' }}><strong>High:</strong> {livestockQuality.summary.high}</span>
            <span style={{ color: '#b45309' }}><strong>Medium:</strong> {livestockQuality.summary.medium}</span>
            {livestockQuality.summary.dismissedIssues > 0 && <span><strong>Dismissed:</strong> {livestockQuality.summary.dismissedIssues}</span>}
          </div>

          {Array.isArray(livestockQuality.trend) && livestockQuality.trend.length > 1 && (
            <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              Trend (last {livestockQuality.trend.length} checks): {livestockQuality.trend.map((p) => p.total).join(' → ')}
            </div>
          )}

          {livestockQuality.summary.totalIssues > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {livestockQuality.issues.map((issue) => (
                <div key={issue.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{issue.module} • {issue.severity.toUpperCase()}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{issue.message}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {issue.fixable && (
                      <button onClick={() => handleAutoFixIssue(issue)} className="btn-primary" style={{ padding: '8px 10px', background: '#059669' }}>
                        Auto Fix
                      </button>
                    )}
                    <button
                      onClick={() => onNavigate && onNavigate(issue.actionView)}
                      className="btn-primary"
                      style={{ padding: '8px 10px' }}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDismissIssue(issue)}
                      className="btn-secondary"
                      style={{ padding: '8px 10px' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 14, color: '#166534' }}>
              No livestock data quality issues detected.
            </div>
          )}
        </div>
      )}

      {/* Bulk Fix Preview */}
      {showBulkFixPreview && livestockQuality && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: 'min(760px, 100%)', maxHeight: '80vh', overflowY: 'auto', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-primary, #e5e7eb)', padding: 20 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Bulk Auto-Fix Preview</h3>
            <p style={{ marginTop: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              Select which fix types should run. Only safe, predefined fixes are shown.
            </p>

            <div style={{ display: 'grid', gap: 10, marginTop: 12, marginBottom: 16 }}>
              {Array.from(new Set(livestockQuality.issues.filter((i) => i.fixable).map((i) => i.code))).map((code) => {
                const count = livestockQuality.issues.filter((i) => i.fixable && i.code === code).length
                const checked = selectedFixCodes.includes(code)
                return (
                  <label key={code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, background: 'var(--bg-secondary)', cursor: 'pointer' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{fixCodeLabel(code)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{count} issue(s)</span>
                      <input type="checkbox" checked={checked} onChange={() => toggleFixCode(code)} />
                    </span>
                  </label>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowBulkFixPreview(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleBulkAutoFix} style={{ background: '#059669' }}>Run Selected Fixes</button>
            </div>
          </div>
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

        {/* Cost Per Animal */}
        <div className="kpi-card" onClick={() => onNavigate && onNavigate('finance')}>
          <div className="kpi-icon">🧮</div>
          <div className="kpi-content">
            <h3>Cost Per Animal</h3>
            <div className="kpi-value" style={{ color: '#2563eb', fontSize: '28px' }}>
              KES {(costPerAnimal?.perAnimalPeriod || 0).toFixed(2)}
            </div>
            <div className="kpi-subtitle">This Month</div>
            <div className="kpi-details">
              <div className="kpi-detail-item">
                <span>Daily/Head:</span> <strong>KES {(costPerAnimal?.perAnimalDaily || 0).toFixed(2)}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>Feed/Head:</span> <strong>KES {(costPerAnimal?.feedPerAnimal || 0).toFixed(2)}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>Vet/Head:</span> <strong>KES {(costPerAnimal?.vetPerAnimal || 0).toFixed(2)}</strong>
              </div>
              <div className="kpi-detail-item">
                <span>Active Herd:</span> <strong>{costPerAnimal?.activeAnimals || 0}</strong>
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

      {/* Week 1: Lactation Curve Insights */}
      {lactation && lactation.records > 0 && (
        <div className="card" style={{ padding: '18px', marginTop: '20px', border: '1px solid #bfdbfe', background: '#eff6ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: '#1d4ed8' }}>🥛 Lactation Curve Snapshot (Last {lactation.windowDays} Days)</h3>
            <button onClick={() => onNavigate && onNavigate('milkyield')} className="btn-secondary">Open Milk Yield</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 12 }}>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Milk</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a8a' }}>{(lactation.totalMilk || 0).toFixed(1)} L</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Daily Average</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a8a' }}>{(lactation.avgDaily || 0).toFixed(1)} L</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Trend</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: lactation.trend === 'up' ? '#059669' : lactation.trend === 'down' ? '#dc2626' : '#6b7280' }}>
                {lactation.trend === 'up' ? '↗' : lactation.trend === 'down' ? '↘' : '→'} {lactation.trend} {lactation.trendPercent ? `(${lactation.trendPercent}%)` : ''}
              </div>
            </div>
          </div>
          {lactation.topProducers?.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              {lactation.topProducers.slice(0, 3).map((producer) => (
                <div key={producer.animalId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{producer.label}</div>
                  <div style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 700 }}>{producer.total.toFixed(1)} L total</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Week 2: Health Risk Scoring ── */}
      {healthRisk && healthRisk.atRisk?.length > 0 && (
        <div className="card" style={{ padding: '18px', marginTop: '20px', border: '1px solid #fecaca', background: '#fff5f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: '#b91c1c' }}>⚠️ Health Risk Scores — Top At-Risk Animals</h3>
            <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
              <span style={{ background: '#fee2e2', borderRadius: 6, padding: '3px 10px', color: '#b91c1c', fontWeight: 700 }}>🔴 High Risk: {healthRisk.highRiskCount}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Avg Score: {healthRisk.avgScore}/100</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {healthRisk.atRisk.map(a => (
              <div key={a.animalId} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: 'white', flexShrink: 0,
                  background: a.score >= 70 ? '#dc2626' : a.score >= 50 ? '#f97316' : '#f59e0b' }}>
                  {a.score}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.label} <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>({a.type})</span></div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{a.factors.join(' · ')}</div>
                </div>
                <button onClick={() => onNavigate && onNavigate('health')} style={{ padding: '5px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>→ Health</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Week 2: Breeding Readiness ── */}
      {breedingReadiness && breedingReadiness.totalHeats > 0 && (
        <div className="card" style={{ padding: '18px', marginTop: '20px', border: '1px solid #fbcfe8', background: '#fdf2f8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: '#9d174d' }}>🐄 Breeding Readiness — Heat Window Tracker</h3>
            <button onClick={() => onNavigate && onNavigate('breeding')} className="btn-secondary">Open Breeding</button>
          </div>
          {breedingReadiness.readyNow?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#be185d', marginBottom: 6 }}>🔴 In Heat / Ready Now ({breedingReadiness.readyNow.length})</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {breedingReadiness.readyNow.map(a => (
                  <div key={a.animalId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 7, padding: '8px 12px' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</span>
                      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{a.type}</span>
                    </div>
                    <span style={{ fontSize: 12, background: '#fce7f3', color: '#9d174d', borderRadius: 5, padding: '2px 8px', fontWeight: 600 }}>{a.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {breedingReadiness.readySoon?.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c026d3', marginBottom: 6 }}>🟡 Heat Expected Soon ({breedingReadiness.readySoon.length})</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {breedingReadiness.readySoon.map(a => (
                  <div key={a.animalId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 7, padding: '8px 12px' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</span>
                    <span style={{ fontSize: 12, background: '#fae8ff', color: '#86198f', borderRadius: 5, padding: '2px 8px', fontWeight: 600 }}>{a.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Week 2: Weight Velocity ── */}
      {weightVelocity && weightVelocity.total > 0 && (
        <div className="card" style={{ padding: '18px', marginTop: '20px', border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: '#14532d' }}>📏 Weight Gain/Loss Velocity</h3>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Herd avg: <strong style={{ color: weightVelocity.avgGainRate >= 0 ? '#15803d' : '#dc2626' }}>{weightVelocity.avgGainRate >= 0 ? '+' : ''}{weightVelocity.avgGainRate} kg/mo</strong></span>
          </div>
          {weightVelocity.alertAnimals?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>⚠️ Weight Loss Alerts ({weightVelocity.alertAnimals.length})</div>
              {weightVelocity.alertAnimals.map(a => (
                <div key={a.animalId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2', borderRadius: 7, padding: '8px 12px', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{a.latestWeight}kg</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 700 }}>{a.ratePerMonth < 0 ? '' : '+'}{a.ratePerMonth} kg/mo</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>🔼 Top Gainers</div>
              {weightVelocity.topGainers?.slice(0, 3).map(a => (
                <div key={a.animalId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #dcfce7' }}>
                  <span>{a.label}</span>
                  <span style={{ color: '#15803d', fontWeight: 700 }}>+{a.ratePerMonth} kg/mo</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9a3412', marginBottom: 6 }}>🔽 Lowest Gain</div>
              {weightVelocity.bottomGainers?.slice(0, 3).map(a => (
                <div key={a.animalId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #ffedd5' }}>
                  <span>{a.label}</span>
                  <span style={{ color: a.ratePerMonth < 0 ? '#dc2626' : '#9a3412', fontWeight: 700 }}>{a.ratePerMonth >= 0 ? '+' : ''}{a.ratePerMonth} kg/mo</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Week 2: Milk Quality Composition ── */}
      {milkComposition && milkComposition.records > 0 && (
        <div className="card" style={{ padding: '18px', marginTop: '20px', border: '1px solid #e0e7ff', background: '#f5f3ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: '#3730a3' }}>🧪 Milk Quality Composition (Last {milkComposition.windowDays} Days)</h3>
            <button onClick={() => onNavigate && onNavigate('milkyield')} className="btn-secondary">Open Milk Yield</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
            {[['Fat%', milkComposition.avgFat, milkComposition.avgFat >= 3.5 ? '#15803d' : milkComposition.avgFat >= 3.0 ? '#d97706' : '#dc2626'],
              ['Protein%', milkComposition.avgProtein, milkComposition.avgProtein >= 3.2 ? '#15803d' : '#d97706'],
              ['SNF%', milkComposition.avgSNF, milkComposition.avgSNF >= 8.5 ? '#15803d' : '#d97706'],
              ['SCC (×1000)', milkComposition.avgSCC ? (milkComposition.avgSCC / 1000).toFixed(0) : '—', milkComposition.avgSCC < 200000 ? '#15803d' : milkComposition.avgSCC < 400000 ? '#d97706' : '#dc2626']
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{val !== 0 && val !== '—' ? val : '—'}</div>
              </div>
            ))}
          </div>
          {milkComposition.flaggedAnimals?.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>🚩 Quality Flags</div>
              {milkComposition.flaggedAnimals.map(a => (
                <div key={a.animalId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 7, padding: '7px 12px', marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {a.flags.map(f => <span key={f} style={{ fontSize: 11, background: '#ede9fe', color: '#6d28d9', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>{f}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {Object.keys(milkComposition.gradeBreakdown || {}).length > 0 && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(milkComposition.gradeBreakdown).map(([grade, count]) => (
                <span key={grade}><strong>{grade}:</strong> {count}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Week 2: Inventory Reorder Insights ── */}
      {inventoryReorder && inventoryReorder.total > 0 && (
        <div className="card" style={{ padding: '18px', marginTop: '20px', border: '1px solid #fed7aa', background: '#fff7ed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: '#c2410c' }}>📦 Inventory Reorder Required ({inventoryReorder.total} items)</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Est. reorder: <strong style={{ color: '#c2410c' }}>KES {inventoryReorder.totalReorderCost.toLocaleString()}</strong></span>
              <button onClick={() => onNavigate && onNavigate('inventory')} className="btn-secondary">Open Inventory</button>
            </div>
          </div>
          {inventoryReorder.critical?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>🚨 Out of Stock ({inventoryReorder.critical.length})</div>
              {inventoryReorder.critical.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2', borderRadius: 7, padding: '8px 12px', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{item.category}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Order {item.reorderQty} {item.unit} · KES {item.reorderCost.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          {inventoryReorder.needsReorder?.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', marginBottom: 6 }}>⚠️ Low Stock — Below Reorder Point ({inventoryReorder.needsReorder.length})</div>
              {inventoryReorder.needsReorder.slice(0, 5).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 7, padding: '8px 12px', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{item.quantity} {item.unit} left (min {item.reorderPoint})</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#ea580c', fontWeight: 600 }}>+{item.reorderQty} {item.unit} · KES {item.reorderCost.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Week 3: Decision Intelligence */}
      {(cashRunway || taskPulse || inventoryCoverage) && (
        <div className="card" style={{ padding: '18px', marginTop: '20px', border: '1px solid #bfdbfe', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: '#1d4ed8' }}>🧠 Week 3 Focus: Decision Intelligence</h3>
            <button className="btn-secondary" onClick={() => setShowWeek3Config((v) => !v)}>
              {showWeek3Config ? 'Hide Settings' : 'Tune Thresholds'}
            </button>
          </div>

          {/* One-click actions row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {cashRunway?.status === 'critical' && (
              <button className="btn-danger" onClick={() => handleCreateUrgentTask('runway')}>
                Create Urgent Task: Cash Runway
              </button>
            )}
            {taskPulse?.overdue > 0 && (
              <button className="btn-danger" onClick={() => handleCreateUrgentTask('overdue')}>
                Create Urgent Task: Overdue Tasks
              </button>
            )}
            {inventoryCoverage?.critical > 0 && (
              <button className="btn-danger" onClick={() => handleCreateUrgentTask('inventory')}>
                Create Urgent Task: Inventory Risk
              </button>
            )}
          </div>

          {showWeek3Config && (
            <div style={{
              marginBottom: 14,
              padding: 12,
              background: 'var(--bg-elevated)',
              borderRadius: 10,
              border: '1px solid #dbeafe',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 10
            }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Cash Window (days)
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={week3Config.cashWindowDays}
                  onChange={(e) => setWeek3Config((prev) => ({ ...prev, cashWindowDays: Number(e.target.value) || 90 }))}
                  style={{ marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Runway Warning (days)
                <input
                  type="number"
                  min="7"
                  max="120"
                  value={week3Config.runwayWarningDays}
                  onChange={(e) => setWeek3Config((prev) => ({ ...prev, runwayWarningDays: Number(e.target.value) || 30 }))}
                  style={{ marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Runway Critical (days)
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={week3Config.runwayCriticalDays}
                  onChange={(e) => setWeek3Config((prev) => ({ ...prev, runwayCriticalDays: Number(e.target.value) || 14 }))}
                  style={{ marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Task Due Soon (hours)
                <input
                  type="number"
                  min="6"
                  max="168"
                  value={week3Config.taskDueHours}
                  onChange={(e) => setWeek3Config((prev) => ({ ...prev, taskDueHours: Number(e.target.value) || 48 }))}
                  style={{ marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Inventory Risk (days)
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={week3Config.inventoryRiskDays}
                  onChange={(e) => setWeek3Config((prev) => ({ ...prev, inventoryRiskDays: Number(e.target.value) || 14 }))}
                  style={{ marginTop: 4 }}
                />
              </label>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {/* Cash Runway Card with Sparkline */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 12, border: '1px solid #dbeafe' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Cash Runway</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: cashRunway?.status === 'critical' || cashRunway?.status === 'negative' ? '#dc2626' : cashRunway?.status === 'warning' ? '#d97706' : '#059669' }}>
                {Math.max(0, cashRunway?.runwayDays || 0).toFixed(0)} days
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Net cash: KES {(cashRunway?.cashBalance || 0).toLocaleString()} • Burn/mo: KES {(cashRunway?.monthlyBurn || 0).toFixed(0)}
              </div>
              {/* Mini-trend sparkline for runway (last 6 months) */}
              {dashboardData?.finance?.runwayHistory && dashboardData.finance.runwayHistory.length > 1 && (
                <div style={{ marginTop: 10 }}>
                  <LineChart
                    data={dashboardData.finance.runwayHistory.map((v, i) => ({ label: v.label, value: v.value }))}
                    width={140}
                    height={40}
                    color="#dc2626"
                  />
                </div>
              )}
            </div>

            {/* Task Execution Pulse Card with Sparkline */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Task Execution Pulse</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1f2937' }}>
                {taskPulse?.totalOpen || 0} open
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6, fontSize: 12 }}>
                <span>High: <strong style={{ color: '#b91c1c' }}>{taskPulse?.highPriorityOpen || 0}</strong></span>
                <span>Due {taskPulse?.hoursAhead || 48}h: <strong style={{ color: '#b45309' }}>{taskPulse?.dueSoon || 0}</strong></span>
                <span>Overdue: <strong style={{ color: '#dc2626' }}>{taskPulse?.overdue || 0}</strong></span>
              </div>
              {/* Mini-trend sparkline for overdue tasks (last 6 weeks) */}
              {dashboardData?.tasks?.overdueHistory && dashboardData.tasks.overdueHistory.length > 1 && (
                <div style={{ marginTop: 10 }}>
                  <LineChart
                    data={dashboardData.tasks.overdueHistory.map((v, i) => ({ label: v.label, value: v.value }))}
                    width={140}
                    height={40}
                    color="#dc2626"
                  />
                </div>
              )}
              {taskPulse?.nextDue?.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  Next: {taskPulse.nextDue[0].title} ({taskPulse.nextDue[0].due})
                </div>
              )}
            </div>

            {/* Inventory Coverage Card (unchanged) */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 12, border: '1px solid #ffedd5' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Inventory Coverage</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: inventoryCoverage?.critical > 0 ? '#dc2626' : '#0369a1' }}>
                {inventoryCoverage?.atRisk || 0} at risk
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Critical (&le;7 days): {inventoryCoverage?.critical || 0} • Tracked: {inventoryCoverage?.tracked || 0}
              </div>
              {inventoryCoverage?.items?.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  Most urgent: {inventoryCoverage.items[0].name} ({Math.max(0, inventoryCoverage.items[0].daysLeft).toFixed(1)} days)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                background: 'var(--bg-elevated)', 
                borderRadius: '12px', 
                border: `2px solid ${source.net >= 0 ? '#86efac' : '#fca5a5'}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  {source.source}
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Income:</span>
                    <span style={{ color: '#15803d', fontWeight: '600' }}>+KES {source.income.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Expenses:</span>
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
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Net:</span>
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
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid #10b981' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Income</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#15803d' }}>
                KES {totalIncome.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid #ef4444' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Expenses</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626' }}>
                KES {totalExpenses.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: `1px solid ${netProfit >= 0 ? '#10b981' : '#ef4444'}` }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Net Profit/Loss</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: netProfit >= 0 ? '#059669' : '#dc2626' }}>
                {netProfit >= 0 ? '+' : ''}KES {netProfit.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
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
      <div className="card" style={{ padding: '20px', marginTop: '24px', background: 'var(--bg-secondary)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🌾 Complete Farm Overview - All Modules & Submodules
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {/* Crops Module */}
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #86efac', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => onNavigate && onNavigate('crops')}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌾</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Crop OS</div>
            <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#059669' }}>{crops?.total || 0}</div>
            <div style={{ fontSize: '11px', color: '#059669' }}>
              {(crops?.active || 0)} active • {crops?.totalArea?.toFixed(1) || 0} acres
            </div>
          </div>
          
          {/* Crop Yield */}
          {cropYield && cropYield.totalRecords > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #fcd34d' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Crop Yield</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#d97706' }}>{cropYield.totalYield?.toFixed(0) || 0}</div>
              <div style={{ fontSize: '11px', color: '#d97706' }}>
                Avg: {cropYield.avgYield?.toFixed(1) || 0} per harvest
              </div>
            </div>
          )}
          
          {/* Crop Sales */}
          {cropSales && cropSales.totalSales > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #60a5fa' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💵</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Crop Sales</div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#2563eb' }}>KES {cropSales.totalRevenue?.toFixed(0) || 0}</div>
              <div style={{ fontSize: '11px', color: '#2563eb' }}>
                {cropSales.totalSales} sales
              </div>
            </div>
          )}
          
          {/* Azolla Farming */}
          {azolla && azolla.totalBeds > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #6ee7b7' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌿</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Azolla Beds</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#047857' }}>{azolla.totalBeds}</div>
              <div style={{ fontSize: '11px', color: '#047857' }}>
                {azolla.activeBeds} active • {azolla.totalProduction?.toFixed(1) || 0}kg
              </div>
            </div>
          )}
          
          {/* BSF Farming */}
          {bsf && bsf.totalUnits > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #f9a8d4' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🪰</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>BSF Units</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#be185d' }}>{bsf.totalUnits}</div>
              <div style={{ fontSize: '11px', color: '#be185d' }}>
                {bsf.activeUnits} active • {bsf.totalProduction?.toFixed(1) || 0}kg larvae
              </div>
            </div>
          )}
          
          {/* Poultry */}
          {poultry && poultry.total > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #fde047', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('poultry')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🐔</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Poultry</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#ca8a04' }}>{poultry.total}</div>
              <div style={{ fontSize: '11px', color: '#ca8a04' }}>
                {poultry.totalEggs} eggs • {poultry.activeFlocks} flocks
              </div>
            </div>
          )}
          
          {/* Canines */}
          {canines && canines.total > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #c4b5fd', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('canines')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🐕</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Canines</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#7c3aed' }}>{canines.total}</div>
              <div style={{ fontSize: '11px', color: '#7c3aed' }}>
                {canines.active} active dogs
              </div>
            </div>
          )}
          
          {/* Calves */}
          {calves && calves.total > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #fca5a5', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('calves')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🐮</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Calves</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#dc2626' }}>{calves.total}</div>
              <div style={{ fontSize: '11px', color: '#dc2626' }}>
                {calves.byAge?.['0-3m'] || 0} young • {calves.byAge?.['12m+'] || 0} mature
              </div>
            </div>
          )}
          
          {/* Pastures */}
          {pastures && pastures.total > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #86efac', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('pastures')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌾</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Pastures</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#16a34a' }}>{pastures.total}</div>
              <div style={{ fontSize: '11px', color: '#16a34a' }}>
                {pastures.totalArea?.toFixed(1) || 0} acres • {pastures.available} available
              </div>
            </div>
          )}
          
          {/* Schedules */}
          {schedules && schedules.total > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #f0abfc', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('schedules')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📅</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Schedules</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#c026d3' }}>{schedules.today}</div>
              <div style={{ fontSize: '11px', color: '#c026d3' }}>
                Today • {schedules.upcoming} upcoming
              </div>
            </div>
          )}
          
          {/* Notifications */}
          {notifications && notifications.total > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #fbbf24', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('notifications')}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Notifications</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#d97706' }}>{notifications.unread}</div>
              <div style={{ fontSize: '11px', color: '#d97706' }}>
                Unread • {notifications.urgent} urgent
              </div>
            </div>
          )}
          
          {/* Measurements */}
          {measurements && measurements.total > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #7dd3fc' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📏</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Measurements</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#0284c7' }}>{measurements.total}</div>
              <div style={{ fontSize: '11px', color: '#0284c7' }}>
                Avg weight: {measurements.avgWeight?.toFixed(1) || 0}kg
              </div>
            </div>
          )}
          
          {/* Treatments */}
          {treatments && treatments.total > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #fdba74' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💊</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Treatments</div>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#ea580c' }}>{treatments.total}</div>
              <div style={{ fontSize: '11px', color: '#ea580c' }}>
                {treatments.active} active • {treatments.completionRate}% done
              </div>
            </div>
          )}
          
          {/* Feeding */}
          {feeding && feeding.total > 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid #fbcfe8' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🍽️</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>Feeding Records</div>
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
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
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
              color: 'var(--text-secondary)',
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
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                        fontWeight: isHighest || isLowest ? 'bold' : 'normal'
                      }}
                    >
                      {month.month}
                    </div>
                    {(month.count || 0) > 0 && (
                      <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 2 }}>
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
            background: 'var(--bg-secondary)',
            borderRadius: 8
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Highest Month</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#ef4444' }}>
                {(() => {
                  const highest = feedCosts.monthlyData.reduce((max, m) => m.amount > max.amount ? m : max, feedCosts.monthlyData[0])
                  return `${highest.month}: $${(highest.amount || 0).toFixed(0)}`
                })()}
+++
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Lowest Month</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#10b981' }}>
                {(() => {
                  const lowest = feedCosts.monthlyData.reduce((min, m) => m.amount < min.amount ? m : min, feedCosts.monthlyData[0])
                  return `${lowest.month}: $${(lowest.amount || 0).toFixed(0)}`
                })()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Cost per Animal (Monthly)</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#3b82f6' }}>
                ${animals.total > 0 && feedCosts.avgMonthly 
                  ? (feedCosts.avgMonthly / animals.total).toFixed(2)
                  : '0.00'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Projected Next Month</div>
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

      {/* Performance & Enhancements Status */}
      <div className="card" style={{ padding: '20px', marginTop: '24px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #f59e0b' }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>🚀 Performance & Recent Enhancements</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>✅ Quick Wins</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>5/5</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>100% Complete</div>
          </div>
          
          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>⚡ Performance</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>90%</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Faster Lists</div>
          </div>
          
          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>💾 Memory</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>70%</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Less Usage</div>
          </div>
          
          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>💰 Cost</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>$0</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>All FREE</div>
          </div>
          
          {cacheStats && (
            <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>🗂️ Cache</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{cacheStats.hitRate}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hit Rate</div>
            </div>
          )}
        </div>

        <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #fbbf24' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>✨ Recently Added:</div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#78350f' }}>
            <li>⚡ Inline Editing in 7+ modules (Animals, Finance, Tasks, Crops)</li>
            <li>🔍 Global Search with Ctrl+K shortcut</li>
            <li>📊 Performance tools: Debouncing, Virtualization, Lazy Loading</li>
            <li>🛡️ Enhanced error handling with user-friendly messages</li>
            <li>💾 Smart data caching with 5-minute TTL</li>
            <li>⚙️ Web Workers for background statistics</li>
            <li>⌨️ Keyboard shortcuts help (press '?')</li>
          </ul>
        </div>

        {cacheStats && (
          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#166534' }}>🗂️ Cache Performance:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', fontSize: '13px' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Hit Rate</div>
                <div style={{ fontWeight: 'bold', color: '#059669' }}>{cacheStats.hitRate}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Cache Size</div>
                <div style={{ fontWeight: 'bold', color: '#059669' }}>{cacheStats.cacheSize} entries</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Memory</div>
                <div style={{ fontWeight: 'bold', color: '#059669' }}>{cacheStats.memoryUsage}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>Hits/Misses</div>
                <div style={{ fontWeight: 'bold', color: '#059669' }}>{cacheStats.hits}/{cacheStats.misses}</div>
              </div>
            </div>
          </div>
        )}

        {predictions && (
          <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #93c5fd' }}>
            <div style={{ fontWeight: '600', marginBottom: '12px', color: '#1e40af', fontSize: '16px' }}>🔮 AI Predictions</div>
            
            {/* Milk Yield Predictions */}
            {predictions.milkYield && (
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #dbeafe' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e3a8a' }}>🥛 Milk Yield Forecast</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Current Daily Avg</div>
                    <div style={{ fontWeight: 'bold', color: '#1e40af' }}>{predictions.milkYield.currentAverage?.toFixed(1) || 0} L</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Predicted Daily Avg</div>
                    <div style={{ fontWeight: 'bold', color: '#2563eb' }}>{predictions.milkYield.predictedAverage?.toFixed(1) || 0} L</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Next Week Total</div>
                    <div style={{ fontWeight: 'bold', color: '#7c3aed' }}>{predictions.milkYield.nextWeekTotal?.toFixed(0) || 0} L</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Trend</div>
                    <div style={{ fontWeight: 'bold', color: predictions.milkYield.trend === 'increasing' ? '#059669' : predictions.milkYield.trend === 'decreasing' ? '#dc2626' : '#6b7280' }}>
                      {predictions.milkYield.trend === 'increasing' ? '↗' : predictions.milkYield.trend === 'decreasing' ? '↘' : '→'} {predictions.milkYield.trend || 'stable'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Confidence</div>
                    <div style={{ fontWeight: 'bold', color: '#059669' }}>{predictions.milkYield.confidence || 0}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Crop Harvest Predictions */}
            {predictions.crops && predictions.crops.length > 0 && (
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #dbeafe' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e3a8a' }}>🌾 Crop Harvest Predictions</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {predictions.crops.slice(0, 3).map((crop, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                      <div style={{ fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>{crop.cropName}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Variety: {crop.variety}</div>
                      <div style={{ color: '#059669', fontWeight: '500', marginTop: '4px' }}>Yield: {crop.predictedYield?.toFixed(0) || 0} kg</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Harvest: {crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString() : 'TBD'}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Days: {crop.daysUntilHarvest || 0}</div>
                      <div style={{ color: '#7c3aed', fontSize: '11px', marginTop: '4px' }}>Confidence: {crop.confidence || 0}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expense Predictions */}
            {predictions.expenses && (
              <div>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e3a8a' }}>💰 Expense Forecast</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '13px' }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Next Month</div>
                    <div style={{ fontWeight: 'bold', color: '#dc2626' }}>KES {predictions.expenses.nextMonth?.toLocaleString() || 0}</div>
                    <div style={{ color: '#7c3aed', fontSize: '11px', marginTop: '4px' }}>Confidence: {predictions.expenses.confidence || 0}%</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Next Quarter</div>
                    <div style={{ fontWeight: 'bold', color: '#dc2626' }}>KES {predictions.expenses.nextQuarter?.toLocaleString() || 0}</div>
                    <div style={{ color: '#7c3aed', fontSize: '11px', marginTop: '4px' }}>Confidence: {predictions.expenses.confidence || 0}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.open('INTEGRATION_GUIDE.md', '_blank')} 
            style={{ padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            📖 View Integration Guide
          </button>
          <button 
            onClick={() => window.open('PERFORMANCE_ENHANCEMENTS.md', '_blank')} 
            style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            ⚡ Performance Docs
          </button>
          <button 
            onClick={() => window.open('FREE_ENHANCEMENTS_CHECKLIST.md', '_blank')} 
            style={{ padding: '8px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            ✅ Feature Checklist
          </button>
        </div>
      </div>

      {/* Smart Alerts Summary */}
      {alertsSummary && alertsSummary.total > 0 && (
        <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #fca5a5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#991b1b' }}>🔔 Smart Alerts</h3>
            <button
              onClick={() => onNavigate && onNavigate('alerts')}
              style={{
                padding: '6px 12px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '13px'
              }}
            >
              View All →
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            {alertsSummary.critical > 0 && (
              <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '2px solid #dc2626' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{alertsSummary.critical}</div>
                <div style={{ fontSize: '12px', color: '#991b1b' }}>🚨 Critical</div>
              </div>
            )}
            
            {alertsSummary.high > 0 && (
              <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '2px solid #ea580c' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>{alertsSummary.high}</div>
                <div style={{ fontSize: '12px', color: '#9a3412' }}>⚠️ High</div>
              </div>
            )}
            
            {alertsSummary.medium > 0 && (
              <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '2px solid #f59e0b' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{alertsSummary.medium}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>⚡ Medium</div>
              </div>
            )}
            
            <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '2px solid #6b7280' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{alertsSummary.total}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📋 Total</div>
            </div>
          </div>
          
          <div style={{ fontSize: '13px', color: '#7f1d1d' }}>
            Showing actionable alerts that need your attention
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>
          <EditableField 
            value={quickActionsTitle}
            onChange={(v)=>setQuickActionsTitle(v)}
            inputStyle={{ fontSize: 18, fontWeight: 700 }}
          />
        </h3>
        <div className="quick-actions-grid">
          <button onClick={() => onNavigate && onNavigate('alerts')} className="btn-primary" style={{ background: '#dc2626' }}>
            <EditableField value={qaLabels.alerts} onChange={(v)=>setQaLabels(l=>({ ...l, alerts: v }))} inputStyle={{ fontWeight: 600 }} />
          </button>
          {/* Voice, disease, and audit quick actions removed */}
          <button onClick={() => onNavigate && onNavigate('timeline')} className="btn-primary" style={{ background: '#f59e0b' }}>
            📅 Timeline Planner
          </button>
          <button onClick={() => onNavigate && onNavigate('photos')} className="btn-primary" style={{ background: '#a855f7' }}>
            📸 Photo Gallery
          </button>

          <button onClick={() => onNavigate && onNavigate('alertcenter')} className="btn-primary" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none' }}>
            🔔 Alert Center
          </button>
          <button onClick={() => onNavigate && onNavigate('mobilesettings')} className="btn-primary" style={{ background: '#6366f1' }}>
            📱 Mobile Settings
          </button>
          <button onClick={() => onNavigate && onNavigate('dashboardbuilder')} className="btn-primary" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none' }}>
            🎨 Dashboard Builder
          </button>
          <button onClick={() => onNavigate && onNavigate('activityfeed')} className="btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #14b8a6 100%)', border: 'none' }}>
            📊 Activity Feed
          </button>
          {/* Animal Health and Health Analytics quick actions removed */}
          <button onClick={() => onNavigate && onNavigate('store-demo')} className="btn-primary" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', border: 'none' }}>
            🏪 Store Demo
          </button>
          <button onClick={() => onNavigate && onNavigate('marketplace')} className="btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none' }}>
            🛒 Marketplace
          </button>

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
