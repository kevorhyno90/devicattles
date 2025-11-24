// Simple settings for personal offline PWA
const SETTINGS_KEY = 'devinsfarm:app:settings'

const DEFAULT_SETTINGS = {
  requireAuth: false, // Set to true if you want login protection - Default: false for easy access
  autoBackup: true, // Auto-export data periodically
  backupFrequency: 7, // Days between auto-backups
  defaultUser: {
    name: 'Farm Owner',
    role: 'MANAGER'
  }
}

export function getAppSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch (err) {
    return DEFAULT_SETTINGS
  }
}

export function saveAppSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    return true
  } catch (err) {
    console.error('Failed to save settings:', err)
    return false
  }
}

export function toggleAuthentication(enabled) {
  const settings = getAppSettings()
  settings.requireAuth = enabled
  return saveAppSettings(settings)
}

export function isAuthRequired() {
  const settings = getAppSettings()
  return settings.requireAuth
}

export function getDefaultUser() {
  const settings = getAppSettings()
  return settings.defaultUser
}
