# VisionPolish - Photo Editing Service Platform

VisionPolish is a comprehensive React-based photo editing service marketplace that connects customers with professional photo editing services.

## Features

### Customer Features
- **Photo Upload**: Drag & drop photo upload with progress tracking
- **Service Selection**: Browse and select from various photo editing services (Retouching, Background Removal, Color Correction, Image Restoration)
- **Shopping Cart**: Add multiple photos with different services
- **Order Management**: Track order status and history
- **Secure Authentication**: User registration and login via Supabase Auth

### Admin Features  
- **User Management**: Complete CRUD operations for users with role-based access
- **Role Management**: Support for 4 user roles (Customer, Editor, Staff, Admin)
- **Order Oversight**: View and manage all customer orders
- **Service Management**: Control available editing services

## Tech Stack

### Frontend
- **React 19** with React Router DOM for navigation
- **Vite** as build tool and development server  
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Supabase** for database, authentication, and file storage
- **PostgreSQL** database with Row Level Security (RLS)
- **Real-time subscriptions** for order updates

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd VisionPolish
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Update `.env` with your Supabase credentials:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

4. Set up the database
Run the SQL files in this order in your Supabase SQL editor:
- `supabase/schema.sql` - Main database schema
- `supabase/fix-profiles-table.sql` - Add missing columns
- `supabase/create-user-function-simple.sql` - Create user management function
- `supabase/create-admin.sql` - Create admin user (admin@admin.com / admin123)

5. Start the development server
```bash
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── Layout/           # Header, Footer, Layout components
│   ├── PhotoUpload.jsx   # Drag & drop photo upload
│   └── ServiceOrderModal.jsx # Service selection modal
├── pages/
│   ├── Home.jsx          # Landing page
│   ├── Services.jsx      # Service catalog
│   ├── Cart.jsx          # Shopping cart
│   ├── Checkout.jsx      # Order processing
│   ├── Orders.jsx        # Order history
│   ├── AdminLogin.jsx    # Admin authentication
│   └── UserManagement.jsx # Admin user management
├── lib/
│   └── supabase.js       # Supabase client configuration
└── App.jsx               # Main application with routing
```

## Database Schema

### Core Tables
- `profiles` - Extended user profiles with roles
- `services` - Available photo editing services  
- `orders` - Customer orders with payment tracking
- `order_items` - Individual service items per order
- `uploaded_images` - Image files with processing status
- `cart_items` - Shopping cart functionality

### User Roles
- **Customer**: Place orders, view own data
- **Editor**: Edit photos, process orders  
- **Staff**: Manage orders, update services
- **Admin**: Full system access, user management

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Admin Access

Default admin credentials:
- Email: admin@admin.com
- Password: admin123

Access admin features at `/admin/login`

## License

This project is licensed under the MIT License.
