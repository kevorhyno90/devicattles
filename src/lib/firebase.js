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

import { initializeApp } from 'firebase/app'
import { initializeFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Firebase configuration - CONFIGURED
// Project: devinsfarm-2025
const firebaseConfig = {
  apiKey: "AIzaSyC3ZH_roI3O4e8O0TEcLbgJCuVI64t8b4c",
  authDomain: "devinsfarm-2025.firebaseapp.com",
  projectId: "devinsfarm-2025",
  storageBucket: "devinsfarm-2025.firebasestorage.app",
  messagingSenderId: "603947883430",
  appId: "1:603947883430:web:ac52cd8333bc7603c14d67",
  measurementId: "G-T8H86QB318"
}

// Check if Firebase is configured
export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && 
         firebaseConfig.projectId !== "YOUR_PROJECT_ID"
}

// Initialize Firebase
let app = null
let db = null
let auth = null

try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig)
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED })
    })
    auth = getAuth(app)
    
    console.log('✅ Firebase initialized successfully with persistence')
  } else {
    // Log once on first check - not a warning since it's expected in local/demo mode
    if (!window.__firebaseConfigLogged) {
      console.info('ℹ️ Firebase not configured. Running in local-only mode.');
      window.__firebaseConfigLogged = true;
    }
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error)
}

export { app, db, auth }
export default { app, db, auth, isConfigured: isFirebaseConfigured }
