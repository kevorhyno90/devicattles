import React, { useState } from 'react'

// This demo uses Twilio's free trial API endpoint
// You must set up a Twilio account and get your Account SID, Auth Token, and a trial phone number
// For security, do NOT expose your Auth Token in frontend code. Use a backend or serverless function in production.

export default function SmsGatewayDemo() {
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')

  async function sendSms() {
    setStatus('Sending...')
    // This is a demo: in production, call your backend API here
    setTimeout(() => {
      setStatus('Demo: SMS would be sent via backend using Twilio API.')
    }, 1500)
  }

  return (
    <div style={{ background: '#fef3c7', padding: 16, borderRadius: 8, margin: '16px 0' }}>
      <h3>SMS Gateway Demo (Twilio)</h3>
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Recipient phone number"
          value={to}
          onChange={e => setTo(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd', width: '60%' }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <textarea
          placeholder="Message text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd', width: '60%', minHeight: 60 }}
        />
      </div>
      <button
        onClick={sendSms}
        style={{ padding: '8px 16px', borderRadius: 6, background: '#059669', color: 'white', border: 'none', cursor: 'pointer' }}
      >Send SMS</button>
      {status && <div style={{ marginTop: 8, color: '#b45309' }}>{status}</div>}
      <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
        <b>Note:</b> For real SMS, set up a backend endpoint to securely call Twilio API.<br />
        Twilio trial allows free SMS to verified numbers only.
      </div>
    </div>
  )
}
