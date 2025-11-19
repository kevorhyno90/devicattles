import React, { useState, useEffect } from 'react'
import { 
  getAuditLog, 
  getAuditStats, 
  exportAuditLogCSV, 
  exportAuditLogJSON,
  formatAuditEntry,
  clearAuditLog,
  ACTIONS,
  ENTITIES
} from '../lib/audit'
import { hasPermission } from '../lib/auth'

export default function AuditLog() {
  const [audit, setAudit] = useState([])
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: '',
    startDate: '',
    endDate: ''
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [filters])

  function loadData() {
    const log = getAuditLog(filters)
    setAudit(log)
    setStats(getAuditStats())
  }

  function handleExportCSV() {
    const csv = exportAuditLogCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleExportJSON() {
    const data = exportAuditLogJSON()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleClearLog() {
    if (!hasPermission('manage_users')) {
      alert('Permission denied')
      return
    }

    if (confirm('Are you sure you want to clear the entire audit log? This cannot be undone!')) {
      const result = clearAuditLog()
      if (result.success) {
        loadData()
        alert('Audit log cleared')
      } else {
        alert(result.error)
      }
    }
  }

  const filteredAudit = audit.filter(entry => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      entry.userName.toLowerCase().includes(searchLower) ||
      entry.action.toLowerCase().includes(searchLower) ||
      entry.entityType.toLowerCase().includes(searchLower) ||
      entry.entityId.toLowerCase().includes(searchLower)
    )
  })

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>📋 Audit Log</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportCSV} style={{ fontSize: 12 }}>📊 Export CSV</button>
          <button onClick={handleExportJSON} style={{ fontSize: 12 }}>📄 Export JSON</button>
          {hasPermission('manage_users') && (
            <button onClick={handleClearLog} style={{ fontSize: 12, background: '#dc2626', color: 'white' }}>
              🗑️ Clear Log
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Entries</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>{stats.total}</div>
          </div>
          <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Last 24 Hours</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>{stats.last24Hours}</div>
          </div>
          <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Last 7 Days</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{stats.lastWeek}</div>
          </div>
          <div className="card" style={{ padding: 16, background: '#fee2e2' }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Delete Actions</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>
              {stats.byAction[ACTIONS.DELETE] || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Search</label>
            <input
              type="text"
              placeholder="Search user, action, entity..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Action</label>
            <select
              value={filters.action}
              onChange={e => setFilters({ ...filters, action: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            >
              <option value="">All Actions</option>
              {Object.values(ACTIONS).map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Entity Type</label>
            <select
              value={filters.entityType}
              onChange={e => setFilters({ ...filters, entityType: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            >
              <option value="">All Entities</option>
              {Object.values(ENTITIES).map(entity => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => {
                setFilters({ action: '', entityType: '', userId: '', startDate: '', endDate: '' })
                setSearchTerm('')
              }}
              style={{ width: '100%', padding: 8 }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Audit Entries Table */}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Role</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredAudit.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  No audit entries found
                </td>
              </tr>
            ) : (
              filteredAudit.map(entry => {
                const formatted = formatAuditEntry(entry)
                return (
                  <tr key={entry.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{formatted.time}</td>
                    <td style={{ fontWeight: 600 }}>{formatted.user}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: 12,
                        background: entry.userRole === 'MANAGER' ? '#dbeafe' : '#f3f4f6',
                        color: entry.userRole === 'MANAGER' ? '#1e40af' : '#374151'
                      }}>
                        {formatted.role}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: 12,
                        background: 
                          entry.action === 'delete' ? '#fee2e2' :
                          entry.action === 'create' ? '#dcfce7' :
                          entry.action === 'update' ? '#fef3c7' :
                          '#f3f4f6',
                        color:
                          entry.action === 'delete' ? '#991b1b' :
                          entry.action === 'create' ? '#166534' :
                          entry.action === 'update' ? '#92400e' :
                          '#374151'
                      }}>
                        {entry.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{entry.entityType}</td>
                    <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{entry.entityId}</td>
                    <td style={{ fontSize: 12, color: '#666' }}>
                      {entry.details && Object.keys(entry.details).length > 0 ? (
                        <details>
                          <summary style={{ cursor: 'pointer' }}>View</summary>
                          <pre style={{ margin: '8px 0 0 0', fontSize: 11, background: '#f9fafb', padding: 8, borderRadius: 4, overflow: 'auto' }}>
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: '#666', textAlign: 'center' }}>
        Showing {filteredAudit.length} of {audit.length} entries
      </div>
    </section>
  )
}
