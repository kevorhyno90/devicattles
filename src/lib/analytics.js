/**
 * Dashboard Analytics & KPI System
 * Calculates real-time statistics and key performance indicators
 * All data computed from local storage - fully offline
 */

import { loadData } from './storage'
import { getCachedData, setCachedData, invalidateCache } from './dataCache'

/**
 * Get total animals grouped by type
 */
export function getAnimalsByType() {
  // Try to get from cache first (5 minute TTL)
  const cacheKey = 'analytics:animalsByType'
  const cached = getCachedData(cacheKey, 5 * 60 * 1000)
  if (cached) return cached
  
  try {
    const animals = loadData('cattalytics:animals', [])
    // Ensure animals is an array
    if (!Array.isArray(animals)) {
      console.warn('Animals data is not an array:', typeof animals)
      return { total: 0, byType: {}, byStatus: {} }
    }
    
    const activeAnimals = animals.filter(a => a.status !== 'Sold' && a.status !== 'Deceased')
    
    const byType = {}
    activeAnimals.forEach(animal => {
      const type = animal.type || 'Unknown'
      byType[type] = (byType[type] || 0) + 1
    })
    
    const result = {
      total: activeAnimals.length,
      byType,
      byStatus: getAnimalsByStatus(activeAnimals)
    }
    
    // Cache the result
    setCachedData(cacheKey, result, 5 * 60 * 1000)
    return result
  } catch (error) {
    console.error('Error calculating animals by type:', error)
    return { total: 0, byType: {}, byStatus: {} }
  }
}

/**
 * Get animals grouped by status
 */
function getAnimalsByStatus(animals) {
  const byStatus = {}
  animals.forEach(animal => {
    const status = animal.status || 'Active'
    byStatus[status] = (byStatus[status] || 0) + 1
  })
  return byStatus
}

/**
 * Get breeding statistics
 */
export function getBreedingStats() {
  try {
    const breeding = loadData('cattalytics:animal:breeding', [])
    if (!Array.isArray(breeding)) {
      console.warn('Breeding data is not an array:', typeof breeding)
      return { totalPregnant: 0, dueNextMonth: 0, overdue: 0, successRate: 0 }
    }
    const now = new Date()
    
    // Pregnancies in progress
    const pregnant = breeding.filter(b => b.status === 'Pregnant' || b.status === 'Confirmed')
    
    // Due in next 30 days
    const dueNextMonth = pregnant.filter(b => {
      if (!b.dueDate) return false
      const dueDate = new Date(b.dueDate)
      const daysUntil = (dueDate - now) / (1000 * 60 * 60 * 24)
      return daysUntil >= 0 && daysUntil <= 30
    })
    
    // Overdue
    const overdue = pregnant.filter(b => {
      if (!b.dueDate) return false
      return new Date(b.dueDate) < now
    })
    
    return {
      totalPregnant: pregnant.length,
      dueNextMonth: dueNextMonth.length,
      overdue: overdue.length,
      successRate: calculateBreedingSuccessRate(breeding)
    }
  } catch (error) {
    console.error('Error calculating breeding stats:', error)
    return { totalPregnant: 0, dueNextMonth: 0, overdue: 0, successRate: 0 }
  }
}

/**
 * Calculate breeding success rate
 */
function calculateBreedingSuccessRate(breeding) {
  const completed = breeding.filter(b => b.status === 'Born' || b.status === 'Failed')
  if (completed.length === 0) return 0
  
  const successful = breeding.filter(b => b.status === 'Born').length
  return Math.round((successful / completed.length) * 100)
}

/**
 * Get health alerts and statistics
 */
export function getHealthAlerts() {
  try {
    const animals = loadData('cattalytics:animals', [])
    const treatments = loadData('cattalytics:animal:treatment', [])
    if (!Array.isArray(animals) || !Array.isArray(treatments)) {
      console.warn('Health data not arrays:', typeof animals, typeof treatments)
      return { critical: [], upcoming: [], overdue: [] }
    }
    const now = new Date()
    
    // Animals currently under treatment
    const underTreatment = new Set()
    treatments.forEach(t => {
      if (t.endDate && new Date(t.endDate) >= now) {
        underTreatment.add(t.animalId)
      }
    })
    
    // Treatments due today or overdue
    const dueTreatments = treatments.filter(t => {
      if (!t.nextDue) return false
      const nextDue = new Date(t.nextDue)
      return nextDue <= now
    })
    
    // Animals needing vaccination (example: every 6 months)
    const needsVaccination = animals.filter(a => {
      if (!a.lastVaccination) return true
      const lastVacc = new Date(a.lastVaccination)
      const monthsSince = (now - lastVacc) / (1000 * 60 * 60 * 24 * 30)
      return monthsSince >= 6
    })
    
    return {
      underTreatment: underTreatment.size,
      dueTreatments: dueTreatments.length,
      needsVaccination: needsVaccination.length,
      totalAlerts: dueTreatments.length + needsVaccination.length
    }
  } catch (error) {
    console.error('Error calculating health alerts:', error)
    return { underTreatment: 0, dueTreatments: 0, needsVaccination: 0, totalAlerts: 0 }
  }
}

/**
 * Get upcoming tasks statistics
 */
export function getUpcomingTasks() {
  try {
    const tasks = loadData('cattalytics:tasks', [])
    if (!Array.isArray(tasks)) {
      console.warn('Tasks data is not an array:', typeof tasks)
      return { today: [], thisWeek: [], overdue: [] }
    }
    const now = new Date()
    
    // Group by status
    const pending = tasks.filter(t => t.status === 'Pending')
    const inProgress = tasks.filter(t => t.status === 'In Progress')
    const completed = tasks.filter(t => t.status === 'Completed')
    
    // Due today
    const dueToday = tasks.filter(t => {
      if (t.status === 'Completed' || !t.dueDate) return false
      const dueDate = new Date(t.dueDate)
      return dueDate.toDateString() === now.toDateString()
    })
    
    // Due this week
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const dueThisWeek = tasks.filter(t => {
      if (t.status === 'Completed' || !t.dueDate) return false
      const dueDate = new Date(t.dueDate)
      return dueDate > now && dueDate <= weekFromNow
    })
    
    // Overdue
    const overdue = tasks.filter(t => {
      if (t.status === 'Completed' || !t.dueDate) return false
      return new Date(t.dueDate) < now
    })
    
    return {
      total: tasks.length,
      pending: pending.length,
      inProgress: inProgress.length,
      completed: completed.length,
      dueToday: dueToday.length,
      dueThisWeek: dueThisWeek.length,
      overdue: overdue.length,
      completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0
    }
  } catch (error) {
    console.error('Error calculating task stats:', error)
    return { total: 0, pending: 0, inProgress: 0, completed: 0, dueToday: 0, dueThisWeek: 0, overdue: 0, completionRate: 0 }
  }
}

