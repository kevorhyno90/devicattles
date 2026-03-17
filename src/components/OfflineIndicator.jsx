import React, { useState, useEffect } from 'react'
import { setupOfflineListener, getQueueStats } from '../lib/offlineSync'

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [queueStats, setQueueStats] = useState({ total: 0 })
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Setup offline listener
    const cleanup = setupOfflineListener((offline) => {
      setIsOffline(offline)
    })

    // Update queue stats periodically
    const updateStats = () => {
      setQueueStats(getQueueStats())
    }

    updateStats()
    const statsInterval = setInterval(updateStats, 5000)

    return () => {
      cleanup()
      clearInterval(statsInterval)
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        fontSize: '13px',
        fontWeight: '500',
        maxWidth: '320px'
      }}
    >
      {isOffline && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            borderLeft: '4px solid #dc2626',
            color: '#991b1b',
            padding: '10px 12px',
            borderRadius: '4px',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
          onClick={() => setShowDetails(!showDetails)}
          title="Click for details"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📡</span>
            <div>
              <div>You're offline</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                Changes saved locally
              </div>
            </div>
          </div>
        </div>
      )}

      {queueStats.total > 0 && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            borderLeft: '4px solid #f59e0b',
            color: '#92400e',
            padding: '10px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '8px'
          }}
          onClick={() => setShowDetails(!showDetails)}
          title="Click for details"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⏳</span>
            <div>
              <div>{queueStats.total} changes pending sync</div>
              {queueStats.grouped.animals > 0 && (
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                  🐄 {queueStats.grouped.animals} animals
                  {queueStats.grouped.tasks > 0 && ` • ✓ ${queueStats.grouped.tasks} tasks`}
                  {queueStats.grouped.finance > 0 && ` • 💰 ${queueStats.grouped.finance} finance`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isOffline && queueStats.total === 0 && (
        <div
          style={{
            backgroundColor: '#e0f2fe',
            borderLeft: '4px solid #0ea5e9',
            color: '#0369a1',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          onClick={() => setShowDetails(!showDetails)}
          title="Click for offline status info"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>✓</span>
            <div>
              <div style={{ fontWeight: '600' }}>Connected</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>All data synced</div>
            </div>
          </div>
        </div>
      )}

      {showDetails && (
        <div
          style={{
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '10px',
            marginTop: '8px',
            fontSize: '12px'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
            Status Info
          </div>
          <div style={{ marginBottom: '6px', color: '#4b5563' }}>
            {isOffline ? '🔴 Offline Mode' : '🟢 Online'}
          </div>
          {isOffline && (
            <div style={{ marginBottom: '6px', color: '#4b5563' }}>
              ✓ All data stored locally in browser
            </div>
          )}
          {queueStats.total > 0 && (
            <>
              <div style={{ marginBottom: '6px', color: '#4b5563' }}>
                ⏳ Pending: {queueStats.total} operation{queueStats.total !== 1 ? 's' : ''}
              </div>
              {queueStats.grouped.animals > 0 && (
                <div style={{ marginBottom: '3px', color: '#4b5563', fontSize: '11px' }}>
                  • {queueStats.grouped.animals} animal{queueStats.grouped.animals !== 1 ? 's' : ''}
                </div>
              )}
              {queueStats.grouped.tasks > 0 && (
                <div style={{ marginBottom: '3px', color: '#4b5563', fontSize: '11px' }}>
                  • {queueStats.grouped.tasks} task{queueStats.grouped.tasks !== 1 ? 's' : ''}
                </div>
              )}
              {queueStats.grouped.finance > 0 && (
                <div style={{ marginBottom: '3px', color: '#4b5563', fontSize: '11px' }}>
                  • {queueStats.grouped.finance} finance transaction{queueStats.grouped.finance !== 1 ? 's' : ''}
                </div>
              )}
              {queueStats.oldest && (
                <div style={{ marginTop: '6px', color: '#4b5563', fontSize: '11px', borderTop: '1px solid #ddd', paddingTop: '6px' }}>
                  Since: {new Date(queueStats.oldest).toLocaleTimeString()}
                </div>
              )}
            </>
          )}
          {!isOffline && queueStats.total === 0 && (
            <div style={{ color: '#059669', fontWeight: '500' }}>
              ✓ Connected and synced
            </div>
          )}
        </div>
      )}
    </div>
  )
}
