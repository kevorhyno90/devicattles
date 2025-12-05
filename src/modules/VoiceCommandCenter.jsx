import React, { useState, useEffect, useRef } from 'react'
import { processVoiceCommand, getCommandSuggestions } from '../lib/voiceCommands'

/**
 * Voice Command Interface
 * Full-featured voice control for farm management
 */
export default function VoiceCommandCenter({ onNavigate }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [recognition, setRecognition] = useState(null)
  const [isSupported, setIsSupported] = useState(false)
  const [selectedContext, setSelectedContext] = useState('general')
  
  const transcriptRef = useRef(null)

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript)
          // Auto-execute when final result is received
          executeCommand(finalTranscript)
        }
      }

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        if (event.error === 'not-allowed') {
          setResult({
            success: false,
            message: 'Microphone access denied. Please enable microphone permissions.'
          })
        } else if (event.error === 'no-speech') {
          setResult({
            success: false,
            message: 'No speech detected. Please try again.'
          })
        } else {
          setResult({
            success: false,
            message: `Error: ${event.error}`
          })
        }
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }

    // Load command history from localStorage
    try {
      const stored = localStorage.getItem('voice_command_history')
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch (e) {}

    // Load suggestions for current context
    setSuggestions(getCommandSuggestions(selectedContext))
  }, [])

  useEffect(() => {
    setSuggestions(getCommandSuggestions(selectedContext))
  }, [selectedContext])

  const startListening = () => {
    if (!recognition) return

    try {
      setTranscript('')
      setResult(null)
      recognition.start()
      setIsListening(true)
    } catch (error) {
      console.error('Failed to start recognition:', error)
      setResult({
        success: false,
        message: 'Failed to start voice recognition. Please try again.'
      })
    }
  }

  const stopListening = () => {
    if (recognition) {
      recognition.stop()
      setIsListening(false)
    }
  }

  const executeCommand = async (command) => {
    setResult({ success: true, message: 'Processing...' })
    
    try {
      const cmdResult = await processVoiceCommand(command, onNavigate)
      setResult(cmdResult)
      
      // Add to history
      const historyItem = {
        command,
        result: cmdResult,
        timestamp: new Date().toISOString()
      }
      const newHistory = [historyItem, ...history].slice(0, 20) // Keep last 20
      setHistory(newHistory)
      
      // Save to localStorage
      try {
        localStorage.setItem('voice_command_history', JSON.stringify(newHistory))
      } catch (e) {}
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error.message}`
      })
    }
  }

  const handleManualCommand = () => {
    if (transcript.trim()) {
      executeCommand(transcript)
    }
  }

  const useSuggestion = (suggestion) => {
    setTranscript(suggestion)
    executeCommand(suggestion)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('voice_command_history')
  }

  if (!isSupported) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎤</div>
          <h2 style={{ color: '#dc2626', marginBottom: '12px' }}>Voice Commands Not Supported</h2>
          <p style={{ color: '#6b7280' }}>
            Your browser doesn't support the Web Speech API. Please use Chrome, Edge, or Safari for voice commands.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '8px' }}>🎤 Voice Command Center</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Control your farm with voice commands - hands-free management
      </p>

      {/* Main Voice Input */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!recognition}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '4px solid rgba(255,255,255,0.3)',
              background: isListening ? '#ef4444' : 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '48px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: isListening ? '0 0 30px rgba(239,68,68,0.6)' : 'none',
              animation: isListening ? 'pulse 1.5s infinite' : 'none'
            }}
          >
            🎤
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            {isListening ? 'Listening...' : 'Tap to speak'}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {isListening ? 'Say a command now' : 'Click the microphone and speak your command'}
          </div>
        </div>

        {transcript && (
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>You said:</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>{transcript}</div>
          </div>
        )}

        {/* Manual Input */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualCommand()}
            placeholder="Or type a command..."
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              background: 'rgba(255,255,255,0.9)',
              color: '#1f2937'
            }}
          />
          <button
            onClick={handleManualCommand}
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.3)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card" style={{
          padding: '20px',
          marginBottom: '20px',
          background: result.success ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${result.success ? '#059669' : '#dc2626'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '32px' }}>{result.success ? '✅' : '❌'}</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 8px 0', color: result.success ? '#065f46' : '#991b1b' }}>
                {result.success ? 'Command Executed' : 'Command Failed'}
              </h4>
              <p style={{ margin: 0, color: result.success ? '#059669' : '#dc2626', whiteSpace: 'pre-wrap' }}>
                {result.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Context Selector */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontWeight: '600', marginBottom: '12px' }}>Command Context:</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['general', 'inventory', 'animals', 'tasks', 'finance'].map(ctx => (
            <button
              key={ctx}
              onClick={() => setSelectedContext(ctx)}
              style={{
                padding: '8px 16px',
                background: selectedContext === ctx ? '#667eea' : '#f3f4f6',
                color: selectedContext === ctx ? '#fff' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {ctx}
            </button>
          ))}
        </div>
      </div>

      {/* Command Suggestions */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '12px' }}>💡 Suggested Commands</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => useSuggestion(suggestion)}
              style={{
                padding: '12px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                color: '#1f2937',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#eff6ff'
                e.target.style.borderColor = '#3b82f6'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f9fafb'
                e.target.style.borderColor = '#e5e7eb'
              }}
            >
              "{suggestion}"
            </button>
          ))}
        </div>
      </div>

      {/* Command History */}
      {history.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>📜 Command History</h3>
            <button
              onClick={clearHistory}
              style={{
                padding: '6px 12px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Clear History
            </button>
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {history.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: '#f9fafb',
                  borderLeft: `4px solid ${item.result.success ? '#059669' : '#dc2626'}`,
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>"{item.command}"</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {item.result.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 30px rgba(239,68,68,0.6);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 50px rgba(239,68,68,0.8);
            }
          }
        `}
      </style>
    </div>
  )
}
