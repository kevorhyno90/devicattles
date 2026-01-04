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
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache } from 'firebase/firestore'
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

// Environment detection
const isDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname.includes('github.dev') ||
  window.location.hostname.includes('githubpreview.dev')
);

try {
  if (isFirebaseConfigured()) {
    // Check if Firebase is already initialized (prevents HMR errors)
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED })
        })
      } catch (firestoreError) {
        // Firestore already initialized, use getFirestore
        db = getFirestore(app)
      }
    } else {
      // Use existing app instance
      app = getApps()[0]
      db = getFirestore(app)
    }
    
    auth = getAuth(app)
    
    // Skip Analytics completely in development (no cookies, no warnings)
    if (!isDev) {
      analyticsIsSupported().then(supported => {
        if (supported) {
          try {
            analytics = getAnalytics(app);
          } catch (err) {
            analytics = null;
          }
        }
      }).catch(() => {
        analytics = null;
      });
    }
    
    // Initialize Messaging only if supported and only once
    if (!messaging) {
      messagingIsSupported().then(supported => {
        if (supported) {
          try {
            messaging = getMessaging(app);
          } catch (err) {
            messaging = null;
          }
        }
      }).catch(() => {
        messaging = null;
      });
    }
    
    isInitialized = true
  } else {
    // Log once on first check - not a warning since it's expected in local/demo mode
    if (!window.__firebaseConfigLogged) {
      console.info('ℹ️ Firebase not configured. Running in local-only mode.');
      window.__firebaseConfigLogged = true;
    }
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error)
  // Ensure variables are set even on error
  app = null
  db = null
  auth = null
  isInitialized = false
}

export { app, db, auth, analytics, messaging }
export default { app, db, auth, analytics, messaging, isConfigured: isFirebaseConfigured }
