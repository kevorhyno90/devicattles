/**
 * Advanced Photo Management with AI Tagging
 * Client-side image analysis and intelligent categorization
 */

/**
 * Analyze image and extract features
 */
export async function analyzeImage(imageFile) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Extract basic image properties
        const analysis = {
          width: img.width,
          height: img.height,
          aspectRatio: (img.width / img.height).toFixed(2),
          size: imageFile.size,
          type: imageFile.type,
          name: imageFile.name,
          timestamp: new Date().toISOString()
        }
        
        // Analyze image content using canvas
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        
        // Get dominant colors
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const colors = extractDominantColors(imageData)
        analysis.dominantColors = colors
        
        // Detect brightness
        analysis.brightness = calculateBrightness(imageData)
        
        // Auto-generate tags based on filename and properties
        analysis.autoTags = generateAutoTags(imageFile.name, analysis)
        
        resolve(analysis)
      }
      img.src = e.target.result
    }
    
    reader.readAsDataURL(imageFile)
  })
}

/**
 * Extract dominant colors from image
 */
function extractDominantColors(imageData) {
  const data = imageData.data
  const colorMap = {}
  
  // Sample every 10th pixel for performance
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    // Round to nearest 25 to group similar colors
    const key = `${Math.round(r/25)*25},${Math.round(g/25)*25},${Math.round(b/25)*25}`
    colorMap[key] = (colorMap[key] || 0) + 1
  }
  
  // Get top 3 colors
  const sorted = Object.entries(colorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  
  return sorted.map(([color]) => {
    const [r, g, b] = color.split(',').map(Number)
    return { r, g, b, hex: `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}` }
  })
}

/**
 * Calculate average brightness
 */
function calculateBrightness(imageData) {
  const data = imageData.data
  let totalBrightness = 0
  let count = 0
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    totalBrightness += (r + g + b) / 3
    count++
  }
  
  return Math.round(totalBrightness / count)
}

/**
 * Generate automatic tags from filename and properties
 */
function generateAutoTags(filename, analysis) {
  const tags = []
  const lower = filename.toLowerCase()
  
  // Animal keywords
  const animalKeywords = ['cow', 'cattle', 'bull', 'calf', 'goat', 'sheep', 'pig', 'chicken', 'hen', 'rooster', 'horse', 'dog', 'cat']
  animalKeywords.forEach(keyword => {
    if (lower.includes(keyword)) tags.push(keyword)
  })
  
  // Crop keywords
  const cropKeywords = ['maize', 'corn', 'wheat', 'bean', 'tomato', 'potato', 'cabbage', 'onion', 'field', 'farm', 'crop', 'plant']
  cropKeywords.forEach(keyword => {
    if (lower.includes(keyword)) tags.push(keyword)
  })
  
  // Activity keywords
  const activityKeywords = ['feeding', 'milking', 'treatment', 'vaccination', 'harvest', 'planting', 'breeding']
  activityKeywords.forEach(keyword => {
    if (lower.includes(keyword)) tags.push(keyword)
  })
  
  // Image properties
  if (analysis.aspectRatio > 1.5) tags.push('landscape')
  else if (analysis.aspectRatio < 0.7) tags.push('portrait')
  else tags.push('square')
  
  if (analysis.brightness > 180) tags.push('bright')
  else if (analysis.brightness < 100) tags.push('dark')
  
  // Dominant color tags
  if (analysis.dominantColors && analysis.dominantColors.length > 0) {
    const mainColor = analysis.dominantColors[0]
    if (mainColor.g > mainColor.r && mainColor.g > mainColor.b) tags.push('green')
    else if (mainColor.r > mainColor.g && mainColor.r > mainColor.b) tags.push('red')
    else if (mainColor.b > mainColor.r && mainColor.b > mainColor.g) tags.push('blue')
    else if (mainColor.r > 200 && mainColor.g > 200 && mainColor.b > 200) tags.push('white')
    else if (mainColor.r < 50 && mainColor.g < 50 && mainColor.b < 50) tags.push('black')
  }
  
  return [...new Set(tags)] // Remove duplicates
}

/**
 * Save photo with metadata
 */
