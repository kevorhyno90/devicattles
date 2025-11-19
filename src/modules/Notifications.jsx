import React, { useState, useEffect } from 'react'
import { logAction, ACTIONS, ENTITIES } from '../lib/audit'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [settings, setSettings] = useState({
    enabled: true,
    treatments: true,
    breeding: true,
    tasks: true,
    inventory: true,
    dailyReminder: true,
    reminderTime: '08:00'
  })
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    loadSettings()
    checkPermission()
    generateNotifications()
    logAction(ACTIONS.VIEW, ENTITIES.OTHER, null, 'Viewed notifications')
  }, [])

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('devinsfarm:notification:settings')
      if (saved) {
        setSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  }

  const saveSettings = (newSettings) => {
    try {
      localStorage.setItem('devinsfarm:notification:settings', JSON.stringify(newSettings))
      setSettings(newSettings)
      logAction(ACTIONS.UPDATE, ENTITIES.OTHER, null, 'Updated notification settings')
    } catch (error) {
      console.error('Error saving notification settings:', error)
    }
  }

  const checkPermission = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        new Notification('Devin\'s Farm', {
          body: 'Notifications enabled! You\'ll receive reminders for important farm tasks.',
          icon: '/icon-192x192.png'
        })
      }
    }
  }

  const generateNotifications = () => {
    const notifs = []
    const today = new Date()
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    try {
      // Load data
      const treatments = JSON.parse(localStorage.getItem('devinsfarm:treatments') || '[]')
      const breeding = JSON.parse(localStorage.getItem('devinsfarm:breeding') || '[]')
      const tasks = JSON.parse(localStorage.getItem('devinsfarm:tasks') || '[]')
      const inventory = JSON.parse(localStorage.getItem('devinsfarm:inventory') || '[]')
      const animals = JSON.parse(localStorage.getItem('devinsfarm:animals') || '[]')

      // Treatment reminders
      if (settings.treatments) {
        treatments.forEach(treatment => {
          if (treatment.nextDue) {
            const dueDate = new Date(treatment.nextDue)
            const animal = animals.find(a => a.id === treatment.animalId)
            const animalName = animal ? animal.name : `Animal #${treatment.animalId}`
            
            if (dueDate < today) {
              notifs.push({
                id: `treatment-${treatment.id}`,
                type: 'treatment',
                priority: 'high',
                title: '🚨 Overdue Treatment',
                message: `${animalName} - ${treatment.type} treatment was due on ${dueDate.toLocaleDateString()}`,
                dueDate: treatment.nextDue,
                action: 'View Treatments'
              })
            } else if (dueDate <= sevenDaysFromNow) {
              notifs.push({
                id: `treatment-${treatment.id}`,
                type: 'treatment',
                priority: 'medium',
                title: '💉 Upcoming Treatment',
                message: `${animalName} - ${treatment.type} treatment due on ${dueDate.toLocaleDateString()}`,
                dueDate: treatment.nextDue,
                action: 'View Treatments'
              })
            }
          }
        })
      }

      // Breeding reminders
      if (settings.breeding) {
        breeding.forEach(record => {
          if (record.expectedDueDate && (record.status === 'pregnant' || record.status === 'confirmed')) {
            const dueDate = new Date(record.expectedDueDate)
            const animal = animals.find(a => a.id === record.femaleId)
            const animalName = animal ? animal.name : `Animal #${record.femaleId}`
            
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
            
            if (daysUntilDue <= 0) {
              notifs.push({
                id: `breeding-${record.id}`,
                type: 'breeding',
                priority: 'high',
                title: '🐄 Birth Due/Overdue',
                message: `${animalName} is due or overdue for birth (Expected: ${dueDate.toLocaleDateString()})`,
                dueDate: record.expectedDueDate,
                action: 'View Breeding'
              })
            } else if (daysUntilDue <= 14) {
              notifs.push({
                id: `breeding-${record.id}`,
                type: 'breeding',
                priority: 'medium',
                title: '🤰 Birth Approaching',
                message: `${animalName} expected to give birth in ${daysUntilDue} days (${dueDate.toLocaleDateString()})`,
                dueDate: record.expectedDueDate,
                action: 'View Breeding'
              })
            }
          }
        })
      }

      // Task reminders
      if (settings.tasks) {
        tasks.forEach(task => {
          if (task.status !== 'completed' && task.dueDate) {
            const dueDate = new Date(task.dueDate)
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
            
            if (dueDate < today && dueDate.toDateString() !== today.toDateString()) {
              notifs.push({
                id: `task-${task.id}`,
                type: 'task',
                priority: 'high',
                title: '📅 Overdue Task',
                message: `${task.title} was due on ${dueDate.toLocaleDateString()}`,
                dueDate: task.dueDate,
                action: 'View Tasks'
              })
            } else if (dueDate.toDateString() === today.toDateString()) {
              notifs.push({
                id: `task-${task.id}`,
                type: 'task',
                priority: 'high',
                title: '⏰ Task Due Today',
                message: `${task.title} is due today`,
                dueDate: task.dueDate,
                action: 'View Tasks'
              })
            } else if (daysUntilDue <= 3) {
              notifs.push({
                id: `task-${task.id}`,
                type: 'task',
                priority: 'medium',
                title: '📝 Task Due Soon',
                message: `${task.title} is due in ${daysUntilDue} days`,
                dueDate: task.dueDate,
                action: 'View Tasks'
              })
            }
          }
        })
      }

      // Inventory alerts
      if (settings.inventory) {
        inventory.forEach(item => {
          const minStock = parseFloat(item.minStock) || 0
          const quantity = parseFloat(item.quantity) || 0
          
          if (minStock > 0 && quantity <= minStock) {
            const severity = quantity === 0 ? 'high' : 'medium'
            notifs.push({
              id: `inventory-${item.id}`,
              type: 'inventory',
              priority: severity,
              title: quantity === 0 ? '🚫 Out of Stock' : '📦 Low Stock',
              message: `${item.name}: ${quantity} ${item.unit} (Min: ${minStock} ${item.unit})`,
              action: 'View Inventory'
            })
          }
        })
      }

      // Sort by priority and date
      notifs.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate)
        }
        return 0
      })

      setNotifications(notifs)

      // Show browser notification for high priority items (if permission granted)
      if (permission === 'granted' && settings.enabled) {
        const highPriority = notifs.filter(n => n.priority === 'high')
        if (highPriority.length > 0 && shouldShowDailyNotification()) {
          new Notification('Devin\'s Farm - Urgent', {
            body: `You have ${highPriority.length} urgent notification(s)`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'farm-urgent'
          })
          markDailyNotificationShown()
        }
      }
    } catch (error) {
      console.error('Error generating notifications:', error)
    }
  }

  const shouldShowDailyNotification = () => {
    const lastShown = localStorage.getItem('devinsfarm:notification:lastShown')
    if (!lastShown) return true
    
    const lastDate = new Date(lastShown)
    const today = new Date()
    return lastDate.toDateString() !== today.toDateString()
  }

  const markDailyNotificationShown = () => {
    localStorage.setItem('devinsfarm:notification:lastShown', new Date().toISOString())
  }

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleAction = (notification) => {
    const actionMap = {
      'View Treatments': '#health',
      'View Breeding': '#animals',
      'View Tasks': '#tasks',
      'View Inventory': '#inventory'
    }
    const hash = actionMap[notification.action]
    if (hash) {
      window.location.hash = hash
    }
  }

  const clearAll = () => {
    setNotifications([])
    logAction(ACTIONS.DELETE, ENTITIES.OTHER, null, 'Cleared all notifications')
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🚨'
      case 'medium': return '⚠️'
      case 'low': return 'ℹ️'
      default: return '📢'
    }
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>🔔 Notifications & Reminders</h1>
        <div className="header-actions">
          <button onClick={generateNotifications} className="refresh-btn">🔄 Refresh</button>
          {notifications.length > 0 && (
            <button onClick={clearAll} className="clear-btn">🗑️ Clear All</button>
          )}
        </div>
      </div>

      {/* Notification Permission */}
      {permission !== 'granted' && (
        <div className="permission-banner">
          <p>📱 Enable browser notifications to receive reminders even when the app is closed.</p>
          <button onClick={requestPermission} className="enable-btn">Enable Notifications</button>
        </div>
      )}

      {/* Summary */}
      <div className="notification-summary">
        <div className="summary-card high">
          <div className="summary-count">{notifications.filter(n => n.priority === 'high').length}</div>
          <div className="summary-label">Urgent</div>
        </div>
        <div className="summary-card medium">
          <div className="summary-count">{notifications.filter(n => n.priority === 'medium').length}</div>
          <div className="summary-label">Important</div>
        </div>
        <div className="summary-card low">
          <div className="summary-count">{notifications.filter(n => n.priority === 'low').length}</div>
          <div className="summary-label">Info</div>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="no-notifications">
          <div className="empty-icon">✅</div>
          <h2>All Caught Up!</h2>
          <p>No pending notifications or reminders at this time.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notif => (
            <div key={notif.id} className={`notification-item ${notif.priority}`}>
              <div className="notification-icon">{getPriorityIcon(notif.priority)}</div>
              <div className="notification-content">
                <h3>{notif.title}</h3>
                <p>{notif.message}</p>
                {notif.dueDate && (
                  <span className="notification-date">
                    📅 {new Date(notif.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="notification-actions">
                <button onClick={() => handleAction(notif)} className="action-btn">
                  {notif.action}
                </button>
                <button onClick={() => dismissNotification(notif.id)} className="dismiss-btn">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      <div className="notification-settings">
        <h2>⚙️ Notification Settings</h2>
        <div className="settings-grid">
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => saveSettings({ ...settings, enabled: e.target.checked })}
            />
            <span>Enable Notifications</span>
          </label>
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.treatments}
              onChange={(e) => saveSettings({ ...settings, treatments: e.target.checked })}
            />
            <span>Treatment Reminders</span>
          </label>
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.breeding}
              onChange={(e) => saveSettings({ ...settings, breeding: e.target.checked })}
            />
            <span>Breeding Due Dates</span>
          </label>
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.tasks}
              onChange={(e) => saveSettings({ ...settings, tasks: e.target.checked })}
            />
            <span>Task Deadlines</span>
          </label>
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.inventory}
              onChange={(e) => saveSettings({ ...settings, inventory: e.target.checked })}
            />
            <span>Low Inventory Alerts</span>
          </label>
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.dailyReminder}
              onChange={(e) => saveSettings({ ...settings, dailyReminder: e.target.checked })}
            />
            <span>Daily Summary (once per day)</span>
          </label>
        </div>
      </div>
    </div>
  )
}
