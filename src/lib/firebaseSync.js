import { db, isFirebaseConfigured } from './firebase'
import { collection, doc, getDocs, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { STORES, loadData, saveData } from './storage'

// Prevent duplicate setup
let isStarted = false
const applyingSet = new Set()

// Expose flags/hooks for storage.js
if (typeof window !== 'undefined') {
  window.__firestoreSyncApplying = applyingSet
}

/**
 * Push local store data to Firestore (replace remote with local snapshot)
 */
async function pushStoreToFirestore(storeName, localData = []) {
  if (!db || !isFirebaseConfigured()) return
  const colRef = collection(db, storeName)
  const batch = writeBatch(db)

  // Index local by id
  const localById = new Map()
  localData.forEach(item => {
    const id = item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    localById.set(id, { ...item, id, updatedAt: item.updatedAt || new Date().toISOString() })
  })

  // Fetch existing docs to detect deletions
  const existingSnap = await getDocs(colRef)
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
      const localData = loadData(storeName, []) || []
      pushStoreToFirestore(storeName, localData).catch(() => {})

      const colRef = collection(db, storeName)
      onSnapshot(colRef, snapshot => {
        applyRemoteToLocal(storeName, snapshot.docs).catch(err => {
          console.warn(`Firestore sync apply failed for ${storeName}:`, err)
        })
      }, err => {
        console.warn(`Firestore listener failed for ${storeName}:`, err)
      })
    } catch (err) {
      console.warn(`Firestore sync skipped for ${storeName}:`, err)
    }
  }
}

export default { startFirestoreSync }