export async function savePhoto(imageFile, metadata = {}) {
  try {
    const analysis = await analyzeImage(imageFile)
    
    // Convert to base64 for storage
    const base64 = await fileToBase64(imageFile)
    
    const photo = {
      id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      base64,
      filename: imageFile.name,
      analysis,
      metadata: {
        ...metadata,
        uploadDate: new Date().toISOString()
      },
      tags: [...analysis.autoTags, ...(metadata.tags || [])],
      category: metadata.category || 'general',
      entityType: metadata.entityType || null,
      entityId: metadata.entityId || null
    }
    
    // Save to localStorage
    const photos = getAllPhotos()
    photos.push(photo)
    
    // Limit to 100 photos (approximately 20-50MB depending on image sizes)
    if (photos.length > 100) {
      photos.shift()
    }
    
    localStorage.setItem('devinsfarm:photos', JSON.stringify(photos))
    
    return photo
  } catch (error) {
    console.error('Error saving photo:', error)
    throw error
  }
}

/**
 * Get all photos
 */
export function getAllPhotos() {
  try {
    const data = localStorage.getItem('devinsfarm:photos')
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error loading photos:', error)
    return []
  }
}

/**
 * Search photos by tags, category, or entity
 */
export function searchPhotos(query) {
  const photos = getAllPhotos()
  const lower = query.toLowerCase()
  
  return photos.filter(photo => {
    // Search in tags
    if (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(lower))) {
      return true
    }
    
    // Search in filename
    if (photo.filename.toLowerCase().includes(lower)) {
      return true
    }
    
    // Search in category
    if (photo.category && photo.category.toLowerCase().includes(lower)) {
      return true
    }
    
    // Search in metadata
    if (photo.metadata) {
      const metaStr = JSON.stringify(photo.metadata).toLowerCase()
      if (metaStr.includes(lower)) return true
    }
    
    return false
  })
}

/**
 * Get photos by entity (animal, crop, etc.)
 */
export function getPhotosByEntity(entityType, entityId) {
  const photos = getAllPhotos()
  return photos.filter(photo => 
    photo.entityType === entityType && photo.entityId === entityId
  )
}

/**
 * Get photos by category
 */
export function getPhotosByCategory(category) {
  const photos = getAllPhotos()
  return photos.filter(photo => photo.category === category)
}

/**
 * Get photos by tag
 */
export function getPhotosByTag(tag) {
  const photos = getAllPhotos()
  return photos.filter(photo => 
    photo.tags && photo.tags.includes(tag)
  )
}

/**
 * Delete photo
 */
export function deletePhoto(photoId) {
  const photos = getAllPhotos()
  const filtered = photos.filter(photo => photo.id !== photoId)
  localStorage.setItem('devinsfarm:photos', JSON.stringify(filtered))
  return true
}

/**
 * Update photo metadata
 */
export function updatePhotoMetadata(photoId, updates) {
  const photos = getAllPhotos()
  const photo = photos.find(p => p.id === photoId)
  
  if (photo) {
    photo.metadata = { ...photo.metadata, ...updates.metadata }
    photo.tags = updates.tags || photo.tags
    photo.category = updates.category || photo.category
    
    localStorage.setItem('devinsfarm:photos', JSON.stringify(photos))
    return photo
  }
  
  return null
}

/**
 * Get photo statistics
 */
export function getPhotoStats() {
  const photos = getAllPhotos()
  
  const byCategory = {}
  const byTag = {}
  const byMonth = {}
  
  photos.forEach(photo => {
    // By category
    byCategory[photo.category] = (byCategory[photo.category] || 0) + 1
    
    // By tags
    if (photo.tags) {
      photo.tags.forEach(tag => {
        byTag[tag] = (byTag[tag] || 0) + 1
      })
    }
    
    // By month
    const date = new Date(photo.metadata.uploadDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    byMonth[monthKey] = (byMonth[monthKey] || 0) + 1
  })
  
  return {
    total: photos.length,
    byCategory,
    byTag,
    byMonth,
    topTags: Object.entries(byTag).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }
}

/**
 * Get all unique tags
 */
export function getAllTags() {
  const photos = getAllPhotos()
  const tags = new Set()
  
  photos.forEach(photo => {
    if (photo.tags) {
      photo.tags.forEach(tag => tags.add(tag))
    }
  })
  
  return Array.from(tags).sort()
}

/**
 * Export photos metadata as JSON
 */
export function exportPhotoMetadata() {
  const photos = getAllPhotos()
  
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    count: photos.length,
    stats: getPhotoStats(),
    photos: photos.map(p => ({
      id: p.id,
      filename: p.filename,
      category: p.category,
      tags: p.tags,
      uploadDate: p.metadata.uploadDate,
      size: p.analysis.size,
      dimensions: `${p.analysis.width}x${p.analysis.height}`
    }))
  }
}

/**
 * Helper: Convert file to base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Compress image before saving
 */
export async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Scale down if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
          'image/jpeg',
          quality
        )
      }
      img.src = e.target.result
    }
    
    reader.readAsDataURL(file)
  })
}
