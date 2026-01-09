import { db, isFirebaseConfigured, auth } from './firebase'
// Respect a dev-only flag to disable cloud sync when running locally or in previews.
const DISABLE_SYNC = typeof import.meta !== 'undefined' && Boolean(import.meta.env.VITE_DISABLE_FIRESTORE_SYNC === 'true')
import { collection, doc, getDocs, onSnapshot, setDoc, writeBatch, query, limit, serverTimestamp } from 'firebase/firestore'
import { STORES, loadData, saveData } from './storage'

// Sync status and listeners (from legacy sync.js)
let syncEnabled = false
let syncStatus = 'offline' // offline, syncing, synced, error, disabled
let listeners = []

// Prevent duplicate setup
let isStarted = false
const applyingSet = new Set()
// Track stores where Firestore access is denied to avoid repeated attempts/logs
const permissionDeniedStores = new Set()
// Pause writes temporarily when backend quota errors are encountered
let pauseWritesUntil = 0

// Expose flags/hooks for storage.js
function firestoreCollectionName(storeName) {
  try {
    return String(storeName).replace(/[:]/g, '_')
  } catch (e) {
    return storeName
  }
}

function getUserCollectionRef(storeName) {
  const colName = firestoreCollectionName(storeName)
  try {
    const uid = auth && auth.currentUser && auth.currentUser.uid
    if (uid) {
      return collection(db, 'users', uid, colName)
    }
  } catch (e) {
    // fallthrough to top-level collection as a last resort
  }
  return collection(db, colName)
}
if (typeof window !== 'undefined') {
  window.__firestoreSyncApplying = applyingSet
  window.__firestorePermissionDeniedStores = permissionDeniedStores
}

/**
 * Push local store data to Firestore (replace remote with local snapshot)
 */
