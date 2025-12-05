import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook to use Web Workers for background processing
 * @param {string} workerPath - Path to worker file
 * @returns {Object} Worker instance and helpers
 */
export function useWebWorker(workerPath) {
  const workerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)
  const taskIdRef = useRef(0)
  const pendingTasksRef = useRef(new Map())

  useEffect(() => {
    // Create worker
    try {
      workerRef.current = new Worker(workerPath)
      
      // Listen for messages from worker
      workerRef.current.onmessage = (event) => {
        const { id, status, result, error: workerError } = event.data
        const task = pendingTasksRef.current.get(id)
        
        if (task) {
          if (status === 'success') {
            task.resolve(result)
          } else {
            task.reject(new Error(workerError))
          }
          pendingTasksRef.current.delete(id)
        }
      }

      // Handle worker errors
      workerRef.current.onerror = (event) => {
        console.error('Worker error:', event)
        setError(event.message)
      }

      setIsReady(true)
    } catch (err) {
      console.error('Failed to create worker:', err)
      setError(err.message)
    }

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [workerPath])

  /**
   * Send task to worker and get result
   * @param {string} type - Task type
   * @param {any} data - Task data
   * @returns {Promise} Task result
   */
  const executeTask = useCallback((type, data) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }

      const id = taskIdRef.current++
      
      // Store promise handlers
      pendingTasksRef.current.set(id, { resolve, reject })

      // Send task to worker
      workerRef.current.postMessage({
        id,
        type,
        data
      })

      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingTasksRef.current.has(id)) {
          pendingTasksRef.current.delete(id)
          reject(new Error('Worker task timeout'))
        }
      }, 30000)
    })
  }, [])

  return {
    isReady,
    error,
    executeTask,
    terminate: () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        setIsReady(false)
      }
    }
  }
}

/**
 * Hook for analytics-specific calculations
 */
export function useAnalyticsWorker() {
  const { isReady, error, executeTask } = useWebWorker('/workers/analytics.worker.js')

  const calculateStatistics = useCallback((data) => {
    return executeTask('calculateStatistics', data)
  }, [executeTask])

  const filterAndSort = useCallback((items, filters, sortBy, sortOrder) => {
    return executeTask('filterAndSort', { items, filters, sortBy, sortOrder })
  }, [executeTask])

  const aggregateFinancials = useCallback((transactions, groupBy, period) => {
    return executeTask('aggregateFinancials', { transactions, groupBy, period })
  }, [executeTask])

  const predictTrends = useCallback((values, periods) => {
    return executeTask('predictTrends', { values, periods })
  }, [executeTask])

  const analyzePerformance = useCallback((metrics, baseline) => {
    return executeTask('analyzePerformance', { metrics, baseline })
  }, [executeTask])

  return {
    isReady,
    error,
    calculateStatistics,
    filterAndSort,
    aggregateFinancials,
    predictTrends,
    analyzePerformance
  }
}

/**
 * Hook for data processing with Web Worker
 * Falls back to main thread if worker fails
 */
export function useBackgroundProcessor(workerPath, fallbackFn) {
  const { isReady, error, executeTask } = useWebWorker(workerPath)
  const [isProcessing, setIsProcessing] = useState(false)

  const process = useCallback(async (type, data) => {
    setIsProcessing(true)
    try {
      if (isReady && !error) {
        // Use worker
        return await executeTask(type, data)
      } else {
        // Fallback to main thread
        console.warn('Worker not available, using fallback')
        return await fallbackFn(type, data)
      }
    } finally {
      setIsProcessing(false)
    }
  }, [isReady, error, executeTask, fallbackFn])

  return {
    process,
    isProcessing,
    workerAvailable: isReady && !error
  }
}

export default useWebWorker
