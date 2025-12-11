// Storage utility with IndexedDB fallback to localStorage
// Automatically uses IndexedDB for large datasets, localStorage for smaller data
import { safeSetItem, safeGetItem } from './safeStorage'

const DB_NAME = 'devinsfarm'
const DB_VERSION = 3
const STORES = {
  animals: 'animals',
  crops: 'crops',
  tasks: 'tasks',
  finance: 'finance',
  inventory: 'inventory',
  notifications: 'notifications',
  activities: 'activities',
  transactions: 'transactions',
  equipment: 'equipment',
  treatments: 'treatments',
  measurements: 'measurements',
  breeding: 'breeding',
  milkYield: 'milkYield',
  diets: 'diets',
  rations: 'rations',
  alert_rules: 'alert_rules'
}

let db = null
let useIndexedDB = true

// Normalize store names used by DataLayer vs IndexedDB
// DataLayer passes keys like 'cattalytics:animals'.
// IndexedDB stores are created without the prefix (e.g., 'animals').
function normalizeStoreName(storeName) {
  if (typeof storeName === 'string' && storeName.startsWith('cattalytics:')) {
    return storeName.split(':').slice(1).join(':');
  }
  return storeName;
}

// Initialize IndexedDB
async function initDB() {
  if (db) return db

  // Check if IndexedDB is available
  if (!window.indexedDB) {
    console.warn('IndexedDB not available, falling back to localStorage')
    useIndexedDB = false
    return null
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('IndexedDB error:', request.error)
      useIndexedDB = false
      resolve(null)
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      // Create object stores for each data type
      Object.values(STORES).forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'id' })
        }
      })
    }
  })
}

// Save data (auto-detect storage method)
export async function saveData(storeName, data) {
  try {
    // Try IndexedDB first for large datasets
    if (useIndexedDB && data.length > 50) {
      await initDB()
      if (db) {
        return await saveToIndexedDB(storeName, data)
      }
    }

    // Fall back to localStorage
    return saveToLocalStorage(storeName, data)
  } catch (err) {
    console.error('Save failed, falling back to localStorage:', err)
    useIndexedDB = false
    return saveToLocalStorage(storeName, data)
  }
}

// Load data (synchronous - always uses localStorage for immediate access)
export function loadData(storeName, defaultData = []) {
  try {
    // Always use localStorage for synchronous access
    return loadFromLocalStorage(storeName, defaultData)
  } catch (err) {
    console.error('Load failed:', err)
    return defaultData
  }
}

// Load data async (uses IndexedDB when available)
export async function loadDataAsync(storeName, defaultData = []) {
  try {
    // Try IndexedDB first
    if (useIndexedDB) {
      await initDB()
      if (db) {
        const data = await loadFromIndexedDB(storeName)
        if (data && data.length > 0) return data
      }
    }

    // Fall back to localStorage
    return loadFromLocalStorage(storeName, defaultData)
  } catch (err) {
    console.error('Load failed, falling back to localStorage:', err)
    useIndexedDB = false
    return loadFromLocalStorage(storeName, defaultData)
  }
}

// IndexedDB implementation
async function saveToIndexedDB(storeName, data) {
  if (!db) throw new Error('Database not initialized')

  return new Promise((resolve, reject) => {
    const idbStore = normalizeStoreName(storeName)
    const transaction = db.transaction([idbStore], 'readwrite')
    const store = transaction.objectStore(idbStore)

    // Clear existing data
    store.clear()

    // Add all items
    data.forEach(item => store.add(item))

    transaction.oncomplete = () => resolve(true)
    transaction.onerror = () => reject(transaction.error)
  })
}

async function loadFromIndexedDB(storeName) {
  if (!db) throw new Error('Database not initialized')

  return new Promise((resolve, reject) => {
    const idbStore = normalizeStoreName(storeName)
    const transaction = db.transaction([idbStore], 'readonly')
    const store = transaction.objectStore(idbStore)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

// LocalStorage implementation
function saveToLocalStorage(storeName, data) {
  try {
    const key = storeName
    const result = safeSetItem(key, JSON.stringify(data))
    if (!result.success) {
      throw new Error(result.error || 'Storage failed')
    }
    return true
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded for', storeName)
      alert(`Storage limit reached for ${storeName}. Some data may not be saved. Consider exporting your data.`)
    }
    throw err
  }
}

function loadFromLocalStorage(storeName, defaultData = []) {
  try {
    const key = storeName
    const raw = safeGetItem(key, null)
    if (!raw) return defaultData
    
    const parsed = JSON.parse(raw)
    // Ensure we always return an array if defaultData is an array
    if (Array.isArray(defaultData) && !Array.isArray(parsed)) {
      console.warn(`Expected array for ${storeName}, got ${typeof parsed}. Returning default.`)
      return defaultData
    }
    return parsed
  } catch (err) {
    console.error('Failed to load from localStorage:', storeName, err)
    return defaultData
  }
}

// Delete data from both storage methods
export async function deleteData(storeName) {
  try {
    // Clear IndexedDB
    if (useIndexedDB && db) {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        store.clear()
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    }

    // Clear localStorage
    const key = `cattalytics:${storeName}`
    localStorage.removeItem(key)

    return true
  } catch (err) {
    console.error('Delete failed:', err)
    return false
  }
}

// Get storage statistics
export async function getStorageStats() {
  const stats = {
    indexedDB: useIndexedDB,
    stores: {}
  }

  // Get IndexedDB sizes
  if (useIndexedDB && db) {
    for (const [key, storeName] of Object.entries(STORES)) {
      try {
        const data = await loadFromIndexedDB(storeName)
        stats.stores[key] = {
          count: data.length,
          storage: 'IndexedDB'
        }
      } catch (err) {
        stats.stores[key] = { count: 0, storage: 'IndexedDB (error)' }
      }
    }
  } else {
    // Get localStorage sizes
    for (const [key, storeName] of Object.entries(STORES)) {
      try {
        const lsKey = `cattalytics:${storeName}`
        const raw = localStorage.getItem(lsKey)
        const data = raw ? JSON.parse(raw) : []
        stats.stores[key] = {
          count: data.length,
          size: raw ? raw.length : 0,
          storage: 'localStorage'
        }
      } catch (err) {
        stats.stores[key] = { count: 0, storage: 'localStorage (error)' }
      }
    }
  }

  // Get total localStorage usage
  let totalSize = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length
    }
  }
  stats.localStorageUsed = (totalSize / 1024).toFixed(2) + ' KB'
  stats.localStorageLimit = '~5-10 MB'

  return stats
}

// Initialize on load
if (typeof window !== 'undefined') {
  initDB().catch(err => {
    console.warn('IndexedDB initialization failed:', err)
    useIndexedDB = false
  })
}
