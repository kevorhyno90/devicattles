/**
 * Geospatial Farm Mapping System
 * Uses Leaflet + OpenStreetMap (free alternative to Mapbox)
 */

/**
 * Get farm location from settings or default
 */
export function getFarmLocation() {
  try {
    const settings = JSON.parse(localStorage.getItem('devinsfarm:settings') || '{}')
    
    // Default to Nairobi, Kenya if no location set
    return {
      lat: settings.farmLatitude || -1.286389,
      lng: settings.farmLongitude || 36.817223,
      zoom: settings.mapZoom || 15,
      name: settings.farmName || 'My Farm'
    }
  } catch (error) {
    console.error('Error loading farm location:', error)
    return { lat: -1.286389, lng: 36.817223, zoom: 15, name: 'My Farm' }
  }
}

/**
 * Save farm location
 */
export function saveFarmLocation(lat, lng, zoom, name) {
  try {
    const settings = JSON.parse(localStorage.getItem('devinsfarm:settings') || '{}')
    settings.farmLatitude = lat
    settings.farmLongitude = lng
    settings.mapZoom = zoom
    if (name) settings.farmName = name
    
    localStorage.setItem('devinsfarm:settings', JSON.stringify(settings))
    return true
  } catch (error) {
    console.error('Error saving farm location:', error)
    return false
  }
}

/**
 * Get all field boundaries
 */
export function getFieldBoundaries() {
  try {
    const data = localStorage.getItem('devinsfarm:fieldBoundaries')
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error loading field boundaries:', error)
    return []
  }
}

/**
 * Save field boundary
 */
export function saveFieldBoundary(field) {
  try {
    const fields = getFieldBoundaries()
    
    const newField = {
      id: field.id || 'field_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: field.name,
      coordinates: field.coordinates, // Array of [lat, lng] pairs
      area: calculatePolygonArea(field.coordinates),
      crop: field.crop || null,
      color: field.color || getRandomColor(),
      notes: field.notes || '',
      createdDate: new Date().toISOString()
    }
    
    fields.push(newField)
    localStorage.setItem('devinsfarm:fieldBoundaries', JSON.stringify(fields))
    
    return newField
  } catch (error) {
    console.error('Error saving field boundary:', error)
    return null
  }
}

/**
 * Update field boundary
 */
export function updateFieldBoundary(fieldId, updates) {
  try {
    const fields = getFieldBoundaries()
    const index = fields.findIndex(f => f.id === fieldId)
    
    if (index !== -1) {
      fields[index] = { ...fields[index], ...updates }
      
      // Recalculate area if coordinates changed
      if (updates.coordinates) {
        fields[index].area = calculatePolygonArea(updates.coordinates)
      }
      
      localStorage.setItem('devinsfarm:fieldBoundaries', JSON.stringify(fields))
      return fields[index]
    }
    
    return null
  } catch (error) {
    console.error('Error updating field boundary:', error)
    return null
  }
}

/**
 * Delete field boundary
 */
