// Secure database utilities for VisionPolish
// These functions work with the enhanced RLS policies

import { supabase } from '../lib/supabase'
import { SecurityUtils } from '../config/security'

export class SecureDBClient {
  
  // =============================================
  // USER AND PROFILE OPERATIONS
  // =============================================
  
  static async getCurrentUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .rpc('get_user_profile', { user_id: user.id })

      if (error) throw error
      return { data: data?.[0] || null, error: null }
    } catch (error) {
      console.error('Error getting user profile:', error)
      return { data: null, error }
    }
  }

  static async checkUserRole(requiredRole) {
    try {
      const { data, error } = await supabase
        .rpc('has_role', { required_role: requiredRole })

      if (error) throw error
      return { hasRole: data || false, error: null }
    } catch (error) {
      console.error('Error checking user role:', error)
      return { hasRole: false, error }
    }
  }

  static async updateUserProfile(profileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .select()
        .single()

      if (error) throw error
      
      SecurityUtils.logSecurityEvent('profile_updated', {
        updated_fields: Object.keys(profileData)
      })

      return { data, error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      SecurityUtils.logSecurityEvent('profile_update_failed', {
        error: error.message
      })
      return { data: null, error }
    }
  }

  // =============================================
  // SERVICE OPERATIONS
  // =============================================

  static async getServices(includeInactive = false) {
    try {
      let query = supabase.from('services').select('*')
      
      if (!includeInactive) {
        query = query.eq('is_active', true)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching services:', error)
      return { data: [], error }
    }
  }

  static async createService(serviceData) {
    try {
      // Check if user has permission
      const { hasRole } = await this.checkUserRole('staff')
      const { hasRole: isAdmin } = await this.checkUserRole('admin')
      
      if (!hasRole && !isAdmin) {
        throw new Error('Insufficient permissions to create service')
      }

      const { data, error } = await supabase
        .from('services')
        .insert([{
          ...serviceData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      SecurityUtils.logSecurityEvent('service_created', {
        service_id: data.id,
        service_name: data.name
      })

      return { data, error: null }
    } catch (error) {
      console.error('Error creating service:', error)
      SecurityUtils.logSecurityEvent('service_creation_failed', {
        error: error.message
      })
      return { data: null, error }
    }
  }

  static async updateService(serviceId, serviceData) {
    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          ...serviceData,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
        .select()
        .single()

      if (error) throw error

      SecurityUtils.logSecurityEvent('service_updated', {
        service_id: serviceId,
        updated_fields: Object.keys(serviceData)
      })

      return { data, error: null }
    } catch (error) {
      console.error('Error updating service:', error)
      return { data: null, error }
    }
  }

  static async deleteService(serviceId) {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error

      SecurityUtils.logSecurityEvent('service_deleted', {
        service_id: serviceId
      })

      return { error: null }
    } catch (error) {
      console.error('Error deleting service:', error)
      return { error }
    }
  }

  // =============================================
  // ORDER OPERATIONS
  // =============================================

  static async getUserOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            specifications,
            service_id,
            services (name, category)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching user orders:', error)
      return { data: [], error }
    }
  }

  static async canAccessOrder(orderId) {
    try {
      const { data, error } = await supabase
        .rpc('user_can_access_order', { order_id_param: orderId })

      if (error) throw error
      return { canAccess: data || false, error: null }
    } catch (error) {
      console.error('Error checking order access:', error)
      return { canAccess: false, error }
    }
  }

  static async createOrder(orderData, orderItems) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          ...orderData,
          user_id: user.id,
          order_number: orderNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const itemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: order.id,
        created_at: new Date().toISOString()
      }))

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsWithOrderId)
        .select()

      if (itemsError) throw itemsError

      SecurityUtils.logSecurityEvent('order_created', {
        order_id: order.id,
        order_number: orderNumber,
        item_count: items.length
      })

      return { data: { ...order, order_items: items }, error: null }
    } catch (error) {
      console.error('Error creating order:', error)
      SecurityUtils.logSecurityEvent('order_creation_failed', {
        error: error.message
      })
      return { data: null, error }
    }
  }

  // =============================================
  // CART OPERATIONS
  // =============================================

  static async getCartItems() {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          services (
            id,
            name,
            description,
            base_price,
            category
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching cart items:', error)
      return { data: [], error }
    }
  }

  static async addToCart(serviceId, quantity = 1, specifications = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('cart_items')
        .insert([{
          user_id: user.id,
          service_id: serviceId,
          quantity,
          specifications,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error adding to cart:', error)
      return { data: null, error }
    }
  }

  static async updateCartItem(cartItemId, updates) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartItemId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating cart item:', error)
      return { data: null, error }
    }
  }

  static async removeFromCart(cartItemId) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error removing from cart:', error)
      return { error }
    }
  }

  static async clearCart() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error clearing cart:', error)
      return { error }
    }
  }

  // =============================================
  // FILE OPERATIONS
  // =============================================

  static async uploadSecureFile(file, folder = 'uploads') {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // Validate file security
      if (!SecurityUtils.isFileSafe(file)) {
        throw new Error('File failed security validation')
      }

      // Generate secure path
      const fileExt = file.name.split('.').pop()
      const secureToken = SecurityUtils.generateSecureToken(16)
      const fileName = `${Date.now()}-${secureToken}.${fileExt}`
      const filePath = `${user.id}/${folder}/${fileName}`

      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(data.path)

      SecurityUtils.logSecurityEvent('file_uploaded', {
        file_name: fileName,
        file_size: file.size,
        file_type: file.type
      })

      return { data: { path: data.path, url: publicUrl }, error: null }
    } catch (error) {
      console.error('Error uploading file:', error)
      SecurityUtils.logSecurityEvent('file_upload_failed', {
        error: error.message,
        file_name: file.name
      })
      return { data: null, error }
    }
  }

  // =============================================
  // ADMIN OPERATIONS
  // =============================================

  static async getAuditLogs(limit = 50) {
    try {
      const { hasRole } = await this.checkUserRole('admin')
      if (!hasRole) {
        throw new Error('Insufficient permissions to view audit logs')
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      return { data: [], error }
    }
  }

  static async getAllUsers() {
    try {
      const { hasRole } = await this.checkUserRole('admin')
      if (!hasRole) {
        throw new Error('Insufficient permissions to view users')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error fetching users:', error)
      return { data: [], error }
    }
  }

  static async updateUserRole(userId, newRole) {
    try {
      const { hasRole } = await this.checkUserRole('admin')
      if (!hasRole) {
        throw new Error('Insufficient permissions to update user roles')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      SecurityUtils.logSecurityEvent('user_role_updated', {
        user_id: userId,
        new_role: newRole
      })

      return { data, error: null }
    } catch (error) {
      console.error('Error updating user role:', error)
      SecurityUtils.logSecurityEvent('role_update_failed', {
        user_id: userId,
        error: error.message
      })
      return { data: null, error }
    }
  }
}

export default SecureDBClient