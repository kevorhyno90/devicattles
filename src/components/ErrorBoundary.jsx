import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.setState({ error, errorInfo })
    
    // Check if it's a localStorage quota error
    if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
      this.setState({ isQuotaError: true })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isQuotaError: false })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  handleClearData = () => {
    if (window.confirm('This will clear some cached data to free up space. Your saved data will remain. Continue?')) {
      try {
        // Clear service worker caches
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name))
          })
        }
        // Clear large temporary items (keep user data)
        const keysToKeep = [
          'cattalytics:animals', 'cattalytics:tasks', 'cattalytics:finance',
          'cattalytics:crops:v2', 'cattalytics:groups', 'devinsfarm:resources',
          'devinsfarm:ui:settings', 'cattalytics:auth:session'
        ]
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && !keysToKeep.some(k => key.startsWith(k))) {
            localStorage.removeItem(key)
          }
        }
        alert('Cache cleared! Please reload the page.')
        window.location.reload()
      } catch (e) {
        alert('Failed to clear cache: ' + e.message)
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px'
          }}>⚠️</div>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '12px'
          }}>
            {this.state.isQuotaError ? 'Storage Full' : 'Something Went Wrong'}
          </h2>
          
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '24px',
            lineHeight: '1.5'
          }}>
            {this.state.isQuotaError 
              ? 'Your device storage is full. Clear some space or remove cached data to continue.'
              : 'This module encountered an error and cannot be displayed. Try reloading or switching to another section.'}
          </p>

          {this.state.isQuotaError && (
            <button
              onClick={this.handleClearData}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#fff',
                backgroundColor: '#f59e0b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginRight: '12px',
                marginBottom: '12px'
              }}
            >
              Clear Cache
            </button>
          )}
          
          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              color: '#fff',
              backgroundColor: '#059669',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            Try Again
          </button>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '32px',
              padding: '16px',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '14px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: '500', color: '#dc2626' }}>
                Error Details (Dev Only)
              </summary>
              <pre style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
