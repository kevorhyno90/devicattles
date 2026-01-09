import React, { useEffect, useState } from 'react'
import { isAudioSuspended, enableAudioNow } from '../lib/notifications'

export default function AudioEnableBanner() {
  const [visible, setVisible] = useState(false)
  const STORAGE_KEY = 'devinsfarm:audio:enabled'

  useEffect(() => {
    try {
      const hidden = localStorage.getItem(STORAGE_KEY)
      if (hidden === 'true') return
      if (isAudioSuspended()) setVisible(true)
    } catch (e) {}
  }, [])

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 12000 }}>
      <button
        onClick={async () => {
          const ok = await enableAudioNow()
          try { localStorage.setItem(STORAGE_KEY, 'true') } catch(e){}
          setVisible(false)
          if (ok) {
            window.showToast && window.showToast('Audio enabled', 'success')
          } else {
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
