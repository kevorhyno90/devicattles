// AI-Powered Insights & Recommendations Engine
// Analyzes farm data and provides intelligent recommendations

// Insight categories
export const InsightCategory = {
  HEALTH: 'health',
  FINANCE: 'finance',
  PRODUCTIVITY: 'productivity',
  EFFICIENCY: 'efficiency',
  PREDICTION: 'prediction',
  ALERT: 'alert',
  OPTIMIZATION: 'optimization',
  TREND: 'trend'
}

// Insight priority levels
export const InsightPriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
}

// Generate health insights
function analyzeHealthInsights(animals) {
  const insights = []
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  
  // Check for animals needing vaccination
  const needsVaccination = animals.filter(a => {
    const lastVax = a.lastVaccination ? new Date(a.lastVaccination).getTime() : 0
    return (now - lastVax) > 180 * 24 * 60 * 60 * 1000 // 6 months
  })
  
  if (needsVaccination.length > 0) {
    insights.push({
      id: `health-vax-${Date.now()}`,
      category: InsightCategory.HEALTH,
      priority: needsVaccination.length > 5 ? InsightPriority.HIGH : InsightPriority.MEDIUM,
      title: `${needsVaccination.length} animals need vaccination`,
      description: `${needsVaccination.length} animals haven't been vaccinated in over 6 months. Schedule vaccinations to prevent disease outbreaks.`,
      impact: `Reduces disease risk by up to 80%`,
      action: 'Schedule vaccinations',
      affectedCount: needsVaccination.length,
      affectedIds: needsVaccination.map(a => a.id),
      recommendation: 'Contact your veterinarian to schedule group vaccinations for cost efficiency.',
      estimatedCost: needsVaccination.length * 15, // $15 per animal
      timestamp: Date.now()
    })
  }
  
  // Check for sick animals
  const sickAnimals = animals.filter(a => a.healthStatus === 'sick' || a.status === 'sick')
  if (sickAnimals.length > 0) {
    insights.push({
      id: `health-sick-${Date.now()}`,
      category: InsightCategory.HEALTH,
      priority: InsightPriority.CRITICAL,
      title: `${sickAnimals.length} animals require immediate attention`,
      description: `${sickAnimals.length} animals are marked as sick and need veterinary care.`,
      impact: `Prevents spread of disease and reduces mortality risk`,
      action: 'Contact veterinarian immediately',
      affectedCount: sickAnimals.length,
      affectedIds: sickAnimals.map(a => a.id),
      recommendation: 'Isolate sick animals and provide immediate veterinary care. Monitor closely for 48 hours.',
      timestamp: Date.now()
    })
  }
  
  // Check weight trends
  const animalsWithWeight = animals.filter(a => a.weight && a.age)
  if (animalsWithWeight.length > 0) {
    const underweight = animalsWithWeight.filter(a => {
      const expectedWeight = a.age * 30 // Rough estimate: 30kg per month of age
      return a.weight < expectedWeight * 0.7
    })
    
    if (underweight.length > 0) {
      insights.push({
        id: `health-weight-${Date.now()}`,
        category: InsightCategory.HEALTH,
        priority: InsightPriority.MEDIUM,
        title: `${underweight.length} animals are underweight`,
        description: `${underweight.length} animals are significantly below expected weight for their age.`,
        impact: `Improved nutrition can increase growth rate by 25-40%`,
        action: 'Adjust feeding program',
        affectedCount: underweight.length,
        affectedIds: underweight.map(a => a.id),
        recommendation: 'Increase feed rations and add protein supplements. Consider deworming program.',
        estimatedCost: underweight.length * 50, // $50 per animal for enhanced nutrition
        timestamp: Date.now()
      })
    }
  }
  
  return insights
}

