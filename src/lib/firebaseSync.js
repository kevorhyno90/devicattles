import { db, isFirebaseConfigured, auth } from './firebase'
// Sync is opt-in to avoid accidental cloud writes/costs for personal apps.
// Enable by setting the env var `VITE_ENABLE_FIRESTORE_SYNC=true` at build/runtime
// or by setting localStorage `devinsfarm:sync:enabled` = 'true' in the browser.
const EXPLICIT_SYNC_ENABLED = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ENABLE_FIRESTORE_SYNC === 'true') || (typeof window !== 'undefined' && (() => { try { return localStorage.getItem('devinsfarm:sync:enabled') === 'true' } catch (e) { return false } })())
const DISABLE_SYNC = !EXPLICIT_SYNC_ENABLED
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
let backoffCount = 0
// Pause reads temporarily when backend quota errors are encountered
let pauseReadsUntil = 0
let readBackoffCount = 0
// Stores to exclude from automatic cloud sync to avoid noisy writes
const EXCLUDED_SYNC_STORES = new Set(['notifications', 'reminders'])

// Single-writer queue to serialize and rate-limit commits to Firestore.
const writeQueue = []
let writeInProgress = false
// Increase the inter-write delay to avoid write bursts that can trigger quota errors.
const INTER_WRITE_DELAY_MS = 1000

function enqueueWrite(fn) {
  return new Promise((resolve, reject) => {
    writeQueue.push({ fn, resolve, reject })
    if (!writeInProgress) processWriteQueue()
  })
}

// Persistent write queue stored in localStorage to survive reloads.
const PERSIST_QUEUE_KEY = 'devinsfarm:writeQueue'
let persistentProcessing = false

