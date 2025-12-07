/**
 * Advanced Health Analytics for Livestock
 * Disease prediction, outbreak detection, and health trend analysis
 */

import { APP_LANGUAGE, formatDate, formatRelativeTime } from './language'

/**
 * Calculate health score for an animal (0-100)
 */
export function calculateHealthScore(animal, healthRecords = [], treatments = [], vaccinations = []) {
  let score = 100
  
  const recentRecords = healthRecords
    .filter(r => r.animalId === animal.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5)
  
  // Deduct for recent illnesses
  recentRecords.forEach(record => {
    const daysAgo = Math.floor((Date.now() - new Date(record.timestamp)) / (1000 * 60 * 60 * 24))
    if (daysAgo <= 30) {
      if (record.severity === 'critical') score -= 40
      else if (record.severity === 'severe') score -= 30
      else if (record.severity === 'moderate') score -= 20
      else if (record.severity === 'mild') score -= 10
    }
  })
  
  // Check ongoing treatments
  const ongoingTreatments = treatments.filter(t => 
    t.animalId === animal.id && 
    t.status === 'ongoing'
  )
  score -= ongoingTreatments.length * 15
  
  // Check vaccination status
  const recentVaccines = vaccinations.filter(v => {
    if (v.animalId !== animal.id) return false
    const daysAgo = Math.floor((Date.now() - new Date(v.timestamp)) / (1000 * 60 * 60 * 24))
    return daysAgo <= 365
  })
  
  if (recentVaccines.length === 0) score -= 20
  else if (recentVaccines.length >= 3) score += 10
  
  // Check overdue vaccinations
  vaccinations.forEach(v => {
    if (v.animalId === animal.id && v.followUpDate) {
      if (new Date(v.followUpDate) < new Date()) {
        score -= 15
      }
    }
  })
  
  return Math.max(0, Math.min(100, score))
}

/**
 * Detect disease outbreak patterns
 */
export function detectOutbreaks(healthRecords, animals) {
  const outbreaks = []
  const today = new Date()
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Group recent illnesses by condition
  const recentIllnesses = healthRecords.filter(r => 
    new Date(r.timestamp) >= sevenDaysAgo && 
    r.severity && 
    ['moderate', 'severe', 'critical'].includes(r.severity)
  )
  
  const conditionGroups = {}
  recentIllnesses.forEach(illness => {
    const condition = illness.condition.toLowerCase().trim()
    if (!conditionGroups[condition]) {
      conditionGroups[condition] = []
    }
    conditionGroups[condition].push(illness)
  })
  
  // Detect outbreaks (3+ animals with same condition in 7 days)
  Object.entries(conditionGroups).forEach(([condition, cases]) => {
    if (cases.length >= 3) {
      const affectedAnimals = [...new Set(cases.map(c => c.animalId))]
      const severity = cases.some(c => c.severity === 'critical') ? 'critical' :
                      cases.some(c => c.severity === 'severe') ? 'severe' : 'moderate'
      
      outbreaks.push({
        id: `outbreak-${Date.now()}-${condition}`,
        condition,
        caseCount: cases.length,
        affectedAnimals: affectedAnimals.length,
        animalIds: affectedAnimals,
        severity,
        startDate: new Date(Math.min(...cases.map(c => new Date(c.timestamp)))),
        lastCase: new Date(Math.max(...cases.map(c => new Date(c.timestamp)))),
        cases
      })
    }
  })
  
  return outbreaks
}

/**
 * Predict health risks based on patterns
 */
