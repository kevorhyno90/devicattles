/**
 * Notification & Reminder System
 * Handles browser notifications, scheduled reminders, and alert management
 * Fully offline-capable with localStorage persistence
 */

const NOTIFICATIONS_KEY = 'devinsfarm:notifications';
const SETTINGS_KEY = 'devinsfarm:notification:settings';
const REMINDERS_KEY = 'devinsfarm:reminders';

// Default notification settings
const DEFAULT_SETTINGS = {
  enabled: true,
  treatmentReminders: true,
  breedingReminders: true,
  taskReminders: true,
  inventoryAlerts: true,
  healthAlerts: true,
  reminderLeadTime: 24, // hours before event
  lowInventoryThreshold: 10, // units
  criticalInventoryThreshold: 5, // units
  soundEnabled: true
};

// --- Web Audio API Management ---
let audioContext = null;
let isAudioInitialized = false;

function getAudioContext() {
  if (!audioContext && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function resumeAudio() {
  const context = getAudioContext();
  if (context && context.state === 'suspended') {
    context.resume().catch(err => console.error("Error resuming AudioContext:", err));
  }
}

export function initializeAudio() {
  if (isAudioInitialized || typeof window === 'undefined') {
    return;
  }
  const events = ['click', 'touchend', 'keydown', 'mousedown'];
  const resumeHandler = () => {
    resumeAudio();
    events.forEach(event => document.body.removeEventListener(event, resumeHandler));
    isAudioInitialized = true;
  };
  events.forEach(event => {
    document.body.addEventListener(event, resumeHandler, { once: true, capture: true });
  });
}
// Check whether an existing AudioContext is suspended (without creating a new one)
export function isAudioSuspended() {
  try {
    return !!audioContext && audioContext.state === 'suspended'
  } catch (e) {
    return false
  }
}

// Attempt to enable audio immediately (called after a user gesture)
export async function enableAudioNow() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    isAudioInitialized = true;
    return ctx.state === 'running';
  } catch (e) {
    console.warn('enableAudioNow failed:', e);
    return false;
  }
}
// --- End Audio API Management ---


// Notification types
export const NOTIFICATION_TYPES = {
  TREATMENT: 'treatment',
  BREEDING: 'breeding',
  TASK: 'task',
  INVENTORY: 'inventory',
  HEALTH: 'health',
  GENERAL: 'general'
};

// Notification priorities
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Request notification permission from browser
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.info('ℹ️ Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.info('ℹ️ Notification permission already denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    }
    return false;
  } catch (error) {
    console.info('ℹ️ Notification request not available in this environment');
    return false;
  }
}

/**
 * Check if notifications are supported and permitted
 */
export function canShowNotifications() {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Get notification settings
 */
export function getNotificationSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading notification settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save notification settings
 */
export function saveNotificationSettings(settings) {
  try {
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return settings;
  }
}

/**
 * Show a browser notification
 */
export function showNotification(title, options = {}) {
  const settings = getNotificationSettings();
  
  if (!settings.enabled || !canShowNotifications()) {
    // Store as in-app notification instead
    addInAppNotification(title, options);
    return null;
  }

  const notification = new Notification(title, {
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    requireInteraction: options.priority === PRIORITIES.URGENT,
    ...options
  });

  // Store in history
  addInAppNotification(title, options);

  // Play sound if enabled
  if (settings.soundEnabled) {
    playNotificationSound();
  }

  return notification;
}

/**
 * Add in-app notification (for notification center/history)
 */
export function addInAppNotification(title, options = {}) {
  try {
    const notifications = getInAppNotifications();
    const notification = {
      id: Date.now() + Math.random(),
      title,
      body: options.body || '',
      type: options.type || NOTIFICATION_TYPES.GENERAL,
      priority: options.priority || PRIORITIES.MEDIUM,
      timestamp: new Date().toISOString(),
      read: false,
      data: options.data || {}
    };
    
    notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.splice(100);
    }
    
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
    
    return notification;
  } catch (error) {
    console.error('Error adding notification:', error);
    return null;
  }
}

/**
 * Get all in-app notifications
 */