/**
 * Get financial summary
 */
export function getFinancialSummary(period = 'month') {
  try {
    const transactions = loadData('cattalytics:finance', [])
    if (!Array.isArray(transactions)) {
      console.warn('Transactions data is not an array:', typeof transactions)
      return { income: 0, expenses: 0, profit: 0, transactionCount: 0 }
    }
    const now = new Date()
    
    // Calculate date range based on period
    let startDate
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    
    // Filter transactions in period
    const periodTransactions = transactions.filter(t => {
      const transDate = new Date(t.date)
      return transDate >= startDate && transDate <= now
    })
    
    // Calculate totals
    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
    
    const expenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
    
    // Get all-time totals
    const allTimeIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
    
    const allTimeExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
    
    return {
      period,
      income,
      expenses,
      netProfit: income - expenses,
      profitMargin: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
      transactionCount: periodTransactions.length,
      allTime: {
        income: allTimeIncome,
        expenses: allTimeExpenses,
        netProfit: allTimeIncome - allTimeExpenses
      }
    }
  } catch (error) {
    console.error('Error calculating financial summary:', error)
    return { period, income: 0, expenses: 0, netProfit: 0, profitMargin: 0, transactionCount: 0, allTime: { income: 0, expenses: 0, netProfit: 0 } }
  }
}

/**
 * Get feed cost trending data
 */
export function getFeedCostTrends(months = 6) {
  try {
    const transactions = loadData('cattalytics:finance', [])
    if (!Array.isArray(transactions)) {
      console.warn('Transactions data is not an array:', typeof transactions)
      return []
    }
    const now = new Date()
    
    // Filter feed-related expenses
    const feedTransactions = transactions.filter(t => 
      t.type === 'expense' && 
      (t.category === 'Feed' || (t.description && t.description.toLowerCase().includes('feed')))
    )
    
    // Group by month
    const monthlyData = []
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthTransactions = feedTransactions.filter(t => {
        const transDate = new Date(t.date)
        return transDate >= monthDate && transDate <= monthEnd
      })
      
      const total = monthTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
      
      monthlyData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: total,
        count: monthTransactions.length
      })
    }
    
    // Calculate average and trend
    const totalCost = monthlyData.reduce((sum, m) => sum + m.amount, 0)
    const avgMonthly = totalCost / months
    
    // Simple trend calculation (comparing first half vs second half)
    const firstHalf = monthlyData.slice(0, Math.floor(months / 2))
    const secondHalf = monthlyData.slice(Math.floor(months / 2))
    
    const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.amount, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.amount, 0) / secondHalf.length
    
    const trendPercent = firstHalfAvg > 0 
      ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
      : 0
    
    return {
      monthlyData,
      avgMonthly,
      totalCost,
      trend: trendPercent > 0 ? 'increasing' : trendPercent < 0 ? 'decreasing' : 'stable',
      trendPercent: Math.abs(trendPercent)
    }
  } catch (error) {
    console.error('Error calculating feed cost trends:', error)
    return { monthlyData: [], avgMonthly: 0, totalCost: 0, trend: 'stable', trendPercent: 0 }
  }
}

/**
 * Get inventory alerts (low stock items)
 */
export function getInventoryAlerts(lowThreshold = 10, criticalThreshold = 5) {
  try {
    const inventory = loadData('cattalytics:inventory', [])
    if (!Array.isArray(inventory)) {
      console.warn('Inventory data is not an array:', typeof inventory)
      return { lowStock: [], outOfStock: [], expiringSoon: [] }
    }
    
    const lowStock = inventory.filter(item => {
      const quantity = parseFloat(item.quantity) || 0
      return quantity > 0 && quantity <= lowThreshold && quantity > criticalThreshold
    })
    
    const criticalStock = inventory.filter(item => {
      const quantity = parseFloat(item.quantity) || 0
      return quantity > 0 && quantity <= criticalThreshold
    })
    
    const outOfStock = inventory.filter(item => {
      const quantity = parseFloat(item.quantity) || 0
      return quantity <= 0
    })
    
    return {
      lowStock: lowStock.length,
      criticalStock: criticalStock.length,
      outOfStock: outOfStock.length,
      totalAlerts: lowStock.length + criticalStock.length + outOfStock.length,
      items: {
        low: lowStock,
        critical: criticalStock,
        out: outOfStock
      }
    }
  } catch (error) {
    console.error('Error calculating inventory alerts:', error)
    return { lowStock: 0, criticalStock: 0, outOfStock: 0, totalAlerts: 0, items: { low: [], critical: [], out: [] } }
  }
}

/**
 * Get milk production statistics
 */
export function getMilkProductionStats(period = 'month') {
  try {
    const milkYield = loadData('cattalytics:animal:milkyield', [])
    if (!Array.isArray(milkYield)) {
      console.warn('MilkYield data is not an array:', typeof milkYield)
      return { period, totalMilk: 0, avgDaily: 0, producingAnimals: 0, recordCount: 0 }
    }
    const now = new Date()
    
    // Calculate date range
    let startDate
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    
    // Filter records in period
    const periodRecords = milkYield.filter(r => {
      const recordDate = new Date(r.date)
      return recordDate >= startDate && recordDate <= now
    })
    
    // Calculate totals
    const totalMilk = periodRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    const avgDaily = totalMilk / Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)))
    
    // Get unique animals producing
    const producingAnimals = new Set(periodRecords.map(r => r.animalId)).size
    
    return {
      period,
      totalMilk,
      avgDaily,
      producingAnimals,
      recordCount: periodRecords.length
    }
  } catch (error) {
    console.error('Error calculating milk production stats:', error)
    return { period, totalMilk: 0, avgDaily: 0, producingAnimals: 0, recordCount: 0 }
  }
}

/**
 * Get herd cost-per-animal KPIs from finance + active herd size
 */
