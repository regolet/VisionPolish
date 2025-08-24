# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Vite (runs on port 3000, fallback to 3001+)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Database Setup

Run these SQL files in order in Supabase SQL editor:
1. `supabase/schema.sql` - Main database schema
2. `supabase/fix-profiles-policies.sql` - Fix profiles table RLS policies and add missing columns
3. `supabase/create-revisions-table.sql` - Create dedicated revisions and revision_images tables
4. `supabase/add-item-level-editor-assignment.sql` - Add item-level editor assignment support
5. `supabase/fix-revision-rls-policies.sql` - Fix RLS policies to allow admin revision management
6. `supabase/schema-optimized.sql` - Optimized schema with indexes
7. `supabase/setup-admin-user.sql` - Create admin user (admin@admin.com / admin123)
8. `supabase/update-revision-status.sql` - Add revision system support (legacy)

## Project Architecture

**VisionPolish** is a comprehensive photo editing service marketplace built as a React SPA with Supabase backend.

### Frontend Stack
- **React 19** with React Router DOM for SPA navigation
- **Vite** as build tool and development server with HMR
- **Tailwind CSS** for responsive, utility-first styling
- **Lucide React** for consistent iconography
- **ESLint** for code quality enforcement

### Backend Integration
- **Supabase** provides all backend services:
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication with JWT tokens
  - File storage for image uploads
  - Real-time subscriptions
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Supabase client: `src/lib/supabase.js`

### Database Schema
Core tables with RLS enabled:
- `profiles` - User profiles extending Supabase auth.users
- `services` - Configurable photo editing services with pricing
- `orders` - Customer orders with status and payment tracking
- `order_items` - Individual service items within orders
- `uploaded_images` - Original and processed image storage
- `cart_items` - Temporary shopping cart functionality
- `reviews` - Customer feedback and ratings system

### Component Architecture
- **Layout System**: `src/components/Layout/` - Header, Footer, Layout wrapper
- **Pages**: `src/pages/` - Route components for each view
- **Protected Routes**: Role-based access control via ProtectedRoute component
- **Contexts**: AuthContext for authentication, NotificationContext for alerts
- **Error Boundaries**: Graceful error handling throughout the app
- **Utilities**: Validation helpers and constants configuration

### Core Features
1. **E-commerce Photo Editing Platform**
   - Service marketplace with category filtering
   - Drag-and-drop multi-file upload with validation
   - Shopping cart with per-image pricing
   - Secure checkout and order processing
   - Order tracking and history

2. **Comprehensive Admin System**
   - User management with CRUD operations
   - Service configuration and pricing control
   - Order management and assignment
   - RLS policy management
   - Analytics and reporting

3. **Business Features**
   - Revision system for customer feedback
   - Multiple service tiers (standard/priority/express)
   - Automated order numbering
   - Payment status tracking
   - Customer review system

### User Roles & Permissions
- **Customer**: Browse services, place orders, upload photos, track orders, request revisions
- **Editor**: Process assigned orders, upload edited images, manage workflow
- **Staff**: Manage all orders, update services, assign work to editors
- **Admin**: Full system control, user management, analytics, configuration

### Editor Assignment System
VisionPolish supports both **order-level** and **item-level** editor assignments:

- **Order-level assignment**: Default editor for all items in an order (`orders.assigned_editor`)
- **Item-level assignment**: Specific editor for individual order items (`order_items.assigned_editor`)
- **Effective assignment**: Items use their specific editor, or fall back to order editor
- **Revision routing**: Revisions are automatically assigned to the effective editor

This allows for:
- **Specialization**: Different items can be assigned to editors with specific skills
- **Workload distribution**: Balance work across multiple editors within one order  
- **Revision management**: Each item's revisions go to the appropriate editor
- **Admin flexibility**: Reassign individual items without affecting the entire order

### Security Implementation
- Supabase Authentication with secure session management
- Row Level Security (RLS) policies on all database tables
- Protected routes with role-based access control
- File upload validation (type, size, count limits)
- Environment-based configuration for API keys
- Secure error handling without exposing sensitive data

### File Structure
```
src/
├── components/        # Reusable UI components
│   ├── Layout/       # Header, Footer, Layout wrapper
│   ├── ErrorBoundary.jsx
│   ├── PhotoUpload.jsx
│   ├── ProtectedRoute.jsx
│   └── ServiceOrderModal.jsx
├── contexts/         # React Context providers
│   ├── AuthContext.jsx
│   └── NotificationContext.jsx
├── pages/           # Route components
│   ├── AdminDashboard.jsx
│   ├── Cart.jsx
│   ├── Checkout.jsx
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Orders.jsx
│   ├── Services.jsx
│   └── UserManagement.jsx
├── lib/             # External library configurations
│   └── supabase.js
├── config/          # App configuration
│   └── constants.js
└── utils/           # Helper functions
    └── validation.js
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Configure Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Run SQL setup files in Supabase dashboard (see Database Setup)
4. Install dependencies: `npm install`
5. Start development server: `npm run dev`

### Recent Updates
- **Header Navigation**: Admin users no longer see redundant Editor Dashboard link
- **Order Management**: Enhanced revision system with comprehensive status tracking
- **Database Optimization**: Added indexes and optimized schema for better performance
- **User Management**: Improved user listing with email display via RPC function

### Known Configurations
- **Hardcoded Admin**: admin@admin.com (password: admin123)
- **Hardcoded Editor**: editor@editor.com (role protection in AuthContext)
- **File Upload Limits**: 10MB max size, 5 files max per upload
- **Supported Image Formats**: JPEG, PNG, WebP, TIFF

The application follows modern React patterns with hooks, functional components, and a clear separation of concerns between UI, business logic, and data management.