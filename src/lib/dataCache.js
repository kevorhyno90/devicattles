/**
 * Smart Data Cache Layer
 * Reduces localStorage reads/writes with in-memory caching
 * Implements TTL (Time To Live) for automatic cache invalidation
 */

class DataCache {
  constructor() {
    this.cache = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      evictions: 0
    }
  }

  /**
   * Get data from cache or localStorage
   * @param {string} key - Storage key
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   * @returns {any} Cached data or null
   */
  get(key, ttl = 5 * 60 * 1000) {
    const cached = this.cache.get(key)
    
    if (cached) {
      const now = Date.now()
      // Check if cache is still valid
      if (now - cached.timestamp < ttl) {
        this.stats.hits++
        return cached.data
      } else {
        // Cache expired, remove it
        this.cache.delete(key)
        this.stats.evictions++
      }
    }

    // Cache miss - read from localStorage
    this.stats.misses++
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const data = JSON.parse(raw)
        this.set(key, data, ttl)
        return data
      }
    } catch (error) {
      console.error('Cache read error:', error)
    }
    
    return null
  }

  /**
   * Set data in cache and localStorage
   * @param {string} key - Storage key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, data, ttl = 5 * 60 * 1000) {
    this.stats.writes++
    
    // Update in-memory cache
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // Write to localStorage (async-like behavior)
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Cache write error:', error)
      // If localStorage is full, try to clear old entries
      if (error.name === 'QuotaExceededError') {
        this.clearExpired()
        try {
          localStorage.setItem(key, JSON.stringify(data))
        } catch (retryError) {
          console.error('Cache write failed after cleanup:', retryError)
        }
      }
    }
  }

  /**
   * Invalidate cache entry
   * @param {string} key - Storage key
   */
  invalidate(key) {
    this.cache.delete(key)
  }

  /**
   * Invalidate multiple cache entries by pattern
   * @param {RegExp|string} pattern - Pattern to match keys
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    const keysToDelete = []
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
    this.stats.evictions += keysToDelete.length
  }

  /**
   * Clear expired entries from cache
   */
  clearExpired() {
    const now = Date.now()
    const keysToDelete = []

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.stats.evictions += keysToDelete.length
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      evictions: 0
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1)
      : 0

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      memoryUsage: this._estimateMemoryUsage()
    }
  }

  /**
   * Estimate memory usage of cache
   * @private
   */
  _estimateMemoryUsage() {
    let size = 0
    for (const [key, value] of this.cache.entries()) {
      size += key.length * 2 // 2 bytes per character
      size += JSON.stringify(value.data).length * 2
    }
    return `${(size / 1024).toFixed(2)} KB`
  }

  /**
   * Prefetch data into cache
   * @param {string} key - Storage key
   * @param {number} ttl - Time to live
   */
  async prefetch(key, ttl = 5 * 60 * 1000) {
    return new Promise((resolve) => {
      // Use requestIdleCallback if available, otherwise setTimeout
      const callback = () => {
        const data = this.get(key, ttl)
        resolve(data)
      }

      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback)
      } else {
        setTimeout(callback, 0)
      }
    })
  }

  /**
   * Batch get multiple keys
   * @param {string[]} keys - Array of storage keys
   * @param {number} ttl - Time to live
   * @returns {Object} Object with key-value pairs
   */
  batchGet(keys, ttl = 5 * 60 * 1000) {
    const results = {}
    keys.forEach(key => {
      results[key] = this.get(key, ttl)
    })
    return results
  }

  /**
   * Batch set multiple keys
   * @param {Object} entries - Object with key-value pairs
   * @param {number} ttl - Time to live
   */
  batchSet(entries, ttl = 5 * 60 * 1000) {
    Object.entries(entries).forEach(([key, data]) => {
      this.set(key, data, ttl)
    })
  }
}

// Singleton instance
const dataCache = new DataCache()

// Auto-cleanup expired entries every minute
setInterval(() => {
  dataCache.clearExpired()
}, 60 * 1000)

// Helper functions for easy use
export function getCachedData(key, ttl) {
  return dataCache.get(key, ttl)
}

export function setCachedData(key, data, ttl) {
  dataCache.set(key, data, ttl)
}

export function invalidateCache(key) {
  dataCache.invalidate(key)
}

export function invalidateCachePattern(pattern) {
  dataCache.invalidatePattern(pattern)
}

export function getCacheStats() {
  return dataCache.getStats()
}

export function prefetchData(key, ttl) {
  return dataCache.prefetch(key, ttl)
}

export function batchGetData(keys, ttl) {
  return dataCache.batchGet(keys, ttl)
}

export function batchSetData(entries, ttl) {
  dataCache.batchSet(entries, ttl)
}

export default dataCache
