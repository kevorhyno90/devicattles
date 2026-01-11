// Simple IndexedDB-backed click/event logger
const DB_NAME = 'devicattles-clicks'
const STORE_NAME = 'clicks'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function recordClick(entityType = 'unknown', entityId = null, action = 'click') {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const rec = { entityType, entityId, action, ts: new Date().toISOString() }
    store.add(rec)
    return tx.complete || new Promise((res) => { tx.oncomplete = res })
  } catch (err) {
    console.warn('recordClick failed', err)
  }
}

export async function getAllClicks() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    return new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('getAllClicks failed', err)
    return []
  }
}

export async function clearAllClicks() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.clear()
    return tx.complete || new Promise((res) => { tx.oncomplete = res })
  } catch (err) {
    console.warn('clearAllClicks failed', err)
  }
}

export async function exportClicks(filename = 'clicks_export.json') {
  try {
    const all = await getAllClicks()
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('exportClicks failed', err)
    alert('Failed to export clicks: ' + (err.message || err))
  }
}
