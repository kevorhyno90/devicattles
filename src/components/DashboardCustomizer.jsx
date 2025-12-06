import React, { useState, useEffect, useRef } from 'react'
import {
  WIDGET_LIBRARY,
  WidgetType,
  loadLayout,
  saveLayout,
  resetLayout,
  addWidget,
  removeWidget,
  updateWidget,
  updateWidgetConfig,
  duplicateWidget,
  getWidgetsByCategory,
  PRESET_LAYOUTS,
  applyPresetLayout,
  getWidgetData
} from '../lib/dashboardWidgets'

export default function DashboardCustomizer({ onClose }) {
  const [layout, setLayout] = useState([])
  const [selectedWidget, setSelectedWidget] = useState(null)
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState(null)
  const [gridCols, setGridCols] = useState(4)
  const [gridRows, setGridRows] = useState(6)
  const [previewMode, setPreviewMode] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  useEffect(() => {
    setLayout(loadLayout())
  }, [])

  const handleAddWidget = (widgetType) => {
    const newWidget = addWidget(widgetType)
    if (newWidget) {
      setLayout(loadLayout())
      setUnsavedChanges(true)
      setShowWidgetLibrary(false)
    }
  }

  const handleRemoveWidget = (widgetId) => {
    if (confirm('Remove this widget from the dashboard?')) {
      removeWidget(widgetId)
      setLayout(loadLayout())
      setUnsavedChanges(true)
      setSelectedWidget(null)
    }
  }

  const handleDuplicateWidget = (widgetId) => {
    const duplicate = duplicateWidget(widgetId)
    if (duplicate) {
      setLayout(loadLayout())
      setUnsavedChanges(true)
    }
  }

  const handleMoveWidget = (widgetId, direction) => {
    const widget = layout.find(w => w.id === widgetId)
    if (!widget) return

    const updates = {}
    switch (direction) {
      case 'up': updates.y = Math.max(0, widget.y - 1); break
      case 'down': updates.y = widget.y + 1; break
      case 'left': updates.x = Math.max(0, widget.x - 1); break
      case 'right': updates.x = Math.min(gridCols - widget.w, widget.x + 1); break
    }

    updateWidget(widgetId, updates)
    setLayout(loadLayout())
    setUnsavedChanges(true)
  }

  const handleResizeWidget = (widgetId, dimension, change) => {
    const widget = layout.find(w => w.id === widgetId)
    if (!widget) return

    const updates = {}
    if (dimension === 'width') {
      updates.w = Math.max(1, Math.min(gridCols, widget.w + change))
    } else {
      updates.h = Math.max(1, Math.min(4, widget.h + change))
    }

    updateWidget(widgetId, updates)
    setLayout(loadLayout())
    setUnsavedChanges(true)
  }

  const handleApplyPreset = (presetName) => {
    if (unsavedChanges && !confirm('Discard current layout and apply preset?')) {
      return
    }

    applyPresetLayout(presetName)
    setLayout(loadLayout())
    setUnsavedChanges(false)
    setShowPresets(false)
  }

  const handleReset = () => {
    if (confirm('Reset dashboard to default layout? This cannot be undone.')) {
      resetLayout()
      setLayout(loadLayout())
      setUnsavedChanges(false)
    }
  }

  const handleSave = () => {
    saveLayout(layout)
    setUnsavedChanges(false)
    alert('✅ Dashboard layout saved!')
  }

  const handleClose = () => {
    if (unsavedChanges && !confirm('You have unsaved changes. Close without saving?')) {
      return
    }
    onClose && onClose()
  }

  const widgetsByCategory = getWidgetsByCategory()

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      overflow: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        maxWidth: 1400,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: 24,
          borderBottom: '2px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24 }}>🎨 Dashboard Customizer</h2>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: 14 }}>
              Drag, resize, and arrange widgets • {layout.length} widgets
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {unsavedChanges && (
              <span style={{
                padding: '6px 12px',
                background: '#fbbf24',
                color: '#78350f',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 'bold'
              }}>
                ● Unsaved Changes
              </span>
            )}
            <button onClick={handleClose} style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{
          padding: 16,
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          background: '#f9fafb'
        }}>
          <button onClick={() => setShowWidgetLibrary(!showWidgetLibrary)} style={{
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14
          }}>
            ➕ Add Widget
          </button>

          <button onClick={() => setShowPresets(!showPresets)} style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14
          }}>
            📋 Presets
          </button>

          <button onClick={handleReset} style={{
            padding: '10px 20px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14
          }}>
            🔄 Reset
          </button>

          <button onClick={() => setPreviewMode(!previewMode)} style={{
            padding: '10px 20px',
            background: previewMode ? '#8b5cf6' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14
          }}>
            {previewMode ? '✏️ Edit Mode' : '👁️ Preview'}
          </button>

          <div style={{ flex: 1 }} />

          <button onClick={handleSave} style={{
            padding: '10px 24px',
            background: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
            boxShadow: '0 4px 12px rgba(5,150,105,0.3)'
          }}>
            💾 Save Layout
          </button>
        </div>

        {/* Widget Library Modal */}
        {showWidgetLibrary && (
          <div style={{
            padding: 24,
            background: '#f3f4f6',
            borderBottom: '2px solid #d1d5db'
          }}>
            <h3 style={{ marginTop: 0 }}>📚 Widget Library</h3>
            {Object.entries(widgetsByCategory).map(([category, widgets]) => (
              <div key={category} style={{ marginBottom: 24 }}>
                <h4 style={{
                  margin: '0 0 12px 0',
                  color: '#6b7280',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }}>
                  {category}
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 12
                }}>
                  {widgets.map(widget => (
                    <div key={widget.id} style={{
                      padding: 16,
                      background: 'white',
                      borderRadius: 8,
                      border: '2px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                      onClick={() => handleAddWidget(widget.id)}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                    >
                      <div style={{ fontSize: 32, marginBottom: 8 }}>{widget.icon}</div>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{widget.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{widget.description}</div>
                      <div style={{
                        marginTop: 8,
                        display: 'flex',
                        gap: 8,
                        fontSize: 11,
                        color: '#9ca3af'
                      }}>
                        <span>Size: {widget.defaultSize.w}x{widget.defaultSize.h}</span>
                        {widget.resizable && <span>• Resizable</span>}
                        {widget.configurable && <span>• Configurable</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Presets Modal */}
        {showPresets && (
          <div style={{
            padding: 24,
            background: '#f3f4f6',
            borderBottom: '2px solid #d1d5db'
          }}>
            <h3 style={{ marginTop: 0 }}>📋 Layout Presets</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16
            }}>
              {Object.entries(PRESET_LAYOUTS).map(([key, preset]) => (
                <div key={key} style={{
                  padding: 20,
                  background: 'white',
                  borderRadius: 8,
                  border: '2px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                  onClick={() => handleApplyPreset(key)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                    {preset.name}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                    {preset.description}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {preset.layout.length} widgets
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid Layout */}
        <div style={{ padding: 24 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: 16,
            minHeight: 600
          }}>
            {layout.map(widget => {
              const widgetDef = WIDGET_LIBRARY[widget.type]
              const isSelected = selectedWidget?.id === widget.id

              return (
                <div key={widget.id} style={{
                  gridColumn: `span ${widget.w}`,
                  gridRow: `span ${widget.h}`,
                  background: 'white',
                  border: isSelected ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  position: 'relative',
                  boxShadow: isSelected ? '0 8px 24px rgba(59,130,246,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  cursor: previewMode ? 'default' : 'pointer'
                }}
                  onClick={() => !previewMode && setSelectedWidget(widget)}
                >
                  {/* Widget Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    paddingBottom: 12,
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{widgetDef.icon}</span>
                      <span style={{ fontWeight: 'bold', fontSize: 14 }}>
                        {widgetDef.name}
                      </span>
                    </div>
                    {!previewMode && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicateWidget(widget.id)
                        }} style={{
                          padding: '4px 8px',
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12
                        }}>
                          📋
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveWidget(widget.id)
                        }} style={{
                          padding: '4px 8px',
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12
                        }}>
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Widget Content Placeholder */}
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: 13,
                    textAlign: 'center'
                  }}>
                    {previewMode ? (
                      <WidgetPreview widget={widget} />
                    ) : (
                      <div>
                        <div>{widgetDef.description}</div>
                        <div style={{ marginTop: 8, fontSize: 11 }}>
                          Size: {widget.w}x{widget.h} • Position: ({widget.x}, {widget.y})
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls (when selected) */}
                  {isSelected && !previewMode && (
                    <div style={{
                      position: 'absolute',
                      bottom: -40,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      gap: 8,
                      justifyContent: 'center',
                      padding: 8,
                      background: 'white',
                      border: '2px solid #3b82f6',
                      borderTop: 'none',
                      borderRadius: '0 0 12px 12px',
                      boxShadow: '0 4px 12px rgba(59,130,246,0.2)'
                    }}>
                      {/* Move Controls */}
                      <button onClick={() => handleMoveWidget(widget.id, 'up')} style={controlButtonStyle}>↑</button>
                      <button onClick={() => handleMoveWidget(widget.id, 'down')} style={controlButtonStyle}>↓</button>
                      <button onClick={() => handleMoveWidget(widget.id, 'left')} style={controlButtonStyle}>←</button>
                      <button onClick={() => handleMoveWidget(widget.id, 'right')} style={controlButtonStyle}>→</button>

                      {/* Resize Controls */}
                      {widgetDef.resizable && (
                        <>
                          <div style={{ width: 1, background: '#d1d5db', margin: '0 4px' }} />
                          <button onClick={() => handleResizeWidget(widget.id, 'width', -1)} style={controlButtonStyle}>W-</button>
                          <button onClick={() => handleResizeWidget(widget.id, 'width', 1)} style={controlButtonStyle}>W+</button>
                          <button onClick={() => handleResizeWidget(widget.id, 'height', -1)} style={controlButtonStyle}>H-</button>
                          <button onClick={() => handleResizeWidget(widget.id, 'height', 1)} style={controlButtonStyle}>H+</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Help Section */}
        <div style={{
          padding: 24,
          background: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          borderRadius: '0 0 12px 12px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>💡 Quick Guide</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, fontSize: 13, color: '#6b7280' }}>
            <div>• <strong>Click widget</strong> to select and show controls</div>
            <div>• <strong>Arrow buttons</strong> to move widget</div>
            <div>• <strong>W+/W-</strong> to adjust width</div>
            <div>• <strong>H+/H-</strong> to adjust height</div>
            <div>• <strong>Preview mode</strong> to see live data</div>
            <div>• <strong>Save</strong> before closing to keep changes</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Widget Preview Component
function WidgetPreview({ widget }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    const widgetData = getWidgetData(widget.type, widget.config)
    setData(widgetData)
  }, [widget.type, widget.config])

  if (!data) {
    return <div>Loading...</div>
  }

  // Render different previews based on widget type
  switch (widget.type) {
    case WidgetType.ANIMAL_COUNT:
      return (
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#059669' }}>{data.total}</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Total Animals</div>
          <div style={{ marginTop: 12, fontSize: 12 }}>
            {Object.entries(data.bySpecies).map(([species, count]) => (
              <div key={species} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>{species}</span>
                <span style={{ fontWeight: 'bold' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )

    case WidgetType.TASK_LIST:
      return (
        <div style={{ width: '100%' }}>
          {data.length === 0 ? (
            <div>No upcoming tasks</div>
          ) : (
            data.map(task => (
              <div key={task.id} style={{
                padding: 8,
                background: '#f9fafb',
                borderRadius: 6,
                marginBottom: 8,
                fontSize: 12
              }}>
                <div style={{ fontWeight: 'bold' }}>{task.title}</div>
                <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>
                  Due: {task.dueDate}
                </div>
              </div>
            ))
          )}
        </div>
      )

    default:
      return <div>Widget preview available in full dashboard</div>
  }
}

const controlButtonStyle = {
  padding: '6px 12px',
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 'bold'
}
