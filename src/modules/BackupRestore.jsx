import React, { useState, useEffect } from 'react'
import { 
  createBackup, 
  restoreFromBackup, 
  getBackupStats, 
  checkBackupReminder,
  updateLastBackupTime 
} from '../lib/backup'
import { logAction, ACTIONS, ENTITIES } from '../lib/audit'

export default function BackupRestore() {
  const [stats, setStats] = useState(null)
  const [backupReminder, setBackupReminder] = useState(null)
  const [restoring, setRestoring] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadStats()
    logAction(ACTIONS.VIEW, ENTITIES.OTHER, null, 'Viewed backup/restore')
  }, [])

  const loadStats = () => {
    const backupStats = getBackupStats()
    const reminder = checkBackupReminder()
    setStats(backupStats)
    setBackupReminder(reminder)
  }

  const handleCreateBackup = async () => {
    try {
      const result = createBackup()
      if (result.success) {
        updateLastBackupTime()
        setMessage({
          type: 'success',
          text: `✅ Backup created successfully! File: ${result.filename} (${(result.size / 1024).toFixed(2)} KB)`
        })
        loadStats()
      } else {
        setMessage({
          type: 'error',
          text: `❌ Backup failed: ${result.error}`
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error creating backup: ${error.message}`
      })
    }
  }

  const handleRestoreBackup = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setRestoring(true)
    setMessage({ type: 'info', text: '⏳ Restoring backup...' })

    try {
      const result = await restoreFromBackup(file, {
        merge: false,
        createBackupFirst: true,
        restoreUsers: false,
        restoreAudit: false
      })

      if (result.success) {
        setMessage({
          type: 'success',
          text: `✅ Backup restored successfully! Restored from ${new Date(result.backupDate).toLocaleString()}`
        })
        loadStats()
        
        // Reload page to reflect changes
        setTimeout(() => {
          if (confirm('Backup restored! Reload page to see changes?')) {
            window.location.reload()
          }
        }, 2000)
      } else if (result.cancelled) {
        setMessage({ type: 'info', text: 'ℹ️ Restore cancelled' })
      } else {
        setMessage({
          type: 'error',
          text: `❌ Restore failed: ${result.error}`
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error restoring backup: ${error.message}`
      })
    } finally {
      setRestoring(false)
      e.target.value = '' // Reset file input
    }
  }

  const handleMergeBackup = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setRestoring(true)
    setMessage({ type: 'info', text: '⏳ Merging backup data...' })

    try {
      const result = await restoreFromBackup(file, {
        merge: true,
        createBackupFirst: true,
        restoreUsers: false,
        restoreAudit: false
      })

      if (result.success) {
        setMessage({
          type: 'success',
          text: `✅ Backup merged successfully! Added new records from ${new Date(result.backupDate).toLocaleString()}`
        })
        loadStats()
        
        setTimeout(() => {
          if (confirm('Backup merged! Reload page to see changes?')) {
            window.location.reload()
          }
        }, 2000)
      } else if (result.cancelled) {
        setMessage({ type: 'info', text: 'ℹ️ Merge cancelled' })
      } else {
        setMessage({
          type: 'error',
          text: `❌ Merge failed: ${result.error}`
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error merging backup: ${error.message}`
      })
    } finally {
      setRestoring(false)
      e.target.value = '' // Reset file input
    }
  }

  return (
    <div className="backup-restore-container">
      <h1>💾 Backup & Restore</h1>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Backup Reminder */}
      {backupReminder?.needsBackup && (
        <div className="backup-reminder warning">
          <h3>⚠️ Backup Reminder</h3>
          <p>{backupReminder.message}</p>
          <button onClick={handleCreateBackup} className="btn-primary">
            Create Backup Now
          </button>
        </div>
      )}

      {/* Current Data Stats */}
      {stats && (
        <div className="backup-stats">
          <h2>📊 Current Data Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalRecords}</div>
              <div className="stat-label">Total Records</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.animals}</div>
              <div className="stat-label">Animals</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.transactions}</div>
              <div className="stat-label">Transactions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.tasks}</div>
              <div className="stat-label">Tasks</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.inventory}</div>
              <div className="stat-label">Inventory Items</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.treatments}</div>
              <div className="stat-label">Treatments</div>
            </div>
          </div>
          {stats.lastBackup && (
            <p className="last-backup">
              Last backup: {new Date(stats.lastBackup).toLocaleString()} 
              ({backupReminder?.daysSince} days ago)
            </p>
          )}
        </div>
      )}

      {/* Backup Section */}
      <div className="backup-section">
        <h2>📦 Create Backup</h2>
        <p>Download a complete backup of all your farm data to a JSON file.</p>
        <div className="backup-info">
          <h4>What's included in the backup:</h4>
          <ul>
            <li>✅ All animal records and history</li>
            <li>✅ Financial transactions</li>
            <li>✅ Inventory items</li>
            <li>✅ Tasks and schedules</li>
            <li>✅ Crops and yields</li>
            <li>✅ Treatments and breeding records</li>
            <li>✅ Feed records and measurements</li>
            <li>✅ Groups, pastures, and equipment</li>
            <li>✅ All settings and preferences</li>
          </ul>
        </div>
        <button onClick={handleCreateBackup} className="btn-backup">
          📥 Download Backup File
        </button>
      </div>

      {/* Restore Section */}
      <div className="restore-section">
        <h2>♻️ Restore from Backup</h2>
        <p>Restore your data from a previously created backup file.</p>
        
        <div className="restore-options">
          <div className="restore-option">
            <h3>🔄 Replace All Data</h3>
            <p>⚠️ This will <strong>delete all current data</strong> and replace it with the backup.</p>
            <p>A safety backup of your current data will be created first.</p>
            <label className="file-input-label">
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                disabled={restoring}
                style={{ display: 'none' }}
              />
              <button 
                className="btn-restore"
                disabled={restoring}
                onClick={(e) => e.currentTarget.previousElementSibling.click()}
              >
                {restoring ? '⏳ Restoring...' : '📤 Choose Backup File to Restore'}
              </button>
            </label>
          </div>

          <div className="restore-option">
            <h3>➕ Merge with Current Data</h3>
            <p>Add new records from backup without deleting current data.</p>
            <p>Existing records with the same ID will be kept (no overwrite).</p>
            <label className="file-input-label">
              <input
                type="file"
                accept=".json"
                onChange={handleMergeBackup}
                disabled={restoring}
                style={{ display: 'none' }}
              />
              <button 
                className="btn-merge"
                disabled={restoring}
                onClick={(e) => e.currentTarget.previousElementSibling.click()}
              >
                {restoring ? '⏳ Merging...' : '🔀 Choose Backup File to Merge'}
              </button>
            </label>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="backup-best-practices">
        <h2>💡 Backup Best Practices</h2>
        <ul>
          <li>🗓️ Create regular backups (weekly recommended)</li>
          <li>💾 Store backup files in multiple locations (external drive, cloud storage)</li>
          <li>📅 Name backups with dates for easy identification</li>
          <li>🧪 Test restore process occasionally to ensure backups work</li>
          <li>🔐 Keep backups secure (they contain sensitive farm data)</li>
          <li>📊 Create backups before major data imports or changes</li>
        </ul>
      </div>
    </div>
  )
}
