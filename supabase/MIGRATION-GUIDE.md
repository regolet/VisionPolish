# VisionPolish Database Migration Guide

This guide provides the essential SQL files needed to set up the VisionPolish database from scratch.

## Migration Files (Run in Order)

### 1. Core Database Schema
**File:** `schema-optimized.sql`
- Complete database schema with all tables, indexes, RLS policies
- Storage bucket setup (uploads)
- Essential functions and triggers
- Default services data
- **Must run first**

### 2. Admin User Setup  
**File:** `setup-admin-user.sql`
- Creates admin, editor, and customer profiles for test accounts
- Links existing auth users to profiles
- **Run after creating users through Supabase Auth**

## Quick Setup Instructions

1. **In Supabase SQL Editor:**
   ```sql
   -- Run the complete schema
   -- Copy and paste contents of schema-optimized.sql
   ```

2. **Create test users via Supabase Auth (optional):**
   - admin@admin.com / admin123
   - editor@editor.com / editor123  
   - customer@customer.com / customer123

3. **Run admin setup:**
   ```sql
   -- Copy and paste contents of setup-admin-user.sql
   ```

## Database Structure Overview

### Core Tables
- `profiles` - User profiles extending Supabase auth
- `services` - Photo editing services (8 default services)
- `orders` - Customer orders with status tracking
- `order_items` - Individual items within orders
- `cart_items` - Shopping cart functionality
- `uploaded_images` - Image upload tracking (legacy)
- `reviews` - Service reviews and ratings

### Key Features
- **Row Level Security (RLS)** - All tables protected with proper policies
- **Role-based Access Control** - customer, editor, staff, admin roles
- **Order Management** - Complete workflow from cart to delivery
- **Image Storage** - Supabase storage integration with 'uploads' bucket
- **Admin Functions** - User management, order oversight

### Storage
- **Bucket:** `uploads` (public, authenticated uploads only)
- **Policies:** Role-based access with admin override

## Environment Variables Required
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Removed Files
The following debug/development files have been consolidated and can be removed:
- All `debug-*.sql` files
- All `fix-*.sql` files  
- All `check-*.sql` files
- Temporary/experimental SQL files

## Final Structure
The supabase directory now contains only essential files:
- `schema-optimized.sql` - Complete database schema (USE THIS)
- `schema.sql` - Legacy schema (can be removed after migration)
- `setup-admin-user.sql` - Admin user setup
- `MIGRATION-GUIDE.md` - This migration guide