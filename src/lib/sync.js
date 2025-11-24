/**
 * Firebase Sync Utility
 * 
 * Handles real-time synchronization between localStorage and Firebase
 * Supports offline-first with automatic sync when online
 */

import { db, auth, isFirebaseConfigured } from './firebase'
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot,
  serverTimestamp,
  writeBatch,
  query,
  where
} from 'firebase/firestore'

// Sync status
let syncEnabled = false
let syncStatus = 'offline' // offline, syncing, synced, error
let listeners = []

/**
 * Initialize sync system
 */
export function initSync() {
  if (!isFirebaseConfigured()) {
    // Silent in local mode - Firebase is optional
    syncStatus = 'disabled'
    return false
  }
  
  try {
    const enabled = localStorage.getItem('devinsfarm:sync:enabled')
    syncEnabled = enabled === 'true'
    
    if (syncEnabled && auth && auth.currentUser) {
      console.log('✅ Sync initialized for user:', auth.currentUser.uid)
      startRealtimeSync()
    }
    
    return syncEnabled
  } catch (error) {
    console.error('Sync initialization error:', error)
    syncStatus = 'error'
    return false
  }
}

/**
 * Enable/disable sync
 */
export function setSyncEnabled(enabled) {
  syncEnabled = enabled
  localStorage.setItem('devinsfarm:sync:enabled', enabled.toString())
  
  if (enabled && auth && auth.currentUser) {
    syncStatus = 'synced'
    startRealtimeSync()
  } else {
    syncStatus = 'offline'
    stopRealtimeSync()
  }
}

/**
 * Check if sync is enabled
 */
export function isSyncEnabled() {
  try {
    return syncEnabled && isFirebaseConfigured() && auth && auth.currentUser !== null
  } catch (error) {
    return false
  }
}

/**
 * Get current sync status
 */
export function getSyncStatus() {
  if (!isFirebaseConfigured()) {
    return 'disabled'
  }
  
  if (!auth || !auth.currentUser) {
    return 'offline'
  }
  
  if (!syncEnabled) {
    return 'offline'
  }
  
  return syncStatus
}

/**
 * Get user's Firestore path
 */
function getUserPath() {
  if (!auth.currentUser) return null
  return `users/${auth.currentUser.uid}`
}

/**
 * Sync a specific data collection to Firebase
 */
export async function syncToFirebase(collectionName, data) {
  if (!isSyncEnabled()) return false

  try {
    syncStatus = 'syncing'
    const userPath = getUserPath()
    if (!userPath) return false

    const batch = writeBatch(db)
    const collectionRef = collection(db, userPath, collectionName)

    for (const item of data) {
      if (!item.id) {
        console.warn(`Skipping item in ${collectionName} without an ID`)
        continue
      }
      const docRef = doc(collectionRef, item.id)
      batch.set(docRef, { ...item, updatedAt: serverTimestamp() }, { merge: true })
    }

    await batch.commit()

    syncStatus = 'synced'
    console.log(`✅ Synced ${collectionName} to Firebase`)
    return true
  } catch (error) {
    console.error(`❌ Error syncing ${collectionName}:`, error)
    syncStatus = 'error'
    return false
  }
}

/**
 * Fetch data from Firebase
 */
export async function fetchFromFirebase(collectionName) {
  if (!isSyncEnabled()) return null

  try {
    const userPath = getUserPath()
    if (!userPath) return null

    const collectionRef = collection(db, userPath, collectionName)
    const querySnapshot = await getDocs(collectionRef)

    const data = querySnapshot.docs.map(doc => doc.data())

    console.log(`✅ Fetched ${collectionName} from Firebase`)
    return data
  } catch (error) {
    console.error(`❌ Error fetching ${collectionName}:`, error)
    return null
  }
}

/**
 * Start real-time sync listeners for all collections
 */
