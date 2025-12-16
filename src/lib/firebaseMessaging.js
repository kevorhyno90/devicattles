import { messaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";

// Check if notifications are supported in the current environment
function isNotificationSupported() {
  return (
    'serviceWorker' in navigator &&
    'Notification' in window &&
    window.isSecureContext &&
    messaging !== null &&
    messaging !== undefined
  );
}

export async function requestNotificationPermission() {
  // Early return if notifications not supported
  if (!isNotificationSupported()) {
    // Silence in development/Codespaces to reduce noise
    if (import.meta.env.PROD) {
      console.info('ℹ️ Notifications not supported in this environment');
    }
    return null;
  }
  
  try {
    // Check current permission state first
    if (Notification.permission === 'denied') {
      if (import.meta.env.PROD) {
        console.info('ℹ️ Notification permission already denied');
      }
      return null;
    }
    
    // Only request if permission is 'default'
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return null;
      }
    }
    
    // Get FCM token
    const token = await getToken(messaging, { 
      vapidKey: "BG4uQNeO-WWaHsPHvfFF1m4ojmz6u1HwbYniH4gkKGH1hHYhsPqe_YC-kvLTn6Q-qMbd9VAqvGy7x1hwKLP9roI" 
    });
    if (import.meta.env.PROD) {
      console.log("✅ FCM Token:", token);
    }
    return token;
  } catch (err) {
    // Suppress expected errors in unsupported environments
    if (err.code === 'messaging/unsupported-browser' || 
        err.message?.includes('messaging') ||
        err.message?.includes('not supported')) {
      if (import.meta.env.PROD) {
        console.info('ℹ️ Push messaging not available in this browser/environment');
      }
    } else {
      console.warn('⚠️ FCM setup error:', err.message);
    }
    return null;
  }
}

export function listenForMessages(callback) {
  if (!isNotificationSupported()) {
    return; // Silently skip if not supported
  }
  
  try {
    onMessage(messaging, (payload) => {
      if (import.meta.env.PROD) {
        console.log("📨 FCM Message received:", payload);
      }
      if (callback) callback(payload);
    });
  } catch (err) {
    if (import.meta.env.PROD) {
      console.info('ℹ️ Message listener not available in this environment');
    }
  }
}
