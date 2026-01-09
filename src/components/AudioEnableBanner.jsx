import React, { useEffect, useState } from 'react'

export default function AudioEnableBanner() {
  const [visible, setVisible] = useState(false)
  const STORAGE_KEY = 'devinsfarm:audio:enabled'

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const hidden = localStorage.getItem(STORAGE_KEY)
        if (hidden === 'true') return
        const mod = await import('../lib/notifications')
        if (!mounted) return
        if (mod && typeof mod.isAudioSuspended === 'function' && mod.isAudioSuspended()) {
          setVisible(true)
        }
      } catch (e) {}
    })()
    return () => { mounted = false }
  }, [])

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 12000 }}>
      <button
        onClick={async () => {
          try {
            const mod = await import('../lib/notifications')
            const ok = mod && typeof mod.enableAudioNow === 'function' ? await mod.enableAudioNow() : false
            try { localStorage.setItem(STORAGE_KEY, 'true') } catch (e) {}
            setVisible(false)
            if (ok) {
              window.showToast && window.showToast('Audio enabled', 'success')
            } else {
              window.showToast && window.showToast('Audio could not be enabled', 'error')
            }
          } catch (e) {
            try { localStorage.setItem(STORAGE_KEY, 'true') } catch (e) {}
            setVisible(false)
            window.showToast && window.showToast('Audio could not be enabled', 'error')
          }
        }}
        style={{
          background: '#059669',
          color: 'white',
          border: 'none',
          padding: '10px 14px',
          borderRadius: 8,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(5,150,105,0.12)'
        }}
        aria-label="Enable audio"
      >
        🔊 Tap to enable sounds
      </button>
    </div>
  )
}