// Generate financial insights
function analyzeFinanceInsights(finances, animals) {
  const insights = []
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  
  // Calculate monthly expenses
  const recentExpenses = finances.filter(f => 
    f.type === 'expense' && new Date(f.date).getTime() > thirtyDaysAgo
  )
  
  const totalExpenses = recentExpenses.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0)
  const avgMonthlyExpense = totalExpenses
  
  // Calculate income
  const recentIncome = finances.filter(f => 
    f.type === 'income' && new Date(f.date).getTime() > thirtyDaysAgo
  )
  const totalIncome = recentIncome.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0)
  
  // Profit margin analysis
  if (totalIncome > 0) {
    const profitMargin = ((totalIncome - totalExpenses) / totalIncome) * 100
    
    if (profitMargin < 10) {
      insights.push({
        id: `finance-margin-${Date.now()}`,
        category: InsightCategory.FINANCE,
        priority: profitMargin < 0 ? InsightPriority.CRITICAL : InsightPriority.HIGH,
        title: `Low profit margin: ${profitMargin.toFixed(1)}%`,
        description: `Your profit margin is ${profitMargin < 0 ? 'negative' : 'below optimal'}. Industry standard is 15-25%.`,
        impact: `Optimizing operations could increase profits by $${((totalIncome * 0.15) - (totalIncome - totalExpenses)).toFixed(2)}`,
        action: 'Review cost structure',
        recommendation: 'Analyze feed costs, reduce waste, and optimize herd size. Consider bulk purchasing for 10-15% savings.',
        timestamp: Date.now()
      })
    }
  }
  
  // High expense categories
  const expensesByCategory = {}
  recentExpenses.forEach(e => {
    const cat = e.category || 'other'
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + parseFloat(e.amount || 0)
  })
  
  const topExpense = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0]
  if (topExpense && topExpense[1] > totalExpenses * 0.4) {
    insights.push({
      id: `finance-category-${Date.now()}`,
      category: InsightCategory.FINANCE,
      priority: InsightPriority.MEDIUM,
      title: `High ${topExpense[0]} costs: $${topExpense[1].toFixed(2)}`,
      description: `${topExpense[0]} accounts for ${((topExpense[1] / totalExpenses) * 100).toFixed(1)}% of expenses.`,
      impact: `Reducing by 10% saves $${(topExpense[1] * 0.1).toFixed(2)}/month`,
      action: `Optimize ${topExpense[0]} spending`,
      recommendation: 'Consider alternative suppliers, bulk purchasing, or efficiency improvements.',
      timestamp: Date.now()
    })
  }
  
  // Cost per animal
  if (animals.length > 0 && totalExpenses > 0) {
    const costPerAnimal = totalExpenses / animals.length
    const industryAvg = 75 // $75 per animal per month
    
    if (costPerAnimal > industryAvg * 1.2) {
      insights.push({
        id: `finance-efficiency-${Date.now()}`,
        category: InsightCategory.EFFICIENCY,
        priority: InsightPriority.MEDIUM,
        title: `High cost per animal: $${costPerAnimal.toFixed(2)}`,
        description: `Your cost per animal ($${costPerAnimal.toFixed(2)}) is ${((costPerAnimal / industryAvg - 1) * 100).toFixed(0)}% above industry average.`,
        impact: `Reducing to industry average saves $${((costPerAnimal - industryAvg) * animals.length).toFixed(2)}/month`,
        action: 'Improve operational efficiency',
        recommendation: 'Review feeding practices, preventive health measures, and labor costs.',
        timestamp: Date.now()
      })
    }
  }
  
  return insights
}

