/**
 * Safe localStorage wrapper that handles quota exceeded errors on mobile devices.
 * Automatically handles QuotaExceededError by clearing old/large data.
 */

const QUOTA_WARNING_KEY = '_quota_warning_shown'

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
    return { success: true }
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
      // Storage quota exceeded - try to free up space
      console.warn('localStorage quota exceeded, attempting cleanup...')
      
      // Show warning to user (once per session)
      if (!sessionStorage.getItem(QUOTA_WARNING_KEY)) {
        sessionStorage.setItem(QUOTA_WARNING_KEY, 'true')
        alert('Storage is full. Some older data may be cleared to make room.')
      }
      
      // Try to clear non-essential data
      const protectedKeys = [
        'cattalytics:animals',
        'cattalytics:tasks', 
        'cattalytics:finance',
        'cattalytics:crops:v2',
        'cattalytics:groups',
        'devinsfarm:resources',
        'devinsfarm:ui:settings',
        'cattalytics:auth:session'
      ]
      
      // Find and remove large items first
      const items = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k) {
          const size = (localStorage.getItem(k) || '').length
          items.push({ key: k, size })
        }
      }
      
      // Sort by size descending
      items.sort((a, b) => b.size - a.size)
      
      // Remove largest non-protected items until we have 20% space
      let removed = 0
      for (const item of items) {
        if (removed >= 5) break // Limit removals to avoid losing too much
        if (!protectedKeys.some(p => item.key.startsWith(p))) {
          localStorage.removeItem(item.key)
          removed++
        }
      }
      
      // Try again after cleanup
      try {
        localStorage.setItem(key, value)
        return { success: true, cleaned: true }
      } catch (retryError) {
        console.error('Storage still full after cleanup:', retryError)
        return { success: false, error: 'Storage quota exceeded', cleaned: true }
      }
    } else {
      console.error('localStorage error:', error)
      return { success: false, error: error.message }
    }
  }
}

export function safeGetItem(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key)
    return value !== null ? value : defaultValue
  } catch (error) {
    console.error('localStorage read error:', error)
    return defaultValue
  }
}

export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key)
    return { success: true }
  } catch (error) {
    console.error('localStorage remove error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get estimated localStorage usage (in MB)
 */
export function getStorageUsage() {
  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ''
        total += key.length + value.length
      }
    }
    // Convert to MB (2 bytes per character in UTF-16)
    return (total * 2 / 1024 / 1024).toFixed(2)
  } catch (error) {
    return '0'
  }
}

/**
 * Check if we're approaching quota (above 80% on mobile)
 */
export function isNearQuota() {
  try {
    const usage = parseFloat(getStorageUsage())
    // Mobile browsers typically have 5-10MB limit
    // Desktop browsers have 10MB+ limit
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
    const limit = isMobile ? 5 : 10
    return usage > (limit * 0.8)
  } catch (error) {
    return false
  }
}
