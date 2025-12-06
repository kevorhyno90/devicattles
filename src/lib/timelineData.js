/**
 * Timeline and Planning Data Generator
 * Creates timeline views for crops, breeding, tasks, and treatments
 */

/**
 * Generate crop timeline data
 */
export function generateCropTimeline() {
  const crops = JSON.parse(localStorage.getItem('devinsfarm:crops') || '[]')
  
  return crops.map(crop => {
    const start = crop.plantingDate ? new Date(crop.plantingDate) : new Date()
    const expectedHarvest = crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate) : null
    
    // Calculate duration in days
    let duration = 90 // default
    if (expectedHarvest) {
      duration = Math.ceil((expectedHarvest - start) / (1000 * 60 * 60 * 24))
    } else {
      // Estimate based on crop type
      duration = estimateCropDuration(crop.cropName)
    }
    
    const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000)
    
    return {
      id: crop.id,
      name: crop.cropName,
      category: 'crop',
      start: start,
      end: end,
      progress: calculateCropProgress(crop.stage),
      stage: crop.stage,
      area: crop.area,
      color: getCropColor(crop.stage),
      data: crop
    }
  })
}

/**
 * Generate breeding timeline
 */
export function generateBreedingTimeline() {
  const breeding = JSON.parse(localStorage.getItem('devinsfarm:breeding') || '[]')
  
  return breeding.map(record => {
    const start = record.breedingDate ? new Date(record.breedingDate) : new Date()
    const expectedDate = record.expectedDate ? new Date(record.expectedDate) : null
    
    // Default gestation periods (days)
    const gestationPeriods = {
      cattle: 283,
      goat: 150,
      sheep: 147,
      pig: 114,
      horse: 340
    }
    
    const duration = gestationPeriods[record.species?.toLowerCase()] || 150
    const end = expectedDate || new Date(start.getTime() + duration * 24 * 60 * 60 * 1000)
    
    return {
      id: record.id,
      name: `${record.animalName || 'Animal'} - Breeding`,
      category: 'breeding',
      start: start,
      end: end,
      progress: calculateBreedingProgress(start, end),
      status: record.status,
      species: record.species,
      color: '#ec4899',
      data: record
    }
  })
}

/**
 * Generate task timeline
 */
export function generateTaskTimeline() {
  const tasks = JSON.parse(localStorage.getItem('devinsfarm:tasks') || '[]')
  
  return tasks
    .filter(task => task.dueDate)
    .map(task => {
      const start = task.createdDate ? new Date(task.createdDate) : new Date()
      const end = new Date(task.dueDate)
      
      return {
        id: task.id,
        name: task.title,
        category: 'task',
        start: start,
        end: end,
        progress: task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0,
        status: task.status,
        priority: task.priority,
        color: getTaskColor(task.status),
        data: task
      }
    })
}

/**
 * Generate treatment schedule timeline
 */
export function generateTreatmentTimeline() {
  const treatments = JSON.parse(localStorage.getItem('devinsfarm:treatments') || '[]')
  
  return treatments.map(treatment => {
    const start = treatment.date ? new Date(treatment.date) : new Date()
    
    // Estimate follow-up date based on treatment type
    const followUpDays = treatment.followUpDays || 14
    const end = new Date(start.getTime() + followUpDays * 24 * 60 * 60 * 1000)
    
    return {
      id: treatment.id,
      name: `${treatment.animalName || 'Animal'} - ${treatment.type || 'Treatment'}`,
      category: 'treatment',
      start: start,
      end: end,
      progress: treatment.completed ? 100 : 0,
      type: treatment.type,
      color: '#8b5cf6',
      data: treatment
    }
  })
}

/**
 * Combine all timelines
 */
export function generateAllTimelines() {
  return [
    ...generateCropTimeline(),
    ...generateBreedingTimeline(),
    ...generateTaskTimeline(),
    ...generateTreatmentTimeline()
  ].sort((a, b) => a.start - b.start)
}

/**
 * Get timeline data for specific date range
 */
export function getTimelineForRange(startDate, endDate) {
  const all = generateAllTimelines()
  
  return all.filter(item => {
    return item.end >= startDate && item.start <= endDate
  })
}

/**
 * Get timeline statistics
 */
export function getTimelineStats() {
  const all = generateAllTimelines()
  
  const now = new Date()
  const upcoming = all.filter(item => item.start > now)
  const active = all.filter(item => item.start <= now && item.end >= now)
  const completed = all.filter(item => item.end < now || item.progress === 100)
  
  return {
    total: all.length,
    active: active.length,
    upcoming: upcoming.length,
    completed: completed.length,
    byCategory: {
      crops: all.filter(i => i.category === 'crop').length,
      breeding: all.filter(i => i.category === 'breeding').length,
      tasks: all.filter(i => i.category === 'task').length,
      treatments: all.filter(i => i.category === 'treatment').length
    }
  }
}

/**
 * Helper: Estimate crop duration
 */
function estimateCropDuration(cropName) {
  const durations = {
    maize: 90,
    wheat: 120,
    beans: 60,
    potatoes: 90,
    tomatoes: 75,
    cabbage: 70,
    onions: 100,
    rice: 120,
    barley: 90
  }
  
  const name = cropName?.toLowerCase() || ''
  for (const [crop, days] of Object.entries(durations)) {
    if (name.includes(crop)) return days
  }
  
  return 90 // default
}

/**
 * Helper: Calculate crop progress
 */
function calculateCropProgress(stage) {
  const stages = {
    planning: 0,
    planted: 20,
    growing: 50,
    flowering: 70,
    mature: 90,
    harvested: 100
  }
  return stages[stage?.toLowerCase()] || 0
}

/**
 * Helper: Calculate breeding progress
 */
function calculateBreedingProgress(start, end) {
  const now = new Date()
  if (now < start) return 0
  if (now > end) return 100
  
  const total = end - start
  const elapsed = now - start
  return Math.round((elapsed / total) * 100)
}

/**
 * Helper: Get crop color
 */
function getCropColor(stage) {
  const colors = {
    planning: '#94a3b8',
    planted: '#86efac',
    growing: '#22c55e',
    flowering: '#fbbf24',
    mature: '#fb923c',
    harvested: '#a78bfa'
  }
  return colors[stage?.toLowerCase()] || '#22c55e'
}

/**
 * Helper: Get task color
 */
function getTaskColor(status) {
  const colors = {
    pending: '#94a3b8',
    'in-progress': '#3b82f6',
    completed: '#22c55e',
    cancelled: '#ef4444'
  }
  return colors[status?.toLowerCase()] || '#94a3b8'
}

/**
 * Export timeline as JSON
 */
export function exportTimelineData() {
  const all = generateAllTimelines()
  
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    stats: getTimelineStats(),
    items: all.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      start: item.start.toISOString(),
      end: item.end.toISOString(),
      progress: item.progress,
      status: item.status || item.stage
    }))
  }
}
