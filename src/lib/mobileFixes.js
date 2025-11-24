/**
 * Mobile-specific fixes and optimizations
 * Helps prevent crashes on Android devices with limited memory
 */

/**
 * Detect if running on mobile device
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Detect if running on low-memory device (Android with < 2GB RAM estimate)
 */
export function isLowMemoryDevice() {
  if (!isMobileDevice()) return false
  
  // Check device memory API if available
  if ('deviceMemory' in navigator && navigator.deviceMemory) {
    return navigator.deviceMemory < 2
  }
  
  // Check hardware concurrency as proxy
  if ('hardwareConcurrency' in navigator) {
    return navigator.hardwareConcurrency <= 4
  }
  
  // Default to true on mobile to be safe
  return true
}

/**
 * Reduce sample data size for mobile devices
 */
export function reduceSampleData(dataArray, maxItems = 3) {
  if (!isMobileDevice() || !Array.isArray(dataArray)) {
    return dataArray
  }
  
  // On mobile, only keep first N items of sample data
  return dataArray.slice(0, maxItems)
}

/**
 * Safely parse localStorage with fallback
 */
export function safeJSONParse(jsonString, defaultValue = null) {
  try {
    return jsonString ? JSON.parse(jsonString) : defaultValue
  } catch (error) {
    console.warn('JSON parse failed:', error)
    return defaultValue
  }
}

/**
 * Check if we should skip heavy features on mobile
 */
export function shouldSkipHeavyFeatures() {
  return isLowMemoryDevice()
}

/**
 * Delay execution to prevent blocking UI on mobile
 */
export function mobileDelay(ms = 10) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Process large arrays in chunks to prevent UI blocking
 */
export async function processInChunks(array, processor, chunkSize = 50) {
  if (!isMobileDevice()) {
    // On desktop, process all at once
    return array.map(processor)
  }
  
  const results = []
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize)
    results.push(...chunk.map(processor))
    // Yield to UI thread
    await mobileDelay(10)
  }
  return results
}
