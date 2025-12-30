import React, { useState } from 'react';

// Dummy data for demonstration
const dummyInsights = [
  {
    id: 1,
    title: 'Livestock Health Alert',
    description: 'Detected abnormal temperature in cattle group A.',
    impact: 'Potential disease outbreak.',
    recommendation: 'Isolate affected animals and consult a vet.',
    affectedCount: 5,
    estimatedCost: 200,
    priority: 'high',
    category: 'health',
  },
      <h2 style={{ marginBottom: 24 }}>AI-Powered Insights</h2>
      {insights.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
          <div style={{ fontSize: 48 }}>🎉</div>
          <p>No insights available.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {insights.map((insight) => (
            <div
              key={insight.id}
              style={{
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${getPriorityColor(insight.priority)}`,
                marginBottom: 8,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 32 }}>{getCategoryIcon(insight.category)}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{insight.title}</h3>
                  <p style={{ margin: '4px 0', color: '#555' }}>{insight.description}</p>
                </div>
                <button
                  onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                  style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
                  aria-label="Expand details"
                >
                  {expandedInsight === insight.id ? '▼' : '▶'}
                </button>
              </div>
              {expandedInsight === insight.id && (
                <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
                  <div><strong>Impact:</strong> {insight.impact}</div>
                  <div><strong>Recommendation:</strong> {insight.recommendation}</div>
                  {insight.affectedCount > 0 && (
                    <div><strong>Affected:</strong> {insight.affectedCount} animals</div>
                  )}
                  {insight.estimatedCost > 0 && (
                    <div><strong>Estimated Cost:</strong> ${insight.estimatedCost}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react'
import { exportToCSV, exportToJSON } from '../lib/exportImport'
import { 
  generateInsights, 
  getInsightsByCategory, 
  getInsightsByPriority,
  calculateTotalImpact
} from '../lib/aiInsights'


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
                </React.Fragment>
              )}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minWidth: 180
                  }}
                />

                {/* Export */}
                <button
                  onClick={() => exportToCSV(filteredInsights, 'ai-insights.csv')}
                  style={{
                    padding: '6px 12px',
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ⬇️ Export CSV
                </button>
                <button
                  onClick={() => exportToJSON(filteredInsights, 'ai-insights.json')}
                  style={{
                    padding: '6px 12px',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ⬇️ Export JSON
                </button>
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
          {pagedInsights.map(insight => (
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
                // ...existing code...
              >
                {/* ...existing code... */}
              </div>
              {/* ...existing code... */}
            </div>
          ))}
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, margin: '24px 0' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', background: page === 1 ? '#f3f4f6' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                ◀ Prev
              </button>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', background: page === totalPages ? '#f3f4f6' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next ▶
              </button>
            </div>
          )}
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