// Generate productivity insights
function analyzeProductivityInsights(animals, milkRecords, crops) {
  const insights = []
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  
  // Milk production analysis
  const recentMilk = milkRecords.filter(m => 
    new Date(m.date).getTime() > thirtyDaysAgo
  )
  
  if (recentMilk.length > 0) {
    const totalMilk = recentMilk.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0)
    const milkingAnimals = animals.filter(a => a.type === 'cow' && a.age > 24) // Mature cows
    const avgPerAnimal = milkingAnimals.length > 0 ? totalMilk / milkingAnimals.length : 0
    const expectedAvg = 450 // 15L per day * 30 days
    
    if (avgPerAnimal < expectedAvg * 0.8) {
      insights.push({
        id: `prod-milk-${Date.now()}`,
        category: InsightCategory.PRODUCTIVITY,
        priority: InsightPriority.HIGH,
        title: `Low milk production: ${avgPerAnimal.toFixed(0)}L/cow/month`,
        description: `Average production is ${((1 - avgPerAnimal / expectedAvg) * 100).toFixed(0)}% below expected levels.`,
        impact: `Improving to expected levels adds ${((expectedAvg - avgPerAnimal) * milkingAnimals.length).toFixed(0)}L/month`,
        action: 'Optimize feeding and milking',
        affectedCount: milkingAnimals.length,
        recommendation: 'Improve nutrition, ensure adequate water, check milking equipment, and reduce stress.',
        estimatedGain: ((expectedAvg - avgPerAnimal) * milkingAnimals.length * 0.5).toFixed(2), // $0.50 per liter
        timestamp: Date.now()
      })
    }
  }
  
  // Breeding efficiency
  const matureAnimals = animals.filter(a => a.age >= 24)
  const pregnant = animals.filter(a => a.status === 'pregnant')
  const breedingRate = matureAnimals.length > 0 ? (pregnant.length / matureAnimals.length) * 100 : 0
  
  if (breedingRate < 30 && matureAnimals.length > 0) {
    insights.push({
      id: `prod-breeding-${Date.now()}`,
      category: InsightCategory.PRODUCTIVITY,
      priority: InsightPriority.MEDIUM,
      title: `Low breeding rate: ${breedingRate.toFixed(0)}%`,
      description: `Only ${pregnant.length} of ${matureAnimals.length} mature animals are pregnant. Target is 40-50%.`,
      impact: `Increasing breeding rate adds ${(matureAnimals.length * 0.4 - pregnant.length).toFixed(0)} calves/year`,
      action: 'Review breeding program',
      recommendation: 'Check heat detection, improve nutrition, and consider AI or breeding soundness exams.',
      timestamp: Date.now()
    })
  }
  
  // Crop yield analysis
  if (crops && crops.length > 0) {
    const harvestedCrops = crops.filter(c => c.status === 'harvested' && c.yield)
    harvestedCrops.forEach(crop => {
      const expectedYield = {
        corn: 150,
        wheat: 50,
        hay: 5
      }[crop.type] || 100
      
      if (crop.yield < expectedYield * 0.7) {
        insights.push({
          id: `prod-crop-${crop.id}`,
          category: InsightCategory.PRODUCTIVITY,
          priority: InsightPriority.MEDIUM,
          title: `Low ${crop.type} yield: ${crop.yield} units`,
          description: `Yield is ${((1 - crop.yield / expectedYield) * 100).toFixed(0)}% below expected.`,
          impact: `Improving to expected yield adds ${(expectedYield - crop.yield).toFixed(0)} units`,
          action: 'Improve crop management',
          recommendation: 'Test soil, optimize irrigation, adjust fertilization, and control pests.',
          timestamp: Date.now()
        })
      }
    })
  }
  
  return insights
}

