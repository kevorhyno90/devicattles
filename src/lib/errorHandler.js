/**
 * Centralized Error Handler
 * 
 * Features:
 * - User-friendly error messages
 * - Error logging and reporting
 * - Retry mechanisms
 * - Recovery suggestions
 * - Toast notifications
 */

// Error types
export const ErrorType = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  STORAGE: 'storage',
  AUTH: 'auth',
  NOT_FOUND: 'not_found',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown'
};

// Error severity levels
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Custom Application Error
 */
export class AppError extends Error {
  constructor(message, type = ErrorType.UNKNOWN, severity = ErrorSeverity.ERROR, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.userMessage = this.getUserMessage(message, type);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(message, type) {
    const friendlyMessages = {
      [ErrorType.VALIDATION]: `Invalid input: ${message}`,
      [ErrorType.NETWORK]: 'Network error. Please check your connection and try again.',
      [ErrorType.STORAGE]: 'Unable to save data. Your storage might be full.',
      [ErrorType.AUTH]: 'Authentication error. Please log in again.',
      [ErrorType.NOT_FOUND]: 'The requested item was not found.',
      [ErrorType.PERMISSION]: 'You do not have permission to perform this action.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    };

    return friendlyMessages[type] || message;
  }

  /**
   * Get recovery suggestions
   */
  getRecoverySuggestions() {
    const suggestions = {
      [ErrorType.VALIDATION]: ['Check your input and try again', 'Make sure all required fields are filled'],
      [ErrorType.NETWORK]: ['Check your internet connection', 'Try again in a moment', 'Work offline and sync later'],
      [ErrorType.STORAGE]: ['Clear some space', 'Delete old records', 'Export data and clear storage'],
      [ErrorType.AUTH]: ['Log in again', 'Check your credentials', 'Clear browser cache'],
      [ErrorType.NOT_FOUND]: ['Refresh the page', 'Go back and try again'],
      [ErrorType.PERMISSION]: ['Contact an administrator', 'Log in with appropriate account'],
      [ErrorType.UNKNOWN]: ['Refresh the page', 'Try again', 'Contact support if the problem persists']
    };

    return suggestions[this.type] || ['Try again', 'Contact support if the problem persists'];
  }
}

/**
 * Error logger
 */
class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  /**
   * Log error
   */
  log(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      type: error.type || ErrorType.UNKNOWN,
      severity: error.severity || ErrorSeverity.ERROR,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.push(errorLog);

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Save to storage
    try {
      localStorage.setItem('cattalytics:errorLog', JSON.stringify(this.errors));
    } catch (e) {
      console.error('Failed to save error log:', e);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', errorLog);
    }

    return errorLog;
  }

  /**
   * Get all errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Clear error log
   */
  clear() {
    this.errors = [];
    try {
      localStorage.removeItem('cattalytics:errorLog');
    } catch (e) {
      console.error('Failed to clear error log:', e);
    }
  }

  /**
   * Export error log
   */
  export() {
    return JSON.stringify(this.errors, null, 2);
  }
}

// Singleton instance
const logger = new ErrorLogger();

/**
 * Handle error with toast notification
 */
export function handleError(error, context = {}, showToast = true) {
  // Convert to AppError if needed
  const appError = error instanceof AppError 
    ? error 
    : new AppError(error.message || 'Unknown error', ErrorType.UNKNOWN);

  // Log error
  logger.log(appError, context);

  // Show toast notification if requested
  if (showToast && window.showToast) {
    window.showToast(appError.userMessage, 'error');
  }

  return appError;
}

/**
 * Try to execute a function with error handling
 */
export async function tryExecute(fn, context = {}, showToast = true) {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context, showToast);
    throw error;
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retry(fn, maxAttempts = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  throw new AppError(
    `Operation failed after ${maxAttempts} attempts`,
    ErrorType.UNKNOWN,
    ErrorSeverity.ERROR,
    { lastError: lastError.message }
  );
}

/**
 * Validate input
 */
export function validate(value, rules, fieldName = 'Field') {
  const errors = [];

  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push(`${fieldName} is required`);
  }

  if (rules.minLength && value && value.length < rules.minLength) {
    errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
  }

  if (rules.maxLength && value && value.length > rules.maxLength) {
    errors.push(`${fieldName} must be at most ${rules.maxLength} characters`);
  }

  if (rules.min && value < rules.min) {
    errors.push(`${fieldName} must be at least ${rules.min}`);
  }

  if (rules.max && value > rules.max) {
    errors.push(`${fieldName} must be at most ${rules.max}`);
  }

  if (rules.pattern && value && !rules.pattern.test(value)) {
    errors.push(`${fieldName} format is invalid`);
  }

  if (rules.custom && typeof rules.custom === 'function') {
    const customError = rules.custom(value);
    if (customError) {
      errors.push(customError);
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors[0], ErrorType.VALIDATION, ErrorSeverity.WARNING, { errors });
  }

  return true;
}

/**
 * Batch validate multiple fields
 */
export function validateBatch(fields) {
  const allErrors = {};
  let hasErrors = false;

  for (const [fieldName, { value, rules }] of Object.entries(fields)) {
    try {
      validate(value, rules, fieldName);
    } catch (error) {
      allErrors[fieldName] = error.details.errors;
      hasErrors = true;
    }
  }

  if (hasErrors) {
    throw new AppError(
      'Validation failed',
      ErrorType.VALIDATION,
      ErrorSeverity.WARNING,
      { fieldErrors: allErrors }
    );
  }

  return true;
}

/**
 * Check if online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Check storage quota
 */
export async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = (usage / quota) * 100;

      if (percentUsed > 90) {
        throw new AppError(
          'Storage is almost full',
          ErrorType.STORAGE,
          ErrorSeverity.WARNING,
          { usage, quota, percentUsed }
        );
      }

      return { usage, quota, percentUsed };
    } catch (error) {
      console.error('Failed to check storage quota:', error);
    }
  }
  return null;
}

/**
 * Get error logger instance
 */
export function getErrorLogger() {
  return logger;
}

/**
 * Global error handler for unhandled errors
 */
export function initGlobalErrorHandler() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    handleError(new AppError(
      event.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.ERROR,
      { filename: event.filename, lineno: event.lineno, colno: event.colno }
    ));
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    handleError(new AppError(
      event.reason?.message || 'Unhandled promise rejection',
      ErrorType.UNKNOWN,
      ErrorSeverity.ERROR,
      { reason: event.reason }
    ));
  });

  // Check storage on startup
  checkStorageQuota().catch(console.error);
}

export default {
  AppError,
  ErrorType,
  ErrorSeverity,
  handleError,
  tryExecute,
  retry,
  validate,
  validateBatch,
  isOnline,
  checkStorageQuota,
  getErrorLogger,
  initGlobalErrorHandler
};
