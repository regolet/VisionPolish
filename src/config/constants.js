// Application constants and configuration

export const APP_CONFIG = {
  name: 'VisionPolish',
  version: '1.0.0',
  description: 'Professional Photo Editing Services',
  url: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
  contact: {
    email: 'support@visionpolish.com',
    phone: '+1 (555) 123-4567'
  }
}

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  projectId: import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]
}

export const USER_ROLES = {
  CUSTOMER: 'customer',
  EDITOR: 'editor', 
  STAFF: 'staff',
  ADMIN: 'admin'
}

export const ROLE_PERMISSIONS = {
  [USER_ROLES.CUSTOMER]: [
    'view_services',
    'create_orders', 
    'view_own_orders',
    'update_own_profile'
  ],
  [USER_ROLES.EDITOR]: [
    'view_services',
    'view_assigned_orders',
    'update_order_status',
    'upload_processed_images'
  ],
  [USER_ROLES.STAFF]: [
    'view_all_orders',
    'assign_orders',
    'manage_services',
    'view_users'
  ],
  [USER_ROLES.ADMIN]: [
    'manage_users',
    'manage_orders',
    'manage_services',
    'view_analytics',
    'system_settings'
  ]
}

export const ORDER_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress', 
  UNDER_REVIEW: 'under_review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const SERVICE_CATEGORIES = {
  PORTRAIT: 'portrait',
  PRODUCT: 'product',
  CREATIVE: 'creative',
  RESTORATION: 'restoration'
}

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
}

export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/tiff'
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.tiff']
}

export const UI_CONSTANTS = {
  ITEMS_PER_PAGE: 20,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 200
}

export const API_ENDPOINTS = {
  profiles: '/profiles',
  orders: '/orders', 
  orderItems: '/order_items',
  services: '/services',
  cartItems: '/cart_items'
}

// Environment-specific configurations
export const isDevelopment = import.meta.env.DEV
export const isProduction = import.meta.env.PROD
export const isTest = import.meta.env.MODE === 'test'

// Feature flags
export const FEATURES = {
  enableAnalytics: isProduction,
  enableErrorReporting: isProduction,
  enableDebugLogs: isDevelopment,
  enablePerformanceMonitoring: isProduction,
  showDevelopmentTools: isDevelopment
}