// Generate predictive insights
function analyzePredictiveInsights(animals, finances, tasks) {
  const insights = []
  const now = Date.now()
  
  // Predict upcoming births
  const pregnantAnimals = animals.filter(a => a.status === 'pregnant' && a.dueDate)
  const dueSoon = pregnantAnimals.filter(a => {
    const dueDate = new Date(a.dueDate).getTime()
    const daysUntilDue = (dueDate - now) / (24 * 60 * 60 * 1000)
    return daysUntilDue > 0 && daysUntilDue <= 30
  })
  
  if (dueSoon.length > 0) {
    insights.push({
      id: `pred-birth-${Date.now()}`,
      category: InsightCategory.PREDICTION,
      priority: InsightPriority.HIGH,
      title: `${dueSoon.length} births expected in next 30 days`,
      description: `Prepare for ${dueSoon.length} upcoming births. Ensure adequate supplies and supervision.`,
      impact: `Proper preparation reduces calf mortality by 50%`,
      action: 'Prepare birthing supplies',
      affectedCount: dueSoon.length,
      affectedIds: dueSoon.map(a => a.id),
      recommendation: 'Stock colostrum, ensure clean birthing area, and schedule extra supervision.',
      estimatedCost: dueSoon.length * 25,
      timestamp: Date.now()
    })
  }
  
  // Predict cash flow issues
  const recentExpenses = finances.filter(f => {
    const age = (now - new Date(f.date).getTime()) / (24 * 60 * 60 * 1000)
    return f.type === 'expense' && age <= 30
  })
  const avgDailyExpense = recentExpenses.length > 0 
    ? recentExpenses.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0) / 30
    : 0
  
  const recentIncome = finances.filter(f => {
    const age = (now - new Date(f.date).getTime()) / (24 * 60 * 60 * 1000)
    return f.type === 'income' && age <= 30
  })
  const avgDailyIncome = recentIncome.length > 0
    ? recentIncome.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0) / 30
    : 0
  
  if (avgDailyExpense > avgDailyIncome && avgDailyExpense > 0) {
    insights.push({
      id: `pred-cashflow-${Date.now()}`,
      category: InsightCategory.PREDICTION,
      priority: InsightPriority.CRITICAL,
      title: `Cash flow warning: expenses exceed income`,
      description: `Daily expenses ($${avgDailyExpense.toFixed(2)}) exceed income ($${avgDailyIncome.toFixed(2)}).`,
      impact: `At current rate, you'll need $${((avgDailyExpense - avgDailyIncome) * 30).toFixed(2)} additional funds in 30 days`,
      action: 'Review budget immediately',
      recommendation: 'Reduce non-essential expenses, accelerate sales, or arrange financing.',
      timestamp: Date.now()
    })
  }
  
  // Predict task overload
  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const overdueTasks = pendingTasks.filter(t => {
    const dueDate = new Date(t.dueDate || t.date).getTime()
    return dueDate < now
  })
  
  if (overdueTasks.length > 10) {
    insights.push({
      id: `pred-tasks-${Date.now()}`,
      category: InsightCategory.EFFICIENCY,
      priority: InsightPriority.MEDIUM,
      title: `${overdueTasks.length} overdue tasks`,
      description: `You have ${overdueTasks.length} overdue tasks. Task backlog may impact operations.`,
      impact: `Completing overdue tasks improves efficiency by 30%`,
      action: 'Prioritize task completion',
      affectedCount: overdueTasks.length,
      recommendation: 'Focus on high-priority tasks, delegate when possible, or hire additional help.',
      timestamp: Date.now()
    })
  }
  
  return insights
}

// Generate trend insights
function analyzeTrendInsights(animals, finances, milkRecords) {
  const insights = []
  const now = Date.now()
  
  // Herd growth trend
  const animalsWithAge = animals.map(a => ({
    ...a,
    addedDate: a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : now - (a.age || 0) * 30 * 24 * 60 * 60 * 1000
  }))
  
  const last30Days = animalsWithAge.filter(a => (now - a.addedDate) <= 30 * 24 * 60 * 60 * 1000).length
  const previous30Days = animalsWithAge.filter(a => {
    const age = now - a.addedDate
    return age > 30 * 24 * 60 * 60 * 1000 && age <= 60 * 24 * 60 * 60 * 1000
  }).length
  
  if (previous30Days > 0) {
    const growthRate = ((last30Days - previous30Days) / previous30Days) * 100
    
    if (Math.abs(growthRate) > 20) {
      insights.push({
        id: `trend-growth-${Date.now()}`,
        category: InsightCategory.TREND,
        priority: InsightPriority.INFO,
        title: `Herd ${growthRate > 0 ? 'growing' : 'declining'} at ${Math.abs(growthRate).toFixed(0)}%`,
        description: `Your herd is ${growthRate > 0 ? 'growing' : 'declining'} faster than normal.`,
        impact: growthRate > 0 
          ? 'Ensure adequate facilities and feed for growing herd'
          : 'Declining herd may impact future revenue',
        action: growthRate > 0 ? 'Plan for expansion' : 'Review breeding program',
        recommendation: growthRate > 0
          ? 'Prepare additional housing, feed, and labor resources.'
          : 'Investigate causes and adjust breeding/retention strategy.',
        timestamp: Date.now()
      })
    }
  }
  
  return insights
}

