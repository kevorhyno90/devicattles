/**
 * Firebase Authentication Integration
 * 
 * Integrates Firebase Auth with existing localStorage auth system
 * Allows gradual migration from localStorage to Firebase
 */

import { auth, isFirebaseConfigured } from './firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'

// Check if Firebase Auth is available
export function isFirebaseAuthAvailable() {
  return isFirebaseConfigured() && auth !== null
}

/**
 * Login with Firebase
 */
export async function loginWithFirebase(email, password) {
  if (!isFirebaseAuthAvailable()) {
    return { success: false, error: 'Firebase not configured' }
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    const session = {
      userId: user.uid,
      username: user.email.split('@')[0],
      name: user.displayName || user.email,
      role: 'MANAGER', // Default role - can be stored in Firestore
      email: user.email,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      firebaseUser: true
    }

    // Store in localStorage for compatibility
    localStorage.setItem('devinsfarm:auth', JSON.stringify(session))

    return { success: true, user: session }
  } catch (error) {
    console.error('Firebase login error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Register with Firebase
 */
export async function registerWithFirebase(email, password, displayName) {
  if (!isFirebaseAuthAvailable()) {
    return { success: false, error: 'Firebase not configured' }
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update profile with display name
    if (displayName) {
      await updateProfile(user, { displayName })
    }

    const session = {
      userId: user.uid,
      username: email.split('@')[0],
      name: displayName || email,
      role: 'MANAGER',
      email: user.email,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      firebaseUser: true
    }

    localStorage.setItem('devinsfarm:auth', JSON.stringify(session))

    return { success: true, user: session }
  } catch (error) {
    console.error('Firebase registration error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Logout from Firebase
 */
export async function logoutFromFirebase() {
  if (!isFirebaseAuthAvailable()) {
    return { success: false, error: 'Firebase not configured' }
  }

  try {
    await signOut(auth)
    localStorage.removeItem('devinsfarm:auth')
    return { success: true }
  } catch (error) {
    console.error('Firebase logout error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Reset password with Firebase
 */
export async function resetPasswordWithFirebase(email) {
  if (!isFirebaseAuthAvailable()) {
    return { success: false, error: 'Firebase not configured' }
  }

  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true, message: 'Password reset email sent' }
  } catch (error) {
    console.error('Firebase password reset error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen for auth state changes
 */
export function onFirebaseAuthChange(callback) {
  if (!isFirebaseAuthAvailable()) {
    return () => {}
  }

  return onAuthStateChanged(auth, (user) => {
    if (user) {
      const session = {
        userId: user.uid,
        username: user.email.split('@')[0],
        name: user.displayName || user.email,
        role: 'MANAGER',
        email: user.email,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        firebaseUser: true
      }
      callback(session)
    } else {
      callback(null)
    }
  })
}

/**
 * Get current Firebase user
 */
export function getCurrentFirebaseUser() {
  if (!isFirebaseAuthAvailable()) {
    return null
  }
  return auth.currentUser
}

/**
 * Check if current user is Firebase user
 */
export function isFirebaseUser() {
  try {
    const session = JSON.parse(localStorage.getItem('devinsfarm:auth') || 'null')
    return session && session.firebaseUser === true
  } catch {
    return false
  }
}

export default {
  isFirebaseAuthAvailable,
  loginWithFirebase,
  registerWithFirebase,
  logoutFromFirebase,
  resetPasswordWithFirebase,
  onFirebaseAuthChange,
  getCurrentFirebaseUser,
  isFirebaseUser
}
