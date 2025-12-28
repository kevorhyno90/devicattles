import React, { useState, useEffect } from 'react'
import { LineChart, BarChart, PieChart } from '../components/Charts'
import { formatCurrency } from '../lib/currency'
import { movingAverage, linearRegression } from '../lib/analyticsPredict'
import { exportToCSV, exportToJSON } from '../lib/exportImport'
import { useUIStore } from '../stores/uiStore'

export default function AdvancedAnalytics() {
  const [animals, setAnimals] = useState([])
  const [milkYield, setMilkYield] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [transactions, setTransactions] = useState([])
  const [crops, setCrops] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [selectedAnimal, setSelectedAnimal] = useState('all')
  const [showPrediction, setShowPrediction] = useState(true)
  const [showTrend, setShowTrend] = useState(false)
  const [correlation, setCorrelation] = useState(null)
  const showSuccess = useUIStore((state) => state.showSuccess)

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    try {
      setAnimals(JSON.parse(localStorage.getItem('cattalytics:animals') || '[]'))
      setMilkYield(JSON.parse(localStorage.getItem('devinsfarm:milkYield') || '[]'))
      setMeasurements(JSON.parse(localStorage.getItem('devinsfarm:measurements') || '[]'))
      setTransactions(JSON.parse(localStorage.getItem('devinsfarm:transactions') || '[]'))
      setCrops(JSON.parse(localStorage.getItem('devinsfarm:crops') || '[]'))
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  // Milk Production Trend
  function getMilkProductionData() {
    const filtered = selectedAnimal === 'all' 
      ? milkYield 
      : milkYield.filter(m => m.animalId === selectedAnimal)

    const grouped = {}
    filtered.forEach(m => {
      const date = m.date || m.milkingDate
      if (!date) return
      
      const monthKey = date.substring(0, 7) // YYYY-MM
      if (!grouped[monthKey]) {
        grouped[monthKey] = { total: 0, count: 0 }
      }
      grouped[monthKey].total += parseFloat(m.quantity || m.totalQuantity || 0)
      grouped[monthKey].count++
    })

    const months = Object.keys(grouped).sort().slice(-12)
    return months.map(month => ({
      label: month,
      value: parseFloat(grouped[month].total.toFixed(1))
    }))
  }

  // Animal Weight Growth
  function getWeightGrowthData() {
    if (selectedAnimal === 'all') return []
    
    const animalMeasurements = measurements
      .filter(m => m.animalId === selectedAnimal)
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    return animalMeasurements.map(m => ({
      label: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseFloat(m.weight || 0)
    }))
  }

  // Financial Trends
  function getFinancialData() {
    const months = {}
    const now = new Date()
    
    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = date.toISOString().substring(0, 7)
      months[key] = { income: 0, expense: 0 }
    }

    transactions.forEach(t => {
      if (!t.date) return
      const monthKey = t.date.substring(0, 7)
      if (!months[monthKey]) return

      const amount = parseFloat(t.amount || 0)
      if (t.type === 'income') {
        months[monthKey].income += amount
      } else {
        months[monthKey].expense += amount
      }
    })

    return Object.keys(months).sort().map(month => ({
      month,
      income: months[month].income,
      expense: months[month].expense,
      profit: months[month].income - months[month].expense
    }))
  }

  // Animal Distribution by Type
  function getAnimalDistribution() {
    const types = {}
    animals.forEach(a => {
      const breed = a.breed || 'Unknown'
      types[breed] = (types[breed] || 0) + 1
    })

    return Object.keys(types).map(breed => ({
      label: breed,
      value: types[breed]
    }))
  }

  // Animal Status Distribution
  function getStatusDistribution() {
    const statuses = {}
    animals.forEach(a => {
      const status = a.status || 'Unknown'
      statuses[status] = (statuses[status] || 0) + 1
    })

    return Object.keys(statuses).map(status => ({
      label: status,
      value: statuses[status]
    }))
  }

  const milkData = getMilkProductionData()
  const weightData = getWeightGrowthData()
  const financialData = getFinancialData()
  const animalDistribution = getAnimalDistribution()
  const statusDistribution = getStatusDistribution()

  // Predictive analytics: moving average and trend line for milk
  const milkMA = showPrediction ? movingAverage(milkData, 3) : [];
  const milkTrend = showTrend ? linearRegression(milkData) : [];

  // Correlation: milk yield vs. feed cost (if available)
  useEffect(() => {
    // Simple correlation: sum of milk vs. sum of feed expenses by month
    try {
      const feed = transactions.filter(t => t.type === 'expense' && t.category === 'Feed');
      const byMonth = {};
      milkYield.forEach(m => {
        const month = (m.date || m.milkingDate || '').substring(0, 7);
        if (!month) return;
        byMonth[month] = byMonth[month] || { milk: 0, feed: 0 };
        byMonth[month].milk += parseFloat(m.quantity || m.totalQuantity || 0);
      });
      feed.forEach(f => {
        const month = (f.date || '').substring(0, 7);
        if (!month) return;
        byMonth[month] = byMonth[month] || { milk: 0, feed: 0 };
        byMonth[month].feed += Math.abs(parseFloat(f.amount || 0));
      });
      const corrData = Object.keys(byMonth).sort().map(month => ({
        month,
        milk: byMonth[month].milk,
        feed: byMonth[month].feed
      }));
      setCorrelation(corrData.length > 0 ? corrData : null);
    } catch {
      setCorrelation(null);
    }
  }, [transactions, milkYield]);

  const incomeData = financialData.map(d => ({ label: d.month, value: d.income / 1000 }))
  const expenseData = financialData.map(d => ({ label: d.month, value: d.expense / 1000 }))
  const profitData = financialData.map(d => ({ label: d.month, value: d.profit / 1000 }))

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>📊 Advanced Analytics</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>Visual insights and trends for your farm data</p>
      </div>

      {/* Filters & Export */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 13 }}>
                    <input type="checkbox" checked={showPrediction} onChange={e => setShowPrediction(e.target.checked)} /> Show Moving Average
                  </label>
                  <label style={{ fontSize: 13 }}>
                    <input type="checkbox" checked={showTrend} onChange={e => setShowTrend(e.target.checked)} /> Show Trend Line
                  </label>
                  <button
                    onClick={() => { exportToCSV(milkData, 'milk_trend.csv'); showSuccess('Exported Milk Data!'); }}
                    style={{ padding: '6px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
                  >⬇️ Export Milk CSV</button>
                  <button
                    onClick={() => { exportToJSON(milkData, 'milk_trend.json'); showSuccess('Exported Milk Data!'); }}
                    style={{ padding: '6px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
                  >⬇️ Export Milk JSON</button>
                </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', fontWeight: '500' }}>
            Period:
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{ marginLeft: '8px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>
          </label>

          <label style={{ fontSize: '14px', fontWeight: '500' }}>
            Animal:
            <select
              value={selectedAnimal}
              onChange={(e) => setSelectedAnimal(e.target.value)}
              style={{ marginLeft: '8px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="all">All Animals</option>
              {animals.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gap: '24px' }}>
        
        {/* Milk Production Trend + Predictive */}
        {milkData.length > 0 && (
          <div className="card" style={{ padding: '20px' }}>
            <LineChart
              data={milkData}
              title="🥛 Milk Production Trend"
              xLabel="Month"
              yLabel="Liters"
              color="#059669"
              width={Math.min(window.innerWidth - 100, 800)}
              height={300}
              extraLines={[
                showPrediction && milkMA.length > 0 ? { data: milkMA, color: '#3b82f6', label: 'Moving Avg' } : null,
                showTrend && milkTrend.length > 0 ? { data: milkTrend, color: '#f59e0b', label: 'Trend Line' } : null
              ].filter(Boolean)}
            />
          </div>
        )}
        {/* Correlation Visualization */}
        {correlation && correlation.length > 0 && (
          <div className="card" style={{ padding: '20px' }}>
            <BarChart
              data={correlation.map(d => ({ label: d.month, value: d.milk }))}
              title="Milk Yield vs Feed Cost (Milk)"
              xLabel="Month"
              yLabel="Milk (L)"
              color="#059669"
              width={Math.min(window.innerWidth - 140, 700)}
              height={180}
            />
            <BarChart
              data={correlation.map(d => ({ label: d.month, value: d.feed }))}
              title="Milk Yield vs Feed Cost (Feed)"
              xLabel="Month"
              yLabel="Feed Cost (KSH)"
              color="#ef4444"
              width={Math.min(window.innerWidth - 140, 700)}
              height={180}
            />
          </div>
        )}

        {/* Weight Growth Curve */}
        {selectedAnimal !== 'all' && weightData.length > 0 && (
          <div className="card" style={{ padding: '20px' }}>
            <LineChart
              data={weightData}
              title={`📈 Weight Growth: ${animals.find(a => a.id === selectedAnimal)?.name || ''}`}
              xLabel="Date"
              yLabel="Weight (kg)"
              color="#3b82f6"
              width={Math.min(window.innerWidth - 100, 800)}
              height={300}
            />
          </div>
        )}

        {/* Financial Overview */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>💰 Financial Trends (KSH '000)</h3>
          <div style={{ display: 'grid', gap: '24px' }}>
            <LineChart
              data={incomeData}
              title="Income Over Time"
              xLabel="Month"
              yLabel="KSH (Thousands)"
              color="#10b981"
              width={Math.min(window.innerWidth - 140, 700)}
              height={250}
            />
            <LineChart
              data={expenseData}
              title="Expenses Over Time"
              xLabel="Month"
              yLabel="KSH (Thousands)"
              color="#ef4444"
              width={Math.min(window.innerWidth - 140, 700)}
              height={250}
            />
            <LineChart
              data={profitData}
              title="Net Profit/Loss"
              xLabel="Month"
              yLabel="KSH (Thousands)"
              color="#8b5cf6"
              width={Math.min(window.innerWidth - 140, 700)}
              height={250}
            />
          </div>
        </div>

        {/* Animal Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {animalDistribution.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <PieChart
                data={animalDistribution}
                title="🐄 Animals by Breed"
                width={350}
                height={300}
              />
            </div>
          )}

          {statusDistribution.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <PieChart
                data={statusDistribution}
                title="📊 Animals by Status"
                width={350}
                height={300}
              />
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>📈 Key Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
                {animals.filter(a => a.status === 'Active').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Active Animals</div>
            </div>

            <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                {milkYield.reduce((sum, m) => sum + parseFloat(m.quantity || m.totalQuantity || 0), 0).toFixed(0)}L
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Total Milk Produced</div>
            </div>

            <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                {formatCurrency(transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0))}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Total Income</div>
            </div>

            <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                {formatCurrency(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0))}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Total Expenses</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