export function getCostPerAnimalStats(period = 'month') {
  try {
    const animals = loadData('cattalytics:animals', [])
    const transactions = loadData('cattalytics:finance', [])

    if (!Array.isArray(animals) || !Array.isArray(transactions)) {
      return {
        period,
        activeAnimals: 0,
        totalExpenses: 0,
        perAnimalPeriod: 0,
        perAnimalDaily: 0,
        feedPerAnimal: 0,
        vetPerAnimal: 0
      }
    }

    const activeAnimals = animals.filter(a => a.status !== 'Sold' && a.status !== 'Deceased')
    const herdCount = activeAnimals.length
    if (herdCount === 0) {
      return {
        period,
        activeAnimals: 0,
        totalExpenses: 0,
        perAnimalPeriod: 0,
        perAnimalDaily: 0,
        feedPerAnimal: 0,
        vetPerAnimal: 0
      }
    }

    const now = new Date()
    let startDate
    let periodDays

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        periodDays = 7
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        periodDays = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)))
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        periodDays = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)))
        break
    }

    const periodExpenses = transactions.filter(t => {
      if (t.type !== 'expense') return false
      const txDate = new Date(t.date)
      return txDate >= startDate && txDate <= now
    })

    const totalExpenses = periodExpenses.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
    const feedExpenses = periodExpenses
      .filter(t => (t.category || '').toLowerCase() === 'feed')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
    const vetExpenses = periodExpenses
      .filter(t => {
        const cat = (t.category || '').toLowerCase()
        return cat === 'veterinary' || cat === 'health'
      })
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)

    return {
      period,
      activeAnimals: herdCount,
      totalExpenses,
      perAnimalPeriod: totalExpenses / herdCount,
      perAnimalDaily: totalExpenses / herdCount / periodDays,
      feedPerAnimal: feedExpenses / herdCount,
      vetPerAnimal: vetExpenses / herdCount
    }
  } catch (error) {
    console.error('Error calculating cost per animal stats:', error)
    return {
      period,
      activeAnimals: 0,
      totalExpenses: 0,
      perAnimalPeriod: 0,
      perAnimalDaily: 0,
      feedPerAnimal: 0,
      vetPerAnimal: 0
    }
  }
}

/**
 * Get focused vaccination list for dashboard triage
 */
export function getVaccinationFocus(limit = 5) {
  try {
    const animals = loadData('cattalytics:animals', [])
    if (!Array.isArray(animals)) {
      return { overdue: [], dueSoon: [], missing: [] }
    }

    const today = new Date()
    const overdue = []
    const dueSoon = []
    const missing = []

    animals.forEach((animal) => {
      if (animal.status === 'Sold' || animal.status === 'Deceased') return

      const label = animal.name || animal.tag || animal.tagNumber || animal.id || 'Unknown animal'
      if (!animal.lastVaccination) {
        missing.push({ animalId: animal.id, label })
        return
      }

      const lastVax = new Date(animal.lastVaccination)
      if (Number.isNaN(lastVax.getTime())) {
        missing.push({ animalId: animal.id, label })
        return
      }

      const daysSince = Math.floor((today - lastVax) / (1000 * 60 * 60 * 24))
      if (daysSince > 180) {
        overdue.push({
          animalId: animal.id,
          label,
          daysOverdue: daysSince - 180,
          lastVaccination: animal.lastVaccination
        })
      } else if (daysSince >= 173) {
        dueSoon.push({
          animalId: animal.id,
          label,
          daysUntilDue: 180 - daysSince,
          lastVaccination: animal.lastVaccination
        })
      }
    })

    overdue.sort((a, b) => b.daysOverdue - a.daysOverdue)
    dueSoon.sort((a, b) => a.daysUntilDue - b.daysUntilDue)

    return {
      overdue: overdue.slice(0, limit),
      dueSoon: dueSoon.slice(0, limit),
      missing: missing.slice(0, limit),
      totals: {
        overdue: overdue.length,
        dueSoon: dueSoon.length,
        missing: missing.length
      }
    }
  } catch (error) {
    console.error('Error getting vaccination focus:', error)
    return { overdue: [], dueSoon: [], missing: [], totals: { overdue: 0, dueSoon: 0, missing: 0 } }
  }
}

/**
 * Get lactation trend and top producers from recent milk records
 */
