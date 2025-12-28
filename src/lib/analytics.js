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
    const animals = loadData('animals', [])
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
    const breeding = loadData('breeding', [])
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
    const animals = loadData('animals', [])
    const treatments = loadData('treatments', [])
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
    const tasks = loadData('tasks', [])
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
    const transactions = loadData('transactions', [])
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
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    
    const expenses = periodTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    
    // Get all-time totals
    const allTimeIncome = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    
    const allTimeExpenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    
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
    const transactions = loadData('transactions', [])
    if (!Array.isArray(transactions)) {
      console.warn('Transactions data is not an array:', typeof transactions)
      return []
    }
    const now = new Date()
    
    // Filter feed-related expenses
    const feedTransactions = transactions.filter(t => 
      t.type === 'Expense' && 
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
      
      const total = monthTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
      
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
    const inventory = loadData('inventory', [])
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
    const milkYield = loadData('milkYield', [])
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
 * Get comprehensive dashboard data from ALL modules
 */
export function getDashboardData() {
  return {
    animals: getAnimalsByType(),
    breeding: getBreedingStats(),
    health: getHealthAlerts(),
    tasks: getUpcomingTasks(),
    finance: getFinancialSummary('month'),
    feedCosts: getFeedCostTrends(6),
    inventory: getInventoryAlerts(),
    milkProduction: getMilkProductionStats('month'),
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
    pets: getPetStats(),
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
    const crops = loadData('crops', [])
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
    const yields = loadData('cropYield', [])
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
    const sales = loadData('cropSales', [])
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
    const treatments = loadData('cropTreatments', [])
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
    const azolla = loadData('azolla', [])
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
    const bsf = loadData('bsf', [])
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
    const canines = loadData('canines', [])
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
 * Get pet statistics
 */
export function getPetStats() {
  try {
    const pets = loadData('pets', [])
    const byType = {}
    
    pets.forEach(p => {
      const type = p.species || p.type || 'Unknown'
      byType[type] = (byType[type] || 0) + 1
    })
    
    return {
      total: pets.length,
      byType
    }
  } catch (error) {
    console.error('Error getting pet stats:', error)
    return { total: 0, byType: {} }
  }
}

/**
 * Get calf statistics
 */
export function getCalfStats() {
  try {
    const calves = loadData('calves', [])
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
    const pastures = loadData('pastures', [])
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
    const groups = loadData('groups', [])
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
    const schedules = loadData('schedules', [])
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
    const notifications = loadData('notifications', [])
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
    const measurements = loadData('measurements', [])
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
    const treatments = loadData('treatments', [])
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
    const feeding = loadData('feeding', [])
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
