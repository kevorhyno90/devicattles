// Deprecated shim: `sync.js` moved into `firebaseSync.js`.
// Import the consolidated APIs from `firebaseSync.js` instead.

import firebaseSync from './firebaseSync'

export const initSync = firebaseSync.initSync
export const setSyncEnabled = firebaseSync.setSyncEnabled
export const isSyncEnabled = firebaseSync.isSyncEnabled
export const getSyncStatus = firebaseSync.getSyncStatus
export const syncToFirebase = firebaseSync.syncToFirebase
export const fetchFromFirebase = firebaseSync.fetchFromFirebase
export const startRealtimeSync = firebaseSync.startRealtimeSync
export const stopRealtimeSync = firebaseSync.stopRealtimeSync
export const pushAllToFirebase = firebaseSync.pushAllToFirebase
export const pullAllFromFirebase = firebaseSync.pullAllFromFirebase
export const setupAutoSync = firebaseSync.setupAutoSync
export const onSyncStatusChange = firebaseSync.onSyncStatusChange

export default firebaseSync

