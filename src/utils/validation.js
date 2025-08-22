// Input validation utilities for forms and data

export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'Email is required'
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return null
  },

  password: (password) => {
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter'
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter'
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number'
    return null
  },

  confirmPassword: (password, confirmPassword) => {
    if (!confirmPassword) return 'Please confirm your password'
    if (password !== confirmPassword) return 'Passwords do not match'
    return null
  },

  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`
    }
    return null
  },

  minLength: (value, min, fieldName = 'This field') => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`
    }
    return null
  },

  maxLength: (value, max, fieldName = 'This field') => {
    if (value && value.length > max) {
      return `${fieldName} must not exceed ${max} characters`
    }
    return null
  },

  phone: (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (phone && !phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      return 'Please enter a valid phone number'
    }
    return null
  },

  price: (price) => {
    const priceRegex = /^\d+(\.\d{1,2})?$/
    if (!price) return 'Price is required'
    if (!priceRegex.test(price)) return 'Please enter a valid price (e.g., 29.99)'
    if (parseFloat(price) <= 0) return 'Price must be greater than 0'
    return null
  },

  positiveNumber: (value, fieldName = 'This field') => {
    if (value !== undefined && value !== null && value !== '') {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) {
        return `${fieldName} must be a positive number`
      }
    }
    return null
  },

  file: (file, options = {}) => {
    const { maxSize, allowedTypes, required = false } = options
    
    if (required && !file) return 'File is required'
    if (!file) return null
    
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
      return `File size must not exceed ${maxSizeMB}MB`
    }
    
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return `File type not supported. Allowed types: ${allowedTypes.join(', ')}`
    }
    
    return null
  }
}

export const validateForm = (formData, validationRules) => {
  const errors = {}
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field]
    
    for (const rule of rules) {
      let error = null
      
      if (typeof rule === 'function') {
        error = rule(value)
      } else if (typeof rule === 'object') {
        const { validator, params = [], message } = rule
        error = validator(value, ...params)
        if (error && message) error = message
      }
      
      if (error) {
        errors[field] = error
        break // Stop at first error for this field
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Common validation rule sets
export const commonValidations = {
  loginForm: {
    email: [validators.required, validators.email],
    password: [validators.required]
  },
  
  signupForm: {
    email: [validators.required, validators.email],
    password: [validators.required, validators.password],
    confirmPassword: [(value, formData) => validators.confirmPassword(formData.password, value)],
    fullName: [validators.required]
  },
  
  profileForm: {
    fullName: [validators.required],
    email: [validators.required, validators.email],
    phone: [validators.phone]
  },
  
  serviceForm: {
    name: [validators.required],
    description: [validators.required],
    basePrice: [validators.required, validators.price],
    turnaroundTime: [validators.required]
  },
  
  orderForm: {
    serviceId: [validators.required],
    quantity: [(value) => validators.positiveNumber(value, 'Quantity')]
  }
}

// Sanitization utilities
export const sanitize = {
  string: (str) => {
    if (typeof str !== 'string') return str
    return str.trim().replace(/[<>]/g, '')
  },
  
  email: (email) => {
    if (typeof email !== 'string') return email
    return email.trim().toLowerCase()
  },
  
  phone: (phone) => {
    if (typeof phone !== 'string') return phone
    return phone.replace(/[^\d\+\-\(\)\s]/g, '')
  },
  
  price: (price) => {
    if (typeof price === 'number') return price
    if (typeof price === 'string') {
      const cleaned = price.replace(/[^\d\.]/g, '')
      return parseFloat(cleaned) || 0
    }
    return 0
  }
}