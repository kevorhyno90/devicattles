import React, { useState } from 'react'

export default function PushNotificationDemo() {
  const [permission, setPermission] = useState(Notification.permission)
  const [message, setMessage] = useState('')

  function requestPermission() {
    Notification.requestPermission().then(result => {
      setPermission(result)
      setMessage(result === 'granted' ? 'Permission granted!' : 'Permission denied.')
    })
  }

  function sendTestNotification() {
    if (permission !== 'granted') {
      setMessage('Notification permission not granted.')
      return
    }
    new Notification('Farm App Notification', {
      body: 'This is a test push notification!',
      icon: '/assets/logo.png'
    })
    setMessage('Test notification sent!')
  }

  return (
    <div style={{ background: '#f3f4f6', padding: 16, borderRadius: 8, margin: '16px 0' }}>
      <h3>Browser Push Notification Demo</h3>
      <div>Current permission: <b>{permission}</b></div>
      <button onClick={requestPermission} style={{ margin: '8px 8px 8px 0', padding: '8px 16px', borderRadius: 6, background: '#059669', color: 'white', border: 'none', cursor: 'pointer' }}>
        Request Permission
      </button>
      <button onClick={sendTestNotification} style={{ margin: '8px 0', padding: '8px 16px', borderRadius: 6, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}>
        Send Test Notification
      </button>
      {message && <div style={{ marginTop: 8, color: '#dc2626' }}>{message}</div>}
    </div>
  )
}
