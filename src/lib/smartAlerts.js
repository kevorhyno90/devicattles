import { loadData } from './storage'
import { showNotification } from './notifications'

/**
 * Smart Alerts & Recommendations System
 * Analyzes farm data to generate proactive alerts and actionable recommendations
 */

// Alert priority levels
export const PRIORITY = {
  CRITICAL: 'critical',  // Immediate action required
  HIGH: 'high',         // Action needed soon
  MEDIUM: 'medium',     // Important but not urgent
  LOW: 'low'           // Informational
}

// Alert categories
export const CATEGORY = {
  HEALTH: 'health',
  BREEDING: 'breeding',
  FEEDING: 'feeding',
  HARVEST: 'harvest',
  INVENTORY: 'inventory',
  FINANCIAL: 'financial',
  MAINTENANCE: 'maintenance',
  WEATHER: 'weather'
}

/**
 * Check for overdue vaccinations
 */
export function checkVaccinationAlerts() {
  const animals = loadData('cattalytics:animals', [])
  const alerts = []
  const today = new Date()
  
  animals.forEach(animal => {
    if (animal.status === 'Deceased' || animal.status === 'Sold') return
    
    // Check last vaccination date
    if (animal.lastVaccination) {
      const lastVax = new Date(animal.lastVaccination)
      const daysSinceVax = Math.floor((today - lastVax) / (1000 * 60 * 60 * 24))
      
      // Alert if more than 180 days (6 months)
      if (daysSinceVax > 180) {
        alerts.push({
          id: `vax-${animal.id}`,
          priority: daysSinceVax > 365 ? PRIORITY.CRITICAL : PRIORITY.HIGH,
          category: CATEGORY.HEALTH,
          title: '💉 Vaccination Overdue',
          message: `${animal.name || animal.tagNumber} needs vaccination (${daysSinceVax} days overdue)`,
          animalId: animal.id,
          actionable: true,
          action: 'Schedule vaccination',
          daysOverdue: daysSinceVax - 180
        })
      }
      // Reminder if coming up in 7 days
      else if (daysSinceVax >= 173) {
        alerts.push({
          id: `vax-reminder-${animal.id}`,
          priority: PRIORITY.MEDIUM,
          category: CATEGORY.HEALTH,
          title: '💉 Vaccination Due Soon',
          message: `${animal.name || animal.tagNumber} needs vaccination in ${180 - daysSinceVax} days`,
          animalId: animal.id,
          actionable: true,
          action: 'Schedule vaccination'
        })
      }
    } else {
      // No vaccination record
      alerts.push({
        id: `vax-missing-${animal.id}`,
        priority: PRIORITY.MEDIUM,
        category: CATEGORY.HEALTH,
        title: '💉 Missing Vaccination Record',
        message: `${animal.name || animal.tagNumber} has no vaccination history`,
        animalId: animal.id,
        actionable: true,
        action: 'Add vaccination record'
      })
    }
  })
  
  return alerts
}

/**
 * Check for breeding opportunities
 */
export function checkBreedingAlerts() {
  const animals = loadData('cattalytics:animals', [])
  const alerts = []
  const today = new Date()
  
  animals.forEach(animal => {
    if (animal.status !== 'Active') return
    if (animal.gender !== 'Female') return
    
    // Check last breeding date
    if (animal.lastBreeding) {
      const lastBreed = new Date(animal.lastBreeding)
      const daysSinceBreed = Math.floor((today - lastBreed) / (1000 * 60 * 60 * 24))
      
      // Cattle gestation is ~283 days
      const gestationPeriod = 283
      const expectedCalving = gestationPeriod - daysSinceBreed
      
      if (expectedCalving <= 30 && expectedCalving > 0) {
        alerts.push({
          id: `calving-${animal.id}`,
          priority: expectedCalving <= 7 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
          category: CATEGORY.BREEDING,
          title: '🐄 Calving Expected Soon',
          message: `${animal.name || animal.tagNumber} expected to calve in ${expectedCalving} days`,
          animalId: animal.id,
          actionable: true,
          action: 'Prepare for calving',
          daysUntil: expectedCalving
        })
      }
      
      // Check if ready for breeding again (60 days after calving)
      if (daysSinceBreed > gestationPeriod + 60) {
        alerts.push({
          id: `breed-ready-${animal.id}`,
          priority: PRIORITY.LOW,
          category: CATEGORY.BREEDING,
          title: '💚 Ready for Breeding',
          message: `${animal.name || animal.tagNumber} is ready for breeding`,
          animalId: animal.id,
          actionable: true,
          action: 'Schedule breeding'
        })
      }
    }
  })
  
  return alerts
}

/**
 * Check for low inventory items
 */
