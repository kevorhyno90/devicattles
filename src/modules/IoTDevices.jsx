import React, { useState, useEffect } from 'react'
import {
  getDevices,
  registerDevice,
  updateDevice,
  removeDevice,
  getDeviceReadings,
  getLatestReading,
  getDeviceStats,
  simulateReading,
  storeSensorReading,
  checkDeviceHealth,
  DEVICE_TYPES,
  PROTOCOLS,
  DEVICE_STATUS
} from '../lib/iot/sensorManager'

export default function IoTDevices() {
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [readings, setReadings] = useState([])
  const [stats, setStats] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [healthAlerts, setHealthAlerts] = useState([])
  
  // Form state for new device
  const [formData, setFormData] = useState({
    name: '',
    type: DEVICE_TYPES.WEIGHT_SCALE,
    protocol: PROTOCOLS.HTTP,
    endpoint: '',
    metadata: {}
  })
  
  useEffect(() => {
    loadDevices()
    
    // Check device health every 5 minutes
    const healthCheckInterval = setInterval(() => {
      const alerts = checkDeviceHealth()
      setHealthAlerts(alerts)
    }, 5 * 60 * 1000)
    
    return () => clearInterval(healthCheckInterval)
  }, [])
  
  useEffect(() => {
    if (selectedDevice) {
      loadDeviceData(selectedDevice.id)
    }
  }, [selectedDevice])
  
  const loadDevices = () => {
    const allDevices = getDevices()
    setDevices(allDevices)
  }
  
  const loadDeviceData = (deviceId) => {
    const deviceReadings = getDeviceReadings(deviceId, 50)
    const deviceStats = getDeviceStats(deviceId, 7)
    setReadings(deviceReadings)
    setStats(deviceStats)
  }
  
  const handleAddDevice = () => {
    if (!formData.name || !formData.type) {
      alert('Please fill in required fields')
      return
    }
    
    try {
      const device = registerDevice(formData)
      loadDevices()
      setShowAddModal(false)
      setFormData({
        name: '',
        type: DEVICE_TYPES.WEIGHT_SCALE,
        protocol: PROTOCOLS.HTTP,
        endpoint: '',
        metadata: {}
      })
      alert(`Device "${device.name}" registered successfully!`)
    } catch (error) {
      alert(`Error registering device: ${error.message}`)
    }
  }
  
  const handleRemoveDevice = (deviceId) => {
    if (!confirm('Are you sure you want to remove this device?')) {
      return
    }
    
    try {
      removeDevice(deviceId)
      loadDevices()
      if (selectedDevice && selectedDevice.id === deviceId) {
        setSelectedDevice(null)
        setReadings([])
        setStats(null)
      }
      alert('Device removed successfully')
    } catch (error) {
      alert(`Error removing device: ${error.message}`)
    }
  }
  
  const handleSimulateReading = (device) => {
    try {
      const reading = simulateReading(device.type)
      storeSensorReading(device.id, reading)
      loadDevices()
      if (selectedDevice && selectedDevice.id === device.id) {
        loadDeviceData(device.id)
      }
      alert('Simulated reading recorded')
    } catch (error) {
      alert(`Error simulating reading: ${error.message}`)
    }
  }
  
  const getDeviceTypeIcon = (type) => {
    switch (type) {
      case DEVICE_TYPES.WEIGHT_SCALE: return '⚖️'
      case DEVICE_TYPES.MILK_METER: return '🥛'
      case DEVICE_TYPES.WEATHER_STATION: return '🌤️'
      case DEVICE_TYPES.SOIL_SENSOR: return '🌱'
      case DEVICE_TYPES.GPS_TRACKER: return '📍'
      case DEVICE_TYPES.TEMPERATURE_SENSOR: return '🌡️'
      case DEVICE_TYPES.HUMIDITY_SENSOR: return '💧'
      case DEVICE_TYPES.WATER_LEVEL: return '💦'
      default: return '📟'
    }
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case DEVICE_STATUS.ONLINE: return '#10b981' // green
      case DEVICE_STATUS.OFFLINE: return '#ef4444' // red
      case DEVICE_STATUS.PAIRING: return '#f59e0b' // amber
      case DEVICE_STATUS.ERROR: return '#dc2626' // red-600
      default: return '#6b7280' // gray
    }
  }
  
  const formatReading = (reading, deviceType) => {
    const data = reading.data
    
    switch (deviceType) {
      case DEVICE_TYPES.WEIGHT_SCALE:
        return `${data.weight} ${data.unit} ${data.stable ? '✓' : '⚠️ unstable'}`
      
      case DEVICE_TYPES.MILK_METER:
        return `${data.volume} L @ ${data.temperature}°C (${data.flowRate} L/min)`
      
      case DEVICE_TYPES.WEATHER_STATION:
        return `${data.temperature}°C, ${data.humidity}% RH, ${data.windSpeed} km/h, ${data.rainfall}mm rain`
      
      case DEVICE_TYPES.SOIL_SENSOR:
        return `Moisture: ${data.moisture}%, Temp: ${data.temperature}°C, pH: ${data.pH}`
      
      case DEVICE_TYPES.GPS_TRACKER:
        return `Lat: ${data.latitude.toFixed(6)}, Lon: ${data.longitude.toFixed(6)}, ${data.speed} km/h`
      
      case DEVICE_TYPES.TEMPERATURE_SENSOR:
        return `${data.temperature}°C`
      
      case DEVICE_TYPES.HUMIDITY_SENSOR:
        return `${data.humidity}%`
      
      case DEVICE_TYPES.WATER_LEVEL:
        return `${data.level}% (${data.volume} L)`
      
      default:
        return JSON.stringify(data)
    }
  }
  
  return (
    <div className="iot-devices-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          📟 IoT Devices & Sensors
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          + Add Device
        </button>
      </div>
      
      {/* Health Alerts */}
      {healthAlerts.length > 0 && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>⚠️ Device Alerts:</strong>
          {healthAlerts.map((alert, idx) => (
            <div key={idx} style={{ marginTop: '5px', color: '#92400e' }}>
              • {alert.message}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
        {/* Devices List */}
        <div>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600' }}>
              Registered Devices ({devices.length})
            </h3>
            
            {devices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                <p>No devices registered yet</p>
                <p style={{ fontSize: '12px', marginTop: '10px' }}>
                  Click "Add Device" to register your first IoT sensor
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {devices.map(device => (
                  <div
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    style={{
                      padding: '12px',
                      border: `2px solid ${selectedDevice?.id === device.id ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: selectedDevice?.id === device.id ? '#eff6ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '24px' }}>{getDeviceTypeIcon(device.type)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{device.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {device.type.replace('_', ' ')}
                        </div>
                      </div>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(device.status)
                        }}
                        title={device.status}
                      />
                    </div>
                    
                    {device.lastReading && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '5px' }}>
                        Last reading: {new Date(device.lastReading.timestamp).toLocaleString()}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSimulateReading(device)
                        }}
                        style={{
                          padding: '5px 10px',
                          fontSize: '11px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        📊 Simulate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveDevice(device.id)
                        }}
                        style={{
                          padding: '5px 10px',
                          fontSize: '11px',
                          backgroundColor: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#dc2626'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Device Details */}
        <div>
          {selectedDevice ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Device Info */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600' }}>
                  {getDeviceTypeIcon(selectedDevice.type)} {selectedDevice.name}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Type</div>
                    <div style={{ fontWeight: '500' }}>{selectedDevice.type.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Protocol</div>
                    <div style={{ fontWeight: '500' }}>{selectedDevice.protocol.toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Status</div>
                    <div style={{ fontWeight: '500', color: getStatusColor(selectedDevice.status) }}>
                      {selectedDevice.status.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Last Seen</div>
                    <div style={{ fontWeight: '500', fontSize: '13px' }}>
                      {selectedDevice.lastSeen ? new Date(selectedDevice.lastSeen).toLocaleString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Statistics */}
              {stats && (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600' }}>
                    📊 Statistics (Last {stats.period} days)
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Total Readings</div>
                      <div style={{ fontSize: '20px', fontWeight: '600' }}>{stats.totalReadings}</div>
                    </div>
                    
                    {stats.averageWeight && (
                      <>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Avg Weight</div>
                          <div style={{ fontSize: '20px', fontWeight: '600' }}>{stats.averageWeight} kg</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Range</div>
                          <div style={{ fontSize: '16px', fontWeight: '500' }}>{stats.minWeight}-{stats.maxWeight} kg</div>
                        </div>
                      </>
                    )}
                    
                    {stats.totalVolume && (
                      <>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Total Milk</div>
                          <div style={{ fontSize: '20px', fontWeight: '600' }}>{stats.totalVolume} L</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Avg per Session</div>
                          <div style={{ fontSize: '20px', fontWeight: '600' }}>{stats.averageVolume} L</div>
                        </div>
                      </>
                    )}
                    
                    {stats.averageTemp && (
                      <>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Avg Temp</div>
                          <div style={{ fontSize: '20px', fontWeight: '600' }}>{stats.averageTemp}°C</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Total Rainfall</div>
                          <div style={{ fontSize: '20px', fontWeight: '600' }}>{stats.totalRainfall} mm</div>
                        </div>
                      </>
                    )}
                    
                    {stats.averageMoisture && (
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Avg Moisture</div>
                        <div style={{ fontSize: '20px', fontWeight: '600' }}>{stats.averageMoisture}%</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Recent Readings */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600' }}>
                  📝 Recent Readings
                </h3>
                
                {readings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                    No readings yet. Click "Simulate" to generate test data.
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {readings.map(reading => (
                      <div
                        key={reading.id}
                        style={{
                          padding: '10px',
                          borderBottom: '1px solid #f3f4f6',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}>
                          {new Date(reading.timestamp).toLocaleString()}
                        </div>
                        <div style={{ fontFamily: 'monospace' }}>
                          {formatReading(reading, selectedDevice.type)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📟</div>
              <h3>Select a device to view details</h3>
              <p style={{ fontSize: '14px' }}>
                Click on a device from the list to see readings and statistics
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Device Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Add IoT Device</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Device Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Barn Weight Scale"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Device Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  {Object.entries(DEVICE_TYPES).map(([key, value]) => (
                    <option key={value} value={value}>
                      {value.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Protocol
                </label>
                <select
                  value={formData.protocol}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  {Object.entries(PROTOCOLS).map(([key, value]) => (
                    <option key={value} value={value}>
                      {value.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Endpoint (Optional)
                </label>
                <input
                  type="text"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder="e.g., http://192.168.1.100:8080 or mqtt://broker.local"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button
                onClick={handleAddDevice}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Add Device
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
