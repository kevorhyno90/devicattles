/**
 * Advanced Analytics & Reporting
 * Complex calculations for farm performance metrics
 */

import { formatCurrency } from './currency'

/**
 * Calculate Feed Efficiency Ratio (FER)
 * FER = Weight Gain / Feed Consumed
 */
export function calculateFeedEfficiency(animals) {
  try {
    const measurements = JSON.parse(localStorage.getItem('devinsfarm:measurements') || '[]')
    const feeding = JSON.parse(localStorage.getItem('devinsfarm:feeding') || '[]')
    
    const results = animals.map(animal => {
      // Get all measurements for this animal
      const animalMeasurements = measurements
        .filter(m => m.animalId === animal.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      
      if (animalMeasurements.length < 2) {
        return { animalId: animal.id, animalName: animal.name, fer: null, message: 'Insufficient data' }
      }
      
      // Calculate weight gain
      const firstWeight = parseFloat(animalMeasurements[0].weight) || 0
      const lastWeight = parseFloat(animalMeasurements[animalMeasurements.length - 1].weight) || 0
      const weightGain = lastWeight - firstWeight
      
      // Calculate total feed consumed
      const animalFeeding = feeding
        .filter(f => f.animalId === animal.id || (f.animals && f.animals.includes(animal.id)))
      
      const totalFeed = animalFeeding.reduce((sum, f) => sum + (parseFloat(f.totalAmount) || 0), 0)
      
      if (totalFeed === 0) {
        return { animalId: animal.id, animalName: animal.name, fer: null, message: 'No feeding data' }
      }
      
      // FER = Weight Gain (kg) / Feed Consumed (kg)
      const fer = weightGain / totalFeed
      
      return {
        animalId: animal.id,
        animalName: animal.name,
        fer: fer,
        weightGain: weightGain,
        feedConsumed: totalFeed,
        efficiency: fer > 0.15 ? 'Excellent' : fer > 0.10 ? 'Good' : fer > 0.05 ? 'Average' : 'Poor',
        startWeight: firstWeight,
        endWeight: lastWeight,
        days: Math.ceil((new Date(animalMeasurements[animalMeasurements.length - 1].date) - new Date(animalMeasurements[0].date)) / (1000 * 60 * 60 * 24))
      }
    }).filter(r => r.fer !== null)
    
    // Calculate average FER
    const avgFER = results.length > 0 
      ? results.reduce((sum, r) => sum + r.fer, 0) / results.length
      : 0
    
    return {
      results,
      averageFER: avgFER,
      totalAnimals: animals.length,
      analyzedAnimals: results.length
    }
  } catch (error) {
    console.error('Error calculating feed efficiency:', error)
    return { results: [], averageFER: 0, totalAnimals: 0, analyzedAnimals: 0 }
  }
}

/**
 * Calculate Return on Investment (ROI) for animals
 * ROI = (Revenue - Cost) / Cost * 100
 */
export function calculateAnimalROI(animals) {
  try {
    const transactions = JSON.parse(localStorage.getItem('devinsfarm:transactions') || '[]')
    const feeding = JSON.parse(localStorage.getItem('devinsfarm:feeding') || '[]')
    const treatments = JSON.parse(localStorage.getItem('devinsfarm:treatments') || '[]')
    const milkYield = JSON.parse(localStorage.getItem('devinsfarm:milkYield') || '[]')
    
    const results = animals.map(animal => {
      // Calculate costs
      const purchaseCost = parseFloat(animal.purchasePrice) || 0
      
      // Feed costs
      const feedCosts = feeding
        .filter(f => f.animalId === animal.id || (f.animals && f.animals.includes(animal.id)))
        .reduce((sum, f) => sum + (parseFloat(f.totalCost) || 0), 0)
      
      // Treatment costs
      const treatmentCosts = treatments
        .filter(t => t.animalId === animal.id)
        .reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0)
      
      // Total costs
      const totalCosts = purchaseCost + feedCosts + treatmentCosts
      
      // Calculate revenue
      let totalRevenue = 0
      
      // Milk revenue
      const animalMilk = milkYield.filter(m => m.animalId === animal.id)
      const milkRevenue = animalMilk.reduce((sum, m) => {
        const quantity = parseFloat(m.quantity) || 0
        const price = parseFloat(m.pricePerUnit) || 0
        return sum + (quantity * price)
      }, 0)
      totalRevenue += milkRevenue
      
      // Sale revenue
      const saleTransaction = transactions.find(t => 
        t.type === 'income' && 
        t.category === 'Livestock Sale' && 
        t.description && t.description.includes(animal.name)
      )
      if (saleTransaction) {
        totalRevenue += parseFloat(saleTransaction.amount) || 0
      }
      
      // Calculate ROI
      const profit = totalRevenue - totalCosts
      const roi = totalCosts > 0 ? (profit / totalCosts) * 100 : 0
      
      return {
        animalId: animal.id,
        animalName: animal.name,
        animalType: animal.type,
        costs: {
          purchase: purchaseCost,
          feed: feedCosts,
          treatment: treatmentCosts,
          total: totalCosts
        },
        revenue: {
          milk: milkRevenue,
          sale: saleTransaction ? parseFloat(saleTransaction.amount) : 0,
          total: totalRevenue
        },
        profit: profit,
        roi: roi,
        status: animal.status,
        profitability: roi > 50 ? 'Highly Profitable' : roi > 20 ? 'Profitable' : roi > 0 ? 'Break Even' : 'Loss'
      }
    })
    
    // Calculate totals
    const totalCosts = results.reduce((sum, r) => sum + r.costs.total, 0)
    const totalRevenue = results.reduce((sum, r) => sum + r.revenue.total, 0)
    const totalProfit = totalRevenue - totalCosts
    const averageROI = results.reduce((sum, r) => sum + r.roi, 0) / results.length
    
    return {
      results,
      summary: {
        totalCosts,
        totalRevenue,
        totalProfit,
        averageROI,
        profitableAnimals: results.filter(r => r.roi > 0).length,
        totalAnimals: animals.length
      }
    }
  } catch (error) {
    console.error('Error calculating ROI:', error)
    return { results: [], summary: {} }
  }
}