export function getInAppNotifications() {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export function getUnreadCount() {
  const notifications = getInAppNotifications();
  return notifications.filter(n => !n.read).length;
}

/**
 * Mark notification as read
 */
export function markAsRead(notificationId) {
  try {
    const notifications = getInAppNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return null;
  }
}

/**
 * Mark all notifications as read
 */
export function markAllAsRead() {
  try {
    const notifications = getInAppNotifications();
    notifications.forEach(n => n.read = true);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
}

/**
 * Clear all notifications
 */
export function clearAllNotifications() {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return false;
  }
}

/**
 * Delete a specific notification
 */
export function deleteNotification(notificationId) {
  try {
    const notifications = getInAppNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  const context = getAudioContext();
  if (!context) return;

  // If suspended, try to resume silently. If resume fails, skip sound.
  if (context.state === 'suspended') {
    try {
      // Attempt to resume; if it succeeds, continue to play sound.
      // If it fails (common without user gesture), silently return.
      const resumed = context.resume();
      if (!resumed || typeof resumed.then !== 'function') return;
      // Wait a short time for resume to take effect
      // If resume fails, the .catch will handle it and we won't play.
      // eslint-disable-next-line no-unused-vars
      return resumed.then(() => {
        try {
          // playback after successful resume
        } catch (e) {}
      }).catch(() => {});
    } catch (e) {
      return;
    }
  }

    try {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
}


// ============================================
// SCHEDULED REMINDERS
// ============================================

/**
 * Get all scheduled reminders
 */
export function getReminders() {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
}

/**
 * Schedule a reminder
 */
export function scheduleReminder(reminder) {
  try {
    const reminders = getReminders();
    const newReminder = {
      id: Date.now() + Math.random(),
      type: reminder.type,
      title: reminder.title,
      body: reminder.body || '',
      dueDate: reminder.dueDate,
      entityId: reminder.entityId || null,
      entityType: reminder.entityType || null,
      priority: reminder.priority || PRIORITIES.MEDIUM,
      notified: false,
      dismissed: false,
      created: new Date().toISOString()
    };
    
    reminders.push(newReminder);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    
    return newReminder;
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return null;
  }
}

/**
 * Dismiss a reminder
 */
export function dismissReminder(reminderId) {
  try {
    const reminders = getReminders();
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.dismissed = true;
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    }
    return reminder;
  } catch (error) {
    console.error('Error dismissing reminder:', error);
    return null;
  }
}

/**
 * Delete a reminder
 */
export function deleteReminder(reminderId) {
  try {
    const reminders = getReminders();
    const filtered = reminders.filter(r => r.id !== reminderId);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return false;
  }
}

/**
 * Check for due reminders and notify
 */
export function checkDueReminders() {
  const settings = getNotificationSettings();
  if (!settings.enabled) return [];

  const reminders = getReminders();
  const now = new Date();
  const leadTime = settings.reminderLeadTime * 60 * 60 * 1000; // convert hours to ms
  
  const dueReminders = reminders.filter(reminder => {
    if (reminder.notified || reminder.dismissed) return false;
    
    const dueDate = new Date(reminder.dueDate);
    const timeDiff = dueDate - now;
    
    // Notify if within lead time or overdue
    return timeDiff <= leadTime;
  });

  dueReminders.forEach(reminder => {
    const dueDate = new Date(reminder.dueDate);
    const isOverdue = dueDate < now;
    
    showNotification(
      isOverdue ? `⚠️ OVERDUE: ${reminder.title}` : `🔔 Reminder: ${reminder.title}`,
      {
        body: reminder.body,
        type: reminder.type,
        priority: isOverdue ? PRIORITIES.URGENT : reminder.priority,
        data: { reminderId: reminder.id, entityId: reminder.entityId, entityType: reminder.entityType }
      }
    );
    
    // Mark as notified
    reminder.notified = true;
  });

  if (dueReminders.length > 0) {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  }

  return dueReminders;
}

/**
 * Get upcoming reminders (within next 7 days)
 */
export function getUpcomingReminders(days = 7) {
  const reminders = getReminders();
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return reminders
    .filter(r => !r.dismissed && new Date(r.dueDate) <= futureDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

/**
 * Get overdue reminders
 */
export function getOverdueReminders() {
  const reminders = getReminders();
  const now = new Date();
  
  return reminders
    .filter(r => !r.dismissed && new Date(r.dueDate) < now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

// ============================================
// AUTO-CHECK SYSTEM
// ============================================

/**
 * Start automatic reminder checking (singleton)
 */
let reminderCheckerIntervalId = null;
export function startReminderChecker() {
  // Prevent multiple intervals
  if (reminderCheckerIntervalId !== null) {
    return reminderCheckerIntervalId;
  }
  // Check every 5 minutes
  reminderCheckerIntervalId = setInterval(() => {
    checkDueReminders();
  }, 5 * 60 * 1000);
  // Initial check
  checkDueReminders();
  return reminderCheckerIntervalId;
}

/**
 * Stop automatic reminder checking
 */
export function stopReminderChecker() {
  if (reminderCheckerIntervalId !== null) {
    clearInterval(reminderCheckerIntervalId);
    reminderCheckerIntervalId = null;
  }
}
