import React, { useState, useEffect } from 'react'
import {
  DEVICE_TYPES,
  getDevices,
  registerDevice,
  removeDevice,
  updateDeviceStatus,
  getDeviceReadings,
  getDeviceStats,
  startMockDataGeneration,
  stopMockDataGeneration
} from '../lib/iotSensors'

/**
 * IoT Sensor Dashboard
 * Manage and monitor IoT devices for smart farming
 */
export default function IoTSensorDashboard() {
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [readings, setReadings] = useState([])
  const [stats, setStats] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [view, setView] = useState('grid') // grid, list, detail
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'weight_scale',
    name: '',
    location: '',
    mockData: true
  })

  useEffect(() => {
    loadDevices()
    
    // Listen for real-time IoT updates
    const handleIoTReading = (e) => {
      loadDevices()
      if (selectedDevice && e.detail.deviceId === selectedDevice.id) {
        loadDeviceData(selectedDevice.id)
      }
    }
    
    const handleIoTAlert = (e) => {
      // Show notification for IoT alerts
      if (window.showNotification) {
        window.showNotification(e.detail.type, e.detail.message)
      }
    }
    
    window.addEventListener('iotReading', handleIoTReading)
    window.addEventListener('iotAlert', handleIoTAlert)
    
    return () => {
      window.removeEventListener('iotReading', handleIoTReading)
      window.removeEventListener('iotAlert', handleIoTAlert)
    }
  }, [selectedDevice])

  const loadDevices = () => {
    const allDevices = getDevices()
    setDevices(allDevices)
  }

  const loadDeviceData = (deviceId) => {
    const deviceReadings = getDeviceReadings(deviceId, 100)
    const deviceStats = getDeviceStats(deviceId, '24h')
    setReadings(deviceReadings)
    setStats(deviceStats)
  }

  const handleAddDevice = () => {
    if (!formData.name || !formData.type) {
      alert('Please enter device name and select type')
      return
    }

    const result = registerDevice(formData)
    
    if (result.success) {
      loadDevices()
      setShowAddModal(false)
      setFormData({
        type: 'weight_scale',
        name: '',
        location: '',
        mockData: true
      })
      alert(`Device "${result.device.name}" registered successfully!`)
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleRemoveDevice = (deviceId) => {
    if (!confirm('Remove this device? All readings will be deleted.')) return
    
    const result = removeDevice(deviceId)
    
    if (result.success) {
      loadDevices()
      if (selectedDevice && selectedDevice.id === deviceId) {
        setSelectedDevice(null)
        setReadings([])
        setStats(null)
      }
    }
  }

  const handleToggleDeviceStatus = (deviceId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    updateDeviceStatus(deviceId, newStatus)
    loadDevices()
    
    if (newStatus === 'active') {
      const device = devices.find(d => d.id === deviceId)
      if (device) {
        startMockDataGeneration(deviceId)
      }
    } else {
      stopMockDataGeneration(deviceId)
    }
  }

  const handleSelectDevice = (device) => {
    setSelectedDevice(device)
    loadDeviceData(device.id)
    setView('detail')
  }

  const getDeviceIcon = (type) => {
    return DEVICE_TYPES[type]?.icon || '📟'
  }

  const getStatusColor = (status) => {
    return status === 'active' ? '#10b981' : '#6b7280'
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  if (view === 'detail' && selectedDevice) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => { setView('grid'); setSelectedDevice(null) }}
            style={{
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            ← Back to Devices
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '48px' }}>{getDeviceIcon(selectedDevice.type)}</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
                {selectedDevice.name}
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                {DEVICE_TYPES[selectedDevice.type]?.name} • {selectedDevice.location}
              </p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button
                onClick={() => handleToggleDeviceStatus(selectedDevice.id, selectedDevice.status)}
                style={{
                  padding: '8px 16px',
                  background: selectedDevice.status === 'active' ? '#ef4444' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {selectedDevice.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {Object.keys(stats).filter(k => k !== 'count' && k !== 'timeRange').map(field => (
              <div
                key={field}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {field}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111', marginBottom: '4px' }}>
                  {typeof stats[field].current === 'number' ? stats[field].current.toFixed(1) : stats[field].current}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Avg: {stats[field].avg.toFixed(1)} | Min: {stats[field].min.toFixed(1)} | Max: {stats[field].max.toFixed(1)}
                </div>
                <div style={{
                  marginTop: '8px',
                  color: stats[field].trend > 0 ? '#10b981' : stats[field].trend < 0 ? '#ef4444' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {stats[field].trend > 0 ? '↑' : stats[field].trend < 0 ? '↓' : '→'} {Math.abs(stats[field].trend).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Readings */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 'bold' }}>
            Recent Readings ({readings.length})
          </h2>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {readings.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                No readings yet. Activate device to start collecting data.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Timestamp</th>
                    {selectedDevice.dataFields.map(field => (
                      <th key={field} style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '14px' }}>
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {readings.slice().reverse().map(reading => (
                    <tr key={reading.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                        {formatTimestamp(reading.timestamp)}
                      </td>
                      {selectedDevice.dataFields.map(field => (
                        <td key={field} style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                          {typeof reading.data[field] === 'number' 
                            ? reading.data[field].toFixed(2) 
                            : reading.data[field] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111', marginBottom: '8px' }}>
            🔌 IoT Sensor Dashboard
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Monitor and manage smart farming sensors
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ➕ Add Device
        </button>
      </div>

      {/* Device Grid */}
      {devices.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📡</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
            No Devices Registered
          </h3>
          <p style={{ color: '#666', margin: '0 0 24px 0' }}>
            Add your first IoT device to start monitoring
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Add Device
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {devices.map(device => (
            <div
              key={device.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                borderLeft: `4px solid ${getStatusColor(device.status)}`
              }}
              onClick={() => handleSelectDevice(device)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontSize: '36px' }}>{getDeviceIcon(device.type)}</div>
                <div
                  style={{
                    padding: '4px 12px',
                    background: device.status === 'active' ? '#dcfce7' : '#f3f4f6',
                    color: device.status === 'active' ? '#166534' : '#6b7280',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  {device.status}
                </div>
              </div>
              
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>
                {device.name}
              </h3>
              <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                {DEVICE_TYPES[device.type]?.name}
              </p>
              
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                📍 {device.location}
              </div>
              
              {device.lastReading && (
                <div style={{
                  background: '#f9fafb',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '14px'
                }}>
                  <div style={{ color: '#666', marginBottom: '4px' }}>Latest Reading:</div>
                  {Object.entries(device.lastReading.data).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ color: '#666' }}>{key}:</span>
                      <span style={{ fontWeight: '600' }}>
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </span>
                    </div>
                  ))}
                  <div style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                    {formatTimestamp(device.lastReading.timestamp)}
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleDeviceStatus(device.id, device.status)
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: device.status === 'active' ? '#fef3c7' : '#dcfce7',
                    color: device.status === 'active' ? '#92400e' : '#166534',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {device.status === 'active' ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveDevice(device.id)
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 'bold' }}>
              Add IoT Device
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Device Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                {Object.entries(DEVICE_TYPES).map(([key, type]) => (
                  <option key={key} value={key.toLowerCase()}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Device Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Barn Scale"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., South Field"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={formData.mockData}
                  onChange={(e) => setFormData({ ...formData, mockData: e.target.checked })}
                />
                Enable demo data generation (for testing)
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAddDevice}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Add Device
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setFormData({
                    type: 'weight_scale',
                    name: '',
                    location: '',
                    mockData: true
                  })
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
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