/**
 * Comparative Analysis - Compare periods
 */
export function comparePerformanceByPeriod(periodType = 'month') {
  try {
    const transactions = JSON.parse(localStorage.getItem('devinsfarm:transactions') || '[]')
    const milkYield = JSON.parse(localStorage.getItem('devinsfarm:milkYield') || '[]')
    const feeding = JSON.parse(localStorage.getItem('devinsfarm:feeding') || '[]')
    
    const now = new Date()
    const periods = []
    
    // Generate periods (last 6 months or 4 quarters)
    const numPeriods = periodType === 'month' ? 6 : 4
    
    for (let i = numPeriods - 1; i >= 0; i--) {
      const periodStart = new Date(now)
      const periodEnd = new Date(now)
      
      if (periodType === 'month') {
        periodStart.setMonth(now.getMonth() - i)
        periodStart.setDate(1)
        periodStart.setHours(0, 0, 0, 0)
        
        periodEnd.setMonth(now.getMonth() - i + 1)
        periodEnd.setDate(0)
        periodEnd.setHours(23, 59, 59, 999)
      } else {
        // Quarter
        const quarterStartMonth = Math.floor((now.getMonth() - i * 3) / 3) * 3
        periodStart.setMonth(quarterStartMonth)
        periodStart.setDate(1)
        periodStart.setHours(0, 0, 0, 0)
        
        periodEnd.setMonth(quarterStartMonth + 3)
        periodEnd.setDate(0)
        periodEnd.setHours(23, 59, 59, 999)
      }
      
      // Filter data for this period
      const periodTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date >= periodStart && date <= periodEnd
      })
      
      const periodMilk = milkYield.filter(m => {
        const date = new Date(m.date)
        return date >= periodStart && date <= periodEnd
      })
      
      const periodFeeding = feeding.filter(f => {
        const date = new Date(f.date)
        return date >= periodStart && date <= periodEnd
      })
      
      // Calculate metrics
      const income = periodTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
      
      const expenses = periodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
      
      const milkProduction = periodMilk.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0)
      const milkRevenue = periodMilk.reduce((sum, m) => {
        const qty = parseFloat(m.quantity) || 0
        const price = parseFloat(m.pricePerUnit) || 0
        return sum + (qty * price)
      }, 0)
      
      const feedCosts = periodFeeding.reduce((sum, f) => sum + (parseFloat(f.totalCost) || 0), 0)
      
      periods.push({
        period: periodType === 'month' 
          ? periodStart.toLocaleString('default', { month: 'short', year: 'numeric' })
          : `Q${Math.floor(periodStart.getMonth() / 3) + 1} ${periodStart.getFullYear()}`,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
        income,
        expenses,
        profit: income - expenses,
        milkProduction,
        milkRevenue,
        feedCosts,
        profitMargin: income > 0 ? ((income - expenses) / income) * 100 : 0
      })
    }
    
    return {
      periods,
      periodType,
      trends: calculateTrends(periods)
    }
  } catch (error) {
    console.error('Error in comparative analysis:', error)
    return { periods: [], periodType, trends: {} }
  }
}

