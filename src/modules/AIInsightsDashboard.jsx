import React, { useState, useEffect } from 'react'
import { 
  generateInsights, 
  getInsightsByCategory, 
  getInsightsByPriority,
  calculateTotalImpact,
  markInsightActioned,
  filterActionedInsights,
  InsightCategory,
  InsightPriority
} from '../lib/aiInsights'

export default function AIInsightsDashboard() {
  const [insights, setInsights] = useState([])
  const [filteredInsights, setFilteredInsights] = useState([])
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showActioned, setShowActioned] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedInsight, setExpandedInsight] = useState(null)

  useEffect(() => {
    loadInsights()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [insights, filterCategory, filterPriority, showActioned])

  const loadInsights = () => {
    setLoading(true)
    
    // Load all data
    const animals = JSON.parse(localStorage.getItem('cattalytics:animals') || '[]')
    const finances = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
    const tasks = JSON.parse(localStorage.getItem('cattalytics:tasks') || '[]')
    const milkRecords = JSON.parse(localStorage.getItem('cattalytics:milk-yield') || '[]')
    const crops = JSON.parse(localStorage.getItem('cattalytics:crops') || '[]')
    
    // Generate insights
    const allInsights = generateInsights({
      animals,
      finances,
      tasks,
      milkRecords,
      crops
    })
    
    setInsights(allInsights)
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...insights]
    
    // Filter by category
    if (filterCategory !== 'all') {
      filtered = getInsightsByCategory(filtered, filterCategory)
    }
    
    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = getInsightsByPriority(filtered, filterPriority)
    }
    
    // Filter actioned insights
    if (!showActioned) {
      filtered = filterActionedInsights(filtered)
    }
    
    setFilteredInsights(filtered)
  }

  const handleAction = (insightId) => {
    markInsightActioned(insightId)
    loadInsights()
  }

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#dc2626',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981',
      info: '#6b7280'
    }
    return colors[priority] || '#6b7280'
  }

  const getCategoryIcon = (category) => {
    const icons = {
      health: '🏥',
      finance: '💰',
      productivity: '📈',
      efficiency: '⚡',
      prediction: '🔮',
      alert: '⚠️',
      optimization: '🎯',
      trend: '📊'
    }
    return icons[category] || '💡'
  }

  const impact = calculateTotalImpact(filteredInsights)

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
        <div>Analyzing your farm data...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111' }}>
          🤖 AI-Powered Insights
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Intelligent recommendations based on your farm data
        </p>
      </div>

      {/* Impact Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>Total Insights</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{filteredInsights.length}</div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>Critical/High Priority</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>
            {filteredInsights.filter(i => i.priority === 'critical' || i.priority === 'high').length}
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>Potential Savings</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>${impact.savings.toFixed(0)}</div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>Potential Gains</div>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>${impact.gains.toFixed(0)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        background: 'white', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories</option>
            <option value={InsightCategory.HEALTH}>🏥 Health</option>
            <option value={InsightCategory.FINANCE}>💰 Finance</option>
            <option value={InsightCategory.PRODUCTIVITY}>📈 Productivity</option>
            <option value={InsightCategory.EFFICIENCY}>⚡ Efficiency</option>
            <option value={InsightCategory.PREDICTION}>🔮 Predictions</option>
            <option value={InsightCategory.OPTIMIZATION}>🎯 Optimization</option>
            <option value={InsightCategory.TREND}>📊 Trends</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Priorities</option>
            <option value={InsightPriority.CRITICAL}>🔴 Critical</option>
            <option value={InsightPriority.HIGH}>🟠 High</option>
            <option value={InsightPriority.MEDIUM}>🔵 Medium</option>
            <option value={InsightPriority.LOW}>🟢 Low</option>
            <option value={InsightPriority.INFO}>⚪ Info</option>
          </select>
        </div>

        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            id="show-actioned-insights"
            name="showActioned"
            checked={showActioned}
            onChange={(e) => setShowActioned(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Show actioned insights
        </label>

        <button
          onClick={loadInsights}
          style={{
            marginLeft: 'auto',
            padding: '6px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Insights List */}
      {filteredInsights.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '60px 20px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#111' }}>All Clear!</h3>
          <p style={{ margin: 0, color: '#666' }}>
            {showActioned ? 'No insights match your filters' : 'No new insights at the moment'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredInsights.map(insight => (
            <div
              key={insight.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                borderLeft: `4px solid ${getPriorityColor(insight.priority)}`,
                transition: 'all 0.2s'
              }}
            >
              {/* Insight Header */}
              <div
                onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '32px' }}>
                  {getCategoryIcon(insight.category)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111' }}>
                      {insight.title}
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      background: getPriorityColor(insight.priority),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {insight.priority}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    {insight.description}
                  </p>
                </div>

                <div style={{ fontSize: '20px', color: '#999' }}>
                  {expandedInsight === insight.id ? '▼' : '▶'}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedInsight === insight.id && (
                <div style={{
                  padding: '0 20px 20px 20px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div style={{ 
                    background: '#f9fafb', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginTop: '16px'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ fontSize: '13px', color: '#555' }}>💡 Impact:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#333' }}>
                        {insight.impact}
                      </p>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ fontSize: '13px', color: '#555' }}>📋 Recommended Action:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#333' }}>
                        {insight.recommendation}
                      </p>
                    </div>

                    {insight.affectedCount > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ fontSize: '13px', color: '#555' }}>🎯 Affected:</strong>
                        <span style={{ marginLeft: '8px', fontSize: '14px', color: '#333' }}>
                          {insight.affectedCount} items
                        </span>
                      </div>
                    )}

                    {insight.estimatedCost > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ fontSize: '13px', color: '#555' }}>💵 Estimated Cost:</strong>
                        <span style={{ marginLeft: '8px', fontSize: '14px', color: '#d97706' }}>
                          ${insight.estimatedCost.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {insight.estimatedSavings > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ fontSize: '13px', color: '#555' }}>💰 Potential Savings:</strong>
                        <span style={{ marginLeft: '8px', fontSize: '14px', color: '#059669' }}>
                          ${insight.estimatedSavings}
                        </span>
                      </div>
                    )}

                    {insight.estimatedGain > 0 && (
                      <div>
                        <strong style={{ fontSize: '13px', color: '#555' }}>📈 Potential Gain:</strong>
                        <span style={{ marginLeft: '8px', fontSize: '14px', color: '#059669' }}>
                          ${insight.estimatedGain}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    marginTop: '16px', 
                    display: 'flex', 
                    gap: '8px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => handleAction(insight.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      ✓ Mark as Actioned
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
