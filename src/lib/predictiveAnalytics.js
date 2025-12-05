/**
 * Predictive Analytics Engine
 * Uses historical data to predict future trends
 * - Milk yield predictions
 * - Crop harvest forecasts
 * - Expense predictions
 * - Revenue forecasts
 */

/**
 * Simple Moving Average
 */
function simpleMovingAverage(data, windowSize = 3) {
  if (data.length < windowSize) return data
  
  const result = []
  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1)
    const avg = window.reduce((a, b) => a + b, 0) / windowSize
    result.push(avg)
  }
  return result
}

/**
 * Linear Regression for trend prediction
 */
function linearRegression(data) {
  const n = data.length
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 }
  
  const sumX = data.reduce((sum, _, i) => sum + i, 0)
  const sumY = data.reduce((sum, val) => sum + val, 0)
  const sumXY = data.reduce((sum, val, i) => sum + i * val, 0)
  const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Calculate R-squared
  const yMean = sumY / n
  const ssTotal = data.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0)
  const predictions = data.map((_, i) => slope * i + intercept)
  const ssResidual = data.reduce((sum, val, i) => sum + Math.pow(val - predictions[i], 2), 0)
  const rSquared = 1 - (ssResidual / ssTotal)
  
  return { slope, intercept, rSquared: Math.max(0, rSquared) }
}

/**
 * Predict future values using linear regression
 */
export function predictFutureValues(historicalData, periodsAhead = 3) {
  if (!historicalData || historicalData.length < 2) {
    return {
      predictions: [],
      confidence: 0,
      trend: 'insufficient_data'
    }
  }
  
  const { slope, intercept, rSquared } = linearRegression(historicalData)
  const n = historicalData.length
  
  const predictions = []
  for (let i = 0; i < periodsAhead; i++) {
    const x = n + i
    predictions.push(Math.max(0, slope * x + intercept))
  }
  
  const trend = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable'
  const confidence = Math.round(rSquared * 100)
  
  return {
    predictions,
    confidence,
    trend,
    slope,
    intercept
  }
}

/**
 * Predict milk yield based on historical data
 */
export function predictMilkYield(animals, milkRecords) {
  const predictions = {}
  
  // Group records by animal
  const recordsByAnimal = {}
  milkRecords.forEach(record => {
    if (!recordsByAnimal[record.animalId]) {
      recordsByAnimal[record.animalId] = []
    }
    recordsByAnimal[record.animalId].push(record)
  })
  
  // Predict for each producing animal
  animals.forEach(animal => {
    if (animal.lactationStatus === 'Lactating' && recordsByAnimal[animal.id]) {
      const records = recordsByAnimal[animal.id]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30) // Last 30 records
      
      if (records.length >= 5) {
        const yields = records.map(r => parseFloat(r.amount) || 0)
        const prediction = predictFutureValues(yields, 7) // Next 7 days
        
        predictions[animal.id] = {
          animalName: animal.name,
          currentAverage: yields.slice(-7).reduce((a, b) => a + b, 0) / 7,
          nextWeekPrediction: prediction.predictions.reduce((a, b) => a + b, 0) / 7,
          trend: prediction.trend,
          confidence: prediction.confidence
        }
      }
    }
  })
  
  // Overall herd prediction
  const allPredictions = Object.values(predictions)
  if (allPredictions.length > 0) {
    const totalCurrentAvg = allPredictions.reduce((sum, p) => sum + p.currentAverage, 0)
    const totalNextWeek = allPredictions.reduce((sum, p) => sum + p.nextWeekPrediction, 0)
    const avgConfidence = allPredictions.reduce((sum, p) => sum + p.confidence, 0) / allPredictions.length
    
    return {
      byAnimal: predictions,
      herdTotal: {
        currentDailyAverage: totalCurrentAvg,
        predictedDailyAverage: totalNextWeek,
        predictedWeeklyTotal: totalNextWeek * 7,
        trend: totalNextWeek > totalCurrentAvg ? 'increasing' : totalNextWeek < totalCurrentAvg ? 'decreasing' : 'stable',
        confidence: Math.round(avgConfidence)
      }
    }
  }
  
  return { byAnimal: {}, herdTotal: null }
}

