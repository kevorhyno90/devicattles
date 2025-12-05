/**
 * Market Prices API Integration
 * Tracks commodity prices for livestock, crops, and farm inputs
 * Provides selling recommendations based on price trends
 */

import { logActivity } from './audit'

// Helper functions for localStorage
const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('localStorage save error:', e)
  }
}

const getFromLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (e) {
    console.error('localStorage read error:', e)
    return null
  }
}

const CACHE_KEY = 'cattalytics:market:prices'
const CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 hours
const HISTORY_KEY = 'cattalytics:market:history'

/**
 * Commodity categories
 */
export const COMMODITY_CATEGORIES = {
  LIVESTOCK: 'livestock',
  DAIRY: 'dairy',
  CROPS: 'crops',
  FEED: 'feed',
  SUPPLIES: 'supplies'
}

/**
 * Specific commodities tracked
 */
export const COMMODITIES = {
  // Livestock
  CATTLE_MATURE: { id: 'cattle_mature', name: 'Mature Cattle', category: 'livestock', unit: 'per head' },
  CATTLE_CALF: { id: 'cattle_calf', name: 'Calf', category: 'livestock', unit: 'per head' },
  GOAT: { id: 'goat', name: 'Goat', category: 'livestock', unit: 'per head' },
  SHEEP: { id: 'sheep', name: 'Sheep', category: 'livestock', unit: 'per head' },
  PIG: { id: 'pig', name: 'Pig', category: 'livestock', unit: 'per head' },
  CHICKEN: { id: 'chicken', name: 'Chicken', category: 'livestock', unit: 'per bird' },
  
  // Dairy
  MILK_RAW: { id: 'milk_raw', name: 'Raw Milk', category: 'dairy', unit: 'per liter' },
  MILK_PROCESSED: { id: 'milk_processed', name: 'Processed Milk', category: 'dairy', unit: 'per liter' },
  CHEESE: { id: 'cheese', name: 'Cheese', category: 'dairy', unit: 'per kg' },
  YOGURT: { id: 'yogurt', name: 'Yogurt', category: 'dairy', unit: 'per liter' },
  
  // Crops
  MAIZE: { id: 'maize', name: 'Maize/Corn', category: 'crops', unit: 'per 90kg bag' },
  WHEAT: { id: 'wheat', name: 'Wheat', category: 'crops', unit: 'per 90kg bag' },
  BEANS: { id: 'beans', name: 'Beans', category: 'crops', unit: 'per kg' },
  POTATOES: { id: 'potatoes', name: 'Potatoes', category: 'crops', unit: 'per kg' },
  TOMATOES: { id: 'tomatoes', name: 'Tomatoes', category: 'crops', unit: 'per crate' },
  CABBAGE: { id: 'cabbage', name: 'Cabbage', category: 'crops', unit: 'per head' },
  ONIONS: { id: 'onions', name: 'Onions', category: 'crops', unit: 'per kg' },
  
  // Feed
  DAIRY_MEAL: { id: 'dairy_meal', name: 'Dairy Meal', category: 'feed', unit: 'per 70kg bag' },
  MAIZE_GERM: { id: 'maize_germ', name: 'Maize Germ', category: 'feed', unit: 'per 70kg bag' },
  HAY: { id: 'hay', name: 'Hay', category: 'feed', unit: 'per bale' },
  SILAGE: { id: 'silage', name: 'Silage', category: 'feed', unit: 'per ton' }
}

/**
 * Get cached prices
 */
function getCachedPrices() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const data = JSON.parse(cached)
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data.prices
      }
    }
  } catch (e) {
    console.error('Cache read error:', e)
  }
  return null
}

/**
 * Cache prices
 */
function cachePrices(prices) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      prices,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.error('Cache write error:', e)
  }
}

/**
 * Get price history
 */
export function getPriceHistory(commodityId, days = 30) {
  const history = getFromLocalStorage(HISTORY_KEY) || {}
  const commodityHistory = history[commodityId] || []
  
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  return commodityHistory.filter(entry => 
    new Date(entry.date) >= cutoffDate
  ).sort((a, b) => new Date(a.date) - new Date(b.date))
}

/**
 * Store price in history
 */
function storePriceHistory(commodityId, price) {
  const history = getFromLocalStorage(HISTORY_KEY) || {}
  
  if (!history[commodityId]) {
    history[commodityId] = []
  }
  
  const today = new Date().toISOString().split('T')[0]
  
  // Check if we already have entry for today
  const existingIndex = history[commodityId].findIndex(entry => 
    entry.date.startsWith(today)
  )
  
  const entry = {
    date: new Date().toISOString(),
    price
  }
  
  if (existingIndex >= 0) {
    // Update existing entry
    history[commodityId][existingIndex] = entry
  } else {
    // Add new entry
    history[commodityId].push(entry)
  }
  
  // Keep only last 90 days
  if (history[commodityId].length > 90) {
    history[commodityId] = history[commodityId].slice(-90)
  }
  
  saveToLocalStorage(HISTORY_KEY, history)
}