export function predictHealthRisks(animal, healthRecords, treatments, vaccinations) {
  const risks = []
  
  const animalRecords = healthRecords.filter(r => r.animalId === animal.id)
  const recentRecords = animalRecords
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10)
  
  // Check for recurring conditions
  const conditionCounts = {}
  animalRecords.forEach(record => {
    const condition = record.condition.toLowerCase()
    conditionCounts[condition] = (conditionCounts[condition] || 0) + 1
  })
  
  Object.entries(conditionCounts).forEach(([condition, count]) => {
    if (count >= 3) {
      risks.push({
        type: 'recurring_condition',
        severity: 'moderate',
        condition,
        occurrences: count,
        message: `${condition} has occurred ${count} times - consider preventive measures`,
        recommendation: `Consult veterinarian about prevention strategies for ${condition}`
      })
    }
  })
  
  // Check vaccination gaps
  const vaccinesByType = {}
  vaccinations.filter(v => v.animalId === animal.id).forEach(v => {
    if (!vaccinesByType[v.type]) {
      vaccinesByType[v.type] = []
    }
    vaccinesByType[v.type].push(v)
  })
  
  Object.entries(vaccinesByType).forEach(([type, vaccines]) => {
    const latest = vaccines.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0]
    
    const daysSince = Math.floor((Date.now() - new Date(latest.timestamp)) / (1000 * 60 * 60 * 24))
    
    if (daysSince > 365) {
      risks.push({
        type: 'overdue_vaccination',
        severity: 'high',
        condition: type,
        daysSince,
        message: `${type} vaccination overdue by ${daysSince - 365} days`,
        recommendation: `Schedule ${type} vaccination immediately`
      })
    } else if (daysSince > 330) {
      risks.push({
        type: 'upcoming_vaccination',
        severity: 'low',
        condition: type,
        daysUntil: 365 - daysSince,
        message: `${type} vaccination due in ${365 - daysSince} days`,
        recommendation: `Schedule ${type} vaccination soon`
      })
    }
  })
  
  // Check treatment effectiveness
  const ongoingTreatments = treatments.filter(t => 
    t.animalId === animal.id && 
    t.status === 'ongoing'
  )
  
  ongoingTreatments.forEach(treatment => {
    const daysSince = Math.floor((Date.now() - new Date(treatment.timestamp)) / (1000 * 60 * 60 * 24))
    
    if (daysSince > 30) {
      risks.push({
        type: 'prolonged_treatment',
        severity: 'moderate',
        condition: treatment.condition,
        daysSince,
        message: `Treatment for ${treatment.condition} ongoing for ${daysSince} days`,
        recommendation: `Review treatment effectiveness with veterinarian`
      })
    }
  })
  
  // Check for untreated severe conditions
  recentRecords.forEach(record => {
    if (['severe', 'critical'].includes(record.severity)) {
      const hasTreatment = treatments.some(t => 
        t.animalId === animal.id &&
        t.condition.toLowerCase().includes(record.condition.toLowerCase()) &&
        new Date(t.timestamp) >= new Date(record.timestamp)
      )
      
      if (!hasTreatment) {
        const daysAgo = Math.floor((Date.now() - new Date(record.timestamp)) / (1000 * 60 * 60 * 24))
        if (daysAgo <= 7) {
          risks.push({
            type: 'untreated_condition',
            severity: 'critical',
            condition: record.condition,
            daysAgo,
            message: `${record.severity} condition "${record.condition}" recorded ${daysAgo} days ago with no treatment`,
            recommendation: `Initiate treatment for ${record.condition} immediately`
          })
        }
      }
    }
  })
  
  return risks
}

/**
 * Generate health trends over time
 */