export function checkInventoryAlerts() {
  const inventory = loadData('cattalytics:inventory', [])
  const alerts = []
  
  inventory.forEach(item => {
    const quantity = parseFloat(item.quantity) || 0
    const minLevel = parseFloat(item.minLevel) || 0
    const reorderLevel = parseFloat(item.reorderLevel) || minLevel
    
    if (quantity <= minLevel) {
      alerts.push({
        id: `inv-critical-${item.id}`,
        priority: PRIORITY.CRITICAL,
        category: CATEGORY.INVENTORY,
        title: '📦 Critical Stock Level',
        message: `${item.name} is critically low (${quantity} ${item.unit})`,
        itemId: item.id,
        actionable: true,
        action: 'Order now',
        quantity,
        minLevel
      })
    } else if (quantity <= reorderLevel) {
      alerts.push({
        id: `inv-low-${item.id}`,
        priority: PRIORITY.HIGH,
        category: CATEGORY.INVENTORY,
        title: '📦 Low Stock Alert',
        message: `${item.name} needs reordering (${quantity} ${item.unit})`,
        itemId: item.id,
        actionable: true,
        action: 'Order soon',
        quantity,
        reorderLevel
      })
    }
  })
  
  return alerts
}

/**
 * Check for crops ready to harvest
 */
export function checkHarvestAlerts() {
  const crops = loadData('cattalytics:crops:v2', [])
  const alerts = []
  const today = new Date()
  
  crops.forEach(crop => {
    if (crop.status === 'Harvested' || crop.status === 'Failed') return
    
    if (crop.harvestDate) {
      const harvestDate = new Date(crop.harvestDate)
      const daysUntilHarvest = Math.floor((harvestDate - today) / (1000 * 60 * 60 * 24))
      
      if (daysUntilHarvest <= 0) {
        alerts.push({
          id: `harvest-ready-${crop.id}`,
          priority: PRIORITY.HIGH,
          category: CATEGORY.HARVEST,
          title: '🌾 Ready to Harvest',
          message: `${crop.cropName} ${crop.variety} is ready for harvest`,
          cropId: crop.id,
          actionable: true,
          action: 'Start harvest',
          daysOverdue: Math.abs(daysUntilHarvest)
        })
      } else if (daysUntilHarvest <= 7) {
        alerts.push({
          id: `harvest-soon-${crop.id}`,
          priority: PRIORITY.MEDIUM,
          category: CATEGORY.HARVEST,
          title: '🌾 Harvest Coming Soon',
          message: `${crop.cropName} ${crop.variety} ready in ${daysUntilHarvest} days`,
          cropId: crop.id,
          actionable: true,
          action: 'Prepare for harvest',
          daysUntil: daysUntilHarvest
        })
      }
    }
  })
  
  return alerts
}

/**
 * Check for overdue tasks
 */
export function checkTaskAlerts() {
  const tasks = loadData('cattalytics:tasks', [])
  const alerts = []
  const today = new Date()
  
  tasks.forEach(task => {
    if (task.status === 'completed' || task.status === 'cancelled') return
    
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate)
      const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24))
      
      if (daysUntilDue < 0) {
        alerts.push({
          id: `task-overdue-${task.id}`,
          priority: PRIORITY.HIGH,
          category: CATEGORY.MAINTENANCE,
          title: '⚠️ Task Overdue',
          message: `"${task.title}" is ${Math.abs(daysUntilDue)} days overdue`,
          taskId: task.id,
          actionable: true,
          action: 'Complete task',
          daysOverdue: Math.abs(daysUntilDue)
        })
      } else if (daysUntilDue === 0) {
        alerts.push({
          id: `task-due-${task.id}`,
          priority: PRIORITY.MEDIUM,
          category: CATEGORY.MAINTENANCE,
          title: '📅 Task Due Today',
          message: `"${task.title}" is due today`,
          taskId: task.id,
          actionable: true,
          action: 'Complete task'
        })
      }
    }
  })
  
  return alerts
}

/**
 * Financial health check
 */
export function checkFinancialAlerts() {
  const transactions = loadData('cattalytics:finance', [])
  const alerts = []
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  // Get recent transactions
  const recentTransactions = transactions.filter(t => {
    const tDate = new Date(t.date)
    return tDate >= thirtyDaysAgo
  })
  
  // Calculate income vs expenses
  let income = 0
  let expenses = 0
  
  recentTransactions.forEach(t => {
    const amount = parseFloat(t.amount) || 0
    if (t.type === 'income') {
      income += amount
    } else {
      expenses += amount
    }
  })
  
  const netCashFlow = income - expenses
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 0
  
  // Alert if expenses exceed income
  if (netCashFlow < 0) {
    alerts.push({
      id: 'finance-negative',
      priority: PRIORITY.HIGH,
      category: CATEGORY.FINANCIAL,
      title: '💰 Negative Cash Flow',
      message: `Expenses exceed income by KES ${Math.abs(netCashFlow).toLocaleString()} (last 30 days)`,
      actionable: true,
      action: 'Review expenses',
      deficit: Math.abs(netCashFlow)
    })
  }
  
  // Alert if expense ratio is high (>80%)
  if (expenseRatio > 80 && income > 0) {
    alerts.push({
      id: 'finance-ratio',
      priority: PRIORITY.MEDIUM,
      category: CATEGORY.FINANCIAL,
      title: '📊 High Expense Ratio',
      message: `Expenses are ${expenseRatio.toFixed(0)}% of income`,
      actionable: true,
      action: 'Optimize costs',
      ratio: expenseRatio
    })
  }
  
  // Alert if no income recorded recently
  if (recentTransactions.length > 0 && income === 0) {
    alerts.push({
      id: 'finance-no-income',
      priority: PRIORITY.MEDIUM,
      category: CATEGORY.FINANCIAL,
      title: '💵 No Income Recorded',
      message: 'No income transactions in the last 30 days',
      actionable: true,
      action: 'Record income'
    })
  }
  
  return alerts
}

