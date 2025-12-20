import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { loadData } from '../lib/storage'
import { formatCurrency } from '../lib/currency'
import { calculateFeedEfficiency, calculateAnimalROI } from '../lib/advancedAnalytics'

/**
 * ReportsPro - Personal Farm Analytics & Reports
 * Feed costs, animal ROI, health trends, predictions
 * Optimized with useCallback and useMemo to prevent INP warnings
 */
export default function ReportsPro({ animals = [], crops = [], finance = [] }) {
  const [activeTab, setActiveTab] = useState('feedCosts')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month') // week, month, quarter, year
  const [selectedAnimal, setSelectedAnimal] = useState('')
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadReportData()
  }, [dateRange, selectedAnimal])

  const loadReportData = async () => {
    setLoading(true)
    try {
      const feedingEvents = loadData('rumen8:feedingEvents', [])
      const animalData = animals || []
      const financeData = finance || []
      
      setData({
        feedingEvents: feedingEvents || [],
        animals: animalData,
        finance: financeData
      })
      
      calculateStatsOptimized(feedingEvents || [], animalData, financeData)
    } catch (err) {
      console.error('Error loading report data:', err)
      setData({ feedingEvents: [], animals, finance })
    } finally {
      setLoading(false)
    }
  }

  const aggregateByFeedType = useCallback((events, key) => {
    const agg = {}
    events.forEach(e => {
      agg[e.feedType] = (agg[e.feedType] || 0) + (e[key] || 0)
    })
    return agg
  }, [])

  const calculateStatsOptimized = useCallback((feeding, animalList, financeData) => {
    // Defer heavy calculation to next microtask to avoid blocking UI
    Promise.resolve().then(() => {
      // Get date range
      const now = new Date()
      let startDate = new Date()
      
      if (dateRange === 'week') startDate.setDate(now.getDate() - 7)
      else if (dateRange === 'month') startDate.setMonth(now.getMonth() - 1)
      else if (dateRange === 'quarter') startDate.setMonth(now.getMonth() - 3)
      else if (dateRange === 'year') startDate.setFullYear(now.getFullYear() - 1)

      const filtered = feeding.filter(f => new Date(f.date) >= startDate)
      const newStats = {}

      // Feed costs
      const totalFeedCost = filtered.reduce((sum, f) => sum + (f.cost || 0), 0)
      const totalFeedQty = filtered.reduce((sum, f) => sum + (f.quantity || 0), 0)
      const avgCostPerKg = totalFeedQty > 0 ? totalFeedCost / totalFeedQty : 0

      newStats.feed = {
        totalCost: totalFeedCost,
        totalQuantity: totalFeedQty,
        avgCostPerKg,
        eventCount: filtered.length,
        byCost: aggregateByFeedType(filtered, 'cost'),
        byQuantity: aggregateByFeedType(filtered, 'quantity')
      }

      // Animal ROI
      newStats.animalROI = []
      for (const animal of animalList) {
        const roi = calculateAnimalROI(animal, filtered, financeData)
        newStats.animalROI.push({ animal, roi })
      }

      // Health metrics
      newStats.health = {
        totalAnimals: animalList.length,
        withRecords: animalList.filter(a => a.treatments?.length > 0).length,
        avgAge: animalList.length > 0 
          ? (animalList.reduce((sum, a) => sum + (calculateAge(a) || 0), 0) / animalList.length).toFixed(1)
          : 0
      }

      setStats(newStats)
    })
  }, [dateRange, aggregateByFeedType])

  const calculateAge = useCallback((animal) => {
    if (!animal.dob) return null
    const today = new Date()
    const birth = new Date(animal.dob)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
    return age
  }, [])

  const handleDateRangeChange = useCallback((range) => {
    setDateRange(range)
  }, [])

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
  }, [])

  const exportCSV = useCallback(() => {
    if (activeTab === 'feedCosts' && stats.feed) {
      exportFeedCostsCSV()
    } else if (activeTab === 'animalROI' && stats.animalROI) {
      exportAnimalROICSV()
    }
  }, [activeTab, stats.feed, stats.animalROI])

  const exportFeedCostsCSV = useCallback(() => {
    const rows = [
      ['Feed Cost Report', dateRange.toUpperCase()],
      [],
      ['Metric', 'Value'],
      ['Total Feed Cost', formatCurrency(stats.feed.totalCost)],
      ['Total Quantity (kg)', stats.feed.totalQuantity.toFixed(2)],
      ['Avg Cost/kg', formatCurrency(stats.feed.avgCostPerKg)],
      ['Events Logged', stats.feed.eventCount],
      [],
      ['By Feed Type', 'Cost', 'Quantity (kg)']
    ]

    const feedTypes = new Set([
      ...Object.keys(stats.feed.byCost || {}),
      ...Object.keys(stats.feed.byQuantity || {})
    ])

    feedTypes.forEach(type => {
      rows.push([
        type,
        formatCurrency(stats.feed.byCost[type] || 0),
        (stats.feed.byQuantity[type] || 0).toFixed(2)
      ])
    })

    downloadCSV(rows, `feed-costs-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`)
  }, [stats.feed, dateRange])

  const exportAnimalROICSV = useCallback(() => {
    const rows = [
      ['Animal ROI Report', dateRange.toUpperCase()],
      [],
      ['Animal', 'Income', 'Feed Cost', 'Net Profit', 'ROI %']
    ]

    stats.animalROI.forEach(({ animal, roi }) => {
      rows.push([
        animal.name || animal.tag,
        formatCurrency(roi.income),
        formatCurrency(roi.feedCost),
        formatCurrency(roi.profit),
        (roi.roiPercent || 0).toFixed(1) + '%'
      ])
    })

    downloadCSV(rows, `animal-roi-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`)
  }, [stats.animalROI, dateRange])

  const downloadCSV = useCallback((rows, filename) => {
    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>📊</div>
        <p>Loading report data...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, marginBottom: '8px' }}>📊 Reports Pro</h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Personal farm analytics & insights</p>
      </div>

      {/* Date Range Selector */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['week', 'month', 'quarter', 'year'].map(range => (
          <button
            key={range}
            onClick={() => handleDateRangeChange(range)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: dateRange === range ? '#3b82f6' : '#e5e7eb',
              color: dateRange === range ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: dateRange === range ? '600' : '400',
              fontSize: '14px'
            }}
          >
            {range === 'week' ? 'Last 7 days' : range === 'month' ? 'Last 30 days' : range === 'quarter' ? 'Last 90 days' : 'Last year'}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', flexWrap: 'wrap' }}>
        {[
          { id: 'feedCosts', label: '💰 Feed Costs', icon: '💰' },
          { id: 'animalROI', label: '🐄 Animal ROI', icon: '🐄' },
          { id: 'health', label: '🏥 Health Metrics', icon: '🏥' },
          { id: 'trends', label: '📈 Trends', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? '600' : '400',
              borderRadius: '4px 4px 0 0',
              fontSize: '14px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed Costs Tab */}
      {activeTab === 'feedCosts' && stats.feed && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px', background: '#f0fdf4', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Total Feed Cost</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(stats.feed.totalCost)}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>for {stats.feed.eventCount} feeding events</div>
            </div>

            <div className="card" style={{ padding: '16px', background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Total Quantity</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.feed.totalQuantity.toFixed(1)} kg</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>feed purchased/used</div>
            </div>

            <div className="card" style={{ padding: '16px', background: '#dbeafe', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Avg Cost/kg</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{formatCurrency(stats.feed.avgCostPerKg)}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>unit cost</div>
            </div>
          </div>

          {/* Feed Type Breakdown */}
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0' }}>By Feed Type</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {Object.entries(stats.feed.byCost || {}).map(([type, cost]) => (
                <div key={type} style={{ padding: '12px', background: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{type}</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>{formatCurrency(cost)}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{(stats.feed.byQuantity[type] || 0).toFixed(1)} kg</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={exportCSV} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
            📥 Export CSV
          </button>
        </div>
      )}

      {/* Animal ROI Tab */}
      {activeTab === 'animalROI' && stats.animalROI && (
        <div>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
            {stats.animalROI
              .sort((a, b) => (b.roi.profit || 0) - (a.roi.profit || 0))
              .map(({ animal, roi }, idx) => (
                <div key={idx} className="card" style={{ padding: '16px', borderLeft: `4px solid ${roi.profit >= 0 ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>ANIMAL</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{animal.name || animal.tag}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>INCOME</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(roi.income || 0)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>FEED COST</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(roi.feedCost || 0)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>NET PROFIT</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: roi.profit >= 0 ? '#10b981' : '#ef4444' }}>
                        {formatCurrency(roi.profit || 0)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    ROI: {(roi.roiPercent || 0).toFixed(1)}% | {animal.breed || 'N/A'} | Age: {calculateAge(animal) || 'N/A'} years
                  </div>
                </div>
              ))}
          </div>

          {stats.animalROI.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              <p>No animal data available for this period</p>
            </div>
          )}

          <button onClick={exportCSV} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
            📥 Export CSV
          </button>
        </div>
      )}

      {/* Health Metrics Tab */}
      {activeTab === 'health' && stats.health && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px', background: '#f3f4f6', borderLeft: '4px solid #6b7280' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Total Animals</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.health.totalAnimals}</div>
            </div>

            <div className="card" style={{ padding: '16px', background: '#fee2e2', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>With Treatment Records</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{stats.health.withRecords}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>({((stats.health.withRecords / stats.health.totalAnimals) * 100).toFixed(0)}%)</div>
            </div>

            <div className="card" style={{ padding: '16px', background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Average Age</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.health.avgAge} yrs</div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <p>Health trend analysis coming soon</p>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
          <p>Trend visualization and predictions coming in next update</p>
        </div>
      )}
    </div>
  )
}
