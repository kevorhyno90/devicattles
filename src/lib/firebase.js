/**
 * Firebase Configuration and Initialization
 * 
 * Setup Instructions:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (or use existing)
 * 3. Add a Web app to your project
 * 4. Copy the Firebase config object
 * 5. Replace the placeholder config below with your actual config
 * 6. Enable Firestore Database in Firebase Console
 * 7. Enable Authentication > Email/Password in Firebase Console
 */

import { initializeApp, getApps } from 'firebase/app'
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache, setLogLevel } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics'
import { getMessaging, isSupported as messagingIsSupported } from 'firebase/messaging'

// Firebase configuration - CONFIGURED
// Project: devicattlesgit-35265529-12687
const firebaseConfig = {
  apiKey: "AIzaSyD9Ll4vI6CTBcMOfREMJ96Drev5OskopKU",
  authDomain: "devicattlesgit-35265529-12687.firebaseapp.com",
  projectId: "devicattlesgit-35265529-12687",
  storageBucket: "devicattlesgit-35265529-12687.firebasestorage.app",
  messagingSenderId: "454358426628",
  appId: "1:454358426628:web:a064f71cb25a1474618151",
  measurementId: "G-09H4N1HQN0"
}

// Check if Firebase is configured
export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && 
         firebaseConfig.projectId !== "YOUR_PROJECT_ID"
}

// Initialize Firebase (singleton pattern to prevent re-initialization)
let app = null
let db = null
let auth = null
let analytics = null
let messaging = null
let isInitialized = false
let initInProgress = false

// Provide a programmatic initializer so firebase can be started explicitly
export async function initFirebase(options = {}) {
  const { force = false } = options
  if (isInitialized && !force) return
  if (initInProgress) return
  initInProgress = true

  try {
    if (!isFirebaseConfigured()) return

    // Initialize only if not already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED })
        })
        try { setLogLevel && setLogLevel('error') } catch (e) {}
      } catch (firestoreError) {
        db = getFirestore(app)
        try { setLogLevel && setLogLevel('error') } catch (e) {}
      }
    } else {
      app = getApps()[0]
      db = getFirestore(app)
      try { setLogLevel && setLogLevel('error') } catch (e) {}
    }

    auth = getAuth(app)

    if (!isDev) {
      analyticsIsSupported().then(supported => {
        if (supported) {
          try { analytics = getAnalytics(app) } catch (err) { analytics = null }
        }
      }).catch(() => { analytics = null })
    }

    if (!messaging) {
      messagingIsSupported().then(supported => {
        if (supported) {
          try { messaging = getMessaging(app) } catch (err) { messaging = null }
        }
      }).catch(() => { messaging = null })
    }

    isInitialized = true
  } catch (error) {
    console.error('❌ Firebase initialization error:', error)
    app = null; db = null; auth = null; analytics = null; messaging = null; isInitialized = false
  } finally {
    initInProgress = false
  }
}

// Environment detection
const isDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname.includes('github.dev') ||
  window.location.hostname.includes('githubpreview.dev')
);

// By default, avoid initializing Firebase automatically during development
// to prevent dev-server restarts or HMR issues caused by SDK initialization.
// Set `VITE_ENABLE_FIREBASE=true` in your dev env to opt-in to auto-init.
try {
  if (isFirebaseConfigured()) {
    const enableAutoInit = !isDev || !!import.meta.env.VITE_ENABLE_FIREBASE
    if (enableAutoInit) {
      // initialize now
      initFirebase().catch(() => {})
    } else {
      if (!window.__firebaseConfigLogged) {
        console.info('ℹ️ Firebase auto-init disabled in dev. Call initFirebase() to enable.')
        window.__firebaseConfigLogged = true
      }
    }
  } else {
    if (!window.__firebaseConfigLogged) {
      console.info('ℹ️ Firebase not configured. Running in local-only mode.');
      window.__firebaseConfigLogged = true;
    }
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error)
}

export { app, db, auth, analytics, messaging, isInitialized }
export default { app, db, auth, analytics, messaging, isConfigured: isFirebaseConfigured, initFirebase }
