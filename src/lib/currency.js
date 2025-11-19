/**
 * Currency Localization System
 * Centralized currency formatting for the entire application
 */

const CURRENCY_KEY = 'devinsfarm:currency'

// Supported currencies
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
 * Get current currency setting
 */
export function getCurrentCurrency() {
  try {
    const stored = localStorage.getItem(CURRENCY_KEY)
    if (stored && CURRENCIES[stored]) {
      return CURRENCIES[stored]
    }
  } catch (error) {
    console.error('Error loading currency:', error)
  }
  return CURRENCIES.KES // Default to Kenya Shillings
}

/**
 * Set currency preference
 */
export function setCurrency(currencyCode) {
  try {
    if (CURRENCIES[currencyCode]) {
      localStorage.setItem(CURRENCY_KEY, currencyCode)
      return true
    }
  } catch (error) {
    console.error('Error saving currency:', error)
  }
  return false
}

/**
 * Format amount as currency with proper symbol and formatting
 */
export function formatCurrency(amount, options = {}) {
  const currency = options.currency || getCurrentCurrency()
  const value = parseFloat(amount) || 0
  
  try {
    // Use Intl.NumberFormat for proper localization
    const formatter = new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: options.decimals !== undefined ? options.decimals : 2,
      maximumFractionDigits: options.decimals !== undefined ? options.decimals : 2
    })
    
    return formatter.format(value)
  } catch (error) {
    // Fallback to manual formatting
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