// Generate optimization insights
function analyzeOptimizationInsights(animals, tasks, finances) {
  const insights = []
  
  // Feed efficiency
  const feedExpenses = finances.filter(f => 
    f.type === 'expense' && (f.category === 'feed' || f.description?.toLowerCase().includes('feed'))
  )
  const totalFeedCost = feedExpenses.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
  const costPerAnimal = animals.length > 0 ? totalFeedCost / animals.length : 0
  
  if (costPerAnimal > 50) { // $50 per animal
    insights.push({
      id: `opt-feed-${Date.now()}`,
      category: InsightCategory.OPTIMIZATION,
      priority: InsightPriority.MEDIUM,
      title: `Feed cost optimization opportunity`,
      description: `Feed costs are $${costPerAnimal.toFixed(2)} per animal. Industry average is $40-45.`,
      impact: `Optimizing feed could save $${((costPerAnimal - 45) * animals.length).toFixed(2)}`,
      action: 'Optimize feeding program',
      recommendation: 'Consider forage-based feeding, bulk purchasing, or feed testing for efficiency.',
      estimatedSavings: ((costPerAnimal - 45) * animals.length).toFixed(2),
      timestamp: Date.now()
    })
  }
  
  // Labor efficiency
  const tasksByPerson = {}
  tasks.forEach(t => {
    const person = t.assignedTo || 'unassigned'
    tasksByPerson[person] = (tasksByPerson[person] || 0) + 1
  })
  
  const taskCounts = Object.values(tasksByPerson)
  if (taskCounts.length > 1) {
    const max = Math.max(...taskCounts)
    const min = Math.min(...taskCounts)
    
    if (max > min * 2) {
      insights.push({
        id: `opt-labor-${Date.now()}`,
        category: InsightCategory.OPTIMIZATION,
        priority: InsightPriority.LOW,
        title: `Uneven task distribution`,
        description: `Task load is unevenly distributed. Some workers have ${max} tasks while others have ${min}.`,
        impact: `Better distribution improves efficiency by 15-20%`,
        action: 'Rebalance workload',
        recommendation: 'Redistribute tasks more evenly or consider additional training.',
        timestamp: Date.now()
      })
    }
  }
  
  return insights
}

// Main function to generate all insights
export function generateInsights(data = {}) {
  const {
    animals = [],
    finances = [],
    tasks = [],
    milkRecords = [],
    crops = []
  } = data
  
  const allInsights = [
    ...analyzeHealthInsights(animals),
    ...analyzeFinanceInsights(finances, animals),
    ...analyzeProductivityInsights(animals, milkRecords, crops),
    ...analyzePredictiveInsights(animals, finances, tasks),
    ...analyzeTrendInsights(animals, finances, milkRecords),
    ...analyzeOptimizationInsights(animals, tasks, finances)
  ]
  
  // Sort by priority
  const priorityOrder = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4
  }
  
  return allInsights.sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  )
}

// Get insights by category
export function getInsightsByCategory(insights, category) {
  return insights.filter(i => i.category === category)
}

// Get insights by priority
export function getInsightsByPriority(insights, priority) {
  return insights.filter(i => i.priority === priority)
}

// Calculate total potential impact
export function calculateTotalImpact(insights) {
  let totalSavings = 0
  let totalGains = 0
  
  insights.forEach(insight => {
    if (insight.estimatedSavings) {
      totalSavings += parseFloat(insight.estimatedSavings)
    }
    if (insight.estimatedGain) {
      totalGains += parseFloat(insight.estimatedGain)
    }
    if (insight.estimatedCost) {
      totalSavings -= parseFloat(insight.estimatedCost)
    }
  })
  
  return {
    savings: totalSavings,
    gains: totalGains,
    netImpact: totalSavings + totalGains
  }
}

// Mark insight as acted upon
export function markInsightActioned(insightId) {
  const actionedInsights = JSON.parse(localStorage.getItem('cattalytics:actioned-insights') || '[]')
  if (!actionedInsights.includes(insightId)) {
    actionedInsights.push(insightId)
    localStorage.setItem('cattalytics:actioned-insights', JSON.stringify(actionedInsights))
  }
}

// Get actioned insights
export function getActionedInsights() {
  return JSON.parse(localStorage.getItem('cattalytics:actioned-insights') || '[]')
}

// Filter out actioned insights
export function filterActionedInsights(insights) {
  const actioned = getActionedInsights()
  return insights.filter(i => !actioned.includes(i.id))
}
