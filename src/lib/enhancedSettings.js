// Enhanced Settings for Devins Farm
const ENHANCED_SETTINGS_KEY = 'devinsfarm:enhanced:settings'

// Default settings structure
const DEFAULT_ENHANCED_SETTINGS = {
  // 1. Farm Information
  farmInfo: {
    farmName: 'Devins Farm',
    businessName: 'Devins Farm Management',
    ownerName: '',
    location: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    registrationNumber: '',
    taxId: ''
  },
  
  // 2. Regional Preferences
  regional: {
    currency: 'KES',
    currencySymbol: 'KSh',
    currencyPosition: 'before', // 'before' or 'after'
    decimalSeparator: '.',
    thousandSeparator: ',',
    measurementSystem: 'metric', // 'metric' or 'imperial'
    dateFormat: 'DD/MM/YYYY', // 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'
    timeFormat: '24h', // '12h' or '24h'
    timezone: 'Africa/Nairobi',
    language: 'en', // 'en', 'es', 'fr', 'sw' (Swahili)
    firstDayOfWeek: 'monday' // 'sunday' or 'monday'
  },
  
  // 3. Notification Preferences
  notifications: {
    enableNotifications: true,
    emailNotifications: false,
    soundAlerts: true,
    visualAlerts: true,
    reminderAdvance: 24, // hours in advance
    autoNotificationFrequency: 60, // minutes
    taskReminders: true,
    healthReminders: true,
    scheduleReminders: true,
    financialAlerts: true,
    inventoryAlerts: true,
    breedingReminders: true,
    vaccinationReminders: true,
    lowStockThreshold: 10 // percentage
  },
  
  // 4. Data Management
  dataManagement: {
    autoBackup: true,
    backupFrequency: 7, // days
    lastBackupDate: null,
    backupFormat: 'json', // 'json' or 'excel'
    dataRetentionDays: 365,
    autoDeleteOldData: false,
    compressBackups: true,
    includePhotos: true,
    cloudSync: false,
    syncFrequency: 30 // minutes
  },
  
  // 5. Security & Privacy
  security: {
    requireAuth: false,
    sessionTimeout: 480, // minutes (8 hours)
    autoLockScreen: false,
    autoLockTime: 15, // minutes
    passwordMinLength: 8,
    requireStrongPassword: true,
    encryptData: false,
    showSensitiveData: true,
    twoFactorAuth: false,
    auditLog: true,
    dataSharing: false
  },
  
  // 6. System Preferences
  system: {
    defaultView: 'dashboard',
    itemsPerPage: 20,
    autoRefreshDashboard: true,
    refreshInterval: 300, // seconds
    offlineMode: true,
    showTooltips: true,
    compactView: false,
    animationsEnabled: true,
    developerMode: false,
    debugLogs: false,
    defaultAnimalSort: 'name', // 'name', 'id', 'age', 'date'
    defaultTaskSort: 'dueDate',
    showCompletedTasks: false,
    theme: 'catalytics'
  }
}

// Currency options
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'KES', symbol: 'KES', name: 'Kenyan Shilling' },
  { code: 'TZS', symbol: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'UGX', symbol: 'UGX', name: 'Ugandan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' }
]

// Language options
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'pt', name: 'Português' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'zh', name: '中文' }
]

// Timezone options (common ones)
export const TIMEZONES = [
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT)' },
  { value: 'Africa/Lagos', label: 'Africa/Lagos (WAT)' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST)' },
  { value: 'America/New_York', label: 'America/New York (EST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (PST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT)' }
]

// Get all enhanced settings
export function getEnhancedSettings() {
  try {
    const raw = localStorage.getItem(ENHANCED_SETTINGS_KEY)
    if (raw) {
      const stored = JSON.parse(raw)
      // Deep merge with defaults to ensure all properties exist
      return {
        farmInfo: { ...DEFAULT_ENHANCED_SETTINGS.farmInfo, ...(stored.farmInfo || {}) },
        regional: { ...DEFAULT_ENHANCED_SETTINGS.regional, ...(stored.regional || {}) },
        notifications: { ...DEFAULT_ENHANCED_SETTINGS.notifications, ...(stored.notifications || {}) },
        dataManagement: { ...DEFAULT_ENHANCED_SETTINGS.dataManagement, ...(stored.dataManagement || {}) },
        security: { ...DEFAULT_ENHANCED_SETTINGS.security, ...(stored.security || {}) },
        system: { ...DEFAULT_ENHANCED_SETTINGS.system, ...(stored.system || {}) }
      }
    }
    return DEFAULT_ENHANCED_SETTINGS
  } catch (err) {
    console.error('Failed to load enhanced settings:', err)
    return DEFAULT_ENHANCED_SETTINGS
  }
}

