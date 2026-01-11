import React, { useRef } from 'react'
import { recordClick } from '../../lib/clickDB'

export default function AnimalCV({ animal = {}, groups = [], onClose = () => {}, onDownloadJSON = () => {} }) {
  const rootRef = useRef(null)
  const groupName = groups.find(g => g.id === animal.groupId)?.name || 'No group'

  function escapeHtml(text) {
    if (text === null || text === undefined) return ''
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function downloadRenderedCV(filename = 'animal_cv.html') {
    try {
      const node = rootRef.current
      if (!node) {
        alert('CV content not available')
        return
      }

      const inner = node.innerHTML
      const css = `body{font-family:Arial,Helvetica,sans-serif;color:#111827;padding:20px} h2{margin:0} .muted{color:#6b7280}`
      const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(animal.name||animal.tag||animal.id)}</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${css}</style></head><body>${inner}</body></html>`

      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download CV failed', err)
      alert('Failed to download CV: ' + (err.message || err))
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div ref={rootRef} style={{ width: '100%', maxWidth: 1000, maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 12px 40px rgba(2,6,23,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>{animal.name || animal.tag || animal.id}</h2>
            <div className="muted">{animal.tag} • {animal.breed} • {animal.sex === 'F' ? 'Female' : 'Male'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { recordClick('animal', animal.id, 'download_json'); onDownloadJSON(); }} style={{ padding: '8px 12px', background: '#111827', color: 'white', border: 'none', borderRadius: 6 }}>⬇️ JSON</button>
            <button onClick={() => { recordClick('animal', animal.id, 'download_cv'); downloadRenderedCV(`${(animal.tag||animal.id||'animal')}_cv.html`); }} style={{ padding: '8px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: 6 }}>⬇️ CV</button>
            <button onClick={() => { recordClick('animal', animal.id, 'download_excel'); downloadRenderedCV(`${(animal.tag||animal.id||'animal')}_cv.html`); }} style={{ padding: '8px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6 }}>⬇️ Excel</button>
            <button onClick={onClose} style={{ padding: '8px 12px', background: '#fee2e2', color: '#9b1c1c', border: 'none', borderRadius: 6 }}>Close</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginTop: 12 }}>
          <div style={{ borderRadius: 8 }}>
            {animal.photos && animal.photos.length > 0 ? (
              <img src={animal.photos[0].dataUrl} alt={animal.name} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8 }} />
            ) : animal.photo ? (
              <img src={animal.photo} alt={animal.name} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div style={{ width: '100%', height: 220, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No photo</div>
            )}

            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              <div style={{ padding: 10, background: '#f9fafb', borderRadius: 8 }}>
                <strong>Group</strong>
                <div style={{ color: '#374151' }}>{groupName}</div>
              </div>
              <div style={{ padding: 10, background: '#f9fafb', borderRadius: 8 }}>
                <strong>Owner</strong>
                <div style={{ color: '#374151' }}>{animal.owner || '—'}</div>
              </div>
              <div style={{ padding: 10, background: '#f9fafb', borderRadius: 8 }}>
                <strong>Status</strong>
                <div style={{ color: '#374151' }}>{animal.status || '—'}</div>
              </div>
              <div style={{ padding: 10, background: '#f9fafb', borderRadius: 8 }}>
                <strong>QR</strong>
                <div style={{ marginTop: 8 }}>{animal.qrCode ? <img src={animal.qrCode} alt="qr" style={{ width: 120, height: 120 }} /> : '—'}</div>
              </div>
            </div>
          </div>

          <div>
            <section style={{ marginBottom: 12 }}>
              <h4 style={{ margin: '4px 0', color: '#111827' }}>📋 Basic Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                <div><strong>Tag:</strong> <div style={{ color: '#374151' }}>{animal.tag || '—'}</div></div>
                <div><strong>Registration:</strong> <div style={{ color: '#374151' }}>{animal.registration || '—'}</div></div>
                <div><strong>Tattoo/ID:</strong> <div style={{ color: '#374151' }}>{animal.tattoo || '—'}</div></div>
                <div><strong>DOB:</strong> <div style={{ color: '#374151' }}>{animal.dob || '—'}</div></div>
                <div><strong>Weight:</strong> <div style={{ color: '#374151' }}>{animal.weight ? animal.weight + ' kg' : '—'}</div></div>
                <div><strong>Color:</strong> <div style={{ color: '#374151' }}>{animal.color || '—'}</div></div>
                <div><strong>Sire:</strong> <div style={{ color: '#374151' }}>{animal.sire || '—'}</div></div>
                <div><strong>Dam:</strong> <div style={{ color: '#374151' }}>{animal.dam || '—'}</div></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Notes:</strong> <div style={{ color: '#374151', marginTop: 6 }}>{animal.notes || '—'}</div></div>
              </div>
            </section>
