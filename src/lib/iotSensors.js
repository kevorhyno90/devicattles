/**
 * IoT Sensor Integration System
 * Simulates and manages IoT devices for smart farming
 * 
 * Supported Sensors:
 * - Weight Scales (automatic animal weighing)
 * - Milk Meters (real-time production tracking)
 * - Weather Stations (on-farm weather data)
 * - Soil Moisture Sensors
 * - GPS Trackers (animal location)
 * - Water Level Sensors
 * - Temperature/Humidity Sensors (barn monitoring)
 * - Feed Level Sensors
 */

const STORAGE_KEY = 'cattalytics:iot-devices'
const READINGS_KEY = 'cattalytics:iot-readings'
const MAX_READINGS_PER_DEVICE = 1000

/**
 * Device Types Configuration
 */
export const DEVICE_TYPES = {
  WEIGHT_SCALE: {
    id: 'weight_scale',
    name: 'Weight Scale',
    icon: '⚖️',
    unit: 'kg',
    dataFields: ['weight'],
    updateInterval: 300000, // 5 minutes
    mockRange: { min: 200, max: 800 }
  },
  MILK_METER: {
    id: 'milk_meter',
    name: 'Milk Meter',
    icon: '🥛',
    unit: 'liters',
    dataFields: ['volume', 'flowRate', 'temperature'],
    updateInterval: 60000, // 1 minute during milking
    mockRange: { min: 0, max: 30 }
  },
  SOIL_MOISTURE: {
    id: 'soil_moisture',
    name: 'Soil Moisture Sensor',
    icon: '💧',
    unit: '%',
    dataFields: ['moisture', 'temperature'],
    updateInterval: 600000, // 10 minutes
    mockRange: { min: 20, max: 80 }
  },
  WEATHER_STATION: {
    id: 'weather_station',
    name: 'Weather Station',
    icon: '🌤️',
    unit: 'multi',
    dataFields: ['temperature', 'humidity', 'pressure', 'windSpeed', 'rainfall'],
    updateInterval: 300000, // 5 minutes
    mockRange: {}
  },
  GPS_TRACKER: {
    id: 'gps_tracker',
    name: 'GPS Tracker',
    icon: '📍',
    unit: 'coordinates',
    dataFields: ['latitude', 'longitude', 'speed', 'heading'],
    updateInterval: 60000, // 1 minute
    mockRange: {}
  },
  WATER_LEVEL: {
    id: 'water_level',
    name: 'Water Level Sensor',
    icon: '🚰',
    unit: 'cm',
    dataFields: ['level', 'volume'],
    updateInterval: 300000, // 5 minutes
    mockRange: { min: 0, max: 200 }
  },
  TEMPERATURE_HUMIDITY: {
    id: 'temp_humidity',
    name: 'Temperature & Humidity',
    icon: '🌡️',
    unit: 'multi',
    dataFields: ['temperature', 'humidity'],
    updateInterval: 300000, // 5 minutes
    mockRange: {}
  },
  FEED_LEVEL: {
    id: 'feed_level',
    name: 'Feed Level Sensor',
    icon: '🌾',
    unit: 'kg',
    dataFields: ['weight', 'level'],
    updateInterval: 600000, // 10 minutes
    mockRange: { min: 0, max: 500 }
  }
}

/**
 * Get all registered IoT devices
 */
export function getDevices() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Error loading IoT devices:', e)
    return []
  }
}

/**
 * Register a new IoT device
 */
export function registerDevice(deviceConfig) {
  try {
    const devices = getDevices()
    
    const newDevice = {
      id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: deviceConfig.type,
      name: deviceConfig.name,
      location: deviceConfig.location || 'Unknown',
      status: 'active',
      lastReading: null,
      lastSync: new Date().toISOString(),
      registered: new Date().toISOString(),
      config: deviceConfig.config || {},
      ...DEVICE_TYPES[deviceConfig.type]
    }
    
    devices.push(newDevice)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices))
    
    // Start mock data generation if in demo mode
    if (deviceConfig.mockData) {
      startMockDataGeneration(newDevice.id)
    }
    
    return { success: true, device: newDevice }
  } catch (e) {
    console.error('Error registering device:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Remove a device
 */
export function removeDevice(deviceId) {
  try {
    const devices = getDevices()
    const filtered = devices.filter(d => d.id !== deviceId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    
    // Remove associated readings
    const readings = getDeviceReadings(deviceId)
    if (readings) {
      const allReadings = getAllReadings()
      delete allReadings[deviceId]
      localStorage.setItem(READINGS_KEY, JSON.stringify(allReadings))
    }
    
    return { success: true }
  } catch (e) {
    console.error('Error removing device:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Update device status
 */
export function updateDeviceStatus(deviceId, status) {
  try {
    const devices = getDevices()
    const updated = devices.map(d => 
      d.id === deviceId ? { ...d, status, lastSync: new Date().toISOString() } : d
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return { success: true }
  } catch (e) {
    console.error('Error updating device status:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Get all readings storage
 */
function getAllReadings() {
  try {
    const data = localStorage.getItem(READINGS_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error('Error loading readings:', e)
    return {}
  }
}

/**
 * Get readings for a specific device
 */
export function getDeviceReadings(deviceId, limit = 100) {
  try {
    const allReadings = getAllReadings()
    const deviceReadings = allReadings[deviceId] || []
    
    // Return most recent readings
    return deviceReadings.slice(-limit)
  } catch (e) {
    console.error('Error getting device readings:', e)
    return []
  }
}

/**
 * Add a reading from a device
 */
export function addReading(deviceId, data) {
  try {
    const allReadings = getAllReadings()
    
    if (!allReadings[deviceId]) {
      allReadings[deviceId] = []
    }
    
    const reading = {
      id: `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      data,
      timestamp: new Date().toISOString()
    }
    
    allReadings[deviceId].push(reading)
    
    // Keep only last MAX_READINGS_PER_DEVICE readings
    if (allReadings[deviceId].length > MAX_READINGS_PER_DEVICE) {
      allReadings[deviceId] = allReadings[deviceId].slice(-MAX_READINGS_PER_DEVICE)
    }
    
    localStorage.setItem(READINGS_KEY, JSON.stringify(allReadings))
    
    // Update device's last reading
    const devices = getDevices()
    const updated = devices.map(d => 
      d.id === deviceId ? { ...d, lastReading: reading, lastSync: new Date().toISOString() } : d
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    
    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent('iotReading', { detail: { deviceId, reading } }))
    
    // Check for alerts
    checkReadingAlerts(deviceId, reading)
    
    return { success: true, reading }
  } catch (e) {
    console.error('Error adding reading:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Generate mock sensor data for demo/testing
 */
export function generateMockReading(device) {
  const data = {}
  
  switch (device.type) {
    case 'weight_scale':
      data.weight = Math.round((Math.random() * (device.mockRange.max - device.mockRange.min) + device.mockRange.min) * 10) / 10
      break
      
    case 'milk_meter':
      data.volume = Math.round(Math.random() * device.mockRange.max * 10) / 10
      data.flowRate = Math.round(Math.random() * 5 * 10) / 10
      data.temperature = Math.round((36 + Math.random() * 2) * 10) / 10
      break
      
    case 'soil_moisture':
      data.moisture = Math.round((Math.random() * (device.mockRange.max - device.mockRange.min) + device.mockRange.min) * 10) / 10
      data.temperature = Math.round((15 + Math.random() * 15) * 10) / 10
      break
      
    case 'weather_station':
      data.temperature = Math.round((18 + Math.random() * 12) * 10) / 10
      data.humidity = Math.round(40 + Math.random() * 40)
      data.pressure = Math.round(1000 + Math.random() * 40)
      data.windSpeed = Math.round(Math.random() * 20 * 10) / 10
      data.rainfall = Math.round(Math.random() * 5 * 10) / 10
      break
      
    case 'gps_tracker':
      data.latitude = -1.2921 + (Math.random() - 0.5) * 0.01
      data.longitude = 36.8219 + (Math.random() - 0.5) * 0.01
      data.speed = Math.round(Math.random() * 5 * 10) / 10
      data.heading = Math.round(Math.random() * 360)
      break
      
    case 'water_level':
      data.level = Math.round((Math.random() * device.mockRange.max) * 10) / 10
      data.volume = Math.round(data.level * 10) // Assuming 10L per cm
      break
      
    case 'temp_humidity':
      data.temperature = Math.round((18 + Math.random() * 12) * 10) / 10
      data.humidity = Math.round(40 + Math.random() * 40)
      break
      
    case 'feed_level':
      data.weight = Math.round((Math.random() * device.mockRange.max) * 10) / 10
      data.level = Math.round((data.weight / device.mockRange.max) * 100)
      break
      
    default:
      data.value = Math.random() * 100
  }
  
  return data
}

/**
 * Start automatic mock data generation for a device
 */
export function startMockDataGeneration(deviceId) {
  const devices = getDevices()
  const device = devices.find(d => d.id === deviceId)
  
  if (!device) return
  
  // Generate initial reading
  const mockData = generateMockReading(device)
  addReading(deviceId, mockData)
  
  // Set up interval for continuous updates
  const intervalId = setInterval(() => {
    const devices = getDevices()
    const currentDevice = devices.find(d => d.id === deviceId)
    
    if (!currentDevice || currentDevice.status !== 'active') {
      clearInterval(intervalId)
      return
    }
    
    const mockData = generateMockReading(currentDevice)
    addReading(deviceId, mockData)
  }, device.updateInterval)
  
  // Store interval ID for cleanup
  if (!window.iotIntervals) window.iotIntervals = {}
  window.iotIntervals[deviceId] = intervalId
}

/**
 * Stop mock data generation for a device
 */
export function stopMockDataGeneration(deviceId) {
  if (window.iotIntervals && window.iotIntervals[deviceId]) {
    clearInterval(window.iotIntervals[deviceId])
    delete window.iotIntervals[deviceId]
  }
}

/**
 * Check sensor readings for alert conditions
 */
function checkReadingAlerts(deviceId, reading) {
  const device = getDevices().find(d => d.id === deviceId)
  if (!device) return
  
  const alerts = []
  
  // Weight scale alerts
  if (device.type === 'weight_scale' && reading.data.weight) {
    if (reading.data.weight < 250) {
      alerts.push({
        type: 'warning',
        message: `Low weight detected: ${reading.data.weight}kg on ${device.name}`
      })
    }
  }
  
  // Soil moisture alerts
  if (device.type === 'soil_moisture' && reading.data.moisture) {
    if (reading.data.moisture < 30) {
      alerts.push({
        type: 'alert',
        message: `Low soil moisture: ${reading.data.moisture}% at ${device.location}`
      })
    }
  }
  
  // Water level alerts
  if (device.type === 'water_level' && reading.data.level) {
    if (reading.data.level < 20) {
      alerts.push({
        type: 'critical',
        message: `Water level critically low: ${reading.data.level}cm in ${device.name}`
      })
    }
  }
  
  // Feed level alerts
  if (device.type === 'feed_level' && reading.data.level) {
    if (reading.data.level < 20) {
      alerts.push({
        type: 'warning',
        message: `Feed running low: ${reading.data.level}% remaining in ${device.name}`
      })
    }
  }
  
  // Dispatch alerts
  alerts.forEach(alert => {
    window.dispatchEvent(new CustomEvent('iotAlert', { detail: alert }))
  })
}

/**
 * Get device statistics
 */
export function getDeviceStats(deviceId, timeRange = '24h') {
  const readings = getDeviceReadings(deviceId, 1000)
  if (readings.length === 0) return null
  
  const now = new Date()
  const cutoff = new Date(now - parseTimeRange(timeRange))
  
  const recentReadings = readings.filter(r => new Date(r.timestamp) >= cutoff)
  
  if (recentReadings.length === 0) return null
  
  const device = getDevices().find(d => d.id === deviceId)
  const stats = {
    count: recentReadings.length,
    timeRange
  }
  
  // Calculate stats for each data field
  device.dataFields.forEach(field => {
    const values = recentReadings.map(r => r.data[field]).filter(v => v !== undefined)
    
    if (values.length > 0) {
      stats[field] = {
        current: values[values.length - 1],
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        trend: calculateTrend(values)
      }
    }
  })
  
  return stats
}

/**
 * Parse time range string to milliseconds
 */
function parseTimeRange(range) {
  const units = {
    h: 3600000,
    d: 86400000,
    w: 604800000,
    m: 2592000000
  }
  
  const match = range.match(/^(\d+)([hdwm])$/)
  if (!match) return 86400000 // Default 24h
  
  return parseInt(match[1]) * (units[match[2]] || 86400000)
}

/**
 * Calculate trend from values (positive = increasing, negative = decreasing)
 */
function calculateTrend(values) {
  if (values.length < 2) return 0
  
  const first = values.slice(0, Math.floor(values.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 3)
  const last = values.slice(-Math.floor(values.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 3)
  
  return ((last - first) / first) * 100
}

export default {
  DEVICE_TYPES,
  getDevices,
  registerDevice,
  removeDevice,
  updateDeviceStatus,
  getDeviceReadings,
  addReading,
  generateMockReading,
  startMockDataGeneration,
  stopMockDataGeneration,
  getDeviceStats
}
