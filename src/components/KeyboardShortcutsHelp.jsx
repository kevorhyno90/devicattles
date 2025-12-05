import React, { useState, useEffect } from 'react'

/**
 * Keyboard Shortcuts Help Modal
 * Press '?' to toggle help overlay
 */
export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    function handleKeyPress(e) {
      // Ignore if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      // Toggle help modal with '?'
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

  if (!isOpen) return null

  const shortcuts = [
    {
      category: 'Global',
      items: [
        { keys: ['?'], description: 'Show/hide keyboard shortcuts' },
        { keys: ['Esc'], description: 'Close modals and dialogs' },
        { keys: ['Ctrl', 'S'], description: 'Save current form (where applicable)' },
        { keys: ['Ctrl', 'K'], description: 'Focus global search' }
      ]
    },
    {
      category: 'Navigation',
      items: [
        { keys: ['Alt', '1'], description: 'Go to Dashboard' },
        { keys: ['Alt', '2'], description: 'Go to Animals' },
        { keys: ['Alt', '3'], description: 'Go to Crops' },
        { keys: ['Alt', '4'], description: 'Go to Finance' },
        { keys: ['Alt', '5'], description: 'Go to Inventory' }
      ]
    },
    {
      category: 'Forms',
      items: [
        { keys: ['Enter'], description: 'Save inline edit' },
        { keys: ['Esc'], description: 'Cancel inline edit' },
        { keys: ['Tab'], description: 'Navigate between fields' },
        { keys: ['Shift', 'Tab'], description: 'Navigate backwards' }
      ]
    },
    {
      category: 'Lists',
      items: [
        { keys: ['↑'], description: 'Select previous item' },
        { keys: ['↓'], description: 'Select next item' },
        { keys: ['E'], description: 'Edit selected item (when applicable)' },
        { keys: ['Del'], description: 'Delete selected item (when applicable)' }
      ]
    },
    {
      category: 'Data Export',
      items: [
        { keys: ['Ctrl', 'E'], description: 'Export to Excel' },
        { keys: ['Ctrl', 'Shift', 'C'], description: 'Export to CSV' },
        { keys: ['Ctrl', 'Shift', 'J'], description: 'Export to JSON' }
      ]
    }
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
        backdropFilter: 'blur(4px)'
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          color: 'white',
          padding: '24px 32px',
          borderRadius: '16px 16px 0 0',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>
                ⌨️ Keyboard Shortcuts
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                Power user tips to navigate faster
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '24px',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth >= 768 ? 'repeat(2, 1fr)' : '1fr',
            gap: '32px'
          }}>
            {shortcuts.map((section, idx) => (
              <div key={idx}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#059669',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {section.category}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {section.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: itemIdx < section.items.length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '14px', color: '#374151', flex: 1 }}>
                        {item.description}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {item.keys.map((key, keyIdx) => (
                          <React.Fragment key={keyIdx}>
                            <kbd style={{
                              background: 'linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              fontFamily: 'monospace',
                              color: '#374151',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                              minWidth: '32px',
                              textAlign: 'center'
                            }}>
                              {key}
                            </kbd>
                            {keyIdx < item.keys.length - 1 && (
                              <span style={{ color: '#9ca3af', fontSize: '12px', alignSelf: 'center' }}>
                                +
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Tip */}
          <div style={{
            marginTop: '32px',
            padding: '16px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>💡</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#166534', fontWeight: '500' }}>
                <strong>Pro Tip:</strong> Press <kbd style={{
                  background: 'white',
                  border: '1px solid #bbf7d0',
                  borderRadius: '3px',
                  padding: '2px 6px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>?</kbd> anytime to see this help menu
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