export function getLactationCurveStats(windowDays = 30) {
  try {
    const milkRecords = loadData('cattalytics:animal:milkyield', [])
    const animals = loadData('cattalytics:animals', [])
    if (!Array.isArray(milkRecords)) {
      return { totalMilk: 0, avgDaily: 0, trend: 'stable', trendPercent: 0, topProducers: [] }
    }

    const animalNameById = new Map()
    if (Array.isArray(animals)) {
      animals.forEach((a) => animalNameById.set(a.id, a.name || a.tag || a.tagNumber || a.id))
    }

    const now = new Date()
    const start = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)

    const recent = milkRecords.filter((r) => {
      if (!r?.date) return false
      const d = new Date(r.date)
      return !Number.isNaN(d.getTime()) && d >= start && d <= now
    })

    const totalMilk = recent.reduce((sum, r) => sum + (parseFloat(r.amount) || parseFloat(r.quantity) || 0), 0)
    const avgDaily = totalMilk / Math.max(1, windowDays)

    const byAnimal = new Map()
    recent.forEach((r) => {
      const key = r.animalId || 'unknown'
      const current = byAnimal.get(key) || { animalId: key, total: 0, records: 0 }
      current.total += parseFloat(r.amount) || parseFloat(r.quantity) || 0
      current.records += 1
      byAnimal.set(key, current)
    })

    const topProducers = Array.from(byAnimal.values())
      .map((item) => ({
        ...item,
        label: animalNameById.get(item.animalId) || item.animalId,
        avgPerRecord: item.records > 0 ? item.total / item.records : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const last7 = recent
      .filter((r) => {
        const d = new Date(r.date)
        return d >= sevenDaysAgo && d <= now
      })
      .reduce((sum, r) => sum + (parseFloat(r.amount) || parseFloat(r.quantity) || 0), 0)

    const previous7 = recent
      .filter((r) => {
        const d = new Date(r.date)
        return d >= fourteenDaysAgo && d < sevenDaysAgo
      })
      .reduce((sum, r) => sum + (parseFloat(r.amount) || parseFloat(r.quantity) || 0), 0)

    const rawTrend = previous7 > 0 ? ((last7 - previous7) / previous7) * 100 : 0
    const trend = rawTrend > 3 ? 'up' : rawTrend < -3 ? 'down' : 'stable'

    return {
      totalMilk,
      avgDaily,
      trend,
      trendPercent: Math.round(Math.abs(rawTrend)),
      topProducers,
      records: recent.length,
      windowDays
    }
  } catch (error) {
    console.error('Error calculating lactation curve stats:', error)
    return { totalMilk: 0, avgDaily: 0, trend: 'stable', trendPercent: 0, topProducers: [], records: 0, windowDays }
  }
}

/**
 * Week 2: Weight gain/loss velocity across herd
 */
export function getWeightVelocityStats(limit = 5) {
  try {
    const measurements = loadData('cattalytics:animal:measurement', [])
    const animals = loadData('cattalytics:animals', [])
    const targetWeights = loadData('cattalytics:animal:targetWeight', {})

    if (!Array.isArray(measurements) || !Array.isArray(animals)) {
      return { topGainers: [], bottomGainers: [], alertAnimals: [], avgGainRate: 0, total: 0 }
    }

    const nameById = new Map()
    animals.forEach(a => nameById.set(a.id, a.name || a.tag || a.tagNumber || a.id))

    const weightRecords = measurements
      .filter(r => r.type === 'Weight' && r.value && r.animalId && r.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    const byAnimal = new Map()
    weightRecords.forEach(r => {
      const list = byAnimal.get(r.animalId) || []
      list.push({ date: new Date(r.date), value: parseFloat(r.value) || 0, bcs: parseFloat(r.bcs) || null })
      byAnimal.set(r.animalId, list)
    })

    const velocities = []
    byAnimal.forEach((records, animalId) => {
      if (records.length < 2) return
      const first = records[0]
      const last = records[records.length - 1]
      const daysDiff = Math.max(1, (last.date - first.date) / (1000 * 60 * 60 * 24))
      const weightChange = last.value - first.value
      const ratePerMonth = (weightChange / daysDiff) * 30
      const target = targetWeights && targetWeights[animalId] ? parseFloat(targetWeights[animalId]) : null
      const targetDeviation = target ? ((last.value - target) / target) * 100 : null

      velocities.push({
        animalId,
        label: nameById.get(animalId) || animalId,
        firstWeight: first.value,
        latestWeight: last.value,
        weightChange: Math.round(weightChange * 10) / 10,
        ratePerMonth: Math.round(ratePerMonth * 10) / 10,
        daysDiff: Math.round(daysDiff),
        records: records.length,
        latestBcs: last.bcs,
        targetDeviation: targetDeviation !== null ? Math.round(targetDeviation) : null,
        alert: ratePerMonth < -5 || (targetDeviation !== null && targetDeviation < -15)
      })
    })

    velocities.sort((a, b) => b.ratePerMonth - a.ratePerMonth)
    const avgGainRate = velocities.length > 0
      ? Math.round((velocities.reduce((s, v) => s + v.ratePerMonth, 0) / velocities.length) * 10) / 10
      : 0

    return {
      topGainers: velocities.slice(0, limit),
      bottomGainers: velocities.slice(-limit).reverse(),
      alertAnimals: velocities.filter(v => v.alert).slice(0, limit),
      avgGainRate,
      total: velocities.length
    }
  } catch (error) {
    console.error('Error calculating weight velocity stats:', error)
    return { topGainers: [], bottomGainers: [], alertAnimals: [], avgGainRate: 0, total: 0 }
  }
}

/**
 * Week 2: Smart inventory reorder recommendations
 */
export function getInventoryReorderInsights() {
  try {
    const inventory = loadData('cattalytics:inventory', [])
    if (!Array.isArray(inventory)) {
      return { needsReorder: [], critical: [], total: 0, totalReorderCost: 0 }
    }

    const needsReorder = []
    const critical = []

    inventory.forEach(item => {
      const qty = parseFloat(item.quantity) || 0
      const reorderPoint = parseFloat(item.reorderPoint) || 0
      const reorderQty = parseFloat(item.reorderQuantity) || 0
      const unitCost = parseFloat(item.unitCost) || 0

      if (reorderPoint <= 0) return

      const reorderCost = reorderQty * unitCost
      const entry = {
        id: item.id,
        name: item.name,
        category: item.category || 'Other',
        quantity: qty,
        unit: item.unit || '',
        reorderPoint,
        reorderQty,
        reorderCost,
        unitCost,
        shortage: Math.max(0, reorderPoint - qty),
        supplier: item.supplier || '',
        location: item.location || ''
      }

      if (qty <= 0) {
        critical.push(entry)
      } else if (qty <= reorderPoint) {
        needsReorder.push(entry)
      }
    })

    needsReorder.sort((a, b) => b.shortage - a.shortage)
    const totalReorderCost = [...critical, ...needsReorder]
      .reduce((s, i) => s + (i.reorderCost || 0), 0)

    return {
      needsReorder,
      critical,
      total: needsReorder.length + critical.length,
      totalReorderCost
    }
  } catch (error) {
    console.error('Error calculating inventory reorder insights:', error)
    return { needsReorder: [], critical: [], total: 0, totalReorderCost: 0 }
  }
}

/**
 * Week 2: Milk quality composition stats (fat%, protein%, SCC, grade)
 */
export function getMilkCompositionStats(windowDays = 14) {
  try {
    const milkRecords = loadData('cattalytics:animal:milkyield', [])
    const animals = loadData('cattalytics:animals', [])
    if (!Array.isArray(milkRecords)) {
      return { avgFat: 0, avgProtein: 0, avgSNF: 0, avgSCC: 0, gradeBreakdown: {}, flaggedAnimals: [], records: 0, windowDays }
    }

    const nameById = new Map()
    if (Array.isArray(animals)) {
      animals.forEach(a => nameById.set(a.id, a.name || a.tag || a.id))
    }

    const now = new Date()
    const start = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)

    const recent = milkRecords.filter(r => {
      if (!r?.date) return false
      const d = new Date(r.date)
      return !isNaN(d) && d >= start && d <= now
    })

    if (recent.length === 0) {
      return { avgFat: 0, avgProtein: 0, avgSNF: 0, avgSCC: 0, gradeBreakdown: {}, flaggedAnimals: [], records: 0, windowDays }
    }

    const withFat = recent.filter(r => (r.fatContent || 0) > 0)
    const withProtein = recent.filter(r => (r.proteinContent || 0) > 0)
    const withSNF = recent.filter(r => (r.solidsNotFat || 0) > 0)
    const withSCC = recent.filter(r => (r.scc || 0) > 0)

    const avgFat = withFat.length > 0
      ? Math.round((withFat.reduce((s, r) => s + r.fatContent, 0) / withFat.length) * 100) / 100 : 0
    const avgProtein = withProtein.length > 0
      ? Math.round((withProtein.reduce((s, r) => s + r.proteinContent, 0) / withProtein.length) * 100) / 100 : 0
    const avgSNF = withSNF.length > 0
      ? Math.round((withSNF.reduce((s, r) => s + r.solidsNotFat, 0) / withSNF.length) * 100) / 100 : 0
    const avgSCC = withSCC.length > 0
      ? Math.round(withSCC.reduce((s, r) => s + r.scc, 0) / withSCC.length) : 0

    const gradeBreakdown = {}
    recent.forEach(r => {
      if (r.quality) gradeBreakdown[r.quality] = (gradeBreakdown[r.quality] || 0) + 1
    })

    const byAnimal = new Map()
    recent.forEach(r => {
      if (!r.animalId) return
      const cur = byAnimal.get(r.animalId) || { sccSum: 0, sccCount: 0, fatSum: 0, fatCount: 0 }
      if (r.scc > 0) { cur.sccSum += r.scc; cur.sccCount++ }
      if (r.fatContent > 0) { cur.fatSum += r.fatContent; cur.fatCount++ }
      byAnimal.set(r.animalId, cur)
    })

    const flaggedAnimals = []
    byAnimal.forEach((stats, animalId) => {
      const animalAvgSCC = stats.sccCount > 0 ? stats.sccSum / stats.sccCount : 0
      const animalAvgFat = stats.fatCount > 0 ? stats.fatSum / stats.fatCount : 0
      const flags = []
      if (animalAvgSCC > 400000) flags.push('High SCC')
      if (animalAvgFat > 0 && animalAvgFat < 3.0) flags.push('Low Fat%')
      if (flags.length > 0) {
        flaggedAnimals.push({ animalId, label: nameById.get(animalId) || animalId, avgSCC: Math.round(animalAvgSCC), avgFat: Math.round(animalAvgFat * 100) / 100, flags })
      }
    })

    return { avgFat, avgProtein, avgSNF, avgSCC, gradeBreakdown, flaggedAnimals: flaggedAnimals.slice(0, 5), records: recent.length, windowDays }
  } catch (error) {
    console.error('Error calculating milk composition stats:', error)
    return { avgFat: 0, avgProtein: 0, avgSNF: 0, avgSCC: 0, gradeBreakdown: {}, flaggedAnimals: [], records: 0, windowDays }
  }
}

/**
 * Week 2: Breeding readiness — animals near heat window
 */
export function getBreedingReadinessStats() {
  try {
    const animals = loadData('cattalytics:animals', [])
    const breedingRecords = loadData('cattalytics:animal:breeding', [])

    if (!Array.isArray(animals)) {
      return { readyNow: [], readySoon: [], totalHeats: 0 }
    }

    const now = new Date()
    const HEAT_CYCLE = 21

    const latestBreeding = new Map()
    if (Array.isArray(breedingRecords)) {
      breedingRecords.forEach(r => {
        if (!r.animalId || !r.date) return
        const existing = latestBreeding.get(r.animalId)
        if (!existing || new Date(r.date) > new Date(existing.date)) {
          latestBreeding.set(r.animalId, r)
        }
      })
    }

    const pregnantAnimalIds = new Set()
    if (Array.isArray(breedingRecords)) {
      breedingRecords
        .filter(r => r.status === 'Pregnant' || r.status === 'Confirmed')
        .forEach(r => pregnantAnimalIds.add(r.animalId))
    }

    const readyNow = []
    const readySoon = []
    const breedableTypes = new Set(['Cattle', 'Goat', 'Sheep', 'Pig', 'Buffalo', 'Cow'])

    animals
      .filter(a => a.status !== 'Sold' && a.status !== 'Deceased')
      .filter(a => breedableTypes.has(a.type))
      .filter(a => !a.gender || a.gender === 'Female' || a.gender === 'female')
      .forEach(animal => {
        if (pregnantAnimalIds.has(animal.id)) return
        const label = animal.name || animal.tag || animal.id
        const latest = latestBreeding.get(animal.id)

        if (!latest) {
          readyNow.push({ animalId: animal.id, label, reason: 'No prior breeding record', daysToHeat: 0, type: animal.type })
          return
        }

        const daysSince = Math.floor((now - new Date(latest.date)) / (1000 * 60 * 60 * 24))
        const nextHeatIn = HEAT_CYCLE - (daysSince % HEAT_CYCLE)

        if (nextHeatIn <= 3) {
          readyNow.push({ animalId: animal.id, label, reason: 'Heat expected ≤3 days', daysToHeat: nextHeatIn, type: animal.type })
        } else if (nextHeatIn <= 7) {
          readySoon.push({ animalId: animal.id, label, reason: `Heat in ~${nextHeatIn} days`, daysToHeat: nextHeatIn, type: animal.type })
        }
      })

    readyNow.sort((a, b) => a.daysToHeat - b.daysToHeat)
    readySoon.sort((a, b) => a.daysToHeat - b.daysToHeat)

    return { readyNow: readyNow.slice(0, 5), readySoon: readySoon.slice(0, 5), totalHeats: readyNow.length + readySoon.length }
  } catch (error) {
    console.error('Error calculating breeding readiness:', error)
    return { readyNow: [], readySoon: [], totalHeats: 0 }
  }
}

/**
 * Week 2: Health Risk Scores — predict which animals are most at risk
 */
export function getHealthRiskScores(limit = 5) {
  try {
    const animals = loadData('cattalytics:animals', [])
    const treatments = loadData('cattalytics:animal:treatment', [])
    const measurements = loadData('cattalytics:animal:measurement', [])

    if (!Array.isArray(animals)) {
      return { atRisk: [], highRiskCount: 0, avgScore: 0 }
    }

    const now = new Date()

    const latestMeasurement = new Map()
    if (Array.isArray(measurements)) {
      measurements
        .filter(m => m.type === 'Weight' && m.animalId && m.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(m => { if (!latestMeasurement.has(m.animalId)) latestMeasurement.set(m.animalId, m) })
    }

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentTreatments = new Map()
    if (Array.isArray(treatments)) {
      treatments
        .filter(t => t.animalId && t.date && new Date(t.date) >= thirtyDaysAgo)
        .forEach(t => recentTreatments.set(t.animalId, (recentTreatments.get(t.animalId) || 0) + 1))
    }

    const scores = []
    animals
      .filter(a => a.status !== 'Sold' && a.status !== 'Deceased')
      .forEach(animal => {
        let score = 0
        const factors = []

        // Vaccination overdue (0-40 pts)
        if (!animal.lastVaccination) {
          score += 40; factors.push('No vaccination record')
        } else {
          const daysSince = Math.floor((now - new Date(animal.lastVaccination)) / (1000 * 60 * 60 * 24))
          if (daysSince > 180) {
            const pts = Math.min(40, Math.round((daysSince - 180) / 4))
            score += pts; factors.push(`Vaccination ${daysSince - 180}d overdue`)
          }
        }

        // Low BCS (0-30 pts)
        const meas = latestMeasurement.get(animal.id)
        if (meas) {
          const bcs = parseFloat(meas.bcs)
          if (!isNaN(bcs)) {
            if (bcs <= 2.0) { score += 30; factors.push('Very low BCS ≤2.0') }
            else if (bcs <= 2.5) { score += 20; factors.push('Low BCS ≤2.5') }
            else if (bcs <= 3.0) { score += 10; factors.push('Below-ideal BCS') }
          }
        }

        // Recent treatments (0-30 pts)
        const txCount = recentTreatments.get(animal.id) || 0
        if (txCount >= 3) { score += 30; factors.push(`${txCount} treatments in 30d`) }
        else if (txCount === 2) { score += 20; factors.push('2 treatments in 30d') }
        else if (txCount === 1) { score += 10; factors.push('1 treatment in 30d') }

        if (score > 0) {
          scores.push({ animalId: animal.id, label: animal.name || animal.tag || animal.id, score: Math.min(100, score), factors, type: animal.type || 'Unknown' })
        }
      })

    scores.sort((a, b) => b.score - a.score)
    const highRiskCount = scores.filter(s => s.score >= 50).length
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, a) => s + a.score, 0) / scores.length) : 0

    return { atRisk: scores.slice(0, limit), highRiskCount, avgScore }
  } catch (error) {
    console.error('Error calculating health risk scores:', error)
    return { atRisk: [], highRiskCount: 0, avgScore: 0 }
  }
}

