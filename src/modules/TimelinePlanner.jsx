import React, { useState, useEffect } from 'react'
import {
  generateAllTimelines,
  getTimelineForRange,
  getTimelineStats,
  exportTimelineData
} from '../lib/timelineData'

/**
 * Timeline & Planning View
 * Gantt-style visualization for crops, breeding, tasks, and treatments
 */
export default function TimelinePlanner() {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('month') // week, month, quarter, year
  const [currentDate, setCurrentDate] = useState(new Date())
  const [stats, setStats] = useState({})
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    loadTimelineData()
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, selectedCategory, viewMode, currentDate])

  const loadTimelineData = () => {
    const allItems = generateAllTimelines()
    setItems(allItems)
    setStats(getTimelineStats())
  }

  const filterItems = () => {
    let filtered = items

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Filter by date range based on view mode
    const { start, end } = getDateRange(currentDate, viewMode)
    filtered = filtered.filter(item => {
      return item.end >= start && item.start <= end
    })

    setFilteredItems(filtered)
  }

  const getDateRange = (date, mode) => {
    const start = new Date(date)
    const end = new Date(date)

    switch (mode) {
      case 'week':
        start.setDate(start.getDate() - start.getDay())
        end.setDate(start.getDate() + 6)
        break
      case 'month':
        start.setDate(1)
        end.setMonth(end.getMonth() + 1, 0)
        break
      case 'quarter':
        const quarter = Math.floor(start.getMonth() / 3)
        start.setMonth(quarter * 3, 1)
        end.setMonth(quarter * 3 + 3, 0)
        break
      case 'year':
        start.setMonth(0, 1)
        end.setMonth(11, 31)
        break
    }

    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate)
    
    switch (viewMode) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7))
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction)
        break
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + (direction * 3))
        break
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + direction)
        break
    }
    
    setCurrentDate(newDate)
  }

  const handleExport = () => {
    const data = exportTimelineData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timeline-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDateRange = () => {
    const { start, end } = getDateRange(currentDate, viewMode)
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' }
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
  }

  const surfaceStyle = {
    background: 'var(--bg-elevated, #ffffff)',
    border: '1px solid var(--border-primary, #e5e7eb)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
  }

  const mutedText = { color: 'var(--text-secondary, #4b5563)' }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: 'var(--text-primary, #1f2937)' }}>
      <div style={{
        marginBottom: '24px',
        padding: '20px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(59, 130, 246, 0.16) 100%)',
        border: '1px solid var(--border-primary, #e5e7eb)'
      }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary, #1f2937)' }}>
          📅 Timeline & Planning
        </h2>
        <p style={{ margin: 0, fontSize: '14px', ...mutedText }}>
          Gantt view of crops, breeding, tasks, and treatments
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ ...surfaceStyle, padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', marginBottom: '4px', ...mutedText }}>Active Items</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.active || 0}</div>
        </div>
        <div style={{ ...surfaceStyle, padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', marginBottom: '4px', ...mutedText }}>Upcoming</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.upcoming || 0}</div>
        </div>
        <div style={{ ...surfaceStyle, padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', marginBottom: '4px', ...mutedText }}>Completed</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>{stats.completed || 0}</div>
        </div>
        <div style={{ ...surfaceStyle, padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', marginBottom: '4px', ...mutedText }}>Total Items</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary, #1f2937)' }}>{stats.total || 0}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        ...surfaceStyle,
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Category filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'crop', 'breeding', 'task', 'treatment'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                background: selectedCategory === cat ? '#3b82f6' : 'var(--bg-secondary, #f3f4f6)',
                color: selectedCategory === cat ? '#f8fafc' : 'var(--text-primary, #1f2937)',
                border: selectedCategory === cat ? 'none' : '1px solid var(--border-primary, #e5e7eb)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {cat === 'all' ? 'All' : cat + 's'}
            </button>
          ))}
        </div>

        {/* View mode */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['week', 'month', 'quarter', 'year'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '8px 12px',
                background: viewMode === mode ? '#059669' : 'var(--bg-secondary, #f3f4f6)',
                color: viewMode === mode ? '#f8fafc' : 'var(--text-primary, #1f2937)',
                border: viewMode === mode ? 'none' : '1px solid var(--border-primary, #e5e7eb)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          style={{
            padding: '8px 16px',
            background: '#8b5cf6',
            color: '#f8fafc',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'transform 0.2s ease'
          }}
        >
          📥 Export
        </button>
      </div>

      {/* Date Navigator */}
      <div style={{
        ...surfaceStyle,
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={() => navigateDate(-1)}
          style={{
            padding: '8px 16px',
            background: 'var(--bg-secondary, #f3f4f6)',
            border: '1px solid var(--border-primary, #e5e7eb)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            color: 'var(--text-primary, #1f2937)'
          }}
        >
          ←
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-primary, #1f2937)' }}>
            {formatDateRange()}
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            style={{
              padding: '4px 12px',
              background: 'var(--bg-secondary, #e5e7eb)',
              border: '1px solid var(--border-primary, #d1d5db)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              color: 'var(--text-secondary, #4b5563)'
            }}
          >
            Today
          </button>
        </div>
        
        <button
          onClick={() => navigateDate(1)}
          style={{
            padding: '8px 16px',
            background: 'var(--bg-secondary, #f3f4f6)',
            border: '1px solid var(--border-primary, #e5e7eb)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            color: 'var(--text-primary, #1f2937)'
          }}
        >
          →
        </button>
      </div>

      {/* Timeline View */}
      <div style={{
        ...surfaceStyle,
        padding: '20px',
        borderRadius: '8px',
        overflowX: 'auto'
      }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary, #4b5563)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
            <div>No items in this time period</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>
              Try selecting a different date range or category
            </div>
          </div>
        ) : (
          <div style={{ minWidth: '800px' }}>
            {filteredItems.map(item => {
              const { start: rangeStart, end: rangeEnd } = getDateRange(currentDate, viewMode)
              const totalDays = (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)
              
              const itemStart = item.start < rangeStart ? rangeStart : item.start
              const itemEnd = item.end > rangeEnd ? rangeEnd : item.end
              
              const startOffset = ((itemStart - rangeStart) / (1000 * 60 * 60 * 24)) / totalDays * 100
              const width = ((itemEnd - itemStart) / (1000 * 60 * 60 * 24)) / totalDays * 100
              
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    marginBottom: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '6px 4px',
                    borderRadius: '8px',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary, #4b5563)',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: item.color,
                      display: 'inline-block'
                    }} />
                    <span>{item.name}</span>
                    <span style={{
                      fontSize: '10px',
                      background: 'var(--bg-secondary, #f3f4f6)',
                      color: 'var(--text-secondary, #4b5563)',
                      border: '1px solid var(--border-primary, #e5e7eb)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'capitalize'
                    }}>
                      {item.category}
                    </span>
                  </div>
                  
                  <div style={{
                    height: '32px',
                    background: 'var(--bg-secondary, #f3f4f6)',
                    borderRadius: '6px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: `${startOffset}%`,
                      width: `${Math.max(width, 1)}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}>
                      {item.progress > 0 && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${item.progress}%`,
                          background: 'rgba(255,255,255,0.3)',
                          borderRadius: '6px'
                        }} />
                      )}
                      <span style={{ position: 'relative', zIndex: 1 }}>
                        {item.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-elevated, #ffffff)',
              border: '1px solid var(--border-primary, #e5e7eb)',
              color: 'var(--text-primary, #1f2937)',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>{selectedItem.name}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary, #4b5563)'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: selectedItem.color,
                color: '#f8fafc',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}>
                {selectedItem.category}
              </span>
            </div>

            <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Start Date:</strong> {selectedItem.start.toLocaleDateString()}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>End Date:</strong> {selectedItem.end.toLocaleDateString()}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Progress:</strong> {selectedItem.progress}%
              </div>
              
              {selectedItem.data && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'var(--bg-secondary, #f9fafb)',
                  border: '1px solid var(--border-primary, #e5e7eb)',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  <div><strong>Additional Details:</strong></div>
                  {Object.entries(selectedItem.data).slice(0, 5).map(([key, value]) => (
                    <div key={key} style={{ marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-secondary, #4b5563)' }}>{key}:</span> {String(value).slice(0, 50)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