export function deleteFieldBoundary(fieldId) {
  try {
    const fields = getFieldBoundaries()
    const filtered = fields.filter(f => f.id !== fieldId)
    localStorage.setItem('devinsfarm:fieldBoundaries', JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting field boundary:', error)
    return false
  }
}

/**
 * Get GPS tracking points for animals
 */
export function getAnimalGPSPoints() {
  try {
    const data = localStorage.getItem('devinsfarm:animalGPS')
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error loading GPS points:', error)
    return []
  }
}

/**
 * Add GPS tracking point
 */
export function addGPSPoint(animalId, lat, lng, metadata = {}) {
  try {
    const points = getAnimalGPSPoints()
    
    const point = {
      id: 'gps_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      animalId,
      lat,
      lng,
      timestamp: new Date().toISOString(),
      ...metadata
    }
    
    points.push(point)
    
    // Keep only last 1000 points
    if (points.length > 1000) {
      points.splice(0, points.length - 1000)
    }
    
    localStorage.setItem('devinsfarm:animalGPS', JSON.stringify(points))
    return point
  } catch (error) {
    console.error('Error adding GPS point:', error)
    return null
  }
}

/**
 * Get GPS trail for specific animal
 */
export function getAnimalGPSTrail(animalId, hours = 24) {
  const points = getAnimalGPSPoints()
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
  
  return points
    .filter(p => p.animalId === animalId && new Date(p.timestamp) > cutoff)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

/**
 * Get map markers for all entities
 */
export function getAllMapMarkers() {
  const markers = []
  
  // Animals
  try {
    const animals = JSON.parse(localStorage.getItem('devinsfarm:animals') || '[]')
    animals.forEach(animal => {
      if (animal.gpsLat && animal.gpsLng) {
        markers.push({
          id: animal.id,
          type: 'animal',
          name: animal.name || animal.tag,
          lat: animal.gpsLat,
          lng: animal.gpsLng,
          icon: '🐄',
          color: '#059669',
          data: animal
        })
      }
    })
  } catch (error) {
    console.error('Error loading animal markers:', error)
  }
  
  // Buildings/Structures
  try {
    const structures = JSON.parse(localStorage.getItem('devinsfarm:structures') || '[]')
    structures.forEach(structure => {
      if (structure.lat && structure.lng) {
        markers.push({
          id: structure.id,
          type: 'structure',
          name: structure.name,
          lat: structure.lat,
          lng: structure.lng,
          icon: '🏠',
          color: '#3b82f6',
          data: structure
        })
      }
    })
  } catch (error) {
    console.error('Error loading structure markers:', error)
  }
  
  // Water sources
  try {
    const water = JSON.parse(localStorage.getItem('devinsfarm:waterSources') || '[]')
    water.forEach(source => {
      if (source.lat && source.lng) {
        markers.push({
          id: source.id,
          type: 'water',
          name: source.name,
          lat: source.lat,
          lng: source.lng,
          icon: '💧',
          color: '#0ea5e9',
          data: source
        })
      }
    })
  } catch (error) {
    console.error('Error loading water markers:', error)
  }
  
  return markers
}

/**
 * Calculate polygon area in hectares
 * Uses Shoelace formula
 */
export function calculatePolygonArea(coordinates) {
  if (!coordinates || coordinates.length < 3) return 0
  
  let area = 0
  const n = coordinates.length
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += coordinates[i][0] * coordinates[j][1]
    area -= coordinates[j][0] * coordinates[i][1]
  }
  
  area = Math.abs(area) / 2
  
  // Convert to hectares (rough approximation)
  // 1 degree latitude ≈ 111 km
  // 1 degree longitude ≈ 111 km * cos(latitude)
  const avgLat = coordinates.reduce((sum, c) => sum + c[0], 0) / n
  const latFactor = 111000 // meters per degree
  const lngFactor = 111000 * Math.cos(avgLat * Math.PI / 180)
  
  const areaInSquareMeters = area * latFactor * lngFactor
  const hectares = areaInSquareMeters / 10000
  
  return Math.round(hectares * 100) / 100 // Round to 2 decimals
}

/**
 * Calculate distance between two points (in meters)
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3 // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c
}

/**
 * Get random color for field
 */
function getRandomColor() {
  const colors = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Export map data
 */
export function exportMapData() {
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    farmLocation: getFarmLocation(),
    fields: getFieldBoundaries(),
    markers: getAllMapMarkers(),
    gpsPoints: getAnimalGPSPoints()
  }
}

/**
 * Calculate farm statistics
 */
export function getMapStats() {
  const fields = getFieldBoundaries()
  const markers = getAllMapMarkers()
  const gpsPoints = getAnimalGPSPoints()
  
  const totalArea = fields.reduce((sum, f) => sum + (f.area || 0), 0)
  const activeFields = fields.filter(f => f.crop).length
  
  return {
    totalFields: fields.length,
    activeFields,
    totalArea: Math.round(totalArea * 100) / 100,
    markers: markers.length,
    gpsPoints: gpsPoints.length,
    byType: {
      animals: markers.filter(m => m.type === 'animal').length,
      structures: markers.filter(m => m.type === 'structure').length,
      water: markers.filter(m => m.type === 'water').length
    }
  }
}
