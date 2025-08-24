// Input validation utilities for forms and data

// Security-focused validation to prevent attacks
export const securityValidators = {
  // Prevent XSS attacks
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input
    return input
      .replace(/[<>"'&]/g, (char) => {
        const entities = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        }
        return entities[char] || char
      })
      .trim()
  },

  // Prevent SQL injection in search terms
  sanitizeSearchTerm: (term) => {
    if (typeof term !== 'string') return ''
    return term
      .replace(/[';"\\]/g, '') // Remove SQL injection characters
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '') // Remove SQL keywords
      .trim()
      .substring(0, 100) // Limit length
  },

  // Validate file names to prevent path traversal
  sanitizeFileName: (fileName) => {
    if (typeof fileName !== 'string') return 'file'
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '') // Allow only safe characters
      .replace(/^\.+/, '') // Remove leading dots
      .substring(0, 255) // Limit length
      || 'file' // Fallback if empty
  },

  // Check for suspicious patterns
  hasXSSPattern: (input) => {
    if (typeof input !== 'string') return false
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi
    ]
    return xssPatterns.some(pattern => pattern.test(input))
  },

  // Rate limiting validation (basic)
  validateRateLimit: (lastAttempt, minInterval = 1000) => {
    const now = Date.now()
    if (lastAttempt && (now - lastAttempt) < minInterval) {
      return `Please wait ${Math.ceil((minInterval - (now - lastAttempt)) / 1000)} seconds before trying again`
    }
    return null
  }
}

export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'Email is required'
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return null
  },

  password: (password) => {
    if (!password) return 'Password is required'
    if (password.length < 12) return 'Password must be at least 12 characters'
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter'
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter'
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number'
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) return 'Password must contain at least one special character'
    
    // Check for common weak patterns
    const weakPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /(.)\1{2,}/, // Repeated characters
      /^\d+$/, // Only numbers
      /^[a-zA-Z]+$/ // Only letters
    ]
    
    if (weakPatterns.some(pattern => pattern.test(password))) {
      return 'Password contains weak patterns. Please choose a stronger password'
    }
    
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
    
    // Security checks
    if (securityValidators.hasXSSPattern(file.name)) {
      return 'File name contains invalid characters'
    }
    
    // Sanitize file name
    const sanitizedName = securityValidators.sanitizeFileName(file.name)
    if (sanitizedName !== file.name) {
      return 'File name contains invalid characters. Please rename your file.'
    }
    
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
      return `File size must not exceed ${maxSizeMB}MB`
    }
    
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return `File type not supported. Allowed types: ${allowedTypes.join(', ')}`
    }
    
    // Additional security: Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase()
    const mimeTypeMap = {
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'webp': ['image/webp'],
      'gif': ['image/gif']
    }
    
    if (extension && mimeTypeMap[extension] && !mimeTypeMap[extension].includes(file.type)) {
      return 'File extension does not match file type. This may be a security risk.'
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
    return securityValidators.sanitizeInput(str)
  },
  
  email: (email) => {
    if (typeof email !== 'string') return email
    return securityValidators.sanitizeInput(email.trim().toLowerCase())
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
  },
  
  searchTerm: (term) => {
    return securityValidators.sanitizeSearchTerm(term)
  },
  
  fileName: (fileName) => {
    return securityValidators.sanitizeFileName(fileName)
  }
}