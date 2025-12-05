import React from 'react'

/**
 * Keyboard Shortcuts Help Overlay
 * Shows all available keyboard shortcuts
 * Triggered by pressing '?' key
 */
export default function KeyboardShortcuts({ onClose }) {
  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Ctrl', 'K'], description: 'Open global search' },
        { keys: ['Esc'], description: 'Close modals/dialogs' },
        { keys: ['?'], description: 'Show this help' },
      ]
    },
    {
      category: 'Quick Actions',
      items: [
        { keys: ['Ctrl', 'S'], description: 'Save current form' },
        { keys: ['Ctrl', 'N'], description: 'New item (when available)' },
        { keys: ['Ctrl', 'E'], description: 'Edit selected item' },
      ]
    },
    {
      category: 'Inline Editing',
      items: [
        { keys: ['Enter'], description: 'Save inline edit' },
        { keys: ['Esc'], description: 'Cancel inline edit' },
        { keys: ['Tab'], description: 'Next field' },
        { keys: ['Shift', 'Tab'], description: 'Previous field' },
      ]
    },
    {
      category: 'Lists & Tables',
      items: [
        { keys: ['↑', '↓'], description: 'Navigate items' },
        { keys: ['Space'], description: 'Select/toggle item' },
        { keys: ['Ctrl', 'A'], description: 'Select all' },
      ]
    },
    {
      category: 'General',
      items: [
        { keys: ['Ctrl', 'Z'], description: 'Undo (when available)' },
        { keys: ['Ctrl', 'P'], description: 'Print' },
        { keys: ['Ctrl', 'F'], description: 'Find in page' },
      ]
    }
  ]

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="card"
        style={{
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>⌨️ Keyboard Shortcuts</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: 'var(--text-color)',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div style={{ display: 'grid', gap: '32px' }}>
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '16px', 
                fontWeight: '600',
                color: 'var(--green)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {section.category}
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {section.items.map((item, itemIdx) => (
                  <div 
                    key={itemIdx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '8px',
                      transition: 'background 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '14px', color: 'var(--text-color)' }}>
                      {item.description}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {item.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          {keyIdx > 0 && (
                            <span style={{ color: 'var(--muted)', fontSize: '12px', alignSelf: 'center' }}>
                              +
                            </span>
                          )}
                          <kbd style={{
                            padding: '4px 8px',
                            background: '#fff',
                            border: '1px solid #d1d5db',
                            borderBottom: '2px solid #9ca3af',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            fontFamily: 'monospace',
                            color: '#374151',
                            minWidth: '32px',
                            textAlign: 'center',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}>
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: 'rgba(5, 150, 105, 0.1)',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--text-color)'
        }}>
          <strong>💡 Tip:</strong> Press <kbd style={{
            padding: '2px 6px',
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: '3px',
            fontSize: '12px',
            fontFamily: 'monospace',
            margin: '0 2px'
          }}>?</kbd> anytime to see these shortcuts again.
        </div>
      </div>
    </div>
  )
}