/**
 * Fetch current market prices
 * In production, this would connect to real APIs (e.g., market info services)
 * For now, generates realistic demo data with trends
 */
export async function getCurrentPrices() {
  // Check cache first
  const cached = getCachedPrices()
  if (cached) {
    return cached
  }
  
  try {
    // In production, fetch from real API:
    // const response = await fetch('https://api.marketprices.com/kenya/current')
    // const data = await response.json()
    
    // Demo: Generate realistic prices with some variance
    const prices = {}
    
    Object.entries(COMMODITIES).forEach(([key, commodity]) => {
      const basePrice = getBasePrice(commodity.id)
      const variance = (Math.random() - 0.5) * 0.1 // ±5%
      const currentPrice = Math.round(basePrice * (1 + variance))
      
      prices[commodity.id] = {
        commodity: commodity.name,
        category: commodity.category,
        unit: commodity.unit,
        price: currentPrice,
        currency: 'KES',
        date: new Date().toISOString(),
        source: 'Market Average',
        trend: calculateTrend(commodity.id, currentPrice)
      }
      
      // Store in history
      storePriceHistory(commodity.id, currentPrice)
    })
    
    cachePrices(prices)
    
    logActivity('market_prices_updated', 'Market prices refreshed', {
      commodities: Object.keys(prices).length
    })
    
    return prices
    
  } catch (error) {
    console.error('Error fetching market prices:', error)
    throw error
  }
}

/**
 * Get base prices (realistic Kenya market prices in KES)
 */
function getBasePrice(commodityId) {
  const basePrices = {
    // Livestock (KES per head)
    cattle_mature: 80000,
    cattle_calf: 25000,
    goat: 12000,
    sheep: 10000,
    pig: 15000,
    chicken: 500,
    
    // Dairy (KES per liter/kg)
    milk_raw: 50,
    milk_processed: 120,
    cheese: 800,
    yogurt: 150,
    
    // Crops (KES)
    maize: 3500, // per 90kg bag
    wheat: 4200,
    beans: 120, // per kg
    potatoes: 60,
    tomatoes: 2500, // per crate
    cabbage: 40, // per head
    onions: 80,
    
    // Feed (KES)
    dairy_meal: 2800, // per 70kg bag
    maize_germ: 2200,
    hay: 400, // per bale
    silage: 8000 // per ton
  }
  
  return basePrices[commodityId] || 1000
}

/**
 * Calculate price trend (up, down, stable)
 */
function calculateTrend(commodityId, currentPrice) {
  const history = getPriceHistory(commodityId, 7) // Last 7 days
  
  if (history.length < 2) {
    return 'stable'
  }
  
  const oldPrice = history[0].price
  const change = ((currentPrice - oldPrice) / oldPrice) * 100
  
  if (change > 3) return 'up'
  if (change < -3) return 'down'
  return 'stable'
}

/**
 * Get selling recommendations
 */
export function getSellingRecommendations(userInventory) {
  const recommendations = []
  
  try {
    const prices = getCachedPrices() || {}
    
    Object.entries(prices).forEach(([commodityId, priceData]) => {
      const history = getPriceHistory(commodityId, 30)
      
      if (history.length >= 7) {
        const recentAvg = history.slice(-7).reduce((sum, entry) => sum + entry.price, 0) / 7
        const monthAvg = history.reduce((sum, entry) => sum + entry.price, 0) / history.length
        
        // Calculate how much above/below average
        const vsMonthAvg = ((priceData.price - monthAvg) / monthAvg) * 100
        const vsWeekAvg = ((priceData.price - recentAvg) / recentAvg) * 100
        
        let recommendation = null
        let urgency = 'low'
        let reason = ''
        
        // Strong sell signal
        if (vsMonthAvg > 10 && priceData.trend !== 'down') {
          recommendation = 'sell'
          urgency = 'high'
          reason = `Price is ${Math.round(vsMonthAvg)}% above 30-day average`
        }
        // Moderate sell signal
        else if (vsMonthAvg > 5 && vsWeekAvg > 0) {
          recommendation = 'sell'
          urgency = 'medium'
          reason = `Price trending upward, ${Math.round(vsMonthAvg)}% above average`
        }
        // Hold signal
        else if (priceData.trend === 'up') {
          recommendation = 'hold'
          urgency = 'low'
          reason = 'Price is rising, wait for peak'
        }
        // Wait signal
        else if (vsMonthAvg < -5) {
          recommendation = 'wait'
          urgency = 'medium'
          reason = `Price is ${Math.round(Math.abs(vsMonthAvg))}% below average`
        }
        
        if (recommendation) {
          recommendations.push({
            commodityId,
            commodity: priceData.commodity,
            category: priceData.category,
            currentPrice: priceData.price,
            monthAverage: Math.round(monthAvg),
            weekAverage: Math.round(recentAvg),
            trend: priceData.trend,
            recommendation,
            urgency,
            reason,
            potentialGain: recommendation === 'sell' ? Math.round(vsMonthAvg) : null
          })
        }
      }
    })
    
    // Sort by urgency (high first)
    recommendations.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 }
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
    })
    
    return recommendations
    
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return []
  }
}