/**
 * Week 3: Cash runway from net cash and recent burn rate
 */
export function getCashRunwayStats(windowDays = 90, thresholds = {}) {
  try {
    const transactions = loadData('cattalytics:finance', [])
    if (!Array.isArray(transactions)) {
      return { cashBalance: 0, avgDailyExpense: 0, monthlyBurn: 0, runwayDays: 0, status: 'unknown' }
    }

    const now = new Date()
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)

    const incomeAllTime = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)

    const expenseAllTime = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)

    const recentExpenses = transactions
      .filter((t) => {
        if (t.type !== 'expense') return false
        const d = new Date(t.date)
        return !Number.isNaN(d.getTime()) && d >= windowStart && d <= now
      })
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)

    const cashBalance = incomeAllTime - expenseAllTime
    const avgDailyExpense = recentExpenses / Math.max(1, windowDays)
    const monthlyBurn = avgDailyExpense * 30
    const runwayDays = avgDailyExpense > 0 ? cashBalance / avgDailyExpense : 0

    const warningDays = Number(thresholds.warningDays) > 0 ? Number(thresholds.warningDays) : 30
    const criticalDays = Number(thresholds.criticalDays) > 0 ? Number(thresholds.criticalDays) : 14

    let status = 'stable'
    if (cashBalance <= 0) status = 'negative'
    else if (runwayDays < criticalDays) status = 'critical'
    else if (runwayDays < warningDays) status = 'warning'

    return {
      cashBalance,
      avgDailyExpense,
      monthlyBurn,
      runwayDays: Number.isFinite(runwayDays) ? runwayDays : 0,
      status,
      windowDays,
      warningDays,
      criticalDays
    }
  } catch (error) {
    console.error('Error calculating cash runway stats:', error)
    return { cashBalance: 0, avgDailyExpense: 0, monthlyBurn: 0, runwayDays: 0, status: 'unknown', windowDays }
  }
}

