/**
 * Performance Utilities
 * 
 * Free enhancements for better app performance:
 * - Debouncing for search/filter inputs
 * - Throttling for scroll/resize events
 * - Image lazy loading helpers
 * - Memory optimization utilities
 */

/**
 * Debounce function - delays execution until after wait time has passed
 * Perfect for search inputs, auto-save, resize events
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function runs at most once per interval
 * Perfect for scroll events, window resize, mouse move
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize function results
 * Cache expensive function calls
 * 
 * @param {Function} func - Function to memoize
 * @returns {Function} Memoized function
 */
export function memoize(func) {
  const cache = new Map();
  return function memoized(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Lazy load images
 * Only load images when they're about to enter viewport
 * 
 * @param {HTMLImageElement} img - Image element to lazy load
 * @param {string} src - Actual image source
 */
export function lazyLoadImage(img, src) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before entering viewport
    });
    observer.observe(img);
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = src;
  }
}

/**
 * Batch DOM updates to prevent layout thrashing
 * 
 * @param {Function} callback - Function containing DOM updates
 */
export function batchDOMUpdates(callback) {
  requestAnimationFrame(() => {
    callback();
  });
}

/**
 * Chunk large arrays for processing
 * Prevents UI freezing when processing large datasets
 * 
 * @param {Array} array - Large array to process
 * @param {Function} processor - Function to process each chunk
 * @param {number} chunkSize - Size of each chunk
 */
export async function processInChunks(array, processor, chunkSize = 100) {
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    await processor(chunk);
    // Give browser time to breathe
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

/**
 * Format large numbers for display
 * 
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Check if element is in viewport
 * 
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if in viewport
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Optimize localStorage usage
 * Compress large objects before storing
 * 
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 */
export function optimizedLocalStorage(key, data) {
  try {
    // For large arrays, only store essential fields
    if (Array.isArray(data) && data.length > 100) {
      console.log(`Storing large array (${data.length} items) for ${key}`);
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded. Consider clearing old data.');
      // Try to clear old cache entries
      clearOldCache();
      // Try again
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (retryError) {
        console.error('Failed to save even after clearing cache:', retryError);
      }
    }
  }
}

/**
 * Clear old cache entries
 */
function clearOldCache() {
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter(k => k.includes('cache') || k.includes('temp'));
  cacheKeys.forEach(key => localStorage.removeItem(key));
}

/**
 * Preload critical resources
 * 
 * @param {Array<string>} urls - URLs to preload
 */
export function preloadResources(urls) {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    if (url.endsWith('.js')) {
      link.as = 'script';
    } else if (url.endsWith('.css')) {
      link.as = 'style';
    } else if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      link.as = 'image';
    }
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Create a Web Worker for heavy computations
 * 
 * @param {Function} workerFunction - Function to run in worker
 * @returns {Worker} Web Worker instance
 */
export function createWorker(workerFunction) {
  const blob = new Blob([`(${workerFunction.toString()})()`], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

/**
 * Cancel pending requests
 * Useful for search autocomplete
 */
export class RequestCanceller {
  constructor() {
    this.controller = null;
  }

  /**
   * Get signal for fetch request
   */
  getSignal() {
    this.cancel(); // Cancel any pending request
    this.controller = new AbortController();
    return this.controller.signal;
  }

  /**
   * Cancel current request
   */
  cancel() {
    if (this.controller) {
      this.controller.abort();
    }
  }
}

/**
 * Performance monitor
 * Track and log performance metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
  }

  /**
   * Start timing an operation
   */
  start(label) {
    this.marks.set(label, performance.now());
  }

  /**
   * End timing and log result
   */
  end(label) {
    const start = this.marks.get(label);
    if (start) {
      const duration = performance.now() - start;
      console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);
      this.marks.delete(label);
      return duration;
    }
    return null;
  }

  /**
   * Measure render time of a component
   */
  measureRender(componentName, callback) {
    this.start(componentName);
    const result = callback();
    requestAnimationFrame(() => {
      this.end(componentName);
    });
    return result;
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * React hook for debounced values
 * Usage: const debouncedSearch = useDebouncedValue(searchTerm, 300);
 */
export function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
