import React, { useState, useEffect } from 'react'

export default function MobileSettings() {
  const [deviceInfo, setDeviceInfo] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDeviceInfo()
  }, [])

  const loadDeviceInfo = () => {
    console.log('MobileSettings: Loading device info...')
    setDeviceInfo({
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isPWA: window.matchMedia('(display-mode: standalone)').matches,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      online: navigator.onLine
    })
    setLoading(false)
    console.log('MobileSettings: Device info loaded')
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p>Loading mobile settings...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111', marginBottom: '8px' }}>
          📱 Mobile Settings
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Device information and mobile optimization settings
        </p>
      </div>

      {/* Device Information */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📱 Device Information
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Device Type:</span>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              {deviceInfo.isMobile ? '📱 Mobile' : '💻 Desktop'}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Touch Support:</span>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              {deviceInfo.isTouch ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>PWA Mode:</span>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              {deviceInfo.isPWA ? '✅ Installed' : '❌ Browser'}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Connection:</span>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              {deviceInfo.online ? '🟢 Online' : '🔴 Offline'}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Screen Resolution:</span>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              {deviceInfo.screenWidth} × {deviceInfo.screenHeight}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Pixel Ratio:</span>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              {deviceInfo.devicePixelRatio}x
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Platform:</span>
            <span style={{ fontWeight: '600', fontSize: '14px', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>
              {deviceInfo.platform}
            </span>
          </div>
        </div>
      </div>

      {/* User Agent */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          🔍 User Agent
        </h2>
        <div style={{
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#374151',
          wordBreak: 'break-all',
          lineHeight: '1.5'
        }}>
          {deviceInfo.userAgent}
        </div>
      </div>

      {/* Actions */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={loadDeviceInfo}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          🔄 Refresh Info
        </button>
      </div>
    </div>
  )
}
