/**
 * Currency Localization System
 * Centralized currency formatting for the entire application
 * Now integrated with Enhanced Settings
 */

import { getSettingsSection } from './enhancedSettings.js'

const CURRENCY_KEY = 'devinsfarm:currency'

// Supported currencies (kept for backwards compatibility)
export const CURRENCIES = {
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenya Shillings', locale: 'en-KE' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-EU' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  UGX: { code: 'UGX', symbol: 'USh', name: 'Uganda Shillings', locale: 'en-UG' },
  TZS: { code: 'TZS', symbol: 'TSh', name: 'Tanzania Shillings', locale: 'en-TZ' }
}

/**
 * Get current currency setting from enhanced settings
 */
export function getCurrentCurrency() {
  try {
    const regional = getSettingsSection('regional')
    const code = regional.currency || 'KES'
    
    if (CURRENCIES[code]) {
      return CURRENCIES[code]
    }
    
    return {
      code: code,
      symbol: regional.currencySymbol || code,
      name: code,
      locale: 'en-US'
    }
  } catch (error) {
    console.error('Error loading currency:', error)
    return CURRENCIES.KES
  }
}

/**
 * Set currency preference (updates enhanced settings)
 */
export function setCurrency(currencyCode) {
  try {
    const { updateSettingsSection } = require('./enhancedSettings.js')
    const currency = CURRENCIES[currencyCode]
    if (currency) {
      updateSettingsSection('regional', { 
        currency: currencyCode,
        currencySymbol: currency.symbol 
      })
      return true
    }
  } catch (error) {
    console.error('Error saving currency:', error)
  }
  return false
}

/**
 * Format amount as currency with proper symbol and formatting
 * Now uses enhanced settings for formatting preferences
 */
export function formatCurrency(amount, options = {}) {
  try {
    const regional = getSettingsSection('regional')
    const value = parseFloat(amount) || 0
    
    const formatted = value.toFixed(options.decimals !== undefined ? options.decimals : 2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, regional.thousandSeparator || ',')
      .replace('.', regional.decimalSeparator || '.')
    
    if (options.includeSymbol === false) {
      return formatted
    }
    
    const symbol = regional.currencySymbol || 'KES'
    return regional.currencyPosition === 'after' 
      ? `${formatted} ${symbol}`
      : `${symbol} ${formatted}`
  } catch (error) {
    const currency = getCurrentCurrency()
    const value = parseFloat(amount) || 0
    const formatted = value.toFixed(options.decimals !== undefined ? options.decimals : 2)
    return `${currency.symbol} ${formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }
}

/**
 * Format currency for input fields (without symbol)
 */
export function formatCurrencyInput(amount) {
  const value = parseFloat(amount) || 0
  return value.toFixed(2)
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString) {
  if (typeof currencyString === 'number') return currencyString
  if (!currencyString) return 0
  
  // Remove currency symbols and formatting
  const cleaned = currencyString.toString()
    .replace(/[^0-9.-]/g, '')
  
  return parseFloat(cleaned) || 0
}

/**
 * Get currency symbol only
 */
export function getCurrencySymbol(currencyCode) {
  const currency = currencyCode ? CURRENCIES[currencyCode] : getCurrentCurrency()
  return currency ? currency.symbol : 'KSh'
}

/**
 * Convert between currencies (requires exchange rates - placeholder for now)
 */
export function convertCurrency(amount, fromCode, toCode) {
  // Placeholder - in a real app, you'd fetch exchange rates
  // For now, just return the amount as-is
  console.warn('Currency conversion not implemented - showing original amount')
  return parseFloat(amount) || 0
}
