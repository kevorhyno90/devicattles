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

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
          📅 Timeline & Planning
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
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
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Active Items</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.active || 0}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Upcoming</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.upcoming || 0}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Completed</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>{stats.completed || 0}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Items</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#6b7280' }}>{stats.total || 0}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
                background: selectedCategory === cat ? '#3b82f6' : '#f3f4f6',
                color: selectedCategory === cat ? 'white' : '#1f2937',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                textTransform: 'capitalize'
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
                background: viewMode === mode ? '#059669' : '#f3f4f6',
                color: viewMode === mode ? 'white' : '#1f2937',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                textTransform: 'capitalize'
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
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          📥 Export
        </button>
      </div>

      {/* Date Navigator */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={() => navigateDate(-1)}
          style={{
            padding: '8px 16px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ←
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
            {formatDateRange()}
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            style={{
              padding: '4px 12px',
              background: '#e5e7eb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              color: '#4b5563'
            }}
          >
            Today
          </button>
        </div>
        
        <button
          onClick={() => navigateDate(1)}
          style={{
            padding: '8px 16px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          →
        </button>
      </div>

      {/* Timeline View */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
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
                    padding: '4px 0'
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
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
                      background: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'capitalize'
                    }}>
                      {item.category}
                    </span>
                  </div>
                  
                  <div style={{
                    height: '32px',
                    background: '#f3f4f6',
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
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
              background: 'white',
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
                  color: '#6b7280'
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
                color: 'white',
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
                <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '6px', fontSize: '13px' }}>
                  <div><strong>Additional Details:</strong></div>
                  {Object.entries(selectedItem.data).slice(0, 5).map(([key, value]) => (
                    <div key={key} style={{ marginTop: '4px' }}>
                      <span style={{ color: '#6b7280' }}>{key}:</span> {String(value).slice(0, 50)}
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
