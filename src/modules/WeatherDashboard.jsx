/**
 * Weather Dashboard Module
 * Displays current weather, forecast, and farm-specific advice
 */

import React, { useState, useEffect } from 'react'
import {
  getCurrentWeather,
  getWeatherForecast,
  getFarmingAdvice,
  getSunProtectionAdvice,
  getActivityRecommendations,
  saveFarmLocation,
  getFarmLocation,
  clearWeatherCache
} from '../lib/weatherApi'

export default function WeatherDashboard({ onNavigate }) {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [advice, setAdvice] = useState([])
  const [sunAdvice, setSunAdvice] = useState(null)
  const [activities, setActivities] = useState({})
  const [location, setLocation] = useState(getFarmLocation())
  const [apiKey, setApiKey] = useState(localStorage.getItem('cattalytics:weather:apikey') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingLocation, setEditingLocation] = useState(false)
  const [editingApiKey, setEditingApiKey] = useState(false)

  // Load weather data
  const loadWeather = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const currentWeather = await getCurrentWeather(location, apiKey || null)
      const forecastData = await getWeatherForecast(location, apiKey || null)
      
      setWeather(currentWeather)
      setForecast(forecastData)
      
      if (currentWeather && forecastData) {
        setAdvice(getFarmingAdvice(currentWeather, forecastData))
        setSunAdvice(getSunProtectionAdvice(currentWeather))
        setActivities(getActivityRecommendations(currentWeather, forecastData))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWeather()
    
    // Auto-refresh every 30 minutes
    const interval = setInterval(loadWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [location, apiKey])

  // Save location
  const handleSaveLocation = () => {
    saveFarmLocation(location)
    setEditingLocation(false)
    loadWeather()
  }

  // Save API key
  const handleSaveApiKey = () => {
    localStorage.setItem('cattalytics:weather:apikey', apiKey)
    setEditingApiKey(false)
    clearWeatherCache()
    loadWeather()
  }

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // Get wind direction
  const getWindDirection = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>🌤️ Weather Dashboard</h2>
        <p>Loading weather data...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🌤️ Weather Dashboard</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              clearWeatherCache()
              loadWeather()
            }}
            style={{
              padding: '8px 16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setEditingLocation(!editingLocation)}
            style={{
              padding: '8px 16px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📍 Location
          </button>
          <button
            onClick={() => setEditingApiKey(!editingApiKey)}
            style={{
              padding: '8px 16px',
              background: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔑 API Key
          </button>
        </div>
      </div>

      {/* Location Editor */}
      {editingLocation && (
        <div style={{
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>Set Farm Location</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Enter city name (e.g., "Nairobi,KE") or coordinates (e.g., "-1.2921,36.8219")
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Nairobi,KE"
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            <button
              onClick={handleSaveLocation}
              style={{
                padding: '8px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
            <button
              onClick={() => setEditingLocation(false)}
              style={{
                padding: '8px 16px',
                background: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* API Key Editor */}
      {editingApiKey && (
        <div style={{
          padding: '15px',
          background: '#fff3e0',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>OpenWeatherMap API Key</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Get a free API key at <a href="https://openweathermap.org/api" target="_blank" rel="noopener">openweathermap.org</a>
            <br />Leave blank to use demo mode (limited features)
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key (optional)"
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            <button
              onClick={handleSaveApiKey}
              style={{
                padding: '8px 16px',
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
            <button
              onClick={() => setEditingApiKey(false)}
              style={{
                padding: '8px 16px',
                background: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Demo Mode Notice */}
      {weather?.demo && (
        <div style={{
          padding: '12px',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          ⚠️ <strong>Demo Mode:</strong> Using sample data. Add an API key for real weather data.
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px',
          background: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          ❌ <strong>Error:</strong> {error}
        </div>
      )}

      {weather && (
        <>
          {/* Current Weather */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Main Weather Card */}
            <div style={{
              gridColumn: 'span 2',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', opacity: 0.9 }}>
                    {weather.location}, {weather.country}
                  </h3>
                  <div style={{ fontSize: '64px', fontWeight: 'bold', margin: '10px 0' }}>
                    {weather.temperature}°C
                  </div>
                  <div style={{ fontSize: '18px', textTransform: 'capitalize', marginBottom: '10px' }}>
                    {weather.description}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    Feels like {weather.feelsLike}°C
                  </div>
                </div>
                <img
                  src={weather.iconUrl}
                  alt={weather.description}
                  style={{ width: '100px', height: '100px' }}
                />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '15px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.3)'
              }}>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>High / Low</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {weather.tempMax}° / {weather.tempMin}°
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>Humidity</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {weather.humidity}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>Wind</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {weather.windSpeed} m/s {getWindDirection(weather.windDirection)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>Pressure</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {weather.pressure} hPa
                  </div>
                </div>
              </div>
            </div>

            {/* Sun Times */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>☀️ Sun Times</h4>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>Sunrise</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {formatTime(weather.sunrise)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#666' }}>Sunset</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {formatTime(weather.sunset)}
                </div>
              </div>
              {sunAdvice && (
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: '#fff3e0',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  <strong>UV {sunAdvice.uvLevel.toUpperCase()}</strong>
                  <div style={{ marginTop: '5px', color: '#666' }}>
                    {sunAdvice.advice}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📊 Details</h4>
              <div style={{ fontSize: '14px' }}>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Cloudiness:</span>
                  <strong>{weather.cloudiness}%</strong>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Visibility:</span>
                  <strong>{(weather.visibility / 1000).toFixed(1)} km</strong>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Coordinates:</span>
                  <strong>{weather.coordinates.lat.toFixed(2)}, {weather.coordinates.lon.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Updated:</span>
                  <strong>{formatTime(weather.timestamp)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>📅 5-Day Forecast</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px'
            }}>
              {forecast.map((day, index) => (
                <div
                  key={index}
                  style={{
                    padding: '15px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                    {index === 0 ? 'Today' : day.dayName}
                  </div>
                  <div style={{ fontSize: '24px', margin: '10px 0' }}>
                    {day.tempMax}° / {day.tempMin}°
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    textTransform: 'capitalize',
                    marginBottom: '8px'
                  }}>
                    {day.condition}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    💧 {day.rainfall}mm
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    💨 {day.windSpeed} m/s
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Farming Advice */}
          {advice.length > 0 && (
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 15px 0' }}>💡 Farming Advice</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                {advice.map((item, index) => {
                  const bgColors = {
                    warning: '#fff3e0',
                    info: '#e3f2fd',
                    success: '#e8f5e9'
                  }
                  const borderColors = {
                    warning: '#ff9800',
                    info: '#2196F3',
                    success: '#4CAF50'
                  }
                  
                  return (
                    <div
                      key={index}
                      style={{
                        padding: '15px',
                        background: bgColors[item.type],
                        border: `2px solid ${borderColors[item.type]}`,
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                        <div style={{ fontSize: '24px' }}>{item.icon}</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                            {item.title}
                          </h4>
                          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                            {item.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Activity Recommendations */}
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>🌾 Today's Farm Activities</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              {Object.entries(activities).map(([activity, suitable]) => {
                const activityIcons = {
                  planting: '🌱',
                  spraying: '🚿',
                  harvesting: '🌾',
                  grazing: '🐄',
                  outdoorWork: '👷'
                }
                const activityNames = {
                  planting: 'Planting',
                  spraying: 'Spraying',
                  harvesting: 'Harvesting',
                  grazing: 'Grazing',
                  outdoorWork: 'Outdoor Work'
                }
                
                return (
                  <div
                    key={activity}
                    style={{
                      padding: '15px',
                      background: suitable ? '#e8f5e9' : '#ffebee',
                      border: `2px solid ${suitable ? '#4CAF50' : '#f44336'}`,
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                      {activityIcons[activity]}
                    </div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {activityNames[activity]}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: suitable ? '#2e7d32' : '#c62828',
                      fontWeight: 'bold'
                    }}>
                      {suitable ? '✓ Suitable' : '✗ Not Recommended'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
