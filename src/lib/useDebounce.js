import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * Perfect for search inputs and filters
 * 
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default 300ms)
 * @returns {any} Debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * // Use debouncedSearch for API calls or expensive filtering
 * useEffect(() => {
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up on value change or unmount
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttling callbacks
 * Perfect for scroll events and window resize
 * 
 * @param {Function} callback - Function to throttle
 * @param {number} limit - Time limit in milliseconds (default 100ms)
 * @returns {Function} Throttled function
 */
export function useThrottle(callback, limit = 100) {
  const [ready, setReady] = useState(true);

  return (...args) => {
    if (ready) {
      callback(...args);
      setReady(false);
      setTimeout(() => {
        setReady(true);
      }, limit);
    }
  };
}
