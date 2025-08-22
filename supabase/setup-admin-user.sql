-- Create admin user for VisionPolish platform
-- Run this script after the main schema to set up the default admin account

-- Insert admin profile (the user must be created through Supabase Auth first)
-- Default credentials: admin@admin.com / admin123
-- Note: Create the user via Supabase Auth UI or signup, then run this script

-- Create admin profile for admin@admin.com
INSERT INTO public.profiles (id, full_name, role, is_active, created_at, updated_at)
SELECT 
  au.id,
  'Admin User',
  'admin',
  true,
  NOW(),
  NOW()
FROM auth.users au 
WHERE au.email = 'admin@admin.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  is_active = true,
  updated_at = NOW();

-- Create editor profile for editor@editor.com (if exists)
INSERT INTO public.profiles (id, full_name, role, is_active, created_at, updated_at)
SELECT 
  au.id,
  'Editor User',
  'editor',
  true,
  NOW(),
  NOW()
FROM auth.users au 
WHERE au.email = 'editor@editor.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'editor',
  is_active = true,
  updated_at = NOW();

-- Create customer profile for customer@customer.com (if exists)
INSERT INTO public.profiles (id, full_name, role, is_active, created_at, updated_at)
SELECT 
  au.id,
  'Customer User',
  'customer',
  true,
  NOW(),
  NOW()
FROM auth.users au 
WHERE au.email = 'customer@customer.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'customer',
  is_active = true,
  updated_at = NOW();

-- Verify admin setup
DO $$ 
DECLARE
  admin_count INTEGER;
  editor_count INTEGER;
BEGIN 
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  SELECT COUNT(*) INTO editor_count FROM public.profiles WHERE role = 'editor';
  
  RAISE NOTICE 'Admin users created: %', admin_count;
  RAISE NOTICE 'Editor users created: %', editor_count;
  
  IF admin_count = 0 THEN
    RAISE NOTICE 'WARNING: No admin users found. Please create admin@admin.com through Supabase Auth first.';
  END IF;
END $$;