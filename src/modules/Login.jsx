import React, { useState } from 'react'
import { login, ROLES } from '../lib/auth'
import { logAction, ACTIONS, ENTITIES } from '../lib/audit'

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = login(username, password)
    
    if (result.success) {
      // Log the login
      logAction(ACTIONS.LOGIN, ENTITIES.USER, result.user.userId, {
        username: result.user.username,
        role: result.user.role
      })
      
      onLoginSuccess(result.user)
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '28px',
            background: 'linear-gradient(90deg, #2b8c3e, #1b6b33)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🌾 Devins Farm
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Farm Management System
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#2b8c3e'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#2b8c3e'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#9ca3af' : 'linear-gradient(90deg, #2b8c3e, #1b6b33)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseOut={e => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '12px', color: '#374151' }}>Demo Accounts:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ color: '#6b7280' }}>
              <strong>Manager:</strong> admin / admin123
            </div>
            <div style={{ color: '#6b7280' }}>
              <strong>Worker:</strong> worker / worker123
            </div>
            <div style={{ color: '#6b7280' }}>
              <strong>Vet:</strong> vet / vet123
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          <p style={{ margin: 0 }}>
            By logging in, you agree to our terms and conditions
          </p>
        </div>
      </div>
    </div>
  )
}