/**
 * Get price comparison (your sale price vs market)
 */
export function comparePrices(commodity, yourPrice) {
  try {
    const prices = getCachedPrices() || {}
    const marketPrice = prices[commodity]
    
    if (!marketPrice) {
      return null
    }
    
    const difference = yourPrice - marketPrice.price
    const percentDiff = (difference / marketPrice.price) * 100
    
    return {
      marketPrice: marketPrice.price,
      yourPrice,
      difference,
      percentDiff,
      status: percentDiff > 0 ? 'above_market' : percentDiff < 0 ? 'below_market' : 'at_market',
      recommendation: percentDiff < -10 ? 'Consider raising price' : 
                      percentDiff > 10 ? 'May be overpriced' : 'Competitive pricing'
    }
  } catch (error) {
    console.error('Error comparing prices:', error)
    return null
  }
}

/**
 * Get price alerts (when prices hit targets)
 */
export function checkPriceAlerts() {
  const alerts = []
  const targets = getFromLocalStorage('cattalytics:market:targets') || []
  const prices = getCachedPrices() || {}
  
  targets.forEach(target => {
    const currentPrice = prices[target.commodityId]
    
    if (!currentPrice) return
    
    const met = target.type === 'above' 
      ? currentPrice.price >= target.price
      : currentPrice.price <= target.price
    
    if (met) {
      alerts.push({
        commodityId: target.commodityId,
        commodity: currentPrice.commodity,
        targetPrice: target.price,
        currentPrice: currentPrice.price,
        type: target.type,
        message: `${currentPrice.commodity} has reached your target price of ${target.price} KES`
      })
    }
  })
  
  return alerts
}

/**
 * Set price alert target
 */
export function setPriceTarget(commodityId, price, type = 'above') {
  const targets = getFromLocalStorage('cattalytics:market:targets') || []
  
  const target = {
    id: `target_${Date.now()}`,
    commodityId,
    price,
    type, // 'above' or 'below'
    createdAt: new Date().toISOString()
  }
  
  targets.push(target)
  saveToLocalStorage('cattalytics:market:targets', targets)
  
  logActivity('price_target_set', `Price target set for ${commodityId}`, { price, type })
  
  return target
}

/**
 * Remove price target
 */
export function removePriceTarget(targetId) {
  let targets = getFromLocalStorage('cattalytics:market:targets') || []
  targets = targets.filter(t => t.id !== targetId)
  saveToLocalStorage('cattalytics:market:targets', targets)
}

/**
 * Get price statistics
 */
export function getPriceStatistics(commodityId, days = 30) {
  const history = getPriceHistory(commodityId, days)
  
  if (history.length === 0) {
    return null
  }
  
  const prices = history.map(h => h.price)
  const sum = prices.reduce((a, b) => a + b, 0)
  const avg = sum / prices.length
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const current = prices[prices.length - 1]
  const change = current - prices[0]
  const changePercent = (change / prices[0]) * 100
  
  // Calculate volatility (standard deviation)
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length
  const volatility = Math.sqrt(variance)
  const volatilityPercent = (volatility / avg) * 100
  
  return {
    period: days,
    dataPoints: history.length,
    current,
    average: Math.round(avg),
    min,
    max,
    change: Math.round(change),
    changePercent: Math.round(changePercent * 10) / 10,
    volatility: Math.round(volatility),
    volatilityPercent: Math.round(volatilityPercent * 10) / 10,
    trend: changePercent > 0 ? 'increasing' : changePercent < 0 ? 'decreasing' : 'stable'
  }
}

export default {
  getCurrentPrices,
  getPriceHistory,
  getSellingRecommendations,
  comparePrices,
  checkPriceAlerts,
  setPriceTarget,
  removePriceTarget,
  getPriceStatistics,
  COMMODITIES,
  COMMODITY_CATEGORIES
}
