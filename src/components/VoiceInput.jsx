import { useState, useEffect } from 'react'

/**
 * VoiceInput Component - Web Speech API wrapper
 * Usage: <VoiceInput value={text} onChange={setText} placeholder="Enter text..." />
 */
export default function VoiceInput({ value, onChange, placeholder = 'Enter text...', multiline = false, disabled = false }) {
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        
        // Update value with current text + new transcript
        const currentValue = value || ''
        const newValue = currentValue ? `${currentValue} ${transcript}` : transcript
        onChange(newValue)
      }

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable microphone permissions.')
        }
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognition) return

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      try {
        recognition.start()
        setIsListening(true)
      } catch (error) {
        console.error('Failed to start recognition:', error)
      }
    }
  }

  const handleTextChange = (e) => {
    onChange(e.target.value)
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 40px 8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: multiline ? 'vertical' : 'none',
    minHeight: multiline ? '80px' : 'auto'
  }

  const buttonStyle = {
    position: 'absolute',
    right: '8px',
    top: multiline ? '8px' : '50%',
    transform: multiline ? 'none' : 'translateY(-50%)',
    background: isListening ? '#ef4444' : '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    transition: 'all 0.2s',
    animation: isListening ? 'pulse 1.5s infinite' : 'none'
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {multiline ? (
        <textarea
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle}
        />
      )}
      
      {isSupported && !disabled && (
        <button
          type="button"
          onClick={toggleListening}
          style={buttonStyle}
          title={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? '⏹️' : '🎤'}
        </button>
      )}
      
      {!isSupported && (
        <div style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          Voice input not supported
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: ${multiline ? 'scale(1)' : 'translateY(-50%) scale(1)'};
          }
          50% {
            opacity: 0.8;
            transform: ${multiline ? 'scale(1.1)' : 'translateY(-50%) scale(1.1)'};
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Utility hook for voice input in custom components
 */
export function useVoiceInput(initialValue = '') {
  const [value, setValue] = useState(initialValue)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setValue(prev => prev ? `${prev} ${transcript}` : transcript)
      }

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [])

  const startListening = () => {
    if (recognition && !isListening) {
      try {
        recognition.start()
        setIsListening(true)
      } catch (error) {
        console.error('Failed to start recognition:', error)
      }
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return {
    value,
    setValue,
    isListening,
    startListening,
    stopListening,
    toggleListening,
    isSupported: !!recognition
  }
}