/**
 * Get all smart alerts
 */
export function getAllSmartAlerts() {
  const alerts = [
    ...checkVaccinationAlerts(),
    ...checkBreedingAlerts(),
    ...checkInventoryAlerts(),
    ...checkHarvestAlerts(),
    ...checkTaskAlerts(),
    ...checkFinancialAlerts()
  ]
  
  // Sort by priority
  const priorityOrder = {
    [PRIORITY.CRITICAL]: 0,
    [PRIORITY.HIGH]: 1,
    [PRIORITY.MEDIUM]: 2,
    [PRIORITY.LOW]: 3
  }
  
  alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  
  return alerts
}

/**
 * Get alerts summary by category
 */
export function getAlertsSummary() {
  const alerts = getAllSmartAlerts()
  
  const summary = {
    total: alerts.length,
    critical: alerts.filter(a => a.priority === PRIORITY.CRITICAL).length,
    high: alerts.filter(a => a.priority === PRIORITY.HIGH).length,
    medium: alerts.filter(a => a.priority === PRIORITY.MEDIUM).length,
    low: alerts.filter(a => a.priority === PRIORITY.LOW).length,
    byCategory: {}
  }
  
  // Count by category
  Object.values(CATEGORY).forEach(cat => {
    summary.byCategory[cat] = alerts.filter(a => a.category === cat).length
  })
  
  return summary
}

/**
 * Show alert notifications to user
 */
export function showSmartAlertNotifications() {
  const alerts = getAllSmartAlerts()
  
  // Show only critical and high priority alerts as notifications
  const importantAlerts = alerts.filter(a => 
    a.priority === PRIORITY.CRITICAL || a.priority === PRIORITY.HIGH
  )
  
  importantAlerts.slice(0, 5).forEach(alert => {
    showNotification({
      title: alert.title,
      body: alert.message,
      tag: alert.id,
      data: alert
    })
  })
  
  return importantAlerts.length
}

/**
 * Get personalized recommendations
 */
export function getSmartRecommendations() {
  const recommendations = []
  const animals = loadData('cattalytics:animals', [])
  const crops = loadData('cattalytics:crops:v2', [])
  const transactions = loadData('cattalytics:finance', [])
  
  // Recommend based on patterns
  
  // 1. Diversification recommendation
  const activeCrops = crops.filter(c => c.status === 'Growing' || c.status === 'Planted')
  if (activeCrops.length < 3) {
    recommendations.push({
      id: 'rec-diversify-crops',
      type: 'growth',
      title: '🌱 Diversify Your Crops',
      message: 'Consider planting 2-3 more crop varieties to reduce risk',
      priority: PRIORITY.LOW,
      benefit: 'Risk mitigation and stable income'
    })
  }
  
  // 2. Record keeping recommendation
  const recentTransactions = transactions.filter(t => {
    const tDate = new Date(t.date)
    const daysSince = (new Date() - tDate) / (1000 * 60 * 60 * 24)
    return daysSince <= 7
  })
  
  if (recentTransactions.length === 0 && transactions.length > 0) {
    recommendations.push({
      id: 'rec-record-keeping',
      type: 'management',
      title: '📝 Update Your Records',
      message: 'No transactions recorded this week. Keep records up to date for better insights',
      priority: PRIORITY.LOW,
      benefit: 'Accurate financial tracking'
    })
  }
  
  // 3. Health monitoring recommendation
  const animalsWithoutHealthRecords = animals.filter(a => 
    a.status === 'Active' && (!a.healthRecords || a.healthRecords.length === 0)
  )
  
  if (animalsWithoutHealthRecords.length > 0) {
    recommendations.push({
      id: 'rec-health-records',
      type: 'health',
      title: '🏥 Improve Health Tracking',
      message: `${animalsWithoutHealthRecords.length} animals have no health records. Regular monitoring prevents issues`,
      priority: PRIORITY.MEDIUM,
      benefit: 'Early disease detection'
    })
  }
  
  return recommendations
}
