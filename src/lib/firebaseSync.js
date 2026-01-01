import { db, isFirebaseConfigured, auth } from './firebase'
import { collection, doc, getDocs, onSnapshot, setDoc, deleteDoc, writeBatch, query, limit } from 'firebase/firestore'
import { STORES, loadData, saveData } from './storage'

// Prevent duplicate setup
let isStarted = false
const applyingSet = new Set()
// Track stores where Firestore access is denied to avoid repeated attempts/logs
const permissionDeniedStores = new Set()

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
    // Index local by id
    const localById = new Map()
    localData.forEach(item => {
      const id = item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      localById.set(id, { ...item, id, updatedAt: item.updatedAt || new Date().toISOString() })
    })

    // Fetch existing docs to detect deletions (guarded)
    let existingSnap
    try {
      existingSnap = await getDocs(colRef)
    } catch (err) {
      // If permissions/network prevent reading, bail out gracefully
      if (err && (err.code === 'permission-denied' || String(err.message).toLowerCase().includes('permission'))) {
        if (!permissionDeniedStores.has(storeName)) {
          permissionDeniedStores.add(storeName)
          console.warn(`Firestore push skipped for ${storeName}: permission denied`)
        }
        return
      }
      // For other errors, rethrow so callers can handle/log
      throw err
    }

    existingSnap.forEach(docSnap => {
      const id = docSnap.id
      if (!localById.has(id)) {
        batch.delete(doc(colRef, id))
      }
    })

    // Upsert all local items
    for (const [id, item] of localById.entries()) {
      batch.set(doc(colRef, id), item, { merge: true })
    }

    await batch.commit()
  } catch (err) {
    // Avoid spamming the console with repeated Firestore errors.
    if (err && (err.code === 'permission-denied' || String(err.message).toLowerCase().includes('permission'))) {
      if (!permissionDeniedStores.has(storeName)) {
        permissionDeniedStores.add(storeName)
        console.warn(`Firestore push aborted for ${storeName}: Missing or insufficient permissions.`)
      }
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
    const records = docs.map(d => ({ id: d.id, ...d.data() }))
    await saveData(storeName, records)
  } finally {
    applyingSet.delete(storeName)
  }
}

/**
 * Start Firestore sync: push local → cloud once, then subscribe to remote changes.
 */
export async function startFirestoreSync() {
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
      // Attempt initial push; swallow expected errors
      pushStoreToFirestore(storeName, localData).catch(() => {})

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

export function getFirestorePermissionDeniedStores() {
  return Array.from(permissionDeniedStores)
}

export default { startFirestoreSync }