export function generateHealthTrends(healthRecords, period = 90) {
  const trends = {
    totalRecords: 0,
    conditions: {},
    severityDistribution: { mild: 0, moderate: 0, severe: 0, critical: 0 },
    timelineData: [],
    mostCommonConditions: [],
    trendsUp: [],
    trendsDown: []
  }
  
  const cutoffDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000)
  const recentRecords = healthRecords.filter(r => new Date(r.timestamp) >= cutoffDate)
  
  trends.totalRecords = recentRecords.length
  
  // Count conditions
  recentRecords.forEach(record => {
    const condition = record.condition.toLowerCase().trim()
    if (!trends.conditions[condition]) {
      trends.conditions[condition] = { count: 0, animals: new Set() }
    }
    trends.conditions[condition].count++
    trends.conditions[condition].animals.add(record.animalId)
    
    if (record.severity) {
      trends.severityDistribution[record.severity]++
    }
  })
  
  // Generate timeline (weekly buckets)
  const weeks = Math.ceil(period / 7)
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(cutoffDate.getTime() + i * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const weekRecords = recentRecords.filter(r => {
      const date = new Date(r.timestamp)
      return date >= weekStart && date < weekEnd
    })
    
    trends.timelineData.push({
      week: i + 1,
      startDate: weekStart,
      endDate: weekEnd,
      totalCases: weekRecords.length,
      severity: {
        mild: weekRecords.filter(r => r.severity === 'mild').length,
        moderate: weekRecords.filter(r => r.severity === 'moderate').length,
        severe: weekRecords.filter(r => r.severity === 'severe').length,
        critical: weekRecords.filter(r => r.severity === 'critical').length
      }
    })
  }
  
  // Most common conditions
  trends.mostCommonConditions = Object.entries(trends.conditions)
    .map(([condition, data]) => ({
      condition,
      count: data.count,
      affectedAnimals: data.animals.size
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // Detect trends (compare first half vs second half of period)
  const midpoint = Math.floor(weeks / 2)
  const firstHalf = trends.timelineData.slice(0, midpoint)
  const secondHalf = trends.timelineData.slice(midpoint)
  
  const firstHalfAvg = firstHalf.reduce((sum, w) => sum + w.totalCases, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, w) => sum + w.totalCases, 0) / secondHalf.length
  
  const changePercent = ((secondHalfAvg - firstHalfAvg) / (firstHalfAvg || 1)) * 100
  
  if (changePercent > 20) {
    trends.trendsUp.push({
      metric: 'Overall Health Issues',
      change: changePercent.toFixed(1) + '%',
      message: `Health issues increased by ${changePercent.toFixed(1)}% in recent weeks`
    })
  } else if (changePercent < -20) {
    trends.trendsDown.push({
      metric: 'Overall Health Issues',
      change: Math.abs(changePercent).toFixed(1) + '%',
      message: `Health issues decreased by ${Math.abs(changePercent).toFixed(1)}% in recent weeks`
    })
  }
  
  return trends
}

/**
 * Calculate veterinary costs and ROI
 */
export function calculateVeterinaryCosts(healthRecords, treatments, vaccinations, period = 365) {
  const cutoffDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000)
  
  const costs = {
    totalCost: 0,
    healthRecordsCost: 0,
    treatmentsCost: 0,
    vaccinationsCost: 0,
    byAnimal: {},
    byCondition: {},
    averagePerAnimal: 0,
    costTrend: []
  }
  
  // Health records costs
  healthRecords
    .filter(r => new Date(r.timestamp) >= cutoffDate)
    .forEach(record => {
      const cost = parseFloat(record.cost) || 0
      costs.healthRecordsCost += cost
      costs.totalCost += cost
      
      if (!costs.byAnimal[record.animalId]) {
        costs.byAnimal[record.animalId] = 0
      }
      costs.byAnimal[record.animalId] += cost
      
      const condition = record.condition.toLowerCase()
      if (!costs.byCondition[condition]) {
        costs.byCondition[condition] = 0
      }
      costs.byCondition[condition] += cost
    })
  
  // Treatments costs
  treatments
    .filter(t => new Date(t.timestamp) >= cutoffDate)
    .forEach(treatment => {
      const cost = parseFloat(treatment.cost) || 0
      costs.treatmentsCost += cost
      costs.totalCost += cost
      
      if (!costs.byAnimal[treatment.animalId]) {
        costs.byAnimal[treatment.animalId] = 0
      }
      costs.byAnimal[treatment.animalId] += cost
    })
  
  // Vaccinations costs
  vaccinations
    .filter(v => new Date(v.timestamp) >= cutoffDate)
    .forEach(vaccine => {
      const cost = parseFloat(vaccine.cost) || 0
      costs.vaccinationsCost += cost
      costs.totalCost += cost
      
      if (!costs.byAnimal[vaccine.animalId]) {
        costs.byAnimal[vaccine.animalId] = 0
      }
      costs.byAnimal[vaccine.animalId] += cost
    })
  
  const animalCount = Object.keys(costs.byAnimal).length
  costs.averagePerAnimal = animalCount > 0 ? costs.totalCost / animalCount : 0
  
  // Generate monthly cost trend
  const months = Math.ceil(period / 30)
  for (let i = 0; i < months; i++) {
    const monthStart = new Date(cutoffDate.getTime() + i * 30 * 24 * 60 * 60 * 1000)
    const monthEnd = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    let monthCost = 0
    
    healthRecords.forEach(r => {
      const date = new Date(r.timestamp)
      if (date >= monthStart && date < monthEnd) {
        monthCost += parseFloat(r.cost) || 0
      }
    })
    
    treatments.forEach(t => {
      const date = new Date(t.timestamp)
      if (date >= monthStart && date < monthEnd) {
        monthCost += parseFloat(t.cost) || 0
      }
    })
    
    vaccinations.forEach(v => {
      const date = new Date(v.timestamp)
      if (date >= monthStart && date < monthEnd) {
        monthCost += parseFloat(v.cost) || 0
      }
    })
    
    costs.costTrend.push({
      month: i + 1,
      startDate: monthStart,
      endDate: monthEnd,
      cost: monthCost
    })
  }
  
  return costs
}

/**
 * Generate health recommendations based on all data
 */
export function generateHealthRecommendations(animals, healthRecords, treatments, vaccinations) {
  const recommendations = []
  
  // Check each animal
  animals.forEach(animal => {
    const risks = predictHealthRisks(animal, healthRecords, treatments, vaccinations)
    
    risks.forEach(risk => {
      if (risk.severity === 'critical' || risk.severity === 'high') {
        recommendations.push({
          priority: risk.severity === 'critical' ? 'urgent' : 'high',
          animalId: animal.id,
          animalName: animal.name || animal.tag || animal.id,
          category: risk.type,
          message: risk.message,
          action: risk.recommendation
        })
      }
    })
  })
  
  // Check for outbreaks
  const outbreaks = detectOutbreaks(healthRecords, animals)
  outbreaks.forEach(outbreak => {
    recommendations.push({
      priority: 'urgent',
      category: 'outbreak',
      message: `Potential outbreak: ${outbreak.condition} affecting ${outbreak.affectedAnimals} animals`,
      action: `Isolate affected animals, investigate cause, implement biosecurity measures`
    })
  })
  
  // Check vaccination coverage
  const vaccineTypes = {}
  vaccinations.forEach(v => {
    if (!vaccineTypes[v.type]) {
      vaccineTypes[v.type] = new Set()
    }
    vaccineTypes[v.type].add(v.animalId)
  })
  
  Object.entries(vaccineTypes).forEach(([type, animalSet]) => {
    const coverage = (animalSet.size / animals.length) * 100
    if (coverage < 80) {
      recommendations.push({
        priority: 'medium',
        category: 'vaccination_coverage',
        message: `Only ${coverage.toFixed(1)}% of animals have ${type} vaccination`,
        action: `Schedule ${type} vaccination for remaining ${animals.length - animalSet.size} animals`
      })
    }
  })
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}