// Save enhanced settings
export function saveEnhancedSettings(settings) {
  try {
    localStorage.setItem(ENHANCED_SETTINGS_KEY, JSON.stringify(settings))
    return true
  } catch (err) {
    console.error('Failed to save enhanced settings:', err)
    return false
  }
}

// Update specific section
export function updateSettingsSection(section, data) {
  const settings = getEnhancedSettings()
  settings[section] = { ...settings[section], ...data }
  return saveEnhancedSettings(settings)
}

// Get specific section
export function getSettingsSection(section) {
  const settings = getEnhancedSettings()
  return settings[section] || DEFAULT_ENHANCED_SETTINGS[section]
}

// Format currency based on settings
export function formatCurrency(amount, includeSymbol = true) {
  const regional = getSettingsSection('regional')
  
  if (amount == null || isNaN(amount)) {
    const zero = includeSymbol ? `${regional.currencySymbol || 'KSh'} 0.00` : '0.00'
    return zero.replace('.', regional.decimalSeparator || '.')
  }
  
  const num = parseFloat(amount)
  
  // Split into integer and decimal parts
  const parts = num.toFixed(2).split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  
  // Add thousand separators to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, regional.thousandSeparator || ',')
  
  // Combine with decimal separator
  const formatted = decimalPart 
    ? `${formattedInteger}${regional.decimalSeparator || '.'}${decimalPart}`
    : formattedInteger
  
  if (!includeSymbol) return formatted
  
  return regional.currencyPosition === 'before' 
    ? `${regional.currencySymbol || 'KSh'} ${formatted}`
    : `${formatted} ${regional.currencySymbol || 'KSh'}`
}

// Format date based on settings
export function formatDate(date, includeTime = false) {
  if (!date) return ''
  
  const regional = getSettingsSection('regional')
  const d = new Date(date)
  
  if (isNaN(d.getTime())) return ''
  
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  
  let formatted = regional.dateFormat
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
  
  if (includeTime) {
    const hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    
    if (regional.timeFormat === '12h') {
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const hours12 = hours % 12 || 12
      formatted += ` ${hours12}:${minutes} ${ampm}`
    } else {
      formatted += ` ${String(hours).padStart(2, '0')}:${minutes}`
    }
  }
  
  return formatted
}

// Convert weight based on settings
export function formatWeight(kg, includeUnit = true) {
  const regional = getSettingsSection('regional')
  
  if (kg == null || isNaN(kg)) return includeUnit ? '0 kg' : '0'
  
  const num = parseFloat(kg)
  
  if (regional.measurementSystem === 'imperial') {
    const lbs = (num * 2.20462).toFixed(2)
    return includeUnit ? `${lbs} lbs` : lbs
  }
  
  return includeUnit ? `${num.toFixed(2)} kg` : num.toFixed(2)
}

// Convert volume based on settings
export function formatVolume(liters, includeUnit = true) {
  const regional = getSettingsSection('regional')
  
  if (liters == null || isNaN(liters)) return includeUnit ? '0 L' : '0'
  
  const num = parseFloat(liters)
  
  if (regional.measurementSystem === 'imperial') {
    const gallons = (num * 0.264172).toFixed(2)
    return includeUnit ? `${gallons} gal` : gallons
  }
  
  return includeUnit ? `${num.toFixed(2)} L` : num.toFixed(2)
}

// Reset to defaults
export function resetEnhancedSettings() {
  return saveEnhancedSettings(DEFAULT_ENHANCED_SETTINGS)
}

// Export settings
export function exportEnhancedSettings() {
  const settings = getEnhancedSettings()
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `devinsfarm-settings-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Import settings
export function importEnhancedSettings(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result)
        if (saveEnhancedSettings(settings)) {
          resolve(true)
        } else {
          reject(new Error('Failed to save settings'))
        }
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
