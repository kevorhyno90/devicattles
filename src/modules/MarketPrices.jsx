import React, { useState, useEffect } from 'react'
import {
  getCurrentPrices,
  getPriceHistory,
  getSellingRecommendations,
  getPriceStatistics,
  COMMODITIES,
  COMMODITY_CATEGORIES
} from '../lib/marketPrices'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function MarketPrices() {
  const [prices, setPrices] = useState({})
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCommodity, setSelectedCommodity] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [priceHistory, setPriceHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  
  useEffect(() => {
    loadPrices()
    loadRecommendations()
    
    // Auto-refresh every 4 hours
    const interval = setInterval(loadPrices, 4 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    if (selectedCommodity) {
      loadCommodityDetails(selectedCommodity)
    }
  }, [selectedCommodity])
  
  const loadPrices = async () => {
    setLoading(true)
    try {
      const currentPrices = await getCurrentPrices()
      setPrices(currentPrices)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading prices:', error)
      alert('Failed to load market prices')
    } finally {
      setLoading(false)
    }
  }
  
  const loadRecommendations = () => {
    const recs = getSellingRecommendations()
    setRecommendations(recs)
  }
  
  const loadCommodityDetails = (commodityId) => {
    const history = getPriceHistory(commodityId, 30)
    const stats = getPriceStatistics(commodityId, 30)
    setPriceHistory(history)
    setStatistics(stats)
  }
  
  const filteredPrices = Object.entries(prices).filter(([id, data]) => {
    if (selectedCategory === 'all') return true
    return data.category === selectedCategory
  })
  
  const getCategoryColor = (category) => {
    switch (category) {
      case 'livestock': return '#10b981'
      case 'dairy': return '#3b82f6'
      case 'crops': return '#f59e0b'
      case 'feed': return '#8b5cf6'
      case 'supplies': return '#6b7280'
      default: return '#6b7280'
    }
  }
  
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
      default: return '➖'
    }
  }
  
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return '#10b981'
      case 'down': return '#ef4444'
      case 'stable': return '#6b7280'
      default: return '#6b7280'
    }
  }
  
  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'sell': return '#10b981'
      case 'hold': return '#f59e0b'
      case 'wait': return '#ef4444'
      default: return '#6b7280'
    }
  }
  
  const getUrgencyBadge = (urgency) => {
    const colors = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#6b7280'
    }
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor: colors[urgency],
        color: 'white'
      }}>
        {urgency.toUpperCase()}
      </span>
    )
  }
  
  // Chart data for selected commodity
  const chartData = priceHistory.length > 0 ? {
    labels: priceHistory.map(h => new Date(h.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Price (KES)',
        data: priceHistory.map(h => h.price),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  } : null
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => `KES ${value.toLocaleString()}`
        }
      }
    }
  }
  
  if (loading && Object.keys(prices).length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
        <h3>Loading market prices...</h3>
      </div>
    )
  }
  
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            📊 Market Prices
          </h2>
          {lastUpdated && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          )}
        </div>
        <button
          onClick={loadPrices}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {loading ? '🔄 Updating...' : '🔄 Refresh Prices'}
        </button>
      </div>
      
      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '8px 16px',
            backgroundColor: selectedCategory === 'all' ? '#3b82f6' : '#f3f4f6',
            color: selectedCategory === 'all' ? 'white' : '#1f2937',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          All Categories
        </button>
        {Object.entries(COMMODITY_CATEGORIES).map(([key, value]) => (
          <button
            key={value}
            onClick={() => setSelectedCategory(value)}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedCategory === value ? getCategoryColor(value) : '#f3f4f6',
              color: selectedCategory === value ? 'white' : '#1f2937',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {key.charAt(0) + key.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: selectedCommodity ? '450px 1fr' : '1fr', gap: '20px' }}>
        {/* Prices List */}
        <div>
          {/* Selling Recommendations */}
          {recommendations.length > 0 && (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                💡 Selling Recommendations
              </h3>
              {recommendations.slice(0, 3).map(rec => (
                <div key={rec.commodityId} style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <strong>{rec.commodity}</strong>
                    {getUrgencyBadge(rec.urgency)}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#374151',
                    marginBottom: '5px'
                  }}>
                    {rec.reason}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <span>Current: KES {rec.currentPrice.toLocaleString()}</span>
                    <span style={{
                      color: getRecommendationColor(rec.recommendation),
                      fontWeight: '600'
                    }}>
                      {rec.recommendation.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Price Cards */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600' }}>
              Current Prices ({filteredPrices.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
              {filteredPrices.map(([id, data]) => (
                <div
                  key={id}
                  onClick={() => setSelectedCommodity(id)}
                  style={{
                    padding: '12px',
                    border: `2px solid ${selectedCommodity === id ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: selectedCommodity === id ? '#eff6ff' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{data.commodity}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{data.unit}</div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: getCategoryColor(data.category),
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {data.category}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                        {data.currency} {data.price.toLocaleString()}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: getTrendColor(data.trend),
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {getTrendIcon(data.trend)}
                      <span>{data.trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Commodity Details */}
        {selectedCommodity && prices[selectedCommodity] && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Commodity Header */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                    {prices[selectedCommodity].commodity}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>
                    {prices[selectedCommodity].unit} • {prices[selectedCommodity].category}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCommodity(null)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕ Close
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Current Price</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>
                    {prices[selectedCommodity].currency} {prices[selectedCommodity].price.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Trend</div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: getTrendColor(prices[selectedCommodity].trend),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {getTrendIcon(prices[selectedCommodity].trend)}
                    <span>{prices[selectedCommodity].trend}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Source</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {prices[selectedCommodity].source}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Statistics */}
            {statistics && (
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600' }}>
                  📊 30-Day Statistics
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Average</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      KES {statistics.average.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Min/Max</div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                      {statistics.min.toLocaleString()} / {statistics.max.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Change</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: statistics.changePercent > 0 ? '#10b981' : statistics.changePercent < 0 ? '#ef4444' : '#6b7280'
                    }}>
                      {statistics.changePercent > 0 ? '+' : ''}{statistics.changePercent}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Volatility</div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                      {statistics.volatilityPercent}%
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Price Chart */}
            {chartData && (
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600' }}>
                  📈 Price History (30 Days)
                </h3>
                <div style={{ height: '300px' }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            )}
          </div>
        )}
        
        {!selectedCommodity && (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
            <h3>Select a commodity to view details</h3>
            <p style={{ fontSize: '14px' }}>
              Click on any commodity from the list to see price history and statistics
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
