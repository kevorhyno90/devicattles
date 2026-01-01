import React, { useState, useEffect } from 'react'

const OPENWEATHER_API_KEY = 'e8b82472e1785fe426645d7d39359924' // User's OpenWeatherMap API key
const DEFAULT_LOCATION = 'Nyaronde, Matutu, KE'

export default function WeatherWidget() {
  const [location, setLocation] = useState(DEFAULT_LOCATION)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true)
      setError(null)
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${OPENWEATHER_API_KEY}&units=metric`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch weather')
        const data = await res.json()
        setWeather(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchWeather()
  }, [location])

  if (loading) return <div>Loading weather...</div>
  if (error) return <div>Error: {error}</div>
  if (!weather) return null

  return (
    <div style={{ background: '#e0f7fa', padding: 16, borderRadius: 8, margin: '16px 0' }}>
      <h3>Weather in {weather.name}</h3>
      <div>🌡️ {weather.main.temp}°C</div>
      <div>☁️ {weather.weather[0].description}</div>
      <div>💧 Humidity: {weather.main.humidity}%</div>
      <div>💨 Wind: {weather.wind.speed} m/s</div>
    </div>
  )
}

