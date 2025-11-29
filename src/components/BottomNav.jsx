import React, { useContext } from 'react';
import { AppViewContext } from '../lib/AppViewContext.jsx';

const navItems = [
  { label: 'Dashboard', icon: '🏠', view: 'dashboard' },
  { label: 'Livestock', icon: '🐄', view: 'animals' },
  { label: 'Crops', icon: '🌾', view: 'crops' },
  { label: 'Settings', icon: '⚙️', view: 'settings' }
];

export default function BottomNav() {
  const { view, setView } = useContext(AppViewContext);

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
          key={item.view}
          onClick={() => setView(item.view)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 22,
            color: view === item.view ? '#2563eb' : '#374151',
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