async function pushStoreToFirestore(storeName, localData = []) {
  if (!db || !isFirebaseConfigured()) return
  // Ensure we have an authenticated user before attempting user-scoped operations
  if (auth && (!auth.currentUser || !auth.currentUser.uid)) {
    // Auth not ready / no user - skip syncing to avoid permission errors
    return
  }
  // If we've previously detected permission denied for this store, skip silently
  if (permissionDeniedStores.has(storeName)) return
  const colRef = getUserCollectionRef(storeName)
  const batch = writeBatch(db)

  try {
    // Respect quota-based pause window
    if (Date.now() < pauseWritesUntil) {
      // Skip write attempts while in backoff to avoid exhausting quota further
      return
    }

    // Index local by id and upsert only — do NOT delete remote docs automatically.
    const localById = new Map()
    localData.forEach(item => {
      const id = item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      localById.set(id, { ...item, id, updatedAt: item.updatedAt || new Date().toISOString() })
    })

    // Upsert all local items
    for (const [id, item] of localById.entries()) {
      batch.set(doc(colRef, id), item, { merge: true })
    }

    await batch.commit()
  } catch (err) {
    // Avoid spamming the console with repeated Firestore errors.
    const msg = String((err && (err.message || err.code)) || '')
    if (err && (err.code === 'permission-denied' || msg.toLowerCase().includes('permission'))) {
      if (!permissionDeniedStores.has(storeName)) {
        permissionDeniedStores.add(storeName)
        console.warn(`Firestore push aborted for ${storeName}: Missing or insufficient permissions.`)
      }
      return
    }

    // Handle quota / resource-exhausted by backing off writes briefly
    if (err && (err.code === 'resource-exhausted' || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource-exhausted'))) {
      pauseWritesUntil = Date.now() + (60 * 1000) // pause for 60s
      console.warn(`Firestore quota exceeded — pausing writes for 60s.`)
      return
    }

    console.warn(`Firestore push failed for ${storeName}:`, err)
  }
}

/**
 * Apply remote snapshot into local storage without echoing back
 */
async function applyRemoteToLocal(storeName, docs) {
  applyingSet.add(storeName)
  try {
    // Merge remote docs with local data using `updatedAt` to avoid overwriting newer local changes.
    const remoteRecords = docs.map(d => ({ id: d.id, ...d.data() }))
    const localRecords = loadData(storeName, []) || []

    const byId = new Map()
    // Start with local records
    for (const r of localRecords) {
      if (r && r.id) byId.set(r.id, r)
    }

    function toMillis(ts) {
      if (!ts) return 0
      try {
        if (typeof ts === 'number') return ts
        if (typeof ts === 'string') return Date.parse(ts) || 0
        if (ts && typeof ts.toMillis === 'function') return ts.toMillis()
        if (ts && ts.seconds) return (ts.seconds * 1000) + Math.floor((ts.nanoseconds || 0) / 1000000)
      } catch (e) {
        return 0
      }
      return 0
    }

    for (const r of remoteRecords) {
      const id = r.id
      if (!id) continue
      const existing = byId.get(id)
      if (!existing) {
        // local doesn't have it — accept remote
        byId.set(id, r)
        continue
      }

      const localTs = toMillis(existing.updatedAt)
      const remoteTs = toMillis(r.updatedAt)

      if (localTs && remoteTs) {
        // Keep the newer version
        if (localTs >= remoteTs) {
          // keep local
          byId.set(id, existing)
        } else {
          byId.set(id, r)
        }
      } else if (remoteTs) {
        byId.set(id, r)
      } else {
        // no reliable timestamps — prefer remote to ensure latest cloud state
        byId.set(id, r)
      }
    }

    const merged = Array.from(byId.values())
    await saveData(storeName, merged)
  } finally {
    applyingSet.delete(storeName)
  }
}

/**
 * Start Firestore sync: push local → cloud once, then subscribe to remote changes.
 */
export async function startFirestoreSync() {
  if (DISABLE_SYNC) {
    console.info('ℹ️ Firestore sync disabled by VITE_DISABLE_FIRESTORE_SYNC')
    syncStatus = 'disabled'
    return
  }
  if (isStarted) return
  if (!db || !isFirebaseConfigured()) return
  isStarted = true

  // Expose push hook for storage saveData
  if (typeof window !== 'undefined') {
    window.__firestoreSyncPush = (store, data) => pushStoreToFirestore(store, data)
  }

  // Initial push + listeners per store
  for (const storeName of Object.keys(STORES)) {
    try {
      // If permissions were already denied for this store, skip push/listener setup
      if (permissionDeniedStores.has(storeName)) {
        continue
      }

      const localData = loadData(storeName, []) || []
      // Attempt initial push only for small stores or when explicitly enabled.
      // This avoids accidentally writing large datasets (which can exhaust quotas) on startup.
      const initialPushEnabled = (() => {
        try { return localStorage.getItem('devinsfarm:sync:initialPush') === 'true' } catch (e) { return false }
      })()
      const MAX_INITIAL_PUSH_ITEMS = 200
      if (initialPushEnabled || (Array.isArray(localData) && localData.length <= MAX_INITIAL_PUSH_ITEMS)) {
        pushStoreToFirestore(storeName, localData).catch(() => {})
      }

      const colRef = getUserCollectionRef(storeName)

      // Probe permission quickly before subscribing to avoid noisy errors
      try {
        await getDocs(query(colRef, limit(1)))
      } catch (probeErr) {
        if (probeErr && (probeErr.code === 'permission-denied' || String(probeErr.message).toLowerCase().includes('permission'))) {
          if (!permissionDeniedStores.has(storeName)) {
            permissionDeniedStores.add(storeName)
            console.warn(`Skipping Firestore listeners for ${storeName}: insufficient permissions.`)
          }
          continue
        }
        // If it's a transient network error, still attempt listener setup below
      }

      // Write lightweight presence doc for this device/user
      try {
        const uid = auth && auth.currentUser && auth.currentUser.uid
        if (uid) {
          const deviceIdKey = 'devinsfarm:deviceId'
          let deviceId = null
          try { deviceId = localStorage.getItem(deviceIdKey) } catch (e) { }
          if (!deviceId) {
            deviceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`
            try { localStorage.setItem(deviceIdKey, deviceId) } catch (e) {}
          }
          const presenceRef = doc(db, 'users', uid, 'presence', deviceId)
          try {
            await setDoc(presenceRef, { deviceId, ua: (navigator && navigator.userAgent) || '', lastSeen: serverTimestamp() }, { merge: true })
          } catch (e) {
            // ignore presence write errors
          }
          // Periodically update presence (best-effort)
          try {
            setInterval(() => {
              try { setDoc(presenceRef, { lastSeen: serverTimestamp() }, { merge: true }) } catch(e){}
            }, 30 * 1000)
          } catch (e) {}
        }
      } catch (e) {}


      onSnapshot(colRef, snapshot => {
        applyRemoteToLocal(storeName, snapshot.docs).catch(err => {
          console.warn(`Firestore sync apply failed for ${storeName}:`, err)
        })
      }, err => {
        if (err && (err.code === 'permission-denied' || String(err.message).toLowerCase().includes('permission'))) {
          if (!permissionDeniedStores.has(storeName)) {
            permissionDeniedStores.add(storeName)
            console.warn(`Firestore listener denied for ${storeName}:`, err)
          }
          return
        }
        console.warn(`Firestore listener failed for ${storeName}:`, err)
      })
    } catch (err) {
      console.warn(`Firestore sync skipped for ${storeName}:`, err)
    }
  }
}

/**
 * Legacy-compatible public API (consolidated)
 */
export function isSyncEnabled() {
  try {
    if (DISABLE_SYNC) return false
    return syncEnabled && isFirebaseConfigured() && auth && auth.currentUser !== null
  } catch (error) {
    return false
  }
}

export function getSyncStatus() {
  if (!isFirebaseConfigured()) return 'disabled'
  if (!auth || !auth.currentUser) return 'offline'
  if (!syncEnabled) return 'offline'
  return syncStatus
}

export function setSyncEnabled(enabled) {
  syncEnabled = enabled
  try { localStorage.setItem('devinsfarm:sync:enabled', enabled.toString()) } catch (e) {}
  if (enabled && auth && auth.currentUser) {
    syncStatus = 'synced'
    startRealtimeSync()
  } else {
    syncStatus = 'offline'
    stopRealtimeSync()
  }
}

export function initSync() {
  if (!isFirebaseConfigured()) {
    syncStatus = 'disabled'
    return false
  }
  try {
    const enabled = localStorage.getItem('devinsfarm:sync:enabled')
    syncEnabled = enabled === 'true'
    if (syncEnabled && auth && auth.currentUser) {
      startRealtimeSync()
    }
    return syncEnabled
  } catch (err) {
    console.error('Sync initialization error:', err)
    syncStatus = 'error'
    return false
  }
}

/**
 * Sync a named collection (array/object) to Firebase. Compatible with `syncToFirebase` callers.
 */
export async function syncToFirebase(collectionName, data) {
  if (!isSyncEnabled()) return false
  try {
    syncStatus = 'syncing'
    const uid = auth && auth.currentUser && auth.currentUser.uid
    if (!uid) return false
    const userPath = `users/${uid}`
    const batch = writeBatch(db)
    let items = []
    if (data == null) items = []
    else if (Array.isArray(data)) items = data
    else if (typeof data === 'object') items = Object.values(data)
    else items = [data]

    const collectionRef = collection(db, userPath, collectionName)
    for (const item of items) {
      if (!item || !item.id) continue
      const docRef = doc(collectionRef, item.id)
      batch.set(docRef, { ...item, updatedAt: serverTimestamp() }, { merge: true })
    }
    await batch.commit()
    syncStatus = 'synced'
    return true
  } catch (err) {
    console.error(`Error syncing ${collectionName}:`, err)
    syncStatus = 'error'
    return false
  }
}

export async function fetchFromFirebase(collectionName) {
  if (!isSyncEnabled()) return null
  try {
    const uid = auth && auth.currentUser && auth.currentUser.uid
    if (!uid) return null
    const collectionRef = collection(db, `users/${uid}`, collectionName)
    const snap = await getDocs(collectionRef)
    return snap.docs.map(d => d.data())
  } catch (err) {
    console.error(`Error fetching ${collectionName}:`, err)
    return null
  }
}

/**
 * Start lightweight real-time listeners for common collections (legacy behavior)
 */
export function startRealtimeSync() {
  if (!isSyncEnabled()) return

  const collections = [
    'animals','transactions','inventory','tasks','crops','treatments','feeding','breeding','measurements','milkYield','groups','pastures','schedules','calves','azolla','bsf','reminders','notifications'
  ]

  const uid = auth && auth.currentUser && auth.currentUser.uid
  if (!uid) return

  // Stop existing listeners
  stopRealtimeSync()

  for (const collectionName of collections) {
    try {
      const collectionRef = collection(db, `users/${uid}`, collectionName)
      const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => doc.data())
        const localKey = `devinsfarm:${collectionName}`
        const currentLocal = localStorage.getItem(localKey)
        const newData = JSON.stringify(data)
        if (currentLocal !== newData) {
          localStorage.setItem(localKey, newData)
          window.dispatchEvent(new StorageEvent('storage', { key: localKey, newValue: newData, url: window.location.href }))
        }
      }, (err) => console.error(`Realtime listener ${collectionName} error:`, err))
      listeners.push(unsubscribe)
    } catch (e) {
      console.warn(`Failed to start realtime listener for ${collectionName}:`, e)
    }
  }
}

export function stopRealtimeSync() {
  listeners.forEach(unsub => {
    try { unsub() } catch (e) {}
  })
  listeners = []
}

export async function pushAllToFirebase() {
  if (!isSyncEnabled()) throw new Error('Sync is not enabled')
  syncStatus = 'syncing'
  // Use STORES mapping to push each store
  const userUid = auth && auth.currentUser && auth.currentUser.uid
  if (!userUid) throw new Error('No user logged in')
  const batch = writeBatch(db)
  let itemCount = 0
  for (const storeName of Object.keys(STORES)) {
    try {
      const localData = loadData(storeName, []) || []
      if (!Array.isArray(localData) || localData.length === 0) continue
      const colRef = getUserCollectionRef(storeName)
      for (const item of localData) {
        if (!item || !item.id) continue
        batch.set(doc(colRef, item.id), { ...item, updatedAt: serverTimestamp() }, { merge: true })
        itemCount++
      }
    } catch (e) { console.warn(`pushAllToFirebase skip ${storeName}:`, e) }
  }
  if (itemCount > 0) await batch.commit()
  syncStatus = 'synced'
  return { success: true, itemCount }
}

export async function pullAllFromFirebase() {
  if (!isSyncEnabled()) throw new Error('Sync is not enabled')
  syncStatus = 'syncing'
  const userUid = auth && auth.currentUser && auth.currentUser.uid
  if (!userUid) throw new Error('No user logged in')
  let count = 0
  for (const storeName of Object.keys(STORES)) {
    try {
      const colRef = getUserCollectionRef(storeName)
      const snap = await getDocs(colRef)
      const data = snap.docs.map(d => d.data())
      if (data.length) {
        try { localStorage.setItem(storeName, JSON.stringify(data)) } catch(e){}
        count++
      }
    } catch (e) { console.warn(`pullAllFromFirebase skip ${storeName}:`, e) }
  }
  syncStatus = 'synced'
  window.dispatchEvent(new Event('dataUpdated'))
  return { success: true, count }
}

export function setupAutoSync() {
  if (!isSyncEnabled()) return
  const originalSetItem = localStorage.setItem
  localStorage.setItem = function(key, value) {
    originalSetItem.call(localStorage, key, value)
    if (key.startsWith('devinsfarm:') || key.startsWith('cattalytics:')) {
      const collectionName = key.replace('devinsfarm:', '').replace('cattalytics:', '')
      try {
        const parsed = JSON.parse(value)
        let toSync
        if (Array.isArray(parsed)) toSync = parsed
        else if (parsed && typeof parsed === 'object') toSync = Object.values(parsed)
        else toSync = [parsed]
        syncToFirebase(collectionName, toSync)
      } catch (e) {}
    }
  }
}

export function onSyncStatusChange(callback) {
  const interval = setInterval(() => callback(syncStatus), 1000)
  return () => clearInterval(interval)
}

export default {
  startFirestoreSync,
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
  onSyncStatusChange,
  getFirestorePermissionDeniedStores
}

export function getFirestorePermissionDeniedStores() {
  return Array.from(permissionDeniedStores)
}
