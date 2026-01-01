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
    version: '3.0',
    timestamp: new Date().toISOString(),
    // Core livestock & farm data
    animals: JSON.parse(localStorage.getItem('devinsfarm:animals') || '[]'),
    crops: JSON.parse(localStorage.getItem('devinsfarm:crops') || '[]'),
    // Financial data
    transactions: JSON.parse(localStorage.getItem('devinsfarm:transactions') || '[]'),
    finance: JSON.parse(localStorage.getItem('devinsfarm:finance') || '[]'),
    // Inventory & equipment
    inventory: JSON.parse(localStorage.getItem('devinsfarm:inventory') || '[]'),
    equipment: JSON.parse(localStorage.getItem('devinsfarm:equipment') || '[]'),
    // Tasks & schedules
    tasks: JSON.parse(localStorage.getItem('devinsfarm:tasks') || '[]'),
    schedules: JSON.parse(localStorage.getItem('devinsfarm:schedules') || '[]'),
    // Animal health & breeding
    treatments: JSON.parse(localStorage.getItem('devinsfarm:treatments') || '[]'),
    breeding: JSON.parse(localStorage.getItem('devinsfarm:breeding') || '[]'),
    // Feeding & nutrition
    feeding: JSON.parse(localStorage.getItem('devinsfarm:feeding') || '[]'),
    diets: JSON.parse(localStorage.getItem('devinsfarm:diets') || '[]'),
    rations: JSON.parse(localStorage.getItem('devinsfarm:rations') || '[]'),
    // Milk production
    milkYield: JSON.parse(localStorage.getItem('devinsfarm:milkYield') || '[]'),
    // Measurements & monitoring
    measurements: JSON.parse(localStorage.getItem('devinsfarm:measurements') || '[]'),
    // Poultry management
    flocks: JSON.parse(localStorage.getItem('devinsfarm:flocks') || '[]'),
    poultry: JSON.parse(localStorage.getItem('devinsfarm:poultry') || '[]'),
    egg_production: JSON.parse(localStorage.getItem('devinsfarm:egg_production') || '[]'),
    poultry_vaccination: JSON.parse(localStorage.getItem('devinsfarm:poultry_vaccination') || '[]'),
    poultry_health: JSON.parse(localStorage.getItem('devinsfarm:poultry_health') || '[]'),
    poultry_treatment: JSON.parse(localStorage.getItem('devinsfarm:poultry_treatment') || '[]'),
    // Calf management
    calfManagement: JSON.parse(localStorage.getItem('devinsfarm:calf:management') || '[]'),
    calfFeeding: JSON.parse(localStorage.getItem('devinsfarm:calf:feeding') || '[]'),
    calfHealth: JSON.parse(localStorage.getItem('devinsfarm:calf:health') || '[]'),
    // Goat management (kid management)
    goats: JSON.parse(localStorage.getItem('devinsfarm:goats') || '[]'),
    kids: JSON.parse(localStorage.getItem('devinsfarm:kids') || '[]'),
    // Land & resources
    groups: JSON.parse(localStorage.getItem('devinsfarm:groups') || '[]'),
    pastures: JSON.parse(localStorage.getItem('devinsfarm:pastures') || '[]'),
    // Notifications & alerts
    notifications: JSON.parse(localStorage.getItem('devinsfarm:notifications') || '[]'),
    alert_rules: JSON.parse(localStorage.getItem('devinsfarm:alert_rules') || '[]'),
    // Activity logs
    activities: JSON.parse(localStorage.getItem('devinsfarm:activities') || '[]'),
    // Photos & media
    photos: JSON.parse(localStorage.getItem('devinsfarm:photos') || '[]'),
    // Notes & documents
    notes: JSON.parse(localStorage.getItem('devinsfarm:notes') || '[]'),
    // Settings
    settings: {
      currency: localStorage.getItem('devinsfarm:currency') || 'KES',
      language: localStorage.getItem('devinsfarm:language') || 'en',
      appSettings: JSON.parse(localStorage.getItem('devinsfarm:app:settings') || 'null'),
      notificationSettings: JSON.parse(localStorage.getItem('devinsfarm:notification:settings') || 'null'),
      uiSettings: JSON.parse(localStorage.getItem('devinsfarm:ui:settings') || 'null'),
      dashboardSettings: JSON.parse(localStorage.getItem('devinsfarm:dashboard:settings') || 'null'),
      analyticsSettings: JSON.parse(localStorage.getItem('devinsfarm:analytics:settings') || 'null')
    },
    users: JSON.parse(localStorage.getItem('devinsfarm:users') || '[]'),
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
          restored.finance = mergeData('devinsfarm:finance', data.finance)
          restored.equipment = mergeData('devinsfarm:equipment', data.equipment)
          restored.diets = mergeData('devinsfarm:diets', data.diets)
          restored.rations = mergeData('devinsfarm:rations', data.rations)
          restored.flocks = mergeData('devinsfarm:flocks', data.flocks)
          restored.poultry = mergeData('devinsfarm:poultry', data.poultry)
          restored.egg_production = mergeData('devinsfarm:egg_production', data.egg_production)
          restored.poultry_vaccination = mergeData('devinsfarm:poultry_vaccination', data.poultry_vaccination)
          restored.poultry_health = mergeData('devinsfarm:poultry_health', data.poultry_health)
          restored.poultry_treatment = mergeData('devinsfarm:poultry_treatment', data.poultry_treatment)
          restored.calfManagement = mergeData('devinsfarm:calf:management', data.calfManagement)
          restored.calfFeeding = mergeData('devinsfarm:calf:feeding', data.calfFeeding)
          restored.calfHealth = mergeData('devinsfarm:calf:health', data.calfHealth)
          restored.goats = mergeData('devinsfarm:goats', data.goats)
          restored.kids = mergeData('devinsfarm:kids', data.kids)
          restored.notifications = mergeData('devinsfarm:notifications', data.notifications)
          restored.alert_rules = mergeData('devinsfarm:alert_rules', data.alert_rules)
          restored.activities = mergeData('devinsfarm:activities', data.activities)
          restored.photos = mergeData('devinsfarm:photos', data.photos)
          restored.notes = mergeData('devinsfarm:notes', data.notes)
        } else {
          // Replace mode - overwrite all existing data
          // Core livestock & farm data
          localStorage.setItem('devinsfarm:animals', JSON.stringify(data.animals || []))
          localStorage.setItem('devinsfarm:crops', JSON.stringify(data.crops || []))
          // Financial data
          localStorage.setItem('devinsfarm:transactions', JSON.stringify(data.transactions || []))
          localStorage.setItem('devinsfarm:finance', JSON.stringify(data.finance || []))
          // Inventory & equipment
          localStorage.setItem('devinsfarm:inventory', JSON.stringify(data.inventory || []))
          localStorage.setItem('devinsfarm:equipment', JSON.stringify(data.equipment || []))
          // Tasks & schedules
          localStorage.setItem('devinsfarm:tasks', JSON.stringify(data.tasks || []))
          localStorage.setItem('devinsfarm:schedules', JSON.stringify(data.schedules || []))
          // Animal health & breeding
          localStorage.setItem('devinsfarm:treatments', JSON.stringify(data.treatments || []))
          localStorage.setItem('devinsfarm:breeding', JSON.stringify(data.breeding || []))
          // Feeding & nutrition
          localStorage.setItem('devinsfarm:feeding', JSON.stringify(data.feeding || []))
          localStorage.setItem('devinsfarm:diets', JSON.stringify(data.diets || []))
          localStorage.setItem('devinsfarm:rations', JSON.stringify(data.rations || []))
          // Milk production
          localStorage.setItem('devinsfarm:milkYield', JSON.stringify(data.milkYield || []))
          // Measurements
          localStorage.setItem('devinsfarm:measurements', JSON.stringify(data.measurements || []))
          // Poultry management
          localStorage.setItem('devinsfarm:flocks', JSON.stringify(data.flocks || []))
          localStorage.setItem('devinsfarm:poultry', JSON.stringify(data.poultry || []))
          localStorage.setItem('devinsfarm:egg_production', JSON.stringify(data.egg_production || []))
          localStorage.setItem('devinsfarm:poultry_vaccination', JSON.stringify(data.poultry_vaccination || []))
          localStorage.setItem('devinsfarm:poultry_health', JSON.stringify(data.poultry_health || []))
          localStorage.setItem('devinsfarm:poultry_treatment', JSON.stringify(data.poultry_treatment || []))
          // Calf management
          localStorage.setItem('devinsfarm:calf:management', JSON.stringify(data.calfManagement || []))
          localStorage.setItem('devinsfarm:calf:feeding', JSON.stringify(data.calfFeeding || []))
          localStorage.setItem('devinsfarm:calf:health', JSON.stringify(data.calfHealth || []))
          // Goat management
          localStorage.setItem('devinsfarm:goats', JSON.stringify(data.goats || []))
          localStorage.setItem('devinsfarm:kids', JSON.stringify(data.kids || []))
          // Land & resources
          localStorage.setItem('devinsfarm:groups', JSON.stringify(data.groups || []))
          localStorage.setItem('devinsfarm:pastures', JSON.stringify(data.pastures || []))
          // Notifications & alerts
          localStorage.setItem('devinsfarm:notifications', JSON.stringify(data.notifications || []))
          localStorage.setItem('devinsfarm:alert_rules', JSON.stringify(data.alert_rules || []))
          // Activity logs
          localStorage.setItem('devinsfarm:activities', JSON.stringify(data.activities || []))
          // Photos & media
          localStorage.setItem('devinsfarm:photos', JSON.stringify(data.photos || []))
          // Notes
          localStorage.setItem('devinsfarm:notes', JSON.stringify(data.notes || []))
          
          restored.animals = data.animals?.length || 0
          restored.crops = data.crops?.length || 0
          restored.transactions = data.transactions?.length || 0
          restored.inventory = data.inventory?.length || 0
          restored.tasks = data.tasks?.length || 0
          restored.flocks = data.flocks?.length || 0
          restored.photos = data.photos?.length || 0
          restored.notes = data.notes?.length || 0
        }
        
        // Restore settings
        if (data.settings) {
          if (data.settings.currency) {
            localStorage.setItem('devinsfarm:currency', data.settings.currency)
          }
          if (data.settings.language) {
            localStorage.setItem('devinsfarm:language', data.settings.language)
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
          if (data.settings.dashboardSettings) {
            localStorage.setItem('devinsfarm:dashboard:settings', JSON.stringify(data.settings.dashboardSettings))
          }
          if (data.settings.analyticsSettings) {
            localStorage.setItem('devinsfarm:analytics:settings', JSON.stringify(data.settings.analyticsSettings))
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
    // Calculate total records from all modules
    totalRecords: 
      (data.animals?.length || 0) +
      (data.crops?.length || 0) +
      (data.transactions?.length || 0) +
      (data.finance?.length || 0) +
      (data.inventory?.length || 0) +
      (data.equipment?.length || 0) +
      (data.tasks?.length || 0) +
      (data.schedules?.length || 0) +
      (data.treatments?.length || 0) +
      (data.breeding?.length || 0) +
      (data.feeding?.length || 0) +
      (data.diets?.length || 0) +
      (data.rations?.length || 0) +
      (data.milkYield?.length || 0) +
      (data.measurements?.length || 0) +
      (data.flocks?.length || 0) +
      (data.poultry?.length || 0) +
      (data.egg_production?.length || 0) +
      (data.poultry_vaccination?.length || 0) +
      (data.poultry_health?.length || 0) +
      (data.poultry_treatment?.length || 0) +
      (data.calfManagement?.length || 0) +
      (data.calfFeeding?.length || 0) +
      (data.calfHealth?.length || 0) +
      (data.goats?.length || 0) +
      (data.kids?.length || 0) +
      (data.groups?.length || 0) +
      (data.pastures?.length || 0) +
      (data.notifications?.length || 0) +
      (data.alert_rules?.length || 0) +
      (data.activities?.length || 0) +
      (data.photos?.length || 0) +
      (data.notes?.length || 0),
    // Module-specific stats
    animals: data.animals?.length || 0,
    crops: data.crops?.length || 0,
    transactions: data.transactions?.length || 0,
    inventory: data.inventory?.length || 0,
    equipment: data.equipment?.length || 0,
    tasks: data.tasks?.length || 0,
    treatments: data.treatments?.length || 0,
    breeding: data.breeding?.length || 0,
    flocks: data.flocks?.length || 0,
    poultry: data.poultry?.length || 0,
    egg_production: data.egg_production?.length || 0,
    calfManagement: data.calfManagement?.length || 0,
    goats: data.goats?.length || 0,
    kids: data.kids?.length || 0,
    pastures: data.pastures?.length || 0,
    photos: data.photos?.length || 0,
    notes: data.notes?.length || 0,
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
