/**
 * Backup and Restore System
 * Complete data backup to file and restore functionality
 */

// import { logAction, ACTIONS, ENTITIES } from './audit' // audit log removed

/**
 * Get all app data for backup
 */
export function getAllData() {
  const data = {
    version: '2.0',
    timestamp: new Date().toISOString(),
    animals: JSON.parse(localStorage.getItem('devinsfarm:animals') || '[]'),
    transactions: JSON.parse(localStorage.getItem('devinsfarm:transactions') || '[]'),
    inventory: JSON.parse(localStorage.getItem('devinsfarm:inventory') || '[]'),
    tasks: JSON.parse(localStorage.getItem('devinsfarm:tasks') || '[]'),
    crops: JSON.parse(localStorage.getItem('devinsfarm:crops') || '[]'),
    treatments: JSON.parse(localStorage.getItem('devinsfarm:treatments') || '[]'),
    breeding: JSON.parse(localStorage.getItem('devinsfarm:breeding') || '[]'),
    feeding: JSON.parse(localStorage.getItem('devinsfarm:feeding') || '[]'),
    measurements: JSON.parse(localStorage.getItem('devinsfarm:measurements') || '[]'),
    milkYield: JSON.parse(localStorage.getItem('devinsfarm:milkYield') || '[]'),
    groups: JSON.parse(localStorage.getItem('devinsfarm:groups') || '[]'),
    pastures: JSON.parse(localStorage.getItem('devinsfarm:pastures') || '[]'),
    schedules: JSON.parse(localStorage.getItem('devinsfarm:schedules') || '[]'),
    equipment: JSON.parse(localStorage.getItem('devinsfarm:equipment') || '[]'),
    settings: {
      currency: localStorage.getItem('devinsfarm:currency') || 'KES',
      appSettings: JSON.parse(localStorage.getItem('devinsfarm:app:settings') || 'null'),
      notificationSettings: JSON.parse(localStorage.getItem('devinsfarm:notification:settings') || 'null'),
      uiSettings: JSON.parse(localStorage.getItem('devinsfarm:ui:settings') || 'null')
    },
    users: JSON.parse(localStorage.getItem('devinsfarm:users') || '[]'),
    // audit: JSON.parse(localStorage.getItem('devinsfarm:audit') || '[]') // audit log removed
  }
  
  return data
}

/**
 * Create backup file and download
 */
export function createBackup(options = {}) {
  try {
    const data = getAllData()
    const filename = options.filename || `devinsfarm-backup-${new Date().toISOString().split('T')[0]}.json`
    
    // Create blob and download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    // logAction removed
    
    return { success: true, filename, size: blob.size }
  } catch (error) {
    console.error('Error creating backup:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Restore data from backup file
 */
export function restoreFromBackup(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        
        // Validate backup format
        if (!data.version || !data.timestamp) {
          throw new Error('Invalid backup file format')
        }
        
        // Confirm restore
        const confirmed = options.skipConfirm || confirm(
          `Restore backup from ${new Date(data.timestamp).toLocaleString()}?\n\n` +
          `This will ${options.merge ? 'merge' : 'replace'} your current data.\n\n` +
          `Animals: ${data.animals?.length || 0}\n` +
          `Transactions: ${data.transactions?.length || 0}\n` +
          `Tasks: ${data.tasks?.length || 0}\n` +
          `Inventory: ${data.inventory?.length || 0}\n\n` +
          `Are you sure?`
        )
        
        if (!confirmed) {
          resolve({ success: false, cancelled: true })
          return
        }
        
        // Create backup of current data before restore
        if (options.createBackupFirst !== false) {
          createBackup({ filename: `pre-restore-backup-${Date.now()}.json` })
        }
        
        // Restore data
        const restored = {}
        
        if (options.merge) {
          // Merge mode - combine with existing data
          restored.animals = mergeData('devinsfarm:animals', data.animals)
          restored.transactions = mergeData('devinsfarm:transactions', data.transactions)
          restored.inventory = mergeData('devinsfarm:inventory', data.inventory)
          restored.tasks = mergeData('devinsfarm:tasks', data.tasks)
          restored.crops = mergeData('devinsfarm:crops', data.crops)
          restored.treatments = mergeData('devinsfarm:treatments', data.treatments)
          restored.breeding = mergeData('devinsfarm:breeding', data.breeding)
          restored.feeding = mergeData('devinsfarm:feeding', data.feeding)
          restored.measurements = mergeData('devinsfarm:measurements', data.measurements)
          restored.milkYield = mergeData('devinsfarm:milkYield', data.milkYield)
          restored.groups = mergeData('devinsfarm:groups', data.groups)
          restored.pastures = mergeData('devinsfarm:pastures', data.pastures)
          restored.schedules = mergeData('devinsfarm:schedules', data.schedules)
          restored.equipment = mergeData('devinsfarm:equipment', data.equipment)
        } else {
          // Replace mode - overwrite existing data
          localStorage.setItem('devinsfarm:animals', JSON.stringify(data.animals || []))
          localStorage.setItem('devinsfarm:transactions', JSON.stringify(data.transactions || []))
          localStorage.setItem('devinsfarm:inventory', JSON.stringify(data.inventory || []))
          localStorage.setItem('devinsfarm:tasks', JSON.stringify(data.tasks || []))
          localStorage.setItem('devinsfarm:crops', JSON.stringify(data.crops || []))
          localStorage.setItem('devinsfarm:treatments', JSON.stringify(data.treatments || []))
          localStorage.setItem('devinsfarm:breeding', JSON.stringify(data.breeding || []))
          localStorage.setItem('devinsfarm:feeding', JSON.stringify(data.feeding || []))
          localStorage.setItem('devinsfarm:measurements', JSON.stringify(data.measurements || []))
          localStorage.setItem('devinsfarm:milkYield', JSON.stringify(data.milkYield || []))
          localStorage.setItem('devinsfarm:groups', JSON.stringify(data.groups || []))
          localStorage.setItem('devinsfarm:pastures', JSON.stringify(data.pastures || []))
          localStorage.setItem('devinsfarm:schedules', JSON.stringify(data.schedules || []))
          localStorage.setItem('devinsfarm:equipment', JSON.stringify(data.equipment || []))
          
          restored.animals = data.animals?.length || 0
          restored.transactions = data.transactions?.length || 0
          restored.inventory = data.inventory?.length || 0
          restored.tasks = data.tasks?.length || 0
        }
        
        // Restore settings
        if (data.settings) {
          if (data.settings.currency) {
            localStorage.setItem('devinsfarm:currency', data.settings.currency)
          }
          if (data.settings.appSettings) {
            localStorage.setItem('devinsfarm:app:settings', JSON.stringify(data.settings.appSettings))
          }
          if (data.settings.notificationSettings) {
            localStorage.setItem('devinsfarm:notification:settings', JSON.stringify(data.settings.notificationSettings))
          }
          if (data.settings.uiSettings) {
            localStorage.setItem('devinsfarm:ui:settings', JSON.stringify(data.settings.uiSettings))
          }
        }
        
        // Optionally restore users and audit log
        if (options.restoreUsers && data.users) {
          localStorage.setItem('devinsfarm:users', JSON.stringify(data.users))
        }
        if (options.restoreAudit && data.audit) {
          localStorage.setItem('devinsfarm:audit', JSON.stringify(data.audit))
        }
        
        logAction(ACTIONS.IMPORT, ENTITIES.OTHER, null, { 
          operation: 'Full Restore',
          mode: options.merge ? 'merge' : 'replace',
          backupDate: data.timestamp
        })
        
        resolve({
          success: true,
          restored,
          backupDate: data.timestamp,
          version: data.version
        })
      } catch (error) {
        console.error('Error restoring backup:', error)
        reject({ success: false, error: error.message })
      }
    }
    
    reader.onerror = () => {
      reject({ success: false, error: 'Failed to read file' })
    }
    
    reader.readAsText(file)
  })
}

