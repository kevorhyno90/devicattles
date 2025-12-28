import React from 'react';

/**
 * Minimal app shell that renders instantly while heavy components load
 * Provides immediate visual feedback to users
 */
export default function AppShell() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e5e7eb 100%)'
    }}>
      {/* Header skeleton */}
      <header style={{
        background: '#059669',
        color: 'white',
        padding: '16px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px'
          }}></div>
          <div style={{
            flex: 1,
            height: '24px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            maxWidth: '200px'
          }}></div>
        </div>
      </header>

      {/* Main content loading */}
      <main style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '20px',
        padding: '40px 20px'
      }}>
        {/* Spinner */}
        <div style={{
          width: '60px',
          height: '60px',
          border: '5px solid #e5e7eb',
          borderTopColor: '#059669',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>

        {/* Loading text */}
        <div style={{
          textAlign: 'center'
        }}>
          <h2 style={{
            color: '#059669',
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            Loading Farm Management System
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Preparing your dashboard...
          </p>
        </div>

        {/* Progress dots */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                background: '#059669',
                borderRadius: '50%',
                animation: `fade 1.4s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.3
              }}
            ></div>
          ))}
        </div>
      </main>

      {/* Bottom navigation skeleton */}
      <nav style={{
        background: 'white',
        padding: '12px 20px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-around'
        }}>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              style={{
                width: '60px',
                height: '40px',
                background: '#f3f4f6',
                borderRadius: '6px'
              }}
            ></div>
          ))}
        </div>
      </nav>

      {/* Add animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
