import { useState, useCallback, useEffect } from 'react'

/**
 * Advanced Form Validation Hook
 * Provides field-level validation with automatic error handling
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} Form state and handlers
 */
export function useFormValidation(initialValues = {}, validationRules = {}, onSubmit) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValid, setIsValid] = useState(false)

  // Validate single field
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name]
    if (!rules) return null

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      return rules.required.message || `${name} is required`
    }

    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength.value) {
      return rules.minLength.message || `${name} must be at least ${rules.minLength.value} characters`
    }

    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength.value) {
      return rules.maxLength.message || `${name} must be at most ${rules.maxLength.value} characters`
    }

    // Min value validation
    if (rules.min !== undefined && value < rules.min.value) {
      return rules.min.message || `${name} must be at least ${rules.min.value}`
    }

    // Max value validation
    if (rules.max !== undefined && value > rules.max.value) {
      return rules.max.message || `${name} must be at most ${rules.max.value}`
    }

    // Pattern validation
    if (rules.pattern && value && !rules.pattern.value.test(value)) {
      return rules.pattern.message || `${name} format is invalid`
    }

    // Email validation
    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return rules.email.message || 'Invalid email address'
      }
    }

    // Custom validation
    if (rules.custom && value) {
      const customError = rules.custom(value, values)
      if (customError) return customError
    }

    return null
  }, [validationRules, values])

  // Validate all fields
  const validateAll = useCallback(() => {
    const newErrors = {}
    let valid = true

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
        valid = false
      }
    })

    setErrors(newErrors)
    setIsValid(valid)
    return valid
  }, [validateField, validationRules, values])

  // Handle field change
  const handleChange = useCallback((nameOrEvent) => {
    const isEvent = nameOrEvent.target !== undefined
    const name = isEvent ? nameOrEvent.target.name : nameOrEvent
    const value = isEvent ? nameOrEvent.target.value : arguments[1]

    setValues(prev => ({ ...prev, [name]: value }))

    // Validate if field has been touched
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }, [touched, validateField])

  // Handle field blur
  const handleBlur = useCallback((nameOrEvent) => {
    const name = nameOrEvent.target ? nameOrEvent.target.name : nameOrEvent

    setTouched(prev => ({ ...prev, [name]: true }))

    // Validate on blur
    const error = validateField(name, values[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [validateField, values])

  // Handle form submit
  const handleSubmit = useCallback(async (event) => {
    if (event) {
      event.preventDefault()
    }

    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
    setTouched(allTouched)

    // Validate all fields
    const valid = validateAll()

    if (!valid) {
      return
    }

    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(values)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [validateAll, values, onSubmit, validationRules])

  // Reset form
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
    setIsValid(false)
  }, [initialValues])

  // Set field value
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }, [])

  // Set field error
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  // Get field props
  const getFieldProps = useCallback((name) => {
    return {
      name,
      value: values[name] || '',
      onChange: handleChange,
      onBlur: handleBlur
    }
  }, [values, handleChange, handleBlur])

  // Validate on mount and when values/rules change
  useEffect(() => {
    // Only validate if any field has been touched
    if (Object.keys(touched).length > 0) {
      validateAll()
    }
  }, [values, validationRules, touched, validateAll])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    getFieldProps,
    validateField,
    validateAll
  }
}

/**
 * Validation rule builders
 */
export const validators = {
  required: (message) => ({
    required: { message }
  }),

  minLength: (value, message) => ({
    minLength: { value, message }
  }),

  maxLength: (value, message) => ({
    maxLength: { value, message }
  }),

  min: (value, message) => ({
    min: { value, message }
  }),

  max: (value, message) => ({
    max: { value, message }
  }),

  pattern: (regex, message) => ({
    pattern: { value: regex, message }
  }),

  email: (message = 'Invalid email address') => ({
    email: { message }
  }),

  custom: (fn) => ({
    custom: fn
  }),

  // Combine multiple validators
  combine: (...validators) => {
    return validators.reduce((acc, validator) => ({ ...acc, ...validator }), {})
  }
}

/**
 * Common validation rules
 */
export const commonRules = {
  email: validators.combine(
    validators.required('Email is required'),
    validators.email()
  ),

  password: validators.combine(
    validators.required('Password is required'),
    validators.minLength(8, 'Password must be at least 8 characters')
  ),

  phone: validators.combine(
    validators.required('Phone number is required'),
    validators.pattern(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
  ),

  number: (min, max, required = true) => validators.combine(
    required && validators.required('This field is required'),
    min !== undefined && validators.min(min, `Must be at least ${min}`),
    max !== undefined && validators.max(max, `Must be at most ${max}`)
  ),

  text: (minLen, maxLen, required = true) => validators.combine(
    required && validators.required('This field is required'),
    minLen && validators.minLength(minLen, `Must be at least ${minLen} characters`),
    maxLen && validators.maxLength(maxLen, `Must be at most ${maxLen} characters`)
  )
}

/**
 * Hook for async validation (e.g., checking unique usernames)
 */
export function useAsyncValidation(asyncValidator, debounceMs = 500) {
  const [validating, setValidating] = useState(false)
  const [asyncError, setAsyncError] = useState(null)
  const timeoutRef = useRef(null)

  const validate = useCallback((value) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setValidating(true)
    setAsyncError(null)

    timeoutRef.current = setTimeout(async () => {
      try {
        const error = await asyncValidator(value)
        setAsyncError(error)
      } catch (err) {
        setAsyncError(err.message)
      } finally {
        setValidating(false)
      }
    }, debounceMs)
  }, [asyncValidator, debounceMs])

  return { validate, validating, asyncError }
}

export default useFormValidation
