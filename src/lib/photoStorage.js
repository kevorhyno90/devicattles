/**
 * Photo Storage Management using IndexedDB
 * Stores photos for animals, crops, health records, etc.
 */

const DB_NAME = 'devinsfarm-photos'
const DB_VERSION = 1
const STORE_NAME = 'photos'

let dbInstance = null

/**
 * Initialize IndexedDB
 */
async function initDB() {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('entityType', 'entityType', { unique: false })
        store.createIndex('entityId', 'entityId', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Save photo to IndexedDB
 * @param {Object} photoData - { entityType, entityId, dataUrl, caption, timestamp }
 * @returns {Promise<string>} - Photo ID
 */
export async function savePhoto(photoData) {
  try {
    const db = await initDB()
    const id = photoData.id || `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const photo = {
      id,
      entityType: photoData.entityType, // 'animal', 'crop', 'health', 'equipment', etc.
      entityId: photoData.entityId,
      dataUrl: photoData.dataUrl,
      caption: photoData.caption || '',
      timestamp: photoData.timestamp || Date.now(),
      tags: photoData.tags || [],
      metadata: photoData.metadata || {}
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(photo)

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error saving photo:', error)
    throw error
  }
}

/**
 * Get photos for a specific entity
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 * @returns {Promise<Array>} - Array of photos
 */
export async function getPhotosByEntity(entityType, entityId) {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const photos = request.result.filter(
          photo => photo.entityType === entityType && photo.entityId === entityId
        )
        photos.sort((a, b) => b.timestamp - a.timestamp)
        resolve(photos)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting photos:', error)
    return []
  }
}

/**
 * Get single photo by ID
 * @param {string} photoId - Photo ID
 * @returns {Promise<Object>} - Photo object
 */
export async function getPhotoById(photoId) {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(photoId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting photo:', error)
    return null
  }
}

/**
 * Delete photo
 * @param {string} photoId - Photo ID
 * @returns {Promise<boolean>}
 */
export async function deletePhoto(photoId) {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(photoId)

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return false
  }
}

/**
 * Get all photos for a type
 * @param {string} entityType - Type of entity
 * @returns {Promise<Array>} - Array of photos
 */
export async function getPhotosByType(entityType) {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('entityType')
      const request = index.getAll(entityType)

      request.onsuccess = () => {
        const photos = request.result
        photos.sort((a, b) => b.timestamp - a.timestamp)
        resolve(photos)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting photos by type:', error)
    return []
  }
}

/**
 * Update photo metadata
 * @param {string} photoId - Photo ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<boolean>}
 */
export async function updatePhoto(photoId, updates) {
  try {
    const db = await initDB()
    const photo = await getPhotoById(photoId)
    
    if (!photo) return false

    const updatedPhoto = { ...photo, ...updates, id: photoId }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(updatedPhoto)

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error updating photo:', error)
    return false
  }
}

/**
 * Get storage statistics
 * @returns {Promise<Object>} - Storage stats
 */
export async function getStorageStats() {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const photos = request.result
        const totalSize = photos.reduce((sum, photo) => {
          const base64 = (photo.dataUrl || '').split(',')[1] || ''
          return sum + Math.round(base64.length * 3 / 4)
        }, 0)

        const byType = {}
        photos.forEach(photo => {
          if (!byType[photo.entityType]) {
            byType[photo.entityType] = 0
          }
          byType[photo.entityType]++
        })

        resolve({
          totalPhotos: photos.length,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          byType
        })
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting storage stats:', error)
    return { totalPhotos: 0, totalSizeMB: 0, byType: {} }
  }
}

/**
 * Clear all photos (with confirmation)
 * @returns {Promise<boolean>}
 */
export async function clearAllPhotos() {
  try {
    const db = await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error clearing photos:', error)
    return false
  }
}