/**
 * Week 3: Task execution pressure and short-horizon workload
 */
export function getTaskExecutionPulse(hoursAhead = 48) {
  try {
    const tasks = loadData('cattalytics:tasks', [])
    if (!Array.isArray(tasks)) {
      return { totalOpen: 0, highPriorityOpen: 0, dueSoon: 0, overdue: 0, nextDue: [] }
    }

    const now = new Date()
    const soon = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)

    const isCompleted = (task) => task.done === true || (task.status || '').toLowerCase() === 'completed'
    const getDueDate = (task) => {
      const raw = task.dueDate || task.due || task.date
      if (!raw) return null
      const d = new Date(raw)
      return Number.isNaN(d.getTime()) ? null : d
    }

    const openTasks = tasks.filter((task) => !isCompleted(task))
    const highPriorityOpen = openTasks.filter((task) => {
      const priority = (task.priority || '').toLowerCase()
      return priority === 'high' || priority === 'urgent'
    })

    const dueSoon = openTasks.filter((task) => {
      const due = getDueDate(task)
      return due && due >= now && due <= soon
    })

    const overdue = openTasks.filter((task) => {
      const due = getDueDate(task)
      return due && due < now
    })

    const nextDue = openTasks
      .map((task) => ({
        id: task.id,
        title: task.title || task.name || 'Untitled task',
        priority: task.priority || 'Medium',
        due: getDueDate(task)
      }))
      .filter((task) => task.due)
      .sort((a, b) => a.due - b.due)
      .slice(0, 5)
      .map((task) => ({ ...task, due: task.due.toISOString().slice(0, 10) }))

    return {
      totalOpen: openTasks.length,
      highPriorityOpen: highPriorityOpen.length,
      dueSoon: dueSoon.length,
      overdue: overdue.length,
      nextDue,
      hoursAhead
    }
  } catch (error) {
    console.error('Error calculating task execution pulse:', error)
    return { totalOpen: 0, highPriorityOpen: 0, dueSoon: 0, overdue: 0, nextDue: [], hoursAhead }
  }
}

/**
 * Week 3: Inventory days-left coverage for consumables
 */
export function getInventoryCoverageStats(daysThreshold = 14) {
  try {
    const inventory = loadData('cattalytics:inventory', [])
    if (!Array.isArray(inventory)) {
      return { tracked: 0, atRisk: 0, critical: 0, items: [] }
    }

    const items = inventory
      .map((item) => {
        const quantity = parseFloat(item.quantity) || 0
        const usagePerDay = parseFloat(item.usagePerDay) || 0
        const usagePerMonth = parseFloat(item.usagePerMonth) || 0
        const dailyUse = usagePerDay > 0 ? usagePerDay : (usagePerMonth > 0 ? usagePerMonth / 30 : 0)

        if (dailyUse <= 0) return null

        const daysLeft = quantity / dailyUse
        return {
          id: item.id,
          name: item.name || 'Unnamed item',
          category: item.category || 'Other',
          quantity,
          unit: item.unit || '',
          dailyUse,
          daysLeft
        }
      })
      .filter(Boolean)

    const atRiskItems = items
      .filter((item) => item.daysLeft <= daysThreshold)
      .sort((a, b) => a.daysLeft - b.daysLeft)

    const criticalItems = atRiskItems.filter((item) => item.daysLeft <= 7)

    return {
      tracked: items.length,
      atRisk: atRiskItems.length,
      critical: criticalItems.length,
      items: atRiskItems.slice(0, 5),
      daysThreshold
    }
  } catch (error) {
    console.error('Error calculating inventory coverage stats:', error)
    return { tracked: 0, atRisk: 0, critical: 0, items: [], daysThreshold }
  }
}

/**
 * Get comprehensive dashboard data from ALL modules
 */
