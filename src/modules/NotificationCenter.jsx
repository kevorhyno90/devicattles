import React, { useState, useEffect } from 'react'
import {
  getInAppNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  canShowNotifications,
  NOTIFICATION_TYPES,
  PRIORITIES,
  getReminders,
  getUpcomingReminders,
  getOverdueReminders,
  dismissReminder,
  deleteReminder
} from '../lib/notifications'

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [reminders, setReminders] = useState([])
  const [settings, setSettings] = useState(getNotificationSettings())
  const [filter, setFilter] = useState('all')
  const [showSettings, setShowSettings] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    loadReminders()
    
    // Listen for new notifications
    const handleNewNotification = () => {
      loadNotifications()
    }
    
    window.addEventListener('newNotification', handleNewNotification)
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification)
    }
  }, [])

  const loadNotifications = () => {
    const allNotifications = getInAppNotifications()
    setNotifications(allNotifications)
    setUnreadCount(getUnreadCount())
  }

  const loadReminders = () => {
    const allReminders = getReminders()
    setReminders(allReminders)
  }

  const handleMarkAsRead = (id) => {
    markAsRead(id)
    loadNotifications()
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
    loadNotifications()
  }

  const handleDelete = (id) => {
    if (confirm('Delete this notification?')) {
      deleteNotification(id)
      loadNotifications()
    }
  }

  const handleClearAll = () => {
    if (confirm('Clear all notifications?')) {
      clearAllNotifications()
      loadNotifications()
    }
  }

  const handleDismissReminder = (id) => {
    dismissReminder(id)
    loadReminders()
  }

  const handleDeleteReminder = (id) => {
    if (confirm('Delete this reminder?')) {
      deleteReminder(id)
      loadReminders()
    }
  }

  const handleSettingsChange = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    saveNotificationSettings(newSettings)
  }

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      alert('✅ Browser notifications enabled!')
    } else {
      alert('❌ Notification permission denied. You can still see in-app notifications.')
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'all') return true
    return n.type === filter
  })

  const upcomingReminders = getUpcomingReminders()
  const overdueReminders = getOverdueReminders()

  const getPriorityColor = (priority) => {
    switch (priority) {
      case PRIORITIES.URGENT: return '#ef4444'
      case PRIORITIES.HIGH: return '#f59e0b'
      case PRIORITIES.MEDIUM: return '#3b82f6'
      case PRIORITIES.LOW: return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.TREATMENT: return '💉'
      case NOTIFICATION_TYPES.BREEDING: return '🤰'
      case NOTIFICATION_TYPES.TASK: return '✅'
      case NOTIFICATION_TYPES.INVENTORY: return '📦'
      case NOTIFICATION_TYPES.HEALTH: return '🏥'
      default: return '🔔'
    }
  }

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h1>🔔 Notifications</h1>
        <div className="notification-header-actions">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="btn-secondary">
              Mark All Read ({unreadCount})
            </button>
          )}
          <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary">
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <h3>Notification Settings</h3>
          
          {!canShowNotifications() && (
            <div className="alert-bar info">
              <p>Browser notifications are disabled.</p>
              <button onClick={handleRequestPermission} className="btn-primary">
                Enable Browser Notifications
              </button>
            </div>
          )}

          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                id="notif-enabled"
                name="notif-enabled"
                checked={settings.enabled}
                onChange={e => handleSettingsChange('enabled', e.target.checked)}
              />
              Enable Notifications
            </label>
          </div>

          <div className="settings-group">
            <h4>Notification Types</h4>
            <label>
              <input
                type="checkbox"
                id="notif-treatments"
                name="notif-treatments"
                checked={settings.treatmentReminders}
                onChange={e => handleSettingsChange('treatmentReminders', e.target.checked)}
              />
              Treatment Reminders
            </label>
            <label>
              <input
                type="checkbox"
                id="notif-breeding"
                name="notif-breeding"
                checked={settings.breedingReminders}
                onChange={e => handleSettingsChange('breedingReminders', e.target.checked)}
              />
              Breeding Due Dates
            </label>
            <label>
              <input
                type="checkbox"
                id="notif-tasks"
                name="notif-tasks"
                checked={settings.taskReminders}
                onChange={e => handleSettingsChange('taskReminders', e.target.checked)}
              />
              Task Deadlines
            </label>
            <label>
              <input
                type="checkbox"
                id="notif-inventory"
                name="notif-inventory"
                checked={settings.inventoryAlerts}
                onChange={e => handleSettingsChange('inventoryAlerts', e.target.checked)}
              />
              Inventory Alerts
            </label>
            <label>
              <input
                type="checkbox"
                id="notif-health"
                name="notif-health"
                checked={settings.healthAlerts}
                onChange={e => handleSettingsChange('healthAlerts', e.target.checked)}
              />
              Health Alerts
            </label>
          </div>

          <div className="settings-group">
            <label htmlFor="notif-leadtime">
              Reminder Lead Time (hours before event):
              <input
                type="number"
                id="notif-leadtime"
                name="notif-leadtime"
                min="1"
                max="168"
                value={settings.reminderLeadTime}
                onChange={e => handleSettingsChange('reminderLeadTime', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                id="notif-sound"
                name="notif-sound"
                checked={settings.soundEnabled}
                onChange={e => handleSettingsChange('soundEnabled', e.target.checked)}
              />
              Sound Enabled
            </label>
          </div>
        </div>
      )}

      {/* Reminders Section */}
      {(upcomingReminders.length > 0 || overdueReminders.length > 0) && (
        <div className="reminders-section">
          <h3>⏰ Reminders</h3>
          
          {overdueReminders.length > 0 && (
            <div className="reminders-group overdue">
              <h4>⚠️ Overdue ({overdueReminders.length})</h4>
              {overdueReminders.map(reminder => (
                <div key={reminder.id} className="reminder-card urgent">
                  <div className="reminder-content">
                    <div className="reminder-title">
                      {getTypeIcon(reminder.type)} {reminder.title}
                    </div>
                    <div className="reminder-body">{reminder.body}</div>
                    <div className="reminder-meta">
                      Due: {new Date(reminder.dueDate).toLocaleString()}
                    </div>
                  </div>
                  <div className="reminder-actions">
                    <button onClick={() => handleDismissReminder(reminder.id)} className="btn-secondary">
                      Dismiss
                    </button>
                    <button onClick={() => handleDeleteReminder(reminder.id)} className="btn-danger">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {upcomingReminders.length > 0 && (
            <div className="reminders-group upcoming">
              <h4>📅 Upcoming ({upcomingReminders.length})</h4>
              {upcomingReminders.slice(0, 5).map(reminder => (
                <div key={reminder.id} className="reminder-card">
                  <div className="reminder-content">
                    <div className="reminder-title">
                      {getTypeIcon(reminder.type)} {reminder.title}
                    </div>
                    <div className="reminder-body">{reminder.body}</div>
                    <div className="reminder-meta">
                      Due: {new Date(reminder.dueDate).toLocaleString()}
                    </div>
                  </div>
                  <div className="reminder-actions">
                    <button onClick={() => handleDismissReminder(reminder.id)} className="btn-secondary">
                      Dismiss
                    </button>
                    <button onClick={() => handleDeleteReminder(reminder.id)} className="btn-danger">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button
          className={filter === 'unread' ? 'active' : ''}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        {Object.values(NOTIFICATION_TYPES).map(type => {
          const count = notifications.filter(n => n.type === type).length
          return count > 0 ? (
            <button
              key={type}
              className={filter === type ? 'active' : ''}
              onClick={() => setFilter(type)}
            >
              {getTypeIcon(type)} {type} ({count})
            </button>
          ) : null
        })}
        {notifications.length > 0 && (
          <button onClick={handleClearAll} className="btn-danger" style={{ marginLeft: 'auto' }}>
            Clear All
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications to display</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-card ${notification.read ? 'read' : 'unread'}`}
              style={{ borderLeftColor: getPriorityColor(notification.priority) }}
            >
              <div className="notification-icon">
                {getTypeIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                {notification.body && (
                  <div className="notification-body">{notification.body}</div>
                )}
                <div className="notification-meta">
                  {new Date(notification.timestamp).toLocaleString()}
                  {notification.priority && (
                    <span className={`priority-badge ${notification.priority}`}>
                      {notification.priority}
                    </span>
                  )}
                </div>
              </div>
              <div className="notification-actions">
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="btn-secondary"
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="btn-danger"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
