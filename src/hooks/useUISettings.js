import { useState, useEffect } from 'react'

export default function useUISettings(key, defaults) {
  const [settings, setSettings] = useState(defaults)

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(key) || 'null')
      if (s) setSettings(prev => ({ ...prev, ...s }))
    } catch (e) {}
  }, [key])

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(settings))
    } catch (e) {}
  }, [key, settings])

  return [settings, setSettings]
}