/**
 * Calculate trends from period data
 */
function calculateTrends(periods) {
  if (periods.length < 2) return {}
  
  const latest = periods[periods.length - 1]
  const previous = periods[periods.length - 2]
  
  const calculateChange = (current, prev) => {
    if (prev === 0) return current > 0 ? 100 : 0
    return ((current - prev) / prev) * 100
  }
  
  return {
    incomeChange: calculateChange(latest.income, previous.income),
    expensesChange: calculateChange(latest.expenses, previous.expenses),
    profitChange: calculateChange(latest.profit, previous.profit),
    milkProductionChange: calculateChange(latest.milkProduction, previous.milkProduction),
    feedCostsChange: calculateChange(latest.feedCosts, previous.feedCosts)
  }
}

/**
 * Get top performers
 */
export function getTopPerformers(metric = 'roi', limit = 5) {
  try {
    const animals = JSON.parse(localStorage.getItem('devinsfarm:animals') || '[]')
    
    if (metric === 'roi') {
      const roiData = calculateAnimalROI(animals)
      return roiData.results
        .sort((a, b) => b.roi - a.roi)
        .slice(0, limit)
    } else if (metric === 'fer') {
      const ferData = calculateFeedEfficiency(animals)
      return ferData.results
        .sort((a, b) => b.fer - a.fer)
        .slice(0, limit)
    } else if (metric === 'milk') {
      const milkYield = JSON.parse(localStorage.getItem('devinsfarm:milkYield') || '[]')
      const milkByAnimal = {}
      
      milkYield.forEach(m => {
        if (!milkByAnimal[m.animalId]) {
          milkByAnimal[m.animalId] = { total: 0, records: 0 }
        }
        milkByAnimal[m.animalId].total += parseFloat(m.quantity) || 0
        milkByAnimal[m.animalId].records++
      })
      
      return Object.entries(milkByAnimal)
        .map(([animalId, data]) => {
          const animal = animals.find(a => a.id === parseInt(animalId))
          return {
            animalId: parseInt(animalId),
            animalName: animal?.name || 'Unknown',
            totalMilk: data.total,
            averageMilk: data.total / data.records,
            records: data.records
          }
        })
        .sort((a, b) => b.totalMilk - a.totalMilk)
        .slice(0, limit)
    }
    
    return []
  } catch (error) {
    console.error('Error getting top performers:', error)
    return []
  }
}
