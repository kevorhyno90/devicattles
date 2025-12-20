import React, { useState } from 'react'

// Custom hook for inline editing
export const useInlineEdit = (initialValue, onSave) => {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue)

  const handleSave = () => {
    onSave(value)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setValue(initialValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return {
    isEditing,
    value,
    setValue,
    setIsEditing,
    handleSave,
    handleCancel,
    handleKeyDown
  }
}

// Inline editable field component
export const InlineEditField = ({ value, onSave, type = 'text', placeholder = 'Click to edit' }) => {
  const {
    isEditing,
    value: editValue,
    setValue,
    setIsEditing,
    handleSave,
    handleCancel,
    handleKeyDown
  } = useInlineEdit(value, onSave)

  if (isEditing) {
    return (
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <input
          id={`inline-edit-${field}`}
          name={field}
          type={type}
          value={editValue}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          style={{
            padding: '4px 8px',
            border: '2px solid #4CAF50',
            borderRadius: '4px',
            fontSize: '14px',
            flex: 1
          }}
        />
        <button
          onClick={handleSave}
          style={{
            padding: '4px 8px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✓
        </button>
        <button
          onClick={handleCancel}
          style={{
            padding: '4px 8px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✗
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        padding: '4px 8px',
        cursor: 'pointer',
        borderRadius: '4px',
        border: '2px solid transparent',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {value || <span style={{ color: '#999', fontStyle: 'italic' }}>{placeholder}</span>}
    </div>
  )
}

// Inline editable table component
export const InlineEditTable = ({ 
  data, 
  columns, 
  onSave, 
  onDelete,
  selected = [],
  onToggleSelect
}) => {
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (rowId, colKey, currentValue) => {
    setEditingCell({ rowId, colKey })
    setEditValue(currentValue || '')
  }

  const saveEdit = (rowId) => {
    if (editingCell) {
      onSave(rowId, { [editingCell.colKey]: editValue })
      setEditingCell(null)
      setEditValue('')
    }
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleKeyDown = (e, rowId) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit(rowId)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            {onToggleSelect && (
              <th style={{ 
                padding: '12px', 
                textAlign: 'left',
                borderBottom: '2px solid #ddd',
                width: '40px'
              }}>
                ☑
              </th>
            )}
            {columns.map(col => (
              <th key={col.key} style={{ 
                padding: '12px', 
                textAlign: 'left',
                borderBottom: '2px solid #ddd',
                fontWeight: '600',
                color: '#333'
              }}>
                {col.label}
              </th>
            ))}
            {onDelete && (
              <th style={{ 
                padding: '12px', 
                textAlign: 'center',
                borderBottom: '2px solid #ddd',
                width: '80px'
              }}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length + (onToggleSelect ? 1 : 0) + (onDelete ? 1 : 0)}
                style={{ 
                  padding: '40px', 
                  textAlign: 'center',
                  color: '#999',
                  fontStyle: 'italic'
                }}
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr 
                key={row.id || idx}
                style={{ 
                  borderBottom: '1px solid #eee',
                  background: selected?.includes(row.id) ? '#e3f2fd' : 'white',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!selected?.includes(row.id)) {
                    e.currentTarget.style.background = '#fafafa'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected?.includes(row.id)) {
                    e.currentTarget.style.background = 'white'
                  }
                }}
              >
                {onToggleSelect && (
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selected?.includes(row.id) || false}
                      onChange={() => onToggleSelect(row.id)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
                )}
                {columns.map(col => {
                  const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key
                  const cellValue = row[col.key]

                  return (
                    <td 
                      key={col.key} 
                      style={{ padding: '12px' }}
                    >
                      {col.editable === false || !onSave ? (
                        <div>{cellValue}</div>
                      ) : isEditing ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <input
                            type={col.type || 'text'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, row.id)}
                            onBlur={() => saveEdit(row.id)}
                            autoFocus
                            style={{
                              padding: '6px 10px',
                              border: '2px solid #4CAF50',
                              borderRadius: '4px',
                              fontSize: '14px',
                              flex: 1
                            }}
                          />
                          <button
                            onClick={() => saveEdit(row.id)}
                            style={{
                              padding: '4px 8px',
                              background: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{
                              padding: '4px 8px',
                              background: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEdit(row.id, col.key, cellValue)}
                          style={{
                            padding: '4px 8px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            border: '2px solid transparent',
                            minHeight: '20px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f5f5f5'
                            e.currentTarget.style.borderColor = '#ddd'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = 'transparent'
                          }}
                        >
                          {cellValue || <span style={{ color: '#999', fontStyle: 'italic' }}>Click to edit</span>}
                        </div>
                      )}
                    </td>
                  )
                })}
                {onDelete && (
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => onDelete(row.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#d32f2f'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f44336'}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div style={{ 
        marginTop: '10px', 
        padding: '10px', 
        background: '#f5f5f5', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
      }}>
        💡 <strong>Tip:</strong> Click any cell to edit inline. Press <kbd>Enter</kbd> to save, <kbd>Esc</kbd> to cancel.
      </div>
    </div>
  )
}

// Inline editable card component
export const InlineEditCard = ({ data, onSave, onDelete }) => {
  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '15px'
    }}>
      {Object.entries(data).map(([key, value]) => {
        if (key === 'id') return null
        
        return (
          <div key={key} style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#555',
              marginBottom: '5px',
              fontSize: '13px',
              textTransform: 'capitalize'
            }}>
              {key.replace(/_/g, ' ')}
            </label>
            <InlineEditField
              value={value}
              onSave={(newValue) => onSave(data.id, { [key]: newValue })}
              placeholder={`Enter ${key}`}
            />
          </div>
        )
      })}
      {onDelete && (
        <button
          onClick={() => onDelete(data.id)}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🗑️ Delete
        </button>
      )}
    </div>
  )
}
