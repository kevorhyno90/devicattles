import React, { useRef } from 'react'
import { exportToJSON } from '../lib/exportImport'

export default function RecordCV({ entity = {}, title = 'Record', fields = [], onClose = () => {} }) {
  const rootRef = useRef(null)

  function escapeHtml(text) {
    if (text === null || text === undefined) return ''
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function downloadRendered(filename = 'record_cv.html') {
    try {
      const node = rootRef.current
      if (!node) { alert('Content not available'); return }
      const inner = node.innerHTML
      const css = `body{font-family:Arial,Helvetica,sans-serif;color:#111827;padding:20px} h2{margin:0} .muted{color:#6b7280}`
      const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(entity.name||entity.id||title)}</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${css}</style></head><body>${inner}</body></html>`
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) { console.error('downloadRendered failed', err); alert('Download failed') }
  }

  function downloadJSON() {
    try { exportToJSON(entity, `${(entity.tag||entity.id||'record')}_data.json`) } catch (err) { console.warn(err); alert('Failed to download JSON') }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div ref={rootRef} style={{ width: '100%', maxWidth: 900, maxHeight: '90vh', overflow: 'auto', background: 'var(--bg-elevated)', borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <div className="muted">{entity.id || ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={downloadJSON} style={{ padding: '8px 12px', background: '#111827', color: 'white', border: 'none', borderRadius: 6 }}>⬇️ JSON</button>
            <button onClick={() => downloadRendered(`${(entity.tag||entity.id||'record')}_cv.html`)} style={{ padding: '8px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: 6 }}>⬇️ CV</button>
            <button onClick={onClose} style={{ padding: '8px 12px', background: '#fee2e2', color: '#9b1c1c', border: 'none', borderRadius: 6 }}>Close</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <section style={{ marginBottom: 12 }}>
            <h4 style={{ margin: '4px 0' }}>Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              {fields && fields.length > 0 ? fields.map(f => (
                <div key={f.key}><strong>{f.label}:</strong> <div style={{ color: 'var(--text-secondary)' }}>{entity[f.key] ?? '—'}</div></div>
              )) : Object.keys(entity).map(k => (
                <div key={k}><strong>{k}:</strong> <div style={{ color: 'var(--text-secondary)' }}>{String(entity[k] ?? '')}</div></div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
