import React, { useState, useEffect } from 'react'
import { InlineEditTable } from '../components/InlineEdit'

// Entity Types
const EntityType = {
  ANIMAL: 'cattalytics:animals',
  CROP: 'cattalytics:crops:v2',
  TASK: 'cattalytics:tasks',
  FINANCE: 'cattalytics:finance',
  INVENTORY: 'cattalytics:inventory'
}

/**
 * Advanced Batch Operations with Inline Editing
 * Demonstrates the new reusable inline edit components
 */
export default function AdvancedBatchOps() {
  const [entityType, setEntityType] = useState(EntityType.ANIMAL)
  const [data, setData] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkEditField, setBulkEditField] = useState('')
  const [bulkEditValue, setBulkEditValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [entityType])

  const loadData = () => {
    try {
      const raw = localStorage.getItem(entityType)
      const items = raw ? JSON.parse(raw) : []
      setData(items)
      setSelectedIds([])
    } catch (error) {
      console.error('Error loading data:', error)
      setData([])
    }
  }

  const handleSave = (updatedItem) => {
    try {
      const items = data.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
      localStorage.setItem(entityType, JSON.stringify(items))
      loadData()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleBulkUpdate = () => {
    if (selectedIds.length === 0) {
      alert('Please select items first')
      return
    }
    
    if (!bulkEditField || !bulkEditValue) {
      alert('Please enter field name and value')
      return
    }
    
    try {
      const items = data.map(item => {
        if (selectedIds.includes(item.id)) {
          return { ...item, [bulkEditField]: bulkEditValue }
        }
        return item
      })
      localStorage.setItem(entityType, JSON.stringify(items))
      setBulkEditField('')
      setBulkEditValue('')
      loadData()
      alert(`✅ Updated ${selectedIds.length} items`)
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }
  
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      alert('Please select items first')
      return
    }
    
    if (!confirm(`Delete ${selectedIds.length} items? This cannot be undone!`)) {
      return
    }
    
    try {
      const items = data.filter(item => !selectedIds.includes(item.id))
      localStorage.setItem(entityType, JSON.stringify(items))
      loadData()
      alert(`✅ Deleted ${selectedIds.length} items`)
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleDelete = (id) => {
    if (!confirm('Delete this item?')) return
    
    try {
      const items = data.filter(item => item.id !== id)
      localStorage.setItem(entityType, JSON.stringify(items))
      loadData()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedIds(data.map(item => item.id))
  }

  const deselectAll = () => {
    setSelectedIds([])
  }

  const getColumns = () => {
    switch (entityType) {
      case EntityType.ANIMAL:
        return [
          { key: 'tagNumber', label: 'Tag #', type: 'text' },
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'species', label: 'Species', type: 'text' },
          { key: 'breed', label: 'Breed', type: 'text' },
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: 'Active', label: 'Active' },
            { value: 'Sold', label: 'Sold' },
            { value: 'Deceased', label: 'Deceased' }
          ]},
          { key: 'weight', label: 'Weight (kg)', type: 'number' }
        ]
      case EntityType.CROP:
        return [
          { key: 'name', label: 'Crop Name', type: 'text' },
          { key: 'variety', label: 'Variety', type: 'text' },
          { key: 'area', label: 'Area (acres)', type: 'number' },
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: 'Planning', label: 'Planning' },
            { value: 'Planted', label: 'Planted' },
            { value: 'Growing', label: 'Growing' },
            { value: 'Harvested', label: 'Harvested' }
          ]}
        ]
      case EntityType.TASK:
        return [
          { key: 'title', label: 'Task', type: 'text' },
          { key: 'priority', label: 'Priority', type: 'select', options: [
            { value: 'Low', label: 'Low' },
            { value: 'Medium', label: 'Medium' },
            { value: 'High', label: 'High' }
          ]},
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: 'Pending', label: 'Pending' },
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Completed', label: 'Completed' }
          ]},
          { key: 'dueDate', label: 'Due Date', type: 'date' }
        ]
      default:
        return [
          { key: 'id', label: 'ID', type: 'text', editable: false },
          { key: 'name', label: 'Name', type: 'text' }
        ]
    }
  }

  const filteredData = data.filter(item => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchLower)
    )
  })

  const dataWithSelection = filteredData.map(item => ({
    ...item,
    _selected: selectedIds.includes(item.id)
  }))

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
          ⚡ Advanced Batch Operations
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Bulk edit, delete, and manage your farm data with inline editing
        </p>
      </div>

      {/* Entity Type Selector */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Select Data Type
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              width: '100%',
              maxWidth: '300px'
            }}
          >
            <option value={EntityType.ANIMAL}>🐄 Animals</option>
            <option value={EntityType.CROP}>🌾 Crops</option>
            <option value={EntityType.TASK}>✓ Tasks</option>
            <option value={EntityType.FINANCE}>💰 Finance</option>
            <option value={EntityType.INVENTORY}>📦 Inventory</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Search
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search across all fields..."
            style={{
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              width: '100%',
              maxWidth: '400px'
            }}
          />
        </div>
      </div>

      {/* Bulk Operations Panel */}
      {selectedIds.length > 0 && (
        <div style={{
          background: '#dbeafe',
          border: '2px solid #3b82f6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
                {selectedIds.length} items selected
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#60a5fa' }}>
                Perform bulk operations on selected items
              </p>
            </div>
            <button
              onClick={deselectAll}
              style={{
                padding: '6px 12px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Deselect All
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                Field to Update
              </label>
              <input
                type="text"
                value={bulkEditField}
                onChange={(e) => setBulkEditField(e.target.value)}
                placeholder="e.g., status"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #93c5fd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                New Value
              </label>
              <input
                type="text"
                value={bulkEditValue}
                onChange={(e) => setBulkEditValue(e.target.value)}
                placeholder="e.g., Active"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #93c5fd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleBulkUpdate}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ✓ Update All
              </button>
              <button
                onClick={handleBulkDelete}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🗑️ Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Items</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{data.length}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Filtered</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{filteredData.length}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Selected</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>{selectedIds.length}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <button
          onClick={selectAll}
          style={{
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ✓ Select All ({filteredData.length})
        </button>
        <button
          onClick={loadData}
          style={{
            padding: '10px 20px',
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

      {/* Data Table with Inline Editing */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <InlineEditTable
          data={dataWithSelection}
          columns={[
            {
              key: '_selected',
              label: '☑',
              type: 'checkbox',
              editable: false,
              render: (value, item) => (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              )
            },
            ...getColumns()
          ]}
          onSave={handleSave}
          onDelete={handleDelete}
          keyField="id"
          editable={true}
          deletable={true}
        />
      </div>

      {/* Help Section */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
          💡 Tips & Keyboard Shortcuts
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: '1.8' }}>
          <li><strong>Click ⚡ Edit</strong> to enable inline editing for any row</li>
          <li><strong>Ctrl+Enter</strong> to save changes</li>
          <li><strong>Esc</strong> to cancel editing</li>
          <li><strong>Ctrl+Z</strong> to undo last change</li>
          <li><strong>Select multiple items</strong> for bulk operations</li>
          <li><strong>Search</strong> works across all fields instantly</li>
        </ul>
      </div>
    </div>
  )
}
