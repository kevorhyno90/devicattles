/**
 * Weather API Integration
 * Provides real-time weather data and forecasts for farm locations
 * Uses OpenWeatherMap API (free tier: 1000 calls/day)
 */

// Cache weather data to reduce API calls
const CACHE_KEY = 'cattalytics:weather:cache'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

/**
 * Get cached weather data if still valid
 */
function getCachedWeather(location) {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}:${location}`)
    if (cached) {
      const data = JSON.parse(cached)
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data.weather
      }
    }
  } catch (e) {
    console.error('Cache read error:', e)
  }
  return null
}

/**
 * Cache weather data
 */
function cacheWeather(location, weather) {
  try {
    localStorage.setItem(`${CACHE_KEY}:${location}`, JSON.stringify({
      weather,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.error('Cache write error:', e)
  }
}

  /**
   * Get mock weather data for demo/fallback
   */
  function getMockWeatherData(location) {
    const cityName = location.includes(',') ? location.split(',')[0].trim() : location
    return {
      location: cityName,
      country: 'KE',
      temperature: 25,
      feelsLike: 26,
      tempMin: 22,
      tempMax: 28,
      humidity: 65,
      pressure: 1013,
      description: 'partly cloudy',
      icon: '02d',
      iconUrl: 'https://openweathermap.org/img/wn/02d@2x.png',
      windSpeed: 3.5,
      windDirection: 180,
      cloudiness: 40,
      visibility: 10000,
      sunrise: new Date(),
      sunset: new Date(Date.now() + 12 * 60 * 60 * 1000),
      timestamp: new Date(),
      coordinates: { lat: -1.2921, lon: 36.8219 },
      isMock: true
    }
  }

/**
 * Get current weather for a location
 * @param {string} location - City name or coordinates (lat,lon)
 * @param {string} apiKey - OpenWeatherMap API key (optional, uses free demo if not provided)
 */
export async function getCurrentWeather(location, apiKey = null) {
  // Check cache first
  const cached = getCachedWeather(location)
  if (cached) {
    return cached
  }

  try {
    // Use OpenWeatherMap API
    const baseUrl = 'https://api.openweathermap.org/data/2.5/weather'
    // Priority: passed apiKey > env variable > localStorage > demo
    const key = apiKey || import.meta.env.VITE_WEATHER_API_KEY || localStorage.getItem('cattalytics:weather:apikey') || 'demo'
    
    // Skip if using demo key (will fail with 401), return mock data instead
    if (key === 'demo') {
      console.info('⚠️ Weather: Using demo mode (use a real API key for live data)');
      return getMockWeatherData(location);
    }
    if (location.includes(',')) {
      const [part1, part2] = location.split(',')
      // Check if both parts are numbers (coordinates) vs city,country
      const isCoordinates = !isNaN(parseFloat(part1)) && !isNaN(parseFloat(part2))
      
      if (isCoordinates) {
        // Coordinates format: lat,lon
        url = `${baseUrl}?lat=${part1}&lon=${part2}&appid=${key}&units=metric`
      } else {
        // City,Country format: Nairobi,KE
        url = `${baseUrl}?q=${encodeURIComponent(location)}&appid=${key}&units=metric`
      }
    } else {
      // City name only
      url = `${baseUrl}?q=${encodeURIComponent(location)}&appid=${key}&units=metric`
    }

    const response = await fetch(url)
    
    if (!response.ok) {
      // Don't log 401 errors when using demo key - this is expected
      if (response.status !== 401 || key !== 'demo') {
        console.warn(`Weather API returned ${response.status}, falling back to demo mode`)
      }
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()
    
    const weather = {
      location: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      cloudiness: data.clouds.all,
      visibility: data.visibility,
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000),
      timestamp: new Date(data.dt * 1000),
      coordinates: {
        lat: data.coord.lat,
        lon: data.coord.lon
      }
    }

    // Cache the result
    cacheWeather(location, weather)
    
    return weather
  } catch (error) {
    // Only log non-401 errors or when using real API key
    if (!error.message.includes('401')) {
      console.error('Weather fetch error:', error)
    }
    
    // Extract city name from location (handle "City,Country" format)
    const cityName = location.includes(',') ? location.split(',')[0].trim() : location
    
    // Return mock data as fallback for demo purposes
    return {
      location: cityName,
      country: 'KE',
      temperature: 25,
      feelsLike: 26,
      tempMin: 22,
      tempMax: 28,
      humidity: 65,
      pressure: 1013,
      description: 'partly cloudy',
      icon: '02d',
      iconUrl: 'https://openweathermap.org/img/wn/02d@2x.png',
      windSpeed: 3.5,
      windDirection: 180,
      cloudiness: 40,
      visibility: 10000,
      sunrise: new Date(),
      sunset: new Date(),
      timestamp: new Date(),
      coordinates: { lat: -1.2921, lon: 36.8219 },
      demo: true,
      error: error.message
    }
  }
}

/**
 * Get 5-day weather forecast
 */
export async function getWeatherForecast(location, apiKey = null) {
  try {
    const baseUrl = 'https://api.openweathermap.org/data/2.5/forecast'
    // Priority: passed apiKey > env variable > localStorage > demo
    const key = apiKey || import.meta.env.VITE_WEATHER_API_KEY || localStorage.getItem('cattalytics:weather:apikey') || 'demo'
    
    let url
    if (location.includes(',')) {
      const [part1, part2] = location.split(',')
      // Check if both parts are numbers (coordinates) vs city,country
      const isCoordinates = !isNaN(parseFloat(part1)) && !isNaN(parseFloat(part2))
      
      if (isCoordinates) {
        // Coordinates format: lat,lon
        url = `${baseUrl}?lat=${part1}&lon=${part2}&appid=${key}&units=metric`
      } else {
        // City,Country format: Nairobi,KE
        url = `${baseUrl}?q=${encodeURIComponent(location)}&appid=${key}&units=metric`
      }
    } else {
      // City name only
      url = `${baseUrl}?q=${encodeURIComponent(location)}&appid=${key}&units=metric`
    }

    const response = await fetch(url)
    
    if (!response.ok) {
      // Don't log 401 errors when using demo key
      if (response.status !== 401 || key !== 'demo') {
        console.warn(`Weather forecast API returned ${response.status}, falling back to demo mode`)
      }
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Group by day
    const dailyForecasts = {}
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString()
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date: new Date(item.dt * 1000),
          temps: [],
          conditions: [],
          humidity: [],
          windSpeed: [],
          rainfall: 0
        }
      }
      
      dailyForecasts[date].temps.push(item.main.temp)
      dailyForecasts[date].conditions.push(item.weather[0].description)
      dailyForecasts[date].humidity.push(item.main.humidity)
      dailyForecasts[date].windSpeed.push(item.wind.speed)
      if (item.rain) {
        dailyForecasts[date].rainfall += (item.rain['3h'] || 0)
      }
    })

    // Calculate daily summaries
    const forecast = Object.values(dailyForecasts).slice(0, 5).map(day => ({
      date: day.date,
      tempMin: Math.round(Math.min(...day.temps)),
      tempMax: Math.round(Math.max(...day.temps)),
      tempAvg: Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length),
      humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      windSpeed: (day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length).toFixed(1),
      rainfall: day.rainfall.toFixed(1),
      condition: getMostCommonCondition(day.conditions),
      dayName: day.date.toLocaleDateString('en-US', { weekday: 'short' })
    }))

    return forecast
  } catch (error) {
    // Only log non-401 errors
    if (!error.message.includes('401')) {
      console.error('Forecast fetch error:', error)
    }
    
    // Return mock forecast
    return Array.from({ length: 5 }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      tempMin: 20 + Math.random() * 5,
      tempMax: 28 + Math.random() * 5,
      tempAvg: 24 + Math.random() * 4,
      humidity: 60 + Math.random() * 20,
      windSpeed: (2 + Math.random() * 3).toFixed(1),
      rainfall: Math.random() > 0.5 ? (Math.random() * 10).toFixed(1) : '0.0',
      condition: ['clear', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
      dayName: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      demo: true
    }))
  }
}

/**
 * Get most common condition from array
 */
function getMostCommonCondition(conditions) {
  const counts = {}
  conditions.forEach(c => {
    counts[c] = (counts[c] || 0) + 1
  })
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
}

/**
 * Get farming advice based on weather
 */
export function getFarmingAdvice(weather, forecast) {
  const advice = []
  
  // Temperature advice
  if (weather.temperature > 30) {
    advice.push({
      type: 'warning',
      icon: '🌡️',
      title: 'High Temperature Alert',
      message: 'Ensure animals have adequate shade and water. Consider moving livestock to cooler areas.',
      priority: 'high'
    })
  } else if (weather.temperature < 10) {
    advice.push({
      type: 'warning',
      icon: '❄️',
      title: 'Cold Weather Alert',
      message: 'Provide shelter for sensitive animals. Check water sources for freezing.',
      priority: 'medium'
    })
  }
  
  // Rain/drought advice
  const totalRainfall = forecast.reduce((sum, day) => sum + parseFloat(day.rainfall), 0)
  
  if (totalRainfall > 50) {
    advice.push({
      type: 'info',
      icon: '🌧️',
      title: 'Heavy Rain Expected',
      message: `${totalRainfall.toFixed(1)}mm of rain forecasted over 5 days. Prepare drainage, delay planting, secure equipment.`,
      priority: 'high'
    })
  } else if (totalRainfall < 2) {
    advice.push({
      type: 'warning',
      icon: '☀️',
      title: 'Dry Period Ahead',
      message: 'Minimal rain expected. Plan irrigation, check water storage, monitor crop moisture.',
      priority: 'medium'
    })
  }
  
  // Wind advice
  if (weather.windSpeed > 10) {
    advice.push({
      type: 'warning',
      icon: '💨',
      title: 'Strong Winds',
      message: 'Secure loose equipment and structures. Protect young plants from wind damage.',
      priority: 'medium'
    })
  }
  
  // Humidity advice
  if (weather.humidity > 80) {
    advice.push({
      type: 'info',
      icon: '💧',
      title: 'High Humidity',
      message: 'Monitor for fungal diseases in crops. Ensure good ventilation for livestock.',
      priority: 'low'
    })
  }
  
  // Planting advice
  const avgTemp = forecast.reduce((sum, day) => sum + day.tempAvg, 0) / forecast.length
  if (avgTemp >= 20 && avgTemp <= 28 && totalRainfall > 10 && totalRainfall < 40) {
    advice.push({
      type: 'success',
      icon: '🌱',
      title: 'Good Planting Conditions',
      message: 'Weather conditions are favorable for planting. Moderate temperatures and adequate rainfall expected.',
      priority: 'low'
    })
  }
  
  return advice
}

/**
 * Get UV index and sun protection advice
 */
export function getSunProtectionAdvice(weather) {
  // Estimate UV index based on cloudiness and time
  const hour = new Date().getHours()
  const isMidday = hour >= 10 && hour <= 16
  const isClear = weather.cloudiness < 30
  
  let uvLevel = 'low'
  let advice = ''
  
  if (isMidday && isClear) {
    uvLevel = 'high'
    advice = 'UV radiation is high. Wear protective clothing, hat, and sunscreen when working outdoors.'
  } else if (isMidday) {
    uvLevel = 'moderate'
    advice = 'Moderate UV levels. Consider sun protection for extended outdoor work.'
  } else {
    uvLevel = 'low'
    advice = 'UV levels are currently low.'
  }
  
  return { uvLevel, advice }
}

/**
 * Check if conditions are good for specific farm activities
 */
export function getActivityRecommendations(weather, forecast) {
  const activities = {
    planting: false,
    spraying: false,
    harvesting: false,
    grazing: true,
    outdoorWork: true
  }
  
  // Check for rain
  const rainToday = forecast[0]?.rainfall > 0
  
  // Planting
  const avgTemp = forecast.slice(0, 3).reduce((sum, day) => sum + day.tempAvg, 0) / 3
  activities.planting = !rainToday && avgTemp >= 15 && avgTemp <= 30
  
  // Spraying (need calm, dry conditions)
  activities.spraying = !rainToday && weather.windSpeed < 5 && weather.humidity < 70
  
  // Harvesting (need dry conditions)
  activities.harvesting = !rainToday && weather.humidity < 60
  
  // Grazing (avoid extreme conditions)
  activities.grazing = weather.temperature > 5 && weather.temperature < 35 && !rainToday
  
  // General outdoor work
  activities.outdoorWork = weather.temperature > 5 && weather.temperature < 38 && weather.windSpeed < 15
  
  return activities
}

/**
 * Save user's farm location
 */
export function saveFarmLocation(location) {
  try {
    localStorage.setItem('cattalytics:farm:location', location)
  } catch (e) {
    console.error('Failed to save location:', e)
  }
}

/**
 * Get saved farm location
 */
export function getFarmLocation() {
  try {
    return localStorage.getItem('cattalytics:farm:location') || 'Nairobi,KE'
  } catch (e) {
    return 'Nairobi,KE'
  }
}

/**
 * Clear weather cache (useful for troubleshooting)
 */
export function clearWeatherCache() {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY)) {
        localStorage.removeItem(key)
      }
    })
  } catch (e) {
    console.error('Failed to clear cache:', e)
  }
}
