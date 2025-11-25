import React, { useState, useEffect } from 'react';

export default function InAppNotification() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleNotificationEvent(e) {
      setMessage(e.detail?.message || '');
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }
    window.addEventListener('inAppNotification', handleNotificationEvent);
    return () => window.removeEventListener('inAppNotification', handleNotificationEvent);
  }, []);

  if (!visible || !message) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#2563eb',
      color: '#fff',
      padding: '14px 24px',
      fontSize: '16px',
      fontWeight: '600',
      textAlign: 'center',
      zIndex: 2000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
    }}>
      {message}
    </div>
  );
}