/**
 * Predict crop harvest yield and timing
 */
export function predictCropHarvest(crops, yieldRecords) {
  const predictions = []
  
  const activeGrowingCrops = crops.filter(c => 
    c.status === 'Growing' || c.status === 'Flowering' || c.status === 'Filling'
  )
  
  activeGrowingCrops.forEach(crop => {
    const similarCrops = crops.filter(c => 
      c.name === crop.name && 
      c.variety === crop.variety &&
      c.status === 'Harvested'
    )
    
    if (similarCrops.length >= 2) {
      // Get historical yields
      const historicalYields = similarCrops
        .map(c => {
          const yieldRecord = yieldRecords.find(y => y.cropId === c.id)
          return yieldRecord ? parseFloat(yieldRecord.amount) / parseFloat(c.area) : null
        })
        .filter(Boolean)
      
      if (historicalYields.length >= 2) {
        const avgYieldPerAcre = historicalYields.reduce((a, b) => a + b, 0) / historicalYields.length
        const stdDev = Math.sqrt(
          historicalYields.reduce((sum, y) => sum + Math.pow(y - avgYieldPerAcre, 2), 0) / historicalYields.length
        )
        
        // Calculate days to maturity
        const avgDaysToMaturity = similarCrops.reduce((sum, c) => {
          const plantDate = new Date(c.plantDate)
          const harvestDate = new Date(c.actualHarvest)
          const days = (harvestDate - plantDate) / (1000 * 60 * 60 * 24)
          return sum + days
        }, 0) / similarCrops.length
        
        const plantDate = new Date(crop.plantDate)
        const predictedHarvestDate = new Date(plantDate.getTime() + avgDaysToMaturity * 24 * 60 * 60 * 1000)
        const daysUntilHarvest = Math.ceil((predictedHarvestDate - new Date()) / (1000 * 60 * 60 * 24))
        
        predictions.push({
          cropId: crop.id,
          cropName: crop.name,
          variety: crop.variety,
          area: crop.area,
          predictedYieldPerAcre: avgYieldPerAcre,
          predictedTotalYield: avgYieldPerAcre * parseFloat(crop.area),
          yieldRange: {
            low: (avgYieldPerAcre - stdDev) * parseFloat(crop.area),
            high: (avgYieldPerAcre + stdDev) * parseFloat(crop.area)
          },
          predictedHarvestDate: predictedHarvestDate.toISOString().split('T')[0],
          daysUntilHarvest,
          confidence: similarCrops.length >= 5 ? 85 : 70,
          basedOn: `${similarCrops.length} similar crops`
        })
      }
    }
  })
  
  return predictions
}

/**
 * Predict monthly expenses based on historical patterns
 */
export function predictExpenses(financeRecords) {
  // Get last 12 months of expenses
  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
  
  const recentExpenses = financeRecords
    .filter(r => r.amount < 0 && new Date(r.date) >= oneYearAgo)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  
  if (recentExpenses.length < 3) {
    return {
      nextMonth: null,
      nextQuarter: null,
      byCategory: {},
      confidence: 0
    }
  }
  
  // Group by month
  const monthlyTotals = {}
  recentExpenses.forEach(expense => {
    const month = new Date(expense.date).toISOString().slice(0, 7) // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + Math.abs(expense.amount)
  })
  
  const months = Object.keys(monthlyTotals).sort()
  const values = months.map(m => monthlyTotals[m])
  
  // Predict next 3 months
  const prediction = predictFutureValues(values, 3)
  
  // Predict by category
  const byCategory = {}
  const categories = [...new Set(recentExpenses.map(e => e.category))]
  
  categories.forEach(category => {
    const categoryExpenses = recentExpenses.filter(e => e.category === category)
    const categoryMonthly = {}
    
    categoryExpenses.forEach(expense => {
      const month = new Date(expense.date).toISOString().slice(0, 7)
      categoryMonthly[month] = (categoryMonthly[month] || 0) + Math.abs(expense.amount)
    })
    
    const catMonths = Object.keys(categoryMonthly).sort()
    const catValues = catMonths.map(m => categoryMonthly[m])
    
    if (catValues.length >= 2) {
      const catPrediction = predictFutureValues(catValues, 1)
      byCategory[category] = {
        nextMonth: catPrediction.predictions[0],
        trend: catPrediction.trend,
        confidence: catPrediction.confidence
      }
    }
  })
  
  return {
    nextMonth: prediction.predictions[0],
    nextQuarter: prediction.predictions.reduce((a, b) => a + b, 0),
    trend: prediction.trend,
    byCategory,
    confidence: prediction.confidence,
    historicalAverage: values.reduce((a, b) => a + b, 0) / values.length
  }
}

