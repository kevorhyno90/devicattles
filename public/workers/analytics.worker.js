/**
 * Analytics Web Worker
 * Performs heavy computations in background thread
 * Keeps UI responsive during data processing
 */

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  const { type, data, id } = event.data

  try {
    let result

    switch (type) {
      case 'calculateStatistics':
        result = calculateStatistics(data)
        break
      
      case 'filterAndSort':
        result = filterAndSort(data)
        break
      
      case 'aggregateFinancials':
        result = aggregateFinancials(data)
        break
      
      case 'predictTrends':
        result = predictTrends(data)
        break
      
      case 'analyzePerformance':
        result = analyzePerformance(data)
        break
      
      default:
        throw new Error(`Unknown worker task: ${type}`)
    }

    // Send result back to main thread
    self.postMessage({
      id,
      type,
      status: 'success',
      result
    })

  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      id,
      type,
      status: 'error',
      error: error.message
    })
  }
})

/**
 * Calculate comprehensive statistics
 */
function calculateStatistics(data) {
  const { animals, crops, finance, inventory } = data
  
  const stats = {
    animals: {
      total: animals.length,
      active: animals.filter(a => a.status === 'Active').length,
      byBreed: groupBy(animals, 'breed'),
      bySex: groupBy(animals, 'sex'),
      avgWeight: average(animals.map(a => parseFloat(a.weight) || 0)),
      pregnant: animals.filter(a => a.pregnancyStatus === 'Pregnant').length
    },
    crops: {
      total: crops.length,
      active: crops.filter(c => c.status === 'Growing').length,
      totalArea: sum(crops.map(c => parseFloat(c.area) || 0)),
      byType: groupBy(crops, 'cropType'),
      avgHealth: average(crops.map(c => c.healthScore || 0))
    },
    finance: {
      totalIncome: sum(finance.filter(f => f.amount > 0).map(f => f.amount)),
      totalExpenses: sum(finance.filter(f => f.amount < 0).map(f => Math.abs(f.amount))),
      byCategory: groupFinanceByCategory(finance),
      recentTrend: calculateTrend(finance)
    },
    inventory: {
      totalItems: inventory.length,
      lowStock: inventory.filter(i => i.quantity <= i.minStock).length,
      outOfStock: inventory.filter(i => i.quantity === 0).length,
      totalValue: sum(inventory.map(i => (i.quantity || 0) * (i.unitPrice || 0)))
    }
  }

  return stats
}

/**
 * Filter and sort large datasets
 */
function filterAndSort(data) {
  const { items, filters, sortBy, sortOrder } = data
  
  // Apply filters
  let filtered = items.filter(item => {
    for (const [key, value] of Object.entries(filters)) {
      if (value && item[key] !== value) {
        return false
      }
    }
    return true
  })
  
  // Apply sorting
  if (sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      return sortOrder === 'asc' 
        ? aVal - bVal
        : bVal - aVal
    })
  }
  
  return filtered
}

/**
 * Aggregate financial data
 */
function aggregateFinancials(data) {
  const { transactions, groupBy: groupField, period } = data
  
  // Filter by period
  const filtered = filterByPeriod(transactions, period)
  
  // Group by specified field
  const grouped = {}
  filtered.forEach(tx => {
    const key = tx[groupField] || 'Uncategorized'
    if (!grouped[key]) {
      grouped[key] = {
        count: 0,
        income: 0,
        expense: 0,
        net: 0
      }
    }
    
    grouped[key].count++
    if (tx.amount > 0) {
      grouped[key].income += tx.amount
    } else {
      grouped[key].expense += Math.abs(tx.amount)
    }
    grouped[key].net += tx.amount
  })
  
  return grouped
}

/**
 * Predict trends using simple linear regression
 */
function predictTrends(data) {
  const { values, periods = 3 } = data
  
  if (values.length < 2) {
    return { predictions: [], confidence: 0 }
  }
  
  // Calculate linear regression
  const n = values.length
  const sumX = sum(values.map((_, i) => i))
  const sumY = sum(values)
  const sumXY = sum(values.map((y, i) => i * y))
  const sumX2 = sum(values.map((_, i) => i * i))
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Generate predictions
  const predictions = []
  for (let i = 0; i < periods; i++) {
    const x = n + i
    predictions.push(slope * x + intercept)
  }
  
  // Calculate R-squared for confidence
  const yMean = sumY / n
  const ssTotal = sum(values.map(y => Math.pow(y - yMean, 2)))
  const ssResidual = sum(values.map((y, i) => Math.pow(y - (slope * i + intercept), 2)))
  const rSquared = 1 - (ssResidual / ssTotal)
  
  return {
    predictions,
    confidence: Math.max(0, Math.min(100, rSquared * 100)),
    slope,
    intercept
  }
}

/**
 * Analyze performance metrics
 */
function analyzePerformance(data) {
  const { metrics, baseline } = data
  
  const analysis = {
    improvements: [],
    degradations: [],
    overall: 'stable'
  }
  
  for (const [key, value] of Object.entries(metrics)) {
    const baseValue = baseline[key]
    if (baseValue === undefined) continue
    
    const change = ((value - baseValue) / baseValue) * 100
    
    if (Math.abs(change) > 5) {
      const item = { metric: key, current: value, baseline: baseValue, change: change.toFixed(1) }
      
      if (change > 0) {
        analysis.improvements.push(item)
      } else {
        analysis.degradations.push(item)
      }
    }
  }
  
  if (analysis.improvements.length > analysis.degradations.length) {
    analysis.overall = 'improving'
  } else if (analysis.degradations.length > analysis.improvements.length) {
    analysis.overall = 'declining'
  }
  
  return analysis
}

// Helper functions
function groupBy(array, key) {
  return array.reduce((acc, item) => {
    const value = item[key] || 'Unknown'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function sum(array) {
  return array.reduce((a, b) => a + b, 0)
}

function average(array) {
  return array.length > 0 ? sum(array) / array.length : 0
}

function groupFinanceByCategory(transactions) {
  const grouped = {}
  transactions.forEach(tx => {
    const category = tx.category || 'Uncategorized'
    if (!grouped[category]) {
      grouped[category] = { income: 0, expense: 0, count: 0 }
    }
    grouped[category].count++
    if (tx.amount > 0) {
      grouped[category].income += tx.amount
    } else {
      grouped[category].expense += Math.abs(tx.amount)
    }
  })
  return grouped
}

function calculateTrend(transactions) {
  if (transactions.length < 2) return 'stable'
  
  const sorted = transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
  const recent = sorted.slice(-5)
  const older = sorted.slice(-10, -5)
  
  const recentAvg = average(recent.map(t => t.amount))
  const olderAvg = average(older.map(t => t.amount))
  
  const change = ((recentAvg - olderAvg) / Math.abs(olderAvg)) * 100
  
  if (change > 10) return 'increasing'
  if (change < -10) return 'decreasing'
  return 'stable'
}

function filterByPeriod(transactions, period) {
  const now = new Date()
  const cutoff = new Date()
  
  switch (period) {
    case 'week':
      cutoff.setDate(now.getDate() - 7)
      break
    case 'month':
      cutoff.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      cutoff.setMonth(now.getMonth() - 3)
      break
    case 'year':
      cutoff.setFullYear(now.getFullYear() - 1)
      break
    default:
      return transactions
  }
  
  return transactions.filter(tx => new Date(tx.date) >= cutoff)
}