function loadPersistQueue() {
  try {
    const raw = localStorage.getItem(PERSIST_QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

function savePersistQueue(q) {
  try {
    localStorage.setItem(PERSIST_QUEUE_KEY, JSON.stringify(q))
  } catch (e) {
    // ignore
  }
}

async function enqueuePersistentOp(op) {
  try {
    const q = loadPersistQueue()
    q.push(op)
    savePersistQueue(q)
    processPersistentQueue().catch(() => {})
  } catch (e) {}
}

async function processPersistentQueue() {
  if (persistentProcessing) return
  persistentProcessing = true
  try {
    let q = loadPersistQueue()
    while (q.length) {
      const op = q[0]
      try {
        // Use the serialized in-memory write queue to perform the commit.
        // Break large ops into smaller chunks and commit with pauses to avoid bursts.
        const uid = auth && auth.currentUser && auth.currentUser.uid
        if (!uid) throw new Error('No user logged in')
        const colName = firestoreCollectionName(op.storeName)
        const colRefBase = uid ? (path => doc(db, 'users', uid, colName, path)) : (path => doc(db, colName, path))
        if (Array.isArray(op.items) && op.items.length) {
          const CHUNK_SIZE = 10
          for (let i = 0; i < op.items.length; i += CHUNK_SIZE) {
            const chunk = op.items.slice(i, i + CHUNK_SIZE)
            await enqueueWrite(async () => {
              const batch = writeBatch(db)
              for (const item of chunk) {
                try {
                  if (item && item._deleted) {
                    const id = String(item.id)
                    batch.delete(colRefBase(id))
                  } else if (item && item.id != null) {
                    const id = String(item.id)
                    batch.set(colRefBase(id), { ...item, updatedAt: serverTimestamp() }, { merge: true })
                  }
                } catch (e) {}
              }
              await batch.commit()
            })
            // Pause briefly between chunk commits to reduce write rate
            await new Promise(r => setTimeout(r, 1200))
          }
        } else {
          // No items: still enqueue a no-op to keep ordering semantics
          await enqueueWrite(async () => {})
        }
        // remove op from persistent queue
        q.shift()
        savePersistQueue(q)
      } catch (e) {
        // handle quota errors: if resource-exhausted, set pauseWritesUntil and stop processing
        const msg = String((e && (e.message || e.code)) || '')
        if (e && (e.code === 'resource-exhausted' || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource-exhausted'))) {
          backoffCount = Math.min((backoffCount || 0) + 1, 6)
          const pauseMs = Math.min(60 * 1000 * Math.pow(2, backoffCount - 1), 60 * 60 * 1000)
          pauseWritesUntil = Date.now() + pauseMs
          console.warn(`Firestore quota exceeded during persistent queue processing — pausing writes for ${Math.round(pauseMs/1000)}s (backoff #${backoffCount}).`)
          try { window.__firestoreBackoff = { backoffCount, pauseWritesUntil } } catch(e) {}
          break
        }
        // Other errors: break to avoid tight failure loop
        break
      }
      q = loadPersistQueue()
    }
  } finally {
    persistentProcessing = false
  }
}

// Expose persistent queue helpers for UI/diagnostics
export function getPersistentQueueLength() {
  try { return loadPersistQueue().length } catch (e) { return 0 }
}

export function clearPersistentQueue() {
  try { savePersistQueue([]); return true } catch (e) { return false }
}

export function flushPersistentQueue() {
  try { processPersistentQueue().catch(() => {}); return true } catch (e) { return false }
}

export function getPersistentQueueItems() {
  try { return loadPersistQueue() } catch (e) { return [] }
}

export function removePersistentQueueItem(index) {
  try {
    const q = loadPersistQueue()
    if (index < 0 || index >= q.length) return false
    q.splice(index, 1)
    savePersistQueue(q)
    return true
  } catch (e) { return false }
}

export function isPersistentProcessing() {
  return Boolean(persistentProcessing)
}

if (typeof window !== 'undefined') {
  try {
    window.__firestoreQueueLength = () => getPersistentQueueLength()
    window.__firestoreFlushQueue = () => flushPersistentQueue()
    window.__firestoreClearQueue = () => clearPersistentQueue()
    window.__firestoreQueueItems = () => getPersistentQueueItems()
    window.__firestoreClearOp = (i) => removePersistentQueueItem(i)
    window.__firestoreQueueProcessing = () => isPersistentProcessing()
  } catch (e) {}
}

// Read queue to serialize/pace read probes (avoids many simultaneous getDocs)
const readQueue = []
let readInProgress = false
const INTER_READ_DELAY_MS = 250

function enqueueRead(fn) {
  return new Promise((resolve, reject) => {
    readQueue.push({ fn, resolve, reject })
    if (!readInProgress) processReadQueue()
  })
}

async function processReadQueue() {
  if (readInProgress) return
  readInProgress = true
  while (readQueue.length) {
    const { fn, resolve, reject } = readQueue.shift()
    try {
      if (Date.now() < pauseReadsUntil) {
        const waitMs = Math.max(0, pauseReadsUntil - Date.now())
        await new Promise(r => setTimeout(r, waitMs))
      }
      const res = await fn()
      resolve(res)
    } catch (e) {
      reject(e)
    }
    await new Promise(r => setTimeout(r, INTER_READ_DELAY_MS))
  }
  readInProgress = false
}

async function processWriteQueue() {
  if (writeInProgress) return
  writeInProgress = true
  while (writeQueue.length) {
    const { fn, resolve, reject } = writeQueue.shift()
    try {
      // Respect quota/backoff window
      if (Date.now() < pauseWritesUntil) {
        const waitMs = Math.max(0, pauseWritesUntil - Date.now())
        await new Promise(r => setTimeout(r, waitMs))
      }
      const res = await fn()
      resolve(res)
    } catch (e) {
      reject(e)
    }
    // Small delay between writes to avoid bursts
    await new Promise(r => setTimeout(r, INTER_WRITE_DELAY_MS))
  }
  writeInProgress = false
}

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
  if (EXCLUDED_SYNC_STORES.has(storeName)) return
  // Skip noisy or intentionally local-only stores
  if (EXCLUDED_SYNC_STORES.has(storeName)) return

  const colRef = getUserCollectionRef(storeName)
  // Index local by id and prepare items for upsert
  const localById = new Map()
  localData.forEach(item => {
    const rawId = item && item.id != null ? item.id : null
    const id = rawId != null ? String(rawId) : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    localById.set(id, { ...item, id, updatedAt: item.updatedAt || new Date().toISOString() })
  })

  // Enqueue the actual Firestore commit to the serialized queue to avoid concurrent bursts
  return enqueueWrite(async () => {
    // If we've previously detected permission denied for this store, skip
    if (permissionDeniedStores.has(storeName)) return
    if (EXCLUDED_SYNC_STORES.has(storeName)) return

    // Respect quota-based pause window
    if (Date.now() < pauseWritesUntil) {
      return
    }

    const batch = writeBatch(db)
    try {
      for (const [id, item] of localById.entries()) {
        try {
          if (!id) {
            console.warn('pushStoreToFirestore: skipping item with invalid id', item)
            continue
          }
          const colName = firestoreCollectionName(storeName)
          const uid = auth && auth.currentUser && auth.currentUser.uid
          const docRef = uid ? doc(db, 'users', uid, colName, id) : doc(db, colName, id)
          batch.set(docRef, item, { merge: true })
        } catch (e) {
          console.warn('pushStoreToFirestore: failed to queue item', id, e)
        }
      }

      await batch.commit()
      backoffCount = 0
    } catch (err) {
      const msg = String((err && (err.message || err.code)) || '')
      if (err && (err.code === 'permission-denied' || msg.toLowerCase().includes('permission'))) {
        if (!permissionDeniedStores.has(storeName)) {
          permissionDeniedStores.add(storeName)
          console.warn(`Firestore push aborted for ${storeName}: Missing or insufficient permissions.`)
        }
        return
      }

      if (err && (err.code === 'resource-exhausted' || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource-exhausted'))) {
        try {
          backoffCount = Math.min((backoffCount || 0) + 1, 6)
          const pauseMs = Math.min(60 * 1000 * Math.pow(2, backoffCount - 1), 60 * 60 * 1000)
          pauseWritesUntil = Date.now() + pauseMs
          console.warn(`Firestore quota exceeded — pausing writes for ${Math.round(pauseMs/1000)}s (backoff #${backoffCount}).`)
          try { window.__firestoreBackoff = { backoffCount, pauseWritesUntil } } catch(e) {}
        } catch (e) {
          pauseWritesUntil = Date.now() + (60 * 1000)
          console.warn(`Firestore quota exceeded — pausing writes for 60s.`)
        }
        return
      }

      console.warn(`Firestore push failed for ${storeName}:`, err)
      throw err
    }
  })
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
    // Expose a persistent enqueue function so `storage.saveData` can queue small
    // deltas safely and survive reloads/offline.
    window.__firestoreSyncPush = (store, data) => enqueuePersistentOp({ storeName: store, items: data })
  }

  // Initial push + listeners per store
  for (const [storeIndex, storeName] of Object.keys(STORES).entries()) {
    try {
      // Optionally skip noisy stores
      if (EXCLUDED_SYNC_STORES.has(storeName)) continue
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
        // Stagger initial pushes across stores to avoid creating a sudden burst
        // of write activity which can exhaust Firestore quotas. Schedule pushes
        // with a small per-store delay rather than committing all at once.
        try {
          const pushDelayMs = 500 // ms per store index
          const storeIndex = Object.keys(STORES).indexOf(storeName)
          setTimeout(() => {
            pushStoreToFirestore(storeName, localData).catch(() => {})
          }, Math.max(0, storeIndex) * pushDelayMs)
        } catch (e) {
          // Fallback to immediate push if scheduling fails for any reason
          pushStoreToFirestore(storeName, localData).catch(() => {})
        }
      }

      const colRef = getUserCollectionRef(storeName)

      // Probe permission quickly before subscribing to avoid noisy errors.
      // Use serialized read queue and a read backoff window to avoid many
      // simultaneous getDocs calls which can exhaust Firestore read quota.
      try {
        if (Date.now() < pauseReadsUntil) {
          // Skip probe while reads are paused; proceed to setup listener later
        } else {
          await enqueueRead(() => getDocs(query(colRef, limit(1))))
        }
      } catch (probeErr) {
        const msg = String((probeErr && (probeErr.message || probeErr.code)) || '')
        if (probeErr && (probeErr.code === 'permission-denied' || msg.toLowerCase().includes('permission'))) {
          if (!permissionDeniedStores.has(storeName)) {
            permissionDeniedStores.add(storeName)
            console.warn(`Skipping Firestore listeners for ${storeName}: insufficient permissions.`)
          }
          continue
        }
        if (probeErr && (probeErr.code === 'resource-exhausted' || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource-exhausted'))) {
          try {
            readBackoffCount = Math.min((readBackoffCount || 0) + 1, 6)
            const pauseMs = Math.min(30 * 1000 * Math.pow(2, readBackoffCount - 1), 60 * 60 * 1000)
            pauseReadsUntil = Date.now() + pauseMs
            console.warn(`Firestore read quota exceeded — pausing probes for ${Math.round(pauseMs/1000)}s (backoff #${readBackoffCount}).`)
            try { window.__firestoreReadBackoff = { readBackoffCount, pauseReadsUntil } } catch(e) {}
          } catch (e) {
            pauseReadsUntil = Date.now() + (30 * 1000)
            console.warn(`Firestore read quota exceeded — pausing probes for 30s.`)
          }
          // Skip listener setup for now; continue so we don't spam with onSnapshot
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


      // Stagger onSnapshot subscriptions to reduce read burst on startup
      try {
        const listenDelayMs = Math.min(1000, Math.max(0, storeIndex * 300))
        setTimeout(() => {
          try {
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
          } catch (e) {
            console.warn(`Failed to start firestore listener for ${storeName}:`, e)
          }
        }, listenDelayMs)
      } catch (e) {}
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
    // Use the serialized write queue for commits
    let items = []
    if (data == null) items = []
    else if (Array.isArray(data)) items = data
    else if (typeof data === 'object') items = Object.values(data)
    else items = [data]
    const collectionRef = collection(db, 'users', uid, collectionName)
    // Enqueue the commit to the write queue to serialize and rate-limit
    return enqueueWrite(async () => {
      const batch = writeBatch(db)
      try {
        for (const item of items) {
          try {
            if (!item || item.id == null) continue
            const id = (typeof item.id === 'string') ? item.id : String(item.id)
            if (!id) continue
            const docRef = doc(collectionRef, id)
            batch.set(docRef, { ...item, updatedAt: serverTimestamp() }, { merge: true })
          } catch (e) {
            console.warn('syncToFirebase: failed to queue item for sync', item, e)
          }
        }
        await batch.commit()
        syncStatus = 'synced'
        backoffCount = 0
        return true
      } catch (err) {
        console.error(`Error syncing ${collectionName}:`, err)
        // bubble quota/permission handling to outer logic similar to pushStoreToFirestore
        const msg = String((err && (err.message || err.code)) || '')
        if (err && (err.code === 'permission-denied' || msg.toLowerCase().includes('permission'))) {
          console.warn(`syncToFirebase aborted for ${collectionName}: Missing or insufficient permissions.`)
          return false
        }
        if (err && (err.code === 'resource-exhausted' || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource-exhausted'))) {
          backoffCount = Math.min((backoffCount || 0) + 1, 6)
          const pauseMs = Math.min(60 * 1000 * Math.pow(2, backoffCount - 1), 60 * 60 * 1000)
          pauseWritesUntil = Date.now() + pauseMs
          console.warn(`Firestore quota exceeded — pausing writes for ${Math.round(pauseMs/1000)}s (backoff #${backoffCount}).`)
          try { window.__firestoreBackoff = { backoffCount, pauseWritesUntil } } catch(e) {}
          return false
        }
        syncStatus = 'error'
        return false
      }
    })
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
  const ops = []
  let itemCount = 0
  for (const storeName of Object.keys(STORES)) {
    try {
      const localData = loadData(storeName, []) || []
      if (!Array.isArray(localData) || localData.length === 0) continue
      const colRef = getUserCollectionRef(storeName)
      for (const item of localData) {
        if (!item || !item.id) continue
        ops.push({ colRef, item })
        itemCount++
      }
    } catch (e) { console.warn(`pushAllToFirebase skip ${storeName}:`, e) }
  }

  // Firestore batch limit is 500; use a safe chunk size
  const CHUNK_SIZE = 450
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const chunk = ops.slice(i, i + CHUNK_SIZE)
    await enqueueWrite(async () => {
      const batch = writeBatch(db)
      try {
        for (const op of chunk) {
          try {
            batch.set(doc(op.colRef, String(op.item.id)), { ...op.item, updatedAt: serverTimestamp() }, { merge: true })
          } catch (e) { console.warn('pushAllToFirebase: failed to queue item', e) }
        }
        await batch.commit()
      } catch (err) {
        const msg = String((err && (err.message || err.code)) || '')
        if (err && (err.code === 'resource-exhausted' || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource-exhausted'))) {
          backoffCount = Math.min((backoffCount || 0) + 1, 6)
          const pauseMs = Math.min(60 * 1000 * Math.pow(2, backoffCount - 1), 60 * 60 * 1000)
          pauseWritesUntil = Date.now() + pauseMs
          console.warn(`Firestore quota exceeded — pausing writes for ${Math.round(pauseMs/1000)}s (backoff #${backoffCount}).`)
          try { window.__firestoreBackoff = { backoffCount, pauseWritesUntil } } catch(e) {}
          throw err
        }
        throw err
      }
    })
  }

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
  // Pending syncs per collection with debounce timers
  const pending = new Map()
  const DEBOUNCE_MS = 2000

  function scheduleSync(collectionName, toSync) {
    try {
      // Skip noisy stores by default
      if (EXCLUDED_SYNC_STORES.has(collectionName)) return

      if (pending.has(collectionName)) {
        // merge arrays
        const entry = pending.get(collectionName)
        entry.items = Array.isArray(entry.items) ? Array.from(new Map([...entry.items, ...toSync].map(i => [i.id || JSON.stringify(i), i])).values()) : toSync
        clearTimeout(entry.timer)
        entry.timer = setTimeout(() => {
          try { syncToFirebase(collectionName, entry.items) } catch (e) {}
          pending.delete(collectionName)
        }, DEBOUNCE_MS)
      } else {
        const timer = setTimeout(() => {
          try { syncToFirebase(collectionName, toSync) } catch (e) {}
          pending.delete(collectionName)
        }, DEBOUNCE_MS)
        pending.set(collectionName, { items: toSync, timer })
      }
    } catch (e) {
      // ignore
    }
  }

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
        scheduleSync(collectionName, toSync)
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