export function startRealtimeSync() {
  if (!isSyncEnabled()) return

  const collections = [
    'animals',
    'transactions',
    'inventory',
    'tasks',
    'crops',
    'treatments',
    'feeding',
    'breeding',
    'measurements',
    'milkYield',
    'groups',
    'pastures',
    'schedules',
    'calves',
    'azolla',
    'bsf',
    'reminders',
    'notifications'
  ]

  const userPath = getUserPath()
  if (!userPath) return

  // Stop existing listeners
  stopRealtimeSync()

  // Create new listeners
  collections.forEach(collectionName => {
    const collectionRef = collection(db, userPath, collectionName)

    const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => doc.data())
      const localKey = `devinsfarm:${collectionName}`

      // Update localStorage with Firebase data
      const currentLocal = localStorage.getItem(localKey)
      const newData = JSON.stringify(data)

      if (currentLocal !== newData) {
        localStorage.setItem(localKey, newData)
        console.log(`🔄 Updated ${collectionName} from Firebase`)

        // Trigger storage event for other tabs/windows
        window.dispatchEvent(new StorageEvent('storage', {
          key: localKey,
          newValue: newData,
          url: window.location.href
        }))
      }
    }, (error) => {
      console.error(`❌ Error in ${collectionName} listener:`, error)
    })

    listeners.push(unsubscribe)
  })

  console.log('✅ Real-time sync listeners started')
}


/**
 * Stop all real-time sync listeners
 */
export function stopRealtimeSync() {
  listeners.forEach(unsubscribe => unsubscribe())
  listeners = []
  console.log('⏹️ Real-time sync listeners stopped')
}

/**
 * Sync all local data to Firebase (one-time push)
 */
export async function pushAllToFirebase() {
  console.log('🔍 Push Debug - Auth current user:', auth?.currentUser?.uid)
  console.log('🔍 Push Debug - Sync enabled:', syncEnabled)
  console.log('🔍 Push Debug - Firebase configured:', isFirebaseConfigured())
  
  if (!isSyncEnabled()) {
    throw new Error('Sync is not enabled. Please login and enable sync first.')
  }

  try {
    syncStatus = 'syncing'

    const collectionMappings = {
      'animals': 'cattalytics:animals',
      'transactions': 'cattalytics:finance',
      'inventory': 'devinsfarm:resources',
      'tasks': 'cattalytics:tasks',
      'crops': 'cattalytics:crops:v2',
      'groups': 'cattalytics:groups',
      'pastures': 'cattalytics:pastures',
      'schedules': 'cattalytics:schedules',
      'calves': 'cattalytics:calf:management',
      'azolla': 'cattalytics:azolla:ponds',
      'bsf': 'cattalytics:bsf:colonies',
      'reminders': 'devinsfarm:reminders',
      'notifications': 'devinsfarm:notifications'
    }

    const userPath = getUserPath()
    console.log('🔍 Push Debug - User path:', userPath)
    if (!userPath) {
      throw new Error('No user logged in')
    }

    const batch = writeBatch(db)
    let count = 0
    let itemCount = 0

    for (const [collectionName, localKey] of Object.entries(collectionMappings)) {
      try {
        const data = localStorage.getItem(localKey)
        console.log(`🔍 Checking ${collectionName} (key: ${localKey}):`, data ? `${JSON.parse(data).length} items` : 'empty')
        if (data) {
          const parsedData = JSON.parse(data)
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            const collectionRef = collection(db, userPath, collectionName)
            console.log(`📤 Writing to: ${userPath}/${collectionName}`)
            for (const item of parsedData) {
              if (!item.id) continue
              const docRef = doc(collectionRef, item.id)
              batch.set(docRef, { ...item, updatedAt: serverTimestamp() }, { merge: true })
              itemCount++
            }
            count++
            console.log(`✓ Queued ${collectionName}: ${parsedData.length} items`)
          }
        }
      } catch (err) {
        console.warn(`Failed to queue ${collectionName}:`, err.message)
      }
    }

    if (itemCount > 0) {
      console.log(`🚀 Committing batch write with ${itemCount} items...`)
      await batch.commit()
      syncStatus = 'synced'
      console.log(`✅ Successfully pushed ${count} collections (${itemCount} items) to Firebase`)
    } else {
      syncStatus = 'synced'
      console.log('ℹ️ No data to push')
    }
    
    return { success: true, count, itemCount }
  } catch (error) {
    console.error('❌ Error pushing to Firebase:', error)
    syncStatus = 'error'
    throw error
  }
}

