/**
 * Inline Edit Pattern - Reusable Hooks and Components
 * 
 * Usage:
 * const { inlineEditId, inlineData, startEdit, saveEdit, cancelEdit, handleKeyDown } = useInlineEdit()
 */

import { useState } from 'react'

/**
 * Custom hook for inline editing
 */
export function useInlineEdit(onSave) {
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({})
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)

  const startEdit = (item) => {
    setInlineEditId(item.id)
    setInlineData({ ...item })
    setLastChange({ item: { ...item } })
  }

  const saveEdit = async () => {
    try {
      await onSave(inlineEditId, inlineData)
      setToast({ type: 'success', message: '✓ Updated', showUndo: true })
      setInlineEditId(null)
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to save' })
    }
  }

  const cancelEdit = () => {
    setInlineEditId(null)
    setInlineData({})
    setToast(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  const undoChange = async () => {
    if (!lastChange) return
    setInlineData(lastChange.item)
    await onSave(inlineEditId, lastChange.item)
    setToast(null)
  }

  return {
    isEditing: inlineEditId !== null,
    inlineEditId,
    inlineData,
    setInlineData,
    startEdit,
    saveEdit,
    cancelEdit,
    handleKeyDown,
    undoChange,
    toast,
    setToast
  }
}

/**
 * Toast Notification Component
 */
export function Toast({ toast, onUndo }) {
  if (!toast) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: toast.type === 'error' ? '#ef4444' : '#10b981',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        maxWidth: '300px',
        zIndex: 1000
      }}
    >
      <span>{toast.message}</span>
      {toast.showUndo && (
        <button
          onClick={onUndo}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        >
          Undo
        </button>
      )}
    </div>
  )
}

/**
 * Inline Edit Field Component
 * Renders either view or edit mode based on isEditing prop
 */
export function InlineEditField({
  isEditing,
  value,
  onChange,
  onKeyDown,
  type = 'text',
  placeholder = '',
  children,
  style = {}
}) {
  if (isEditing) {
    return (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus
        style={{
          padding: '6px 8px',
          border: '2px solid #3b82f6',
          borderRadius: '4px',
          fontSize: '14px',
          ...style
        }}
      />
    )
  }

  return <span style={style}>{children || value || '-'}</span>
}

/**
 * Edit Action Buttons Component
 */
export function EditActionButtons({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isLoading = false,
  style = {}
}) {
  if (!isEditing) {
    return (
      <button
        onClick={onEdit}
        style={{
          background: '#f0f0f0',
          border: '1px solid #ddd',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          ...style
        }}
      >
        ✏️ Edit
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '6px', ...style }}>
      <button
        onClick={onSave}
        disabled={isLoading}
        style={{
          background: '#10b981',
          color: 'white',
          border: 'none',
          padding: '4px 10px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          opacity: isLoading ? 0.6 : 1
        }}
      >
        {isLoading ? '...' : '✓ Save'}
      </button>
      <button
        onClick={onCancel}
        style={{
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '4px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        ✕ Cancel
      </button>
    </div>
  )
}
