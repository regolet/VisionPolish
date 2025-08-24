// Security configuration and constants
export const SECURITY_CONFIG = {
  // Authentication settings
  auth: {
    passwordMinLength: 12,
    loginAttemptLimit: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    requirePasswordChange: false, // Set to true to force password changes
    allowedEmailDomains: [], // Empty array means all domains allowed
  },

  // File upload security
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/webp'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    scanForMalware: false, // Enable if you have malware scanning service
    quarantineSuspiciousFiles: true,
    maxFilesPerUpload: 5,
    maxTotalUploadSize: 50 * 1024 * 1024, // 50MB total
  },

  // Rate limiting
  rateLimit: {
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    api: {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    fileUpload: {
      maxUploads: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    }
  },

  // Content Security
  content: {
    maxInputLength: 1000,
    maxSearchTermLength: 100,
    allowedHtmlTags: [], // No HTML allowed by default
    sanitizeAll: true,
    blockSuspiciousPatterns: true,
  },

  // Admin security
  admin: {
    requireMFA: false, // Set to true for production
    allowedIPs: [], // Empty array means all IPs allowed
    auditLogRetention: 90, // days
    forcePasswordChange: true,
    minPasswordAge: 1, // days before password can be changed again
  },

  // Database security
  database: {
    enableRowLevelSecurity: true,
    auditChanges: true,
    encryptSensitiveFields: false, // Enable if you have encryption setup
    backupEncryption: true,
  },

  // Production security headers
  headers: {
    contentSecurityPolicy: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'connect-src': ["'self'", import.meta.env.VITE_SUPABASE_URL || 'https://*.supabase.co'].filter(Boolean),
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameOptions: 'DENY',
    contentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
  }
}

// Security utilities
export const SecurityUtils = {
  // Generate secure random string
  generateSecureToken: (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // Check if password meets security requirements
  isPasswordSecure: (password) => {
    const config = SECURITY_CONFIG.auth
    if (password.length < config.passwordMinLength) return false
    
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    
    return hasLower && hasUpper && hasNumber && hasSpecial
  },

  // Check if file is safe to upload
  isFileSafe: (file) => {
    const config = SECURITY_CONFIG.fileUpload
    
    // Check file size
    if (file.size > config.maxSize) return false
    
    // Check MIME type
    if (!config.allowedMimeTypes.includes(file.type)) return false
    
    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!config.allowedExtensions.includes(extension)) return false
    
    return true
  },

  // Log security events
  logSecurityEvent: (event, details = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
    }
    
    console.warn('Security Event:', logEntry)
    
    // In production, send to monitoring service
    // Example: sendToSecurityMonitoring(logEntry)
  },

  // Rate limiting check
  checkRateLimit: (key, limit = SECURITY_CONFIG.rateLimit.api) => {
    const now = Date.now()
    const windowStart = now - limit.windowMs
    
    // Get stored attempts from localStorage (in production, use proper storage)
    const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]')
    
    // Filter out old attempts
    const recentAttempts = attempts.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (recentAttempts.length >= limit.maxRequests) {
      return {
        allowed: false,
        resetTime: recentAttempts[0] + limit.windowMs
      }
    }
    
    // Add current attempt
    recentAttempts.push(now)
    localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentAttempts))
    
    return {
      allowed: true,
      remaining: limit.maxRequests - recentAttempts.length
    }
  }
}

// Environment-specific security settings
export const getSecurityConfig = () => {
  const isDev = import.meta.env.DEV
  const isProd = import.meta.env.PROD
  
  return {
    ...SECURITY_CONFIG,
    // Relax some restrictions in development
    auth: {
      ...SECURITY_CONFIG.auth,
      passwordMinLength: isDev ? 8 : 12,
      loginAttemptLimit: isDev ? 10 : 5,
    },
    // Enable all security features in production
    headers: isProd ? SECURITY_CONFIG.headers : {},
    admin: {
      ...SECURITY_CONFIG.admin,
      requireMFA: isProd,
      forcePasswordChange: isProd,
    }
  }
}