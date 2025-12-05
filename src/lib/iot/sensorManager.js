/**
 * IoT Sensor Integration Manager
 * Supports multiple protocols: MQTT, WebSocket, HTTP polling
 * Device types: Weight scales, milk meters, weather stations, soil sensors, GPS trackers
 */

import { logActivity } from '../audit'

// Helper functions for localStorage
const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('localStorage save error:', e)
  }
}

const getFromLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (e) {
    console.error('localStorage read error:', e)
    return null
  }
}

// Device registry
const DEVICES_KEY = 'cattalytics:iot:devices'
const READINGS_KEY = 'cattalytics:iot:readings'
const DEVICE_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Device types supported
 */
export const DEVICE_TYPES = {
  WEIGHT_SCALE: 'weight_scale',
  MILK_METER: 'milk_meter',
  WEATHER_STATION: 'weather_station',
  SOIL_SENSOR: 'soil_sensor',
  GPS_TRACKER: 'gps_tracker',
  TEMPERATURE_SENSOR: 'temperature_sensor',
  HUMIDITY_SENSOR: 'humidity_sensor',
  WATER_LEVEL: 'water_level'
}

/**
 * Connection protocols
 */
export const PROTOCOLS = {
  MQTT: 'mqtt',
  WEBSOCKET: 'websocket',
  HTTP: 'http',
  BLUETOOTH: 'bluetooth'
}

/**
 * Device status
 */
export const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  PAIRING: 'pairing',
  ERROR: 'error'
}

/**
 * Get all registered devices
 */
export function getDevices() {
  return getFromLocalStorage(DEVICES_KEY) || []
}

/**
 * Get device by ID
 */
export function getDevice(deviceId) {
  const devices = getDevices()
  return devices.find(d => d.id === deviceId)
}

/**
 * Register new IoT device
 */
