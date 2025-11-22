// Offline Sync Queue Management
// Queues operations while offline and syncs when connection returns

const SYNC_QUEUE_KEY = 'devinsfarm:offline:syncqueue'
const OFFLINE_STATE_KEY = 'devinsfarm:offline:state'

// Queue operations while offline
export function queueOfflineOperation(operation) {
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
    queue.push({
      ...operation,
      timestamp: Date.now(),
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    })
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
    return true
  } catch (error) {
    console.error('Failed to queue offline operation:', error)
    return false
  }
}

// Get all queued operations
export function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

// Clear queue after successful sync
export function clearOfflineQueue() {
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY)
    return true
  } catch {
    return false
  }
}

// Remove specific operation from queue
export function removeQueuedOperation(operationId) {
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
    const filtered = queue.filter(op => op.id !== operationId)
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered))
    return true
  } catch {
    return false
  }
}

// Set offline state
export function setOfflineState(isOffline) {
  try {
    localStorage.setItem(OFFLINE_STATE_KEY, JSON.stringify({
      isOffline,
      timestamp: Date.now()
    }))
    return true
  } catch {
    return false
  }
}

// Get offline state
export function getOfflineState() {
  try {
    const state = JSON.parse(localStorage.getItem(OFFLINE_STATE_KEY) || '{}')
    return state.isOffline || false
  } catch {
    return false
  }
}

// Sync queue with server (can be called when connection returns)
export async function syncOfflineQueue() {
  const queue = getOfflineQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const operation of queue) {
    try {
      // Operations are stored locally - no actual server sync yet
      // In a future Firebase integration, this would push to server
      synced++
    } catch (error) {
      console.error('Failed to sync operation:', operation.id, error)
      failed++
    }
  }

  if (synced > 0) {
    clearOfflineQueue()
  }

  return { synced, failed }
}

// Listen for online/offline events
export function setupOfflineListener(callback) {
  const handleOnline = () => {
    setOfflineState(false)
    callback?.(false)
  }

  const handleOffline = () => {
    setOfflineState(true)
    callback?.(true)
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Check initial state
  const isCurrentlyOffline = !navigator.onLine
  setOfflineState(isCurrentlyOffline)
  callback?.(isCurrentlyOffline)

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// Get queue statistics
export function getQueueStats() {
  const queue = getOfflineQueue()
  const grouped = {
    animals: 0,
    tasks: 0,
    finance: 0,
    other: 0
  }

  queue.forEach(op => {
    if (op.entity === 'animals') grouped.animals++
    else if (op.entity === 'tasks') grouped.tasks++
    else if (op.entity === 'finance') grouped.finance++
    else grouped.other++
  })

  return {
    total: queue.length,
    grouped,
    oldest: queue[0]?.timestamp || null,
    newest: queue[queue.length - 1]?.timestamp || null
  }
}
