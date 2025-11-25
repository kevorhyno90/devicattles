import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', icon: '🏠', path: '/' },
  { label: 'Livestock', icon: '🐄', path: '/livestock' },
  { label: 'Crops', icon: '🌾', path: '/crops' },
  { label: 'Settings', icon: '⚙️', path: '/settings' }
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      background: '#fff',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000
    }}>
      {navItems.map(item => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 22,
            color: location.pathname === item.path ? '#2563eb' : '#374151',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            padding: 0,
            cursor: 'pointer'
          }}
        >
          <span>{item.icon}</span>
          <span style={{ fontSize: 12 }}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