/**
 * Merge imported data with existing data
 */
function mergeData(key, newData) {
  if (!newData || !Array.isArray(newData)) return 0
  
  const existing = JSON.parse(localStorage.getItem(key) || '[]')
  const merged = [...existing]
  let added = 0
  
  newData.forEach(item => {
    // Check if item already exists by id
    const existingIndex = merged.findIndex(e => e.id === item.id)
    if (existingIndex === -1) {
      merged.push(item)
      added++
    } else {
      // Update if newer
      if (new Date(item.updatedAt || item.date) > new Date(merged[existingIndex].updatedAt || merged[existingIndex].date)) {
        merged[existingIndex] = item
      }
    }
  })
  
  localStorage.setItem(key, JSON.stringify(merged))
  return added
}

/**
 * Get backup statistics
 */
export function getBackupStats() {
  const data = getAllData()
  
  return {
    totalRecords: 
      (data.animals?.length || 0) +
      (data.transactions?.length || 0) +
      (data.inventory?.length || 0) +
      (data.tasks?.length || 0) +
      (data.crops?.length || 0) +
      (data.treatments?.length || 0) +
      (data.breeding?.length || 0),
    animals: data.animals?.length || 0,
    transactions: data.transactions?.length || 0,
    inventory: data.inventory?.length || 0,
    tasks: data.tasks?.length || 0,
    crops: data.crops?.length || 0,
    treatments: data.treatments?.length || 0,
    breeding: data.breeding?.length || 0,
    lastBackup: localStorage.getItem('devinsfarm:lastBackup') || null
  }
}

/**
 * Auto-backup reminder
 */
export function checkBackupReminder() {
  const lastBackup = localStorage.getItem('devinsfarm:lastBackup')
  const appSettings = JSON.parse(localStorage.getItem('devinsfarm:app:settings') || '{}')
  const backupFrequency = appSettings.backupFrequency || 7 // days
  
  if (!lastBackup) {
    return { needsBackup: true, daysSince: null, message: 'No backup found. Create your first backup now!' }
  }
  
  const lastBackupDate = new Date(lastBackup)
  const daysSince = Math.floor((Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysSince >= backupFrequency) {
    return { 
      needsBackup: true, 
      daysSince, 
      message: `Last backup was ${daysSince} days ago. Time to create a new backup!` 
    }
  }
  
  return { needsBackup: false, daysSince, message: `Last backup: ${daysSince} days ago` }
}

/**
 * Update last backup timestamp
 */
export function updateLastBackupTime() {
  localStorage.setItem('devinsfarm:lastBackup', new Date().toISOString())
}
