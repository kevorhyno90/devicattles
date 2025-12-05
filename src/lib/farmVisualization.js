/**
 * 3D Farm Visualization Engine
 * Generates 3D farm layouts with animals, buildings, and fields
 */

// Farm object types
export const OBJECT_TYPES = {
  ANIMAL: 'animal',
  BUILDING: 'building',
  FIELD: 'field',
  FENCE: 'fence',
  TREE: 'tree',
  WATER: 'water',
  EQUIPMENT: 'equipment'
}

// Default farm layout
export const DEFAULT_FARM_SIZE = {
  width: 200,
  length: 200
}

/**
 * Generate 3D farm objects from app data
 */
export function generateFarmObjects() {
  const objects = []
  
  // Load animals
  const animals = JSON.parse(localStorage.getItem('devinsfarm:animals') || '[]')
  animals.forEach((animal, index) => {
    objects.push({
      id: animal.id,
      type: OBJECT_TYPES.ANIMAL,
      name: animal.name || animal.tag,
      species: animal.species,
      position: {
        x: (index % 10) * 20 - 90,
        y: 0,
        z: Math.floor(index / 10) * 20 - 90
      },
      color: getAnimalColor(animal.species),
      health: animal.healthStatus || 'healthy',
      data: animal
    })
  })
  
  // Add buildings
  objects.push({
    id: 'barn',
    type: OBJECT_TYPES.BUILDING,
    name: 'Main Barn',
    position: { x: -80, y: 0, z: -80 },
    size: { width: 30, height: 20, depth: 40 },
    color: '#8B4513'
  })
  
  objects.push({
    id: 'dairy',
    type: OBJECT_TYPES.BUILDING,
    name: 'Dairy Shed',
    position: { x: 80, y: 0, z: -80 },
    size: { width: 25, height: 15, depth: 30 },
    color: '#A0522D'
  })
  
  objects.push({
    id: 'storage',
    type: OBJECT_TYPES.BUILDING,
    name: 'Feed Storage',
    position: { x: -80, y: 0, z: 80 },
    size: { width: 20, height: 12, depth: 25 },
    color: '#CD853F'
  })
  
  // Add fields from crops
  const crops = JSON.parse(localStorage.getItem('devinsfarm:crops') || '[]')
  crops.forEach((crop, index) => {
    const row = Math.floor(index / 2)
    const col = index % 2
    objects.push({
      id: crop.id,
      type: OBJECT_TYPES.FIELD,
      name: crop.cropName,
      position: {
        x: col * 50 - 25,
        y: 0,
        z: row * 40 + 20
      },
      size: { width: 40, depth: 35 },
      color: getCropColor(crop.stage),
      stage: crop.stage,
      data: crop
    })
  })
  
  // Add decorative elements
  objects.push({
    id: 'pond',
    type: OBJECT_TYPES.WATER,
    name: 'Water Pond',
    position: { x: 80, y: 0, z: 80 },
    size: { width: 30, depth: 30 },
    color: '#4682B4'
  })
  
  // Add trees
  for (let i = 0; i < 8; i++) {
    objects.push({
      id: `tree_${i}`,
      type: OBJECT_TYPES.TREE,
      position: {
        x: -95 + (i % 4) * 63,
        y: 0,
        z: -95 + Math.floor(i / 4) * 190
      },
      color: '#228B22'
    })
  }
  
  // Add fences
  const fenceSegments = [
    { x: 0, z: -100, rotation: 0, length: 200 }, // North
    { x: 0, z: 100, rotation: 0, length: 200 },  // South
    { x: -100, z: 0, rotation: Math.PI / 2, length: 200 }, // West
    { x: 100, z: 0, rotation: Math.PI / 2, length: 200 }   // East
  ]
  
  fenceSegments.forEach((fence, i) => {
    objects.push({
      id: `fence_${i}`,
      type: OBJECT_TYPES.FENCE,
      position: fence,
      color: '#8B7355'
    })
  })
  
  return objects
}

/**
 * Get color for animal based on species
 */
function getAnimalColor(species) {
  const colors = {
    cattle: '#D2691E',
    goat: '#F5F5DC',
    sheep: '#FFFAF0',
    pig: '#FFB6C1',
    chicken: '#FFFFFF',
    horse: '#8B4513',
    dog: '#A0522D',
    cat: '#F4A460'
  }
  return colors[species?.toLowerCase()] || '#808080'
}

/**
 * Get color for crop field based on stage
 */
function getCropColor(stage) {
  const colors = {
    planning: '#D2B48C',
    planted: '#90EE90',
    growing: '#32CD32',
    flowering: '#FFD700',
    mature: '#DAA520',
    harvested: '#A0522D'
  }
  return colors[stage?.toLowerCase()] || '#228B22'
}

/**
 * Update animal positions (for animation)
 */
export function updateAnimalPositions(objects) {
  const animalObjects = objects.filter(obj => obj.type === OBJECT_TYPES.ANIMAL)
  
  animalObjects.forEach(animal => {
    // Random walk within bounds
    animal.position.x += (Math.random() - 0.5) * 2
    animal.position.z += (Math.random() - 0.5) * 2
    
    // Keep within farm bounds
    animal.position.x = Math.max(-95, Math.min(95, animal.position.x))
    animal.position.z = Math.max(-95, Math.min(95, animal.position.z))
  })
  
  return objects
}

/**
 * Get farm statistics for display
 */
export function getFarmStats() {
  const animals = JSON.parse(localStorage.getItem('devinsfarm:animals') || '[]')
  const crops = JSON.parse(localStorage.getItem('devinsfarm:crops') || '[]')
  
  return {
    totalAnimals: animals.length,
    healthyAnimals: animals.filter(a => a.healthStatus === 'healthy').length,
    totalFields: crops.length,
    activeFields: crops.filter(c => ['planted', 'growing', 'flowering', 'mature'].includes(c.stage)).length,
    farmSize: `${DEFAULT_FARM_SIZE.width}m × ${DEFAULT_FARM_SIZE.length}m`
  }
}

/**
 * Calculate camera position for best view
 */
export function getOptimalCameraPosition(objects) {
  if (objects.length === 0) {
    return { x: 150, y: 100, z: 150 }
  }
  
  // Find center of all objects
  const positions = objects
    .filter(obj => obj.position)
    .map(obj => obj.position)
  
  if (positions.length === 0) {
    return { x: 150, y: 100, z: 150 }
  }
  
  const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length
  const centerZ = positions.reduce((sum, p) => sum + p.z, 0) / positions.length
  
  return {
    x: centerX + 150,
    y: 100,
    z: centerZ + 150
  }
}

/**
 * Export farm layout as JSON
 */
export function exportFarmLayout(objects) {
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    farmSize: DEFAULT_FARM_SIZE,
    objects: objects.map(obj => ({
      id: obj.id,
      type: obj.type,
      name: obj.name,
      position: obj.position,
      size: obj.size
    }))
  }
}

/**
 * Import farm layout from JSON
 */
export function importFarmLayout(layoutData) {
  try {
    const parsed = typeof layoutData === 'string' ? JSON.parse(layoutData) : layoutData
    return parsed.objects || []
  } catch (error) {
    console.error('Error importing farm layout:', error)
    return []
  }
}
