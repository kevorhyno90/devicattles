import React, { useEffect, useMemo, useState } from 'react'
import { loadData, saveData } from '../lib/storage'

const NOTES_KEY = 'cattalytics:notes'
const MODULE_OPTIONS = [
  'General',
  'Tasks',
  'Animals',
  'Goats',
  'Kids',
  'Crops',
  'Pastures',
  'Health',
  'Breeding',
  'Inventory',
  'Finance',
  'Weather',
  'Analytics'
]

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [search, setSearch] = useState('')
  const [filterModule, setFilterModule] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    title: '',
    body: '',
    module: 'General',
    tags: '',
    dueDate: '',
    priority: 'Normal',
    pinned: false
  })

  useEffect(() => {
    const stored = loadData(NOTES_KEY, [])
    setNotes(stored)
  }, [])

  useEffect(() => {
    saveData(NOTES_KEY, notes)
  }, [notes])

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const resetForm = () => {
    setForm({ title: '', body: '', module: 'General', tags: '', dueDate: '', priority: 'Normal', pinned: false })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = () => {
    if (!form.title.trim()) {
      showToast('Title is required', 'error')
      return
    }

    const now = new Date().toISOString()
    if (editingId) {
      const updated = notes.map(n => n.id === editingId ? { ...form, id: editingId, updatedAt: now, createdAt: n.createdAt } : n)
      setNotes(updated)
      showToast('Note updated', 'success')
    } else {
      const newNote = {
        ...form,
        id: 'NOTE-' + Date.now(),
        createdAt: now,
        updatedAt: now
      }
      setNotes([newNote, ...notes])
      showToast('Note added', 'success')
    }
    resetForm()
  }

  const handleEdit = (note) => {
    setForm({
      title: note.title,
      body: note.body,
      module: note.module,
      tags: note.tags || '',
      dueDate: note.dueDate || '',
      priority: note.priority || 'Normal',
      pinned: !!note.pinned
    })
    setEditingId(note.id)
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this note?')) {
      setNotes(notes.filter(n => n.id !== id))
      showToast('Note deleted', 'success')
    }
  }

  const togglePin = (id) => {
    setNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n))
  }

  const filteredNotes = useMemo(() => {
    const term = search.toLowerCase()
    return notes
      .filter(n => filterModule === 'All' || n.module === filterModule)
      .filter(n =>
        !term ||
        n.title.toLowerCase().includes(term) ||
        n.body.toLowerCase().includes(term) ||
        (n.tags || '').toLowerCase().includes(term)
      )
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      })
  }, [notes, search, filterModule])

  const stats = useMemo(() => {
    const total = notes.length
    const pinned = notes.filter(n => n.pinned).length
    const dueSoon = notes.filter(n => {
      if (!n.dueDate) return false
      const now = Date.now()
      const due = new Date(n.dueDate).getTime()
      return due > now && due - now <= 3 * 24 * 60 * 60 * 1000
    }).length
    return { total, pinned, dueSoon }
  }, [notes])

  const surfaceCard = {
    background: 'var(--bg-elevated, #ffffff)',
    border: '1px solid var(--border-primary, #e5e7eb)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
  }

  const inputBaseStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-secondary, #d1d5db)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary, #111827)',
    background: 'var(--bg-elevated, #ffffff)',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary, #374151)',
    marginBottom: '6px'
  }

  return (
    <div style={{
      padding: '24px',
      background: 'var(--bg-primary, #f9fafb)',
      color: 'var(--text-primary, #111827)',
      minHeight: '100vh'
    }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px',
          background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white', padding: '12px 16px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary, #111827)', marginBottom: '6px' }}>🗒️ Notes & Scratchpad</h1>
        <p style={{ color: 'var(--text-secondary, #4b5563)', fontSize: '14px' }}>Capture quick notes before pushing them into the right modules.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ ...surfaceCard, padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #4b5563)', fontWeight: 600 }}>Total Notes</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>{stats.total}</div>
        </div>
        <div style={{ ...surfaceCard, padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #4b5563)', fontWeight: 600 }}>Pinned</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6' }}>{stats.pinned}</div>
        </div>
        <div style={{ ...surfaceCard, padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #4b5563)', fontWeight: 600 }}>Due Soon (3d)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{stats.dueSoon}</div>
        </div>
      </div>

      <div style={{ ...surfaceCard, padding: '14px', borderRadius: '10px', marginBottom: '18px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search notes by text or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputBaseStyle, flex: 1, minWidth: '220px' }}
        />
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          style={{ ...inputBaseStyle, width: 'auto', minWidth: '180px' }}
        >
          <option value="All">All Modules</option>
          {MODULE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          style={{
            padding: '10px 16px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ➕ New Note
        </button>
      </div>

      {showForm && (
        <div style={{ ...surfaceCard, padding: '16px', borderRadius: '10px', marginBottom: '18px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
            {editingId ? 'Edit Note' : 'Add Note'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={inputBaseStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Module</label>
              <select
                value={form.module}
                onChange={(e) => setForm({ ...form, module: e.target.value })}
                style={inputBaseStyle}
              >
                {MODULE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tags (comma separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. vaccine, supplier"
                style={inputBaseStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Due Date (optional)</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                style={inputBaseStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                style={inputBaseStyle}
              >
                <option>Low</option>
                <option>Normal</option>
                <option>High</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
              <input
                id="note-pinned"
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              <label htmlFor="note-pinned" style={{ fontSize: '14px', color: 'var(--text-secondary, #374151)' }}>Pin note</label>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Details</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows="4"
              placeholder="Capture details you will later copy into the right module..."
              style={{ ...inputBaseStyle, fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave}
              style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              💾 Save
            </button>
            <button
              onClick={resetForm}
              style={{
                padding: '10px 16px',
                background: 'var(--bg-secondary, #e5e7eb)',
                color: 'var(--text-primary, #111827)',
                border: '1px solid var(--border-primary, #d1d5db)',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ✖️ Cancel
            </button>
          </div>
        </div>
      )}

      {filteredNotes.length === 0 ? (
        <div style={{ ...surfaceCard, padding: '32px', borderRadius: '10px', textAlign: 'center', color: 'var(--text-secondary, #4b5563)' }}>
          <div style={{ fontSize: '42px', marginBottom: '10px' }}>🗒️</div>
          <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary, #111827)' }}>No notes yet</div>
          <div style={{ fontSize: '14px' }}>Capture quick notes and later move them into the right modules.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {filteredNotes.map(note => (
            <div key={note.id} style={{ ...surfaceCard, padding: '14px', borderRadius: '10px', position: 'relative', borderLeft: note.priority === 'High' ? '4px solid #ef4444' : note.priority === 'Low' ? '4px solid #6b7280' : '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary, #111827)', fontSize: '15px' }}>{note.title}</div>
                <button
                  onClick={() => togglePin(note.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                  title={note.pinned ? 'Unpin' : 'Pin'}
                >
                  {note.pinned ? '📌' : '📍'}
                </button>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary, #374151)', whiteSpace: 'pre-wrap', marginBottom: '10px' }}>{note.body || 'No details provided.'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'var(--text-secondary, #4b5563)', marginBottom: '10px' }}>
                <span style={{ background: 'rgba(79, 70, 229, 0.14)', color: '#6366f1', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, border: '1px solid rgba(99, 102, 241, 0.35)' }}>{note.module}</span>
                {note.tags && note.tags.split(',').filter(Boolean).map(t => (
                  <span key={t} style={{ background: 'var(--bg-secondary, #f3f4f6)', color: 'var(--text-secondary, #374151)', border: '1px solid var(--border-primary, #e5e7eb)', padding: '4px 8px', borderRadius: '6px' }}>#{t.trim()}</span>
                ))}
                {note.dueDate && (
                  <span style={{ background: 'rgba(251, 146, 60, 0.16)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.35)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    Due {new Date(note.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(note)}
                  style={{ padding: '8px 12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  style={{ padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  🗑️ Delete
                </button>
              </div>
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary, #4b5563)' }}>
                Updated {new Date(note.updatedAt || note.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