/**
 * Predict revenue based on historical patterns and current production
 */
export function predictRevenue(financeRecords, animals, crops) {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  
  const recentIncome = financeRecords
    .filter(r => r.amount > 0 && new Date(r.date) >= sixMonthsAgo)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  
  if (recentIncome.length < 3) {
    return {
      nextMonth: null,
      nextQuarter: null,
      bySource: {},
      confidence: 0
    }
  }
  
  // Group by month
  const monthlyTotals = {}
  recentIncome.forEach(income => {
    const month = new Date(income.date).toISOString().slice(0, 7)
    monthlyTotals[month] = (monthlyTotals[month] || 0) + income.amount
  })
  
  const months = Object.keys(monthlyTotals).sort()
  const values = months.map(m => monthlyTotals[m])
  
  const prediction = predictFutureValues(values, 3)
  
  // Predict by source
  const bySource = {}
  const sources = [...new Set(recentIncome.map(i => i.category))]
  
  sources.forEach(source => {
    const sourceIncome = recentIncome.filter(i => i.category === source)
    const sourceMonthly = {}
    
    sourceIncome.forEach(income => {
      const month = new Date(income.date).toISOString().slice(0, 7)
      sourceMonthly[month] = (sourceMonthly[month] || 0) + income.amount
    })
    
    const srcMonths = Object.keys(sourceMonthly).sort()
    const srcValues = srcMonths.map(m => sourceMonthly[m])
    
    if (srcValues.length >= 2) {
      const srcPrediction = predictFutureValues(srcValues, 1)
      bySource[source] = {
        nextMonth: srcPrediction.predictions[0],
        trend: srcPrediction.trend,
        confidence: srcPrediction.confidence
      }
    }
  })
  
  return {
    nextMonth: prediction.predictions[0],
    nextQuarter: prediction.predictions.reduce((a, b) => a + b, 0),
    trend: prediction.trend,
    bySource,
    confidence: prediction.confidence,
    historicalAverage: values.reduce((a, b) => a + b, 0) / values.length
  }
}

/**
 * Detect seasonal patterns in data
 */
export function detectSeasonalPatterns(data, timestamps) {
  if (data.length < 12) return null
  
  // Group by month
  const byMonth = {}
  data.forEach((value, i) => {
    const month = new Date(timestamps[i]).getMonth()
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(value)
  })
  
  // Calculate average for each month
  const monthlyAverages = []
  for (let i = 0; i < 12; i++) {
    if (byMonth[i] && byMonth[i].length > 0) {
      monthlyAverages[i] = byMonth[i].reduce((a, b) => a + b, 0) / byMonth[i].length
    } else {
      monthlyAverages[i] = 0
    }
  }
  
  // Find peaks and troughs
  const max = Math.max(...monthlyAverages)
  const min = Math.min(...monthlyAverages.filter(v => v > 0))
  const peakMonth = monthlyAverages.indexOf(max)
  const troughMonth = monthlyAverages.indexOf(min)
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  return {
    monthlyAverages,
    peakMonth: monthNames[peakMonth],
    troughMonth: monthNames[troughMonth],
    seasonalVariation: ((max - min) / max * 100).toFixed(1) + '%',
    pattern: max / min > 1.5 ? 'strong' : max / min > 1.2 ? 'moderate' : 'weak'
  }
}

/**
 * Get comprehensive predictions for dashboard
 */
export function getPredictiveDashboard(animals, crops, finance, milkRecords, cropYields) {
  return {
    milk: predictMilkYield(animals, milkRecords || []),
    crops: predictCropHarvest(crops, cropYields || []),
    expenses: predictExpenses(finance),
    revenue: predictRevenue(finance, animals, crops)
  }
}
