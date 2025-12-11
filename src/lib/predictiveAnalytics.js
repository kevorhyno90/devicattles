/**
 * Predictive Analytics Engine
 * Uses historical data and ML algorithms to predict future trends
 * 
 * Features:
 * - Milk yield predictions (7-30 days ahead)
 * - Weight gain forecasting
 * - Breeding success probability
 * - Feed cost optimization
 * - Crop harvest forecasts
 * - Expense predictions
 * - Revenue forecasts
 * 
 * Algorithms:
 * - Linear Regression
 * - Moving Averages
 * - Seasonal Decomposition
 * - Confidence Scoring
 * 
 * Usage:
 * import { PredictiveAnalytics } from './predictiveAnalytics';
 * const analytics = new PredictiveAnalytics();
 * const prediction = await analytics.predictMilkYield(animalId, 30);
 */

import { DataLayer } from './dataLayer';
import { logAction } from './audit';

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

/**
 * Enhanced Predictive Analytics Class
 * Provides AI-powered predictions with DataLayer integration
 */
export class PredictiveAnalytics {
  constructor() {
    this.initialized = true;
  }

  /**
   * Predict milk yield for specific animal
   * @param {string} animalId - Animal ID
   * @param {number} daysAhead - Days to predict ahead (default 30)
   * @returns {Promise<Object>} Prediction results
   */
  async predictMilkYieldForAnimal(animalId, daysAhead = 30) {
    try {
      const milkRecords = await DataLayer.milkYield?.getByAnimal(animalId, 90) || [];
      
      if (milkRecords.length < 7) {
        return {
          success: false,
          error: 'Insufficient data',
          message: 'Need at least 7 milk records for prediction',
          animalId
        };
      }

      // Extract amounts and sort by date
      const sorted = milkRecords
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(r => r.amount);

      // Perform regression
      const { slope, intercept, rSquared } = linearRegression(sorted);

      // Generate predictions
      const predictions = [];
      for (let i = 0; i < daysAhead; i++) {
        const predictedValue = slope * (sorted.length + i) + intercept;
        predictions.push({
          day: i + 1,
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          predicted: Math.max(0, predictedValue).toFixed(2),
          confidence: this.calculateConfidence(rSquared, i, daysAhead)
        });
      }

      const avgHistorical = sorted.reduce((a, b) => a + b, 0) / sorted.length;
      const avgPredicted = predictions.reduce((sum, p) => sum + parseFloat(p.predicted), 0) / predictions.length;

      const trend = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';

      // Log prediction
      logAction('prediction_made', {
        type: 'milk_yield',
        animalId,
        daysAhead,
        confidence: (rSquared * 100).toFixed(1)
      });

      return {
        success: true,
        animalId,
        predictions,
        trend,
        confidence: (rSquared * 100).toFixed(1),
        historicalAverage: avgHistorical.toFixed(2),
        predictedAverage: avgPredicted.toFixed(2),
        changePercent: ((avgPredicted - avgHistorical) / avgHistorical * 100).toFixed(1)
      };
    } catch (error) {
      console.error('Milk yield prediction failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Predict weight gain until target weight
   * @param {string} animalId - Animal ID
   * @param {number} targetWeight - Target weight in kg
   * @returns {Promise<Object>} Prediction results
   */
  async predictWeightGain(animalId, targetWeight) {
    try {
      const measurements = await DataLayer.measurements?.getByAnimal(animalId) || [];
      
      if (measurements.length < 3) {
        return {
          success: false,
          error: 'Insufficient data',
          message: 'Need at least 3 weight measurements'
        };
      }

      // Sort by date and extract weights
      const weights = measurements
        .filter(m => m.weight)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(m => ({ date: new Date(m.date), weight: m.weight }));

      // Calculate average daily gain
      const totalGain = weights[weights.length - 1].weight - weights[0].weight;
      const totalDays = (weights[weights.length - 1].date - weights[0].date) / (1000 * 60 * 60 * 24);
      const avgDailyGain = totalGain / totalDays;

      // Current weight and remaining gain
      const currentWeight = weights[weights.length - 1].weight;
      const remainingGain = targetWeight - currentWeight;

      if (remainingGain <= 0) {
        return {
          success: true,
          message: 'Target weight already reached',
          currentWeight,
          targetWeight
        };
      }

      // Calculate days to target
      const daysToTarget = Math.ceil(remainingGain / avgDailyGain);
      const estimatedDate = new Date(Date.now() + daysToTarget * 24 * 60 * 60 * 1000);

      // Generate weekly predictions
      const weeklyPredictions = [];
      for (let week = 1; week <= Math.ceil(daysToTarget / 7); week++) {
        const days = week * 7;
        const predictedWeight = currentWeight + (avgDailyGain * days);
        weeklyPredictions.push({
          week,
          date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          weight: Math.min(predictedWeight, targetWeight).toFixed(1)
        });
      }

      return {
        success: true,
        animalId,
        currentWeight,
        targetWeight,
        remainingGain: remainingGain.toFixed(1),
        avgDailyGain: avgDailyGain.toFixed(2),
        daysToTarget,
        estimatedDate: estimatedDate.toISOString().split('T')[0],
        weeklyPredictions,
        confidence: weights.length >= 5 ? 'high' : 'medium'
      };
    } catch (error) {
      console.error('Weight gain prediction failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Predict breeding success probability
   * @param {string} animalId - Animal ID
   * @returns {Promise<Object>} Success probability and recommendations
   */
  async predictBreedingSuccess(animalId) {
    try {
      const animal = await DataLayer.animals.getById(animalId);
      
      if (!animal) {
        return { success: false, error: 'Animal not found' };
      }

      // Base success rate (industry average)
      let successRate = 0.75;
      const factors = [];

      // Historical breeding success
      if (animal.breedingHistory && animal.breedingHistory.length > 0) {
        const successful = animal.breedingHistory.filter(b => b.conceived).length;
        const historicalRate = successful / animal.breedingHistory.length;
        successRate = historicalRate;
        factors.push({
          factor: 'Historical Success',
          impact: historicalRate > 0.7 ? 'positive' : 'negative',
          value: (historicalRate * 100).toFixed(1) + '%'
        });
      }

      // Age factor (peak fertility 24-96 months for cattle)
      const ageMonths = animal.age || 24;
      let ageFactor = 1.0;

      if (ageMonths < 24) {
        ageFactor = 0.8;
        factors.push({ factor: 'Age', impact: 'negative', value: 'Young - below peak fertility' });
      } else if (ageMonths > 96) {
        ageFactor = 0.7;
        factors.push({ factor: 'Age', impact: 'negative', value: 'Older - reduced fertility' });
      } else {
        ageFactor = 1.1;
        factors.push({ factor: 'Age', impact: 'positive', value: 'Peak breeding age' });
      }

      // Health factor
      const healthScore = await this.calculateHealthScore(animalId);
      factors.push({
        factor: 'Health',
        impact: healthScore > 0.8 ? 'positive' : 'negative',
        value: (healthScore * 100).toFixed(0) + '%'
      });

      // Pregnancy-free period
      if (animal.lastBreedingDate) {
        const daysSinceBreeding = (Date.now() - new Date(animal.lastBreedingDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceBreeding > 60) {
          factors.push({ factor: 'Rest Period', impact: 'positive', value: 'Adequate recovery time' });
        }
      }

      // Calculate adjusted success rate
      const adjustedRate = Math.min(1.0, successRate * ageFactor * healthScore);

      return {
        success: true,
        animalId,
        animalName: animal.name,
        successRate: (adjustedRate * 100).toFixed(1),
        confidence: animal.breedingHistory?.length > 3 ? 'high' : 'medium',
        factors,
        recommendation: adjustedRate > 0.6 
          ? 'Good breeding candidate - proceed with breeding'
          : 'Consider health improvements and optimal timing'
      };
    } catch (error) {
      console.error('Breeding success prediction failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate health score for animal
   */
  async calculateHealthScore(animalId) {
    let score = 1.0;

    try {
      // Check recent treatments
      const treatments = await DataLayer.treatments?.getByAnimal(animalId) || [];
      const recentTreatments = treatments.filter(t => {
        const monthsAgo = (Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 3;
      });

      if (recentTreatments.length > 2) {
        score *= 0.8; // Multiple recent treatments = health concerns
      }

      // Check vaccinations (if tracked)
      const animal = await DataLayer.animals.getById(animalId);
      if (animal.nextVaccinationDate) {
        const vaccDate = new Date(animal.nextVaccinationDate);
        if (vaccDate < new Date()) {
          score *= 0.9; // Overdue vaccination
        }
      }
    } catch (error) {
      console.error('Health score calculation error:', error);
    }

    return Math.max(0.5, score);
  }

  /**
   * Optimize feed costs based on consumption patterns
   * @returns {Promise<Object>} Feed optimization recommendations
   */
  async optimizeFeedCosts() {
    try {
      const feedings = await DataLayer.feeding?.getAll() || [];
      const inventory = await DataLayer.inventory?.getAll() || [];

      if (feedings.length < 10) {
        return {
          success: false,
          error: 'Insufficient feeding data'
        };
      }

      // Calculate feed consumption patterns
      const consumption = {};
      const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;

      feedings
        .filter(f => new Date(f.date).getTime() > last30Days)
        .forEach(f => {
          if (!consumption[f.feedType]) {
            consumption[f.feedType] = { total: 0, count: 0 };
          }
          consumption[f.feedType].total += f.amount || 0;
          consumption[f.feedType].count++;
        });

      // Get feed costs from inventory
      const feedItems = inventory.filter(i => i.category === 'feed' || i.type === 'feed');

      const recommendations = [];

      for (const feed of feedItems) {
        const usage = consumption[feed.name];
        if (!usage) continue;

        const avgDaily = usage.total / 30;
        const costPerKg = feed.unitCost || 0;
        const monthlyCost = avgDaily * 30 * costPerKg;
        const monthlyUsage = avgDaily * 30;

        let suggestion = 'Current usage optimal';
        let savings = 0;

        // Check for bulk purchase opportunities
        if (monthlyCost > 10000) {
          savings = monthlyCost * 0.15; // Assume 15% bulk discount
          suggestion = `Consider bulk purchase for ₦${savings.toFixed(0)} monthly savings`;
        }

        // Check for wastage (high variation)
        const dailyAmounts = feedings
          .filter(f => f.feedType === feed.name && new Date(f.date).getTime() > last30Days)
          .map(f => f.amount || 0);
        
        if (dailyAmounts.length > 5) {
          const avg = dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length;
          const variance = dailyAmounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / dailyAmounts.length;
          const stdDev = Math.sqrt(variance);

          if (stdDev / avg > 0.3) {
            suggestion += ' | High variation detected - standardize feeding amounts to reduce waste';
          }
        }

        recommendations.push({
          feedType: feed.name,
          avgDailyUse: avgDaily.toFixed(2),
          monthlyUsage: monthlyUsage.toFixed(2),
          monthlyCost: monthlyCost.toFixed(2),
          costPerKg: costPerKg.toFixed(2),
          suggestion,
          potentialSavings: savings.toFixed(0)
        });
      }

      const totalMonthlyCost = recommendations.reduce((sum, r) => sum + parseFloat(r.monthlyCost), 0);
      const totalSavings = recommendations.reduce((sum, r) => sum + parseFloat(r.potentialSavings), 0);

      return {
        success: true,
        totalMonthlyCost: totalMonthlyCost.toFixed(2),
        potentialSavings: totalSavings.toFixed(2),
        savingsPercent: ((totalSavings / totalMonthlyCost) * 100).toFixed(1),
        recommendations,
        dataRange: '30 days'
      };
    } catch (error) {
      console.error('Feed cost optimization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate confidence score based on data quality
   */
  calculateConfidence(rSquared, dayIndex, totalDays) {
    // Base confidence from R-squared
    let confidence = rSquared * 100;

    // Reduce confidence for distant predictions
    const distanceFactor = 1 - (dayIndex / totalDays) * 0.3;
    confidence *= distanceFactor;

    return Math.max(20, Math.min(100, confidence)).toFixed(1);
  }

  /**
   * Get comprehensive analytics dashboard
   */
  async getDashboard() {
    try {
      const animals = await DataLayer.animals.getAll();
      const finance = await DataLayer.finance.getAll();

      // Get milk-producing animals
      const milkingAnimals = animals.filter(a => 
        a.lactationStatus === 'Lactating' || a.purpose === 'Dairy'
      );

      // Get predictions for first milking animal (demo)
      let milkPrediction = null;
      if (milkingAnimals.length > 0) {
        milkPrediction = await this.predictMilkYieldForAnimal(milkingAnimals[0].id, 7);
      }

      // Feed optimization
      const feedOptimization = await this.optimizeFeedCosts();

      return {
        success: true,
        milkProduction: milkPrediction,
        feedCosts: feedOptimization,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Dashboard generation failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
export const predictiveAnalytics = new PredictiveAnalytics();

export default predictiveAnalytics;
