import React, { useEffect, useState } from 'react'
import { getAllClicks, exportClicks, clearAllClicks } from '../lib/clickDB'

export default function ClickDBViewer(){
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(false)

  async function refresh(){
    setLoading(true)
    try {
      const all = await getAllClicks()
      setClicks(all || [])
    } catch (e) {
      console.warn('refresh clicks failed', e)
      setClicks([])
    }
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>Click DB</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={refresh} disabled={loading} style={{ fontSize: 13 }}>Refresh</button>
          <button onClick={() => exportClicks()} style={{ fontSize: 13 }}>Export JSON</button>
          <button onClick={async () => { if(!confirm('Clear all clicks?')) return; await clearAllClicks(); refresh() }} style={{ fontSize: 13, color: '#dc2626' }}>Clear All</button>
        </div>
      </div>

      <div style={{ maxHeight: 360, overflow: 'auto', border: '1px solid #eee', borderRadius: 6 }}>
        {loading ? (
          <div style={{ padding: 16, color: '#4b5563' }}>Loading...</div>
        ) : clicks.length === 0 ? (
          <div style={{ padding: 16, color: '#4b5563' }}>No click events recorded.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fafafa' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>#</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Entity</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Entity ID</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Action</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {clicks.map((c, i) => (
                <tr key={c.id || i} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <td style={{ padding: 8, fontSize: 13 }}>{i+1}</td>
                  <td style={{ padding: 8, fontSize: 13 }}>{c.entityType}</td>
                  <td style={{ padding: 8, fontSize: 13 }}>{String(c.entityId ?? '')}</td>
                  <td style={{ padding: 8, fontSize: 13 }}>{c.action}</td>
                  <td style={{ padding: 8, fontSize: 13 }}>{new Date(c.ts).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