/**
 * Pull all data from Firebase to local (one-time pull)
 */
export async function pullAllFromFirebase() {
  if (!isSyncEnabled()) {
    throw new Error('Sync is not enabled. Please login and enable sync first.')
  }

  try {
    syncStatus = 'syncing'

    const userPath = getUserPath()
    if (!userPath) {
      throw new Error('No user logged in')
    }

    const collectionMappings = {
      'animals': 'cattalytics:animals',
      'transactions': 'cattalytics:finance',
      'inventory': 'devinsfarm:resources',
      'tasks': 'cattalytics:tasks',
      'crops': 'cattalytics:crops:v2',
      'groups': 'cattalytics:groups',
      'pastures': 'cattalytics:pastures',
      'schedules': 'cattalytics:schedules',
      'calves': 'cattalytics:calf:management',
      'azolla': 'cattalytics:azolla:ponds',
      'bsf': 'cattalytics:bsf:colonies',
      'reminders': 'devinsfarm:reminders',
      'notifications': 'devinsfarm:notifications'
    }

    let count = 0

    for (const [collectionName, localKey] of Object.entries(collectionMappings)) {
      try {
        const collectionRef = collection(db, userPath, collectionName)
        const querySnapshot = await getDocs(collectionRef)
        const data = querySnapshot.docs.map(doc => doc.data())

        if (data.length > 0) {
          localStorage.setItem(localKey, JSON.stringify(data))
          count++
          console.log(`✓ Pulled ${collectionName}: ${data.length} items`)
        }
      } catch (err) {
        console.warn(`Failed to pull ${collectionName}:`, err.message)
      }
    }

    syncStatus = 'synced'
    console.log(`✅ Successfully pulled ${count} collections from Firebase`)

    // Dispatch event instead of reloading page
    window.dispatchEvent(new Event('dataUpdated'))
    
    return { success: true, count }
  } catch (error) {
    console.error('❌ Error pulling from Firebase:', error)
    syncStatus = 'error'
    throw error
  }
}


/**
 * Auto-sync hook for localStorage changes
 */
export function setupAutoSync() {
  if (!isSyncEnabled()) return

  // Intercept localStorage.setItem
  const originalSetItem = localStorage.setItem
  localStorage.setItem = function(key, value) {
    originalSetItem.call(localStorage, key, value)

    // Sync to Firebase if it's a devinsfarm key
    if (key.startsWith('devinsfarm:') || key.startsWith('cattalytics:')) {
      const collectionName = key.replace('devinsfarm:', '').replace('cattalytics:', '')
      try {
        const data = JSON.parse(value)
        syncToFirebase(collectionName, data)
      } catch (e) {
        // Not JSON, skip
      }
    }
  }
}

/**
 * Listen for sync status changes
 */
export function onSyncStatusChange(callback) {
  const interval = setInterval(() => {
    callback(syncStatus)
  }, 1000)

  return () => clearInterval(interval)
}

export default {
  initSync,
  setSyncEnabled,
  isSyncEnabled,
  getSyncStatus,
  syncToFirebase,
  fetchFromFirebase,
  startRealtimeSync,
  stopRealtimeSync,
  pushAllToFirebase,
  pullAllFromFirebase,
  setupAutoSync,
  onSyncStatusChange
}
