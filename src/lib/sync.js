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
  
  const enabled = localStorage.getItem('devinsfarm:sync:enabled')
  syncEnabled = enabled === 'true'
  
  if (syncEnabled && auth.currentUser) {
    console.log('✅ Sync initialized for user:', auth.currentUser.uid)
    startRealtimeSync()
  }
  
  return syncEnabled
}

/**
 * Enable/disable sync
 */
export function setSyncEnabled(enabled) {
  syncEnabled = enabled
  localStorage.setItem('devinsfarm:sync:enabled', enabled.toString())
  
  if (enabled && auth.currentUser) {
    startRealtimeSync()
  } else {
    stopRealtimeSync()
  }
}

/**
 * Check if sync is enabled
 */
export function isSyncEnabled() {
  return syncEnabled && isFirebaseConfigured() && auth.currentUser !== null
}

/**
 * Get current sync status
 */
export function getSyncStatus() {
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
  if (!isSyncEnabled()) return false

  try {
    syncStatus = 'syncing'

    const collections = {
      animals: localStorage.getItem('devinsfarm:animals'),
      transactions: localStorage.getItem('devinsfarm:transactions'),
      inventory: localStorage.getItem('devinsfarm:inventory'),
      tasks: localStorage.getItem('devinsfarm:tasks'),
      crops: localStorage.getItem('devinsfarm:crops'),
      treatments: localStorage.getItem('devinsfarm:treatments'),
      feeding: localStorage.getItem('devinsfarm:feeding'),
      breeding: localStorage.getItem('devinsfarm:breeding'),
      measurements: localStorage.getItem('devinsfarm:measurements'),
      milkYield: localStorage.getItem('devinsfarm:milkYield'),
      groups: localStorage.getItem('devinsfarm:groups'),
      pastures: localStorage.getItem('devinsfarm:pastures'),
      schedules: localStorage.getItem('devinsfarm:schedules'),
      calves: localStorage.getItem('cattalytics:calf:management'),
      azolla: localStorage.getItem('cattalytics:azolla:ponds'),
      bsf: localStorage.getItem('cattalytics:bsf:colonies'),
      reminders: localStorage.getItem('devinsfarm:reminders'),
      notifications: localStorage.getItem('devinsfarm:notifications')
    }

    const userPath = getUserPath()
    if (!userPath) return false

    const batch = writeBatch(db)
    let count = 0

    for (const [name, data] of Object.entries(collections)) {
      if (data) {
        const parsedData = JSON.parse(data)
        const collectionRef = collection(db, userPath, name)
        for (const item of parsedData) {
          if (!item.id) continue
          const docRef = doc(collectionRef, item.id)
          batch.set(docRef, { ...item, updatedAt: serverTimestamp() }, { merge: true })
        }
        count++
      }
    }

    await batch.commit()
    syncStatus = 'synced'
    console.log(`✅ Pushed ${count} collections to Firebase`)
    return true
  } catch (error) {
    console.error('❌ Error pushing to Firebase:', error)
    syncStatus = 'error'
    return false
  }
}

/**
 * Pull all data from Firebase to local (one-time pull)
 */
export async function pullAllFromFirebase() {
  if (!isSyncEnabled()) return false

  try {
    syncStatus = 'syncing'

    const userPath = getUserPath()
    if (!userPath) return false

    const collections = [
      'animals', 'transactions', 'inventory', 'tasks', 'crops',
      'treatments', 'feeding', 'breeding', 'measurements', 'milkYield',
      'groups', 'pastures', 'schedules', 'calves', 'azolla', 'bsf',
      'reminders', 'notifications'
    ]

    let count = 0

    for (const collectionName of collections) {
      const collectionRef = collection(db, userPath, collectionName)
      const querySnapshot = await getDocs(collectionRef)
      const data = querySnapshot.docs.map(doc => doc.data())

      if (data.length > 0) {
        const localKey = collectionName.startsWith('cattalytics:')
          ? collectionName
          : `devinsfarm:${collectionName}`

        localStorage.setItem(localKey, JSON.stringify(data))
        count++
      }
    }

    syncStatus = 'synced'
    console.log(`✅ Pulled ${count} collections from Firebase`)

    // Reload page to reflect changes
    window.location.reload()
    return true
  } catch (error) {
    console.error('❌ Error pulling from Firebase:', error)
    syncStatus = 'error'
    return false
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