export function registerDevice(deviceConfig) {
  const devices = getDevices()
  
  const device = {
    id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: deviceConfig.name,
    type: deviceConfig.type,
    protocol: deviceConfig.protocol,
    endpoint: deviceConfig.endpoint, // URL, topic, or device address
    status: DEVICE_STATUS.PAIRING,
    lastSeen: null,
    lastReading: null,
    metadata: deviceConfig.metadata || {},
    settings: deviceConfig.settings || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  devices.push(device)
  saveToLocalStorage(DEVICES_KEY, devices)
  
  logActivity('iot_device_registered', `Device registered: ${device.name} (${device.type})`, { deviceId: device.id })
  
  return device
}

/**
 * Update device configuration
 */
export function updateDevice(deviceId, updates) {
  const devices = getDevices()
  const index = devices.findIndex(d => d.id === deviceId)
  
  if (index === -1) {
    throw new Error(`Device not found: ${deviceId}`)
  }
  
  devices[index] = {
    ...devices[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  saveToLocalStorage(DEVICES_KEY, devices)
  
  logActivity('iot_device_updated', `Device updated: ${devices[index].name}`, { deviceId })
  
  return devices[index]
}

/**
 * Remove device from registry
 */
export function removeDevice(deviceId) {
  let devices = getDevices()
  const device = devices.find(d => d.id === deviceId)
  
  if (!device) {
    throw new Error(`Device not found: ${deviceId}`)
  }
  
  devices = devices.filter(d => d.id !== deviceId)
  saveToLocalStorage(DEVICES_KEY, devices)
  
  // Also remove readings
  removeDeviceReadings(deviceId)
  
  logActivity('iot_device_removed', `Device removed: ${device.name}`, { deviceId })
  
  return true
}

/**
 * Update device status
 */
export function updateDeviceStatus(deviceId, status, lastSeen = new Date()) {
  return updateDevice(deviceId, {
    status,
    lastSeen: lastSeen.toISOString()
  })
}

/**
 * Store sensor reading
 */
export function storeSensorReading(deviceId, reading) {
  const device = getDevice(deviceId)
  
  if (!device) {
    throw new Error(`Device not found: ${deviceId}`)
  }
  
  const allReadings = getFromLocalStorage(READINGS_KEY) || {}
  
  if (!allReadings[deviceId]) {
    allReadings[deviceId] = []
  }
  
  const readingEntry = {
    id: `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    deviceId,
    timestamp: new Date().toISOString(),
    data: reading,
    deviceType: device.type
  }
  
  allReadings[deviceId].push(readingEntry)
  
  // Keep only last 1000 readings per device
  if (allReadings[deviceId].length > 1000) {
    allReadings[deviceId] = allReadings[deviceId].slice(-1000)
  }
  
  saveToLocalStorage(READINGS_KEY, allReadings)
  
  // Update device last reading
  updateDevice(deviceId, {
    lastReading: readingEntry,
    lastSeen: readingEntry.timestamp,
    status: DEVICE_STATUS.ONLINE
  })
  
  return readingEntry
}

/**
 * Get readings for a device
 */
export function getDeviceReadings(deviceId, limit = 100) {
  const allReadings = getFromLocalStorage(READINGS_KEY) || {}
  const readings = allReadings[deviceId] || []
  
  return readings.slice(-limit).reverse() // Most recent first
}

/**
 * Get latest reading for device
 */
export function getLatestReading(deviceId) {
  const readings = getDeviceReadings(deviceId, 1)
  return readings[0] || null
}

/**
 * Remove all readings for a device
 */
function removeDeviceReadings(deviceId) {
  const allReadings = getFromLocalStorage(READINGS_KEY) || {}
  delete allReadings[deviceId]
  saveToLocalStorage(READINGS_KEY, allReadings)
}

/**
 * Simulate device reading (for demo/testing)
 */
export function simulateReading(deviceType) {
  switch (deviceType) {
    case DEVICE_TYPES.WEIGHT_SCALE:
      return {
        weight: Math.round(200 + Math.random() * 300), // 200-500 kg
        unit: 'kg',
        stable: Math.random() > 0.2 // 80% stable readings
      }
    
    case DEVICE_TYPES.MILK_METER:
      return {
        volume: Math.round((5 + Math.random() * 20) * 10) / 10, // 5-25 liters
        unit: 'liters',
        flowRate: Math.round((1 + Math.random() * 3) * 10) / 10, // 1-4 L/min
        temperature: Math.round((35 + Math.random() * 5) * 10) / 10 // 35-40°C
      }
    
    case DEVICE_TYPES.WEATHER_STATION:
      return {
        temperature: Math.round((15 + Math.random() * 20) * 10) / 10, // 15-35°C
        humidity: Math.round(30 + Math.random() * 60), // 30-90%
        pressure: Math.round(980 + Math.random() * 40), // 980-1020 hPa
        windSpeed: Math.round(Math.random() * 20 * 10) / 10, // 0-20 km/h
        rainfall: Math.round(Math.random() * 10 * 10) / 10 // 0-10 mm
      }
    
    case DEVICE_TYPES.SOIL_SENSOR:
      return {
        moisture: Math.round(20 + Math.random() * 60), // 20-80%
        temperature: Math.round((15 + Math.random() * 15) * 10) / 10, // 15-30°C
        pH: Math.round((5.5 + Math.random() * 2.5) * 10) / 10, // 5.5-8.0
        ec: Math.round((0.5 + Math.random() * 2) * 100) / 100 // 0.5-2.5 dS/m
      }
    
    case DEVICE_TYPES.GPS_TRACKER:
      return {
        latitude: -1.286389 + (Math.random() - 0.5) * 0.01, // Near Nairobi
        longitude: 36.817223 + (Math.random() - 0.5) * 0.01,
        altitude: Math.round(1600 + Math.random() * 100), // 1600-1700m
        speed: Math.round(Math.random() * 5 * 10) / 10, // 0-5 km/h
        heading: Math.round(Math.random() * 360) // 0-360°
      }
    
    case DEVICE_TYPES.TEMPERATURE_SENSOR:
      return {
        temperature: Math.round((20 + Math.random() * 15) * 10) / 10, // 20-35°C
        unit: 'celsius'
      }
    
    case DEVICE_TYPES.HUMIDITY_SENSOR:
      return {
        humidity: Math.round(40 + Math.random() * 50), // 40-90%
        unit: 'percent'
      }
    
    case DEVICE_TYPES.WATER_LEVEL:
      return {
        level: Math.round(Math.random() * 100), // 0-100%
        volume: Math.round(Math.random() * 5000), // 0-5000 liters
        unit: 'liters'
      }
    
    default:
      return { value: Math.random() * 100 }
  }
}

/**
 * MQTT Connection Manager (for future implementation)
 */
export class MQTTManager {
  constructor(brokerUrl, options = {}) {
    this.brokerUrl = brokerUrl
    this.options = options
    this.client = null
    this.subscriptions = new Map()
  }
  
  connect() {
    console.log(`MQTT: Would connect to ${this.brokerUrl}`)
    // TODO: Implement actual MQTT.js client when needed
    // For now, this is a placeholder for future WebSocket-based MQTT
    return Promise.resolve()
  }
  
  subscribe(topic, callback) {
    console.log(`MQTT: Would subscribe to ${topic}`)
    this.subscriptions.set(topic, callback)
    return Promise.resolve()
  }
  
  publish(topic, message) {
    console.log(`MQTT: Would publish to ${topic}:`, message)
    return Promise.resolve()
  }
  
  disconnect() {
    console.log('MQTT: Disconnecting')
    this.subscriptions.clear()
    return Promise.resolve()
  }
}

/**
 * WebSocket Connection Manager
 */
export class WebSocketManager {
  constructor(url) {
    this.url = url
    this.ws = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }
  
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)
        
        this.ws.onopen = () => {
          console.log(`WebSocket connected to ${this.url}`)
          this.reconnectAttempts = 0
          resolve()
        }
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }
        
        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }
  
  handleMessage(data) {
    // Notify all listeners
    this.listeners.forEach((callback) => {
      callback(data)
    })
  }
  
  on(event, callback) {
    this.listeners.set(event, callback)
  }
  
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket not connected')
    }
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
      setTimeout(() => this.connect(), delay)
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners.clear()
  }
}

/**
 * HTTP Polling Manager (for devices with REST APIs)
 */
export class HTTPPollingManager {
  constructor(url, interval = 5000) {
    this.url = url
    this.interval = interval
    this.timerId = null
    this.listeners = new Map()
  }
  
  start() {
    this.timerId = setInterval(() => {
      this.poll()
    }, this.interval)
    
    // Initial poll
    this.poll()
  }
  
  async poll() {
    try {
      const response = await fetch(this.url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      this.handleData(data)
    } catch (error) {
      console.error('Polling error:', error)
    }
  }
  
  handleData(data) {
    this.listeners.forEach((callback) => {
      callback(data)
    })
  }
  
  on(event, callback) {
    this.listeners.set(event, callback)
  }
  
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.listeners.clear()
  }
}

/**
 * Auto-process sensor readings (integrate with app modules)
 */
export function processSensorReading(device, reading) {
  const results = []
  
  try {
    switch (device.type) {
      case DEVICE_TYPES.WEIGHT_SCALE:
        if (device.metadata.animalId) {
          // Auto-record animal weight
          results.push({
            action: 'record_weight',
            animalId: device.metadata.animalId,
            weight: reading.weight,
            timestamp: new Date().toISOString()
          })
        }
        break
      
      case DEVICE_TYPES.MILK_METER:
        if (device.metadata.animalId) {
          // Auto-record milk yield
          results.push({
            action: 'record_milk',
            animalId: device.metadata.animalId,
            volume: reading.volume,
            temperature: reading.temperature,
            timestamp: new Date().toISOString()
          })
        }
        break
      
      case DEVICE_TYPES.SOIL_SENSOR:
        if (device.metadata.cropId || device.metadata.fieldId) {
          // Update crop/field conditions
          results.push({
            action: 'update_soil_conditions',
            cropId: device.metadata.cropId,
            fieldId: device.metadata.fieldId,
            moisture: reading.moisture,
            temperature: reading.temperature,
            pH: reading.pH,
            timestamp: new Date().toISOString()
          })
        }
        break
      
      case DEVICE_TYPES.GPS_TRACKER:
        if (device.metadata.animalId) {
          // Update animal location
          results.push({
            action: 'update_location',
            animalId: device.metadata.animalId,
            latitude: reading.latitude,
            longitude: reading.longitude,
            timestamp: new Date().toISOString()
          })
        }
        break
    }
  } catch (error) {
    console.error('Error processing sensor reading:', error)
  }
  
  return results
}

/**
 * Get device statistics
 */
export function getDeviceStats(deviceId, days = 7) {
  const readings = getDeviceReadings(deviceId, days * 24 * 60) // Assume ~1 reading/min
  
  if (readings.length === 0) {
    return null
  }
  
  const device = getDevice(deviceId)
  const stats = {
    deviceId,
    deviceType: device.type,
    totalReadings: readings.length,
    firstReading: readings[readings.length - 1].timestamp,
    lastReading: readings[0].timestamp,
    period: days
  }
  
  // Calculate type-specific stats
  switch (device.type) {
    case DEVICE_TYPES.WEIGHT_SCALE:
      const weights = readings.map(r => r.data.weight).filter(w => w != null)
      stats.averageWeight = Math.round(weights.reduce((a, b) => a + b, 0) / weights.length)
      stats.minWeight = Math.min(...weights)
      stats.maxWeight = Math.max(...weights)
      break
    
    case DEVICE_TYPES.MILK_METER:
      const volumes = readings.map(r => r.data.volume).filter(v => v != null)
      stats.totalVolume = Math.round(volumes.reduce((a, b) => a + b, 0) * 10) / 10
      stats.averageVolume = Math.round((volumes.reduce((a, b) => a + b, 0) / volumes.length) * 10) / 10
      break
    
    case DEVICE_TYPES.WEATHER_STATION:
      const temps = readings.map(r => r.data.temperature).filter(t => t != null)
      const rainfall = readings.map(r => r.data.rainfall || 0)
      stats.averageTemp = Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10
      stats.totalRainfall = Math.round(rainfall.reduce((a, b) => a + b, 0) * 10) / 10
      break
    
    case DEVICE_TYPES.SOIL_SENSOR:
      const moisture = readings.map(r => r.data.moisture).filter(m => m != null)
      stats.averageMoisture = Math.round(moisture.reduce((a, b) => a + b, 0) / moisture.length)
      break
  }
  
  return stats
}

/**
 * Check device health (offline detection)
 */
export function checkDeviceHealth() {
  const devices = getDevices()
  const now = new Date()
  const alerts = []
  
  devices.forEach(device => {
    if (!device.lastSeen) {
      return // Never seen, skip
    }
    
    const lastSeen = new Date(device.lastSeen)
    const minutesSinceLastSeen = (now - lastSeen) / (1000 * 60)
    
    // Mark as offline if no reading in 15 minutes
    if (minutesSinceLastSeen > 15 && device.status === DEVICE_STATUS.ONLINE) {
      updateDeviceStatus(device.id, DEVICE_STATUS.OFFLINE)
      alerts.push({
        deviceId: device.id,
        deviceName: device.name,
        type: 'device_offline',
        message: `Device "${device.name}" has been offline for ${Math.round(minutesSinceLastSeen)} minutes`,
        severity: minutesSinceLastSeen > 60 ? 'high' : 'medium'
      })
    }
  })
  
  return alerts
}

// Export default manager instance
export default {
  getDevices,
  getDevice,
  registerDevice,
  updateDevice,
  removeDevice,
  updateDeviceStatus,
  storeSensorReading,
  getDeviceReadings,
  getLatestReading,
  simulateReading,
  processSensorReading,
  getDeviceStats,
  checkDeviceHealth,
  DEVICE_TYPES,
  PROTOCOLS,
  DEVICE_STATUS
}