export function getDashboardData(options = {}) {
  const week3 = options.week3 || {}
  const cashWindowDays = Number(week3.cashWindowDays) > 0 ? Number(week3.cashWindowDays) : 90
  const taskDueHours = Number(week3.taskDueHours) > 0 ? Number(week3.taskDueHours) : 48
  const inventoryRiskDays = Number(week3.inventoryRiskDays) > 0 ? Number(week3.inventoryRiskDays) : 14

  // Mini-trend: last 6 months of cash runway
  const finance = getFinancialSummary('month')
  const transactions = loadData('cattalytics:finance', [])
  const now = new Date()
  const runwayHistory = []
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthTrans = transactions.filter(t => {
      const d = new Date(t.date)
      return d >= monthDate && d <= monthEnd
    })
    const income = monthTrans.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(parseFloat(t.amount) || 0), 0)
    const expense = monthTrans.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(parseFloat(t.amount) || 0), 0)
    const cashBalance = income - expense
    const avgDailyExpense = expense / Math.max(1, (monthEnd - monthDate) / (1000 * 60 * 60 * 24))
    const runway = avgDailyExpense > 0 ? cashBalance / avgDailyExpense : 0
    runwayHistory.push({ label: monthDate.toLocaleDateString('en-US', { month: 'short' }), value: Math.round(runway) })
  }
  finance.runwayHistory = runwayHistory

  // Mini-trend: last 6 weeks of overdue tasks
  const tasks = getUpcomingTasks()
  const allTasks = loadData('cattalytics:tasks', [])
  const overdueHistory = []
  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7))
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7) + 6)
    const weekTasks = allTasks.filter(t => {
      if (!t.dueDate) return false
      const d = new Date(t.dueDate)
      return d >= weekStart && d <= weekEnd && (t.status !== 'Completed' && t.status !== 'completed' && t.done !== true)
    })
    overdueHistory.push({ label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: weekTasks.length })
  }
  tasks.overdueHistory = overdueHistory

  return {
    animals: getAnimalsByType(),
    breeding: getBreedingStats(),
    health: getHealthAlerts(),
    tasks,
    finance,
    costPerAnimal: getCostPerAnimalStats('month'),
    feedCosts: getFeedCostTrends(6),
    inventory: getInventoryAlerts(),
    milkProduction: getMilkProductionStats('month'),
    lactation: getLactationCurveStats(30),
    vaccinationFocus: getVaccinationFocus(5),
    // Week 2: advanced insights
    weightVelocity: getWeightVelocityStats(5),
    inventoryReorder: getInventoryReorderInsights(),
    milkComposition: getMilkCompositionStats(14),
    breedingReadiness: getBreedingReadinessStats(),
    healthRisk: getHealthRiskScores(5),
    // Week 3: decision intelligence
    cashRunway: getCashRunwayStats(cashWindowDays, {
      warningDays: week3.runwayWarningDays,
      criticalDays: week3.runwayCriticalDays
    }),
    taskPulse: getTaskExecutionPulse(taskDueHours),
    inventoryCoverage: getInventoryCoverageStats(inventoryRiskDays),
    // Crop modules
    crops: getCropStats(),
    cropYield: getCropYieldStats(),
    cropSales: getCropSalesStats(),
    cropTreatments: getCropTreatmentStats(),
    // Specialized farming
    azolla: getAzollaStats(),
    bsf: getBSFStats(),
    // Animal submodules
    canines: getCanineStats(),
    calves: getCalfStats(),
    // Resource management
    pastures: getPastureStats(),
    groups: getGroupStats(),
    schedules: getScheduleStats(),
    notifications: getNotificationStats(),
    // Advanced analytics
    measurements: getMeasurementStats(),
    treatments: getTreatmentStats(),
    feeding: getFeedingStats(),
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Get crop statistics
 */
export function getCropStats() {
  try {
    const crops = loadData('cattalytics:crops:v2', [])
    const active = crops.filter(c => c.status === 'Growing' || c.status === 'Planted')
    const byType = {}
    const byStatus = {}
    
    crops.forEach(crop => {
      const type = crop.cropType || crop.type || 'Unknown'
      byType[type] = (byType[type] || 0) + 1
      
      const status = crop.status || 'Unknown'
      byStatus[status] = (byStatus[status] || 0) + 1
    })
    
    const totalArea = crops.reduce((sum, c) => sum + (parseFloat(c.area) || 0), 0)
    
    return {
      total: crops.length,
      active: active.length,
      byType,
      byStatus,
      totalArea
    }
  } catch (error) {
    console.error('Error getting crop stats:', error)
    return { total: 0, active: 0, byType: {}, byStatus: {}, totalArea: 0 }
  }
}

/**
 * Get crop yield statistics
 */
export function getCropYieldStats() {
  try {
    const yields = loadData('cattalytics:crop-yield', [])
    const totalYield = yields.reduce((sum, y) => sum + (parseFloat(y.quantity) || 0), 0)
    const avgYield = yields.length > 0 ? totalYield / yields.length : 0
    
    return {
      totalRecords: yields.length,
      totalYield,
      avgYield,
      recent: yields.slice(-5)
    }
  } catch (error) {
    console.error('Error getting crop yield stats:', error)
    return { totalRecords: 0, totalYield: 0, avgYield: 0, recent: [] }
  }
}

/**
 * Get crop sales statistics
 */
export function getCropSalesStats() {
  try {
    const sales = loadData('cattalytics:crops:sales', [])
    const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.totalAmount) || parseFloat(s.amount) || 0), 0)
    const totalQuantity = sales.reduce((sum, s) => sum + (parseFloat(s.quantity) || 0), 0)
    
    return {
      totalSales: sales.length,
      totalRevenue,
      totalQuantity,
      recentSales: sales.slice(-5)
    }
  } catch (error) {
    console.error('Error getting crop sales stats:', error)
    return { totalSales: 0, totalRevenue: 0, totalQuantity: 0, recentSales: [] }
  }
}

/**
 * Get crop treatment statistics
 */
export function getCropTreatmentStats() {
  try {
    const treatments = loadData('cattalytics:crops:treatments', [])
    const active = treatments.filter(t => t.status === 'Active' || t.status === 'Ongoing')
    
    return {
      total: treatments.length,
      active: active.length,
      recent: treatments.slice(-5)
    }
  } catch (error) {
    console.error('Error getting crop treatment stats:', error)
    return { total: 0, active: 0, recent: [] }
  }
}

/**
 * Get Azolla farming statistics
 */
