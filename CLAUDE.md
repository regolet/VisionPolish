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
2. `supabase/fix-profiles-table.sql` - Add missing columns to profiles table
3. `supabase/create-user-function-simple.sql` - Create get_users_with_email() function
4. `supabase/create-admin.sql` - Create admin user (admin@admin.com / admin123)

## Project Architecture

**VisionPolish** is a React-based photo editing service platform with the following key components:

### Frontend Stack
- **React 19** with React Router DOM for navigation
- **Vite** as build tool and development server
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **ESLint** for code linting

### Backend Integration
- **Supabase** as the backend service (database, auth, storage)
- Environment variables for Supabase configuration (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Supabase client configured in `src/lib/supabase.js`

### Database Schema
The Supabase database includes these core tables:
- `profiles` - User profile data extending Supabase auth
- `services` - Photo editing services (retouching, background removal, color correction, etc.)
- `orders` - Customer orders with payment tracking
- `order_items` - Individual service items within orders
- `uploaded_images` - Image files with processing status
- `cart_items` - Shopping cart functionality

### Component Structure
- **Layout System**: `src/components/Layout/` contains Header, Footer, and Layout wrapper
- **Pages**: Individual route components in `src/pages/` (Home, Services, Cart, Checkout, Login)
- **Routing**: React Router setup in main App component

### Key Features
- **Photo editing service marketplace** with drag & drop upload
- **User authentication** via Supabase Auth with role-based access control
- **Shopping cart and checkout flow** with per-image pricing
- **Order management system** for customers and admins
- **File upload for images** with progress tracking and validation
- **Admin panel** with comprehensive user management
- **Role system**: Customer, Editor, Staff, Admin with different permissions

### User Roles & Access
- **Customer**: Place orders, upload photos, view order history
- **Editor**: Edit photos, process orders
- **Staff**: Manage orders, update services
- **Admin**: Full system access, user management, role assignment

### Admin Features
- User management with CRUD operations
- Role assignment and permission control
- Order oversight and management
- Service configuration
- Debug logging for troubleshooting

### Environment Setup
1. Copy `.env.example` to `.env`
2. Configure Supabase URL and anon key
3. Run all SQL setup files in order (see Database Setup above)

### Current Issues & Fixes
- **User Management**: Uses `get_users_with_email()` RPC function to display users with emails
- **Debug Mode**: Added console logging to UserManagement component for troubleshooting
- **Database Sync**: Fixed profile table structure and user synchronization

The application follows a standard React SPA architecture with Supabase handling all backend concerns including database, authentication, and file storage.