export function getAzollaStats() {
  try {
    const azolla = loadData('cattalytics:azolla:ponds', [])
    const totalProduction = azolla.reduce((sum, a) => sum + (parseFloat(a.yield) || parseFloat(a.production) || 0), 0)
    
    return {
      totalBeds: azolla.length,
      activeBeds: azolla.filter(a => a.status === 'Active').length,
      totalProduction,
      recent: azolla.slice(-5)
    }
  } catch (error) {
    console.error('Error getting azolla stats:', error)
    return { totalBeds: 0, activeBeds: 0, totalProduction: 0, recent: [] }
  }
}

/**
 * Get Black Soldier Fly farming statistics
 */
export function getBSFStats() {
  try {
    const bsf = loadData('cattalytics:bsf:colonies', [])
    const totalProduction = bsf.reduce((sum, b) => sum + (parseFloat(b.larvaeProduction) || parseFloat(b.production) || 0), 0)
    
    return {
      totalUnits: bsf.length,
      activeUnits: bsf.filter(b => b.status === 'Active').length,
      totalProduction,
      recent: bsf.slice(-5)
    }
  } catch (error) {
    console.error('Error getting BSF stats:', error)
    return { totalUnits: 0, activeUnits: 0, totalProduction: 0, recent: [] }
  }
}

/**


/**
 * Get canine statistics
 */
export function getCanineStats() {
  try {
    const allAnimals = loadData('cattalytics:animals', [])
    const canines = Array.isArray(allAnimals) ? allAnimals.filter(a => a.groupId === 'G-008' || (a.type || '').toLowerCase() === 'dog') : []
    const byPurpose = {}
    
    canines.forEach(c => {
      const purpose = c.purpose || c.role || 'Unknown'
      byPurpose[purpose] = (byPurpose[purpose] || 0) + 1
    })
    
    return {
      total: canines.length,
      active: canines.filter(c => c.status === 'Active').length,
      byPurpose
    }
  } catch (error) {
    console.error('Error getting canine stats:', error)
    return { total: 0, active: 0, byPurpose: {} }
  }
}
/**
 * Get calf statistics
 */
export function getCalfStats() {
  try {
    const calves = loadData('cattalytics:calf:management', [])
    const byAge = { '0-3m': 0, '3-6m': 0, '6-12m': 0, '12m+': 0 }
    
    calves.forEach(c => {
      if (c.ageInMonths < 3) byAge['0-3m']++
      else if (c.ageInMonths < 6) byAge['3-6m']++
      else if (c.ageInMonths < 12) byAge['6-12m']++
      else byAge['12m+']++
    })
    
    return {
      total: calves.length,
      byAge,
      recent: calves.slice(-5)
    }
  } catch (error) {
    console.error('Error getting calf stats:', error)
    return { total: 0, byAge: {}, recent: [] }
  }
}

/**
 * Get pasture statistics
 */
export function getPastureStats() {
  try {
    const pastures = loadData('cattalytics:pastures:v2', [])
    const totalArea = pastures.reduce((sum, p) => sum + (parseFloat(p.area) || 0), 0)
    const available = pastures.filter(p => p.status === 'Available' || p.status === 'Ready')
    
    return {
      total: pastures.length,
      totalArea,
      available: available.length,
      inUse: pastures.filter(p => p.status === 'In Use' || p.status === 'Occupied').length
    }
  } catch (error) {
    console.error('Error getting pasture stats:', error)
    return { total: 0, totalArea: 0, available: 0, inUse: 0 }
  }
}

/**
 * Get group statistics
 */
export function getGroupStats() {
  try {
    const groups = loadData('cattalytics:groups', [])
    const totalAnimals = groups.reduce((sum, g) => sum + (g.members?.length || 0), 0)
    
    return {
      totalGroups: groups.length,
      totalAnimals,
      avgGroupSize: groups.length > 0 ? totalAnimals / groups.length : 0
    }
  } catch (error) {
    console.error('Error getting group stats:', error)
    return { totalGroups: 0, totalAnimals: 0, avgGroupSize: 0 }
  }
}

/**
 * Get schedule statistics
 */
export function getScheduleStats() {
  try {
    const schedules = loadData('cattalytics:schedules', [])
    const now = new Date()
    const today = schedules.filter(s => {
      const scheduleDate = new Date(s.date || s.scheduledDate)
      return scheduleDate.toDateString() === now.toDateString()
    })
    
    return {
      total: schedules.length,
      today: today.length,
      upcoming: schedules.filter(s => new Date(s.date || s.scheduledDate) > now).length
    }
  } catch (error) {
    console.error('Error getting schedule stats:', error)
    return { total: 0, today: 0, upcoming: 0 }
  }
}

/**
 * Get notification statistics
 */
export function getNotificationStats() {
  try {
    const notifications = loadData('cattalytics:notifications', [])
    const unread = notifications.filter(n => !n.read)
    
    return {
      total: notifications.length,
      unread: unread.length,
      urgent: notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length
    }
  } catch (error) {
    console.error('Error getting notification stats:', error)
    return { total: 0, unread: 0, urgent: 0 }
  }
}

/**
 * Get measurement statistics
 */
export function getMeasurementStats() {
  try {
    const measurements = loadData('cattalytics:animal:measurement', [])
    const recent = measurements.slice(-10)
    const avgWeight = recent.reduce((sum, m) => sum + (parseFloat(m.weight) || 0), 0) / Math.max(1, recent.length)
    
    return {
      total: measurements.length,
      recent: recent.length,
      avgWeight
    }
  } catch (error) {
    console.error('Error getting measurement stats:', error)
    return { total: 0, recent: 0, avgWeight: 0 }
  }
}

/**
 * Get treatment statistics
 */
export function getTreatmentStats() {
  try {
    const treatments = loadData('cattalytics:animal:treatment', [])
    const active = treatments.filter(t => t.status === 'Active' || t.status === 'Ongoing')
    const completed = treatments.filter(t => t.status === 'Completed')
    
    return {
      total: treatments.length,
      active: active.length,
      completed: completed.length,
      completionRate: treatments.length > 0 ? (completed.length / treatments.length * 100).toFixed(1) : 0
    }
  } catch (error) {
    console.error('Error getting treatment stats:', error)
    return { total: 0, active: 0, completed: 0, completionRate: 0 }
  }
}

/**
 * Get feeding statistics
 */
export function getFeedingStats() {
  try {
    const feeding = loadData('cattalytics:feeding', [])
    const totalCost = feeding.reduce((sum, f) => sum + (parseFloat(f.cost) || 0), 0)
    const totalQuantity = feeding.reduce((sum, f) => sum + (parseFloat(f.quantity) || 0), 0)
    
    return {
      total: feeding.length,
      totalCost,
      totalQuantity,
      recent: feeding.slice(-5)
    }
  } catch (error) {
    console.error('Error getting feeding stats:', error)
    return { total: 0, totalCost: 0, totalQuantity: 0, recent: [] }
  }
}
