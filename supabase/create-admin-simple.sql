-- Simple Admin User Creation for VisionPolish
-- This script should be run AFTER creating a user through Supabase Auth
-- 
-- INSTRUCTIONS:
-- 1. First create a user with email "admin@admin.com" and password "admin123" 
--    using one of these methods:
--    a) Supabase Dashboard > Authentication > Users > Add User
--    b) Your application's signup page
--    c) Supabase JS Client or API
--
-- 2. Then run this SQL to grant admin privileges

-- Make sure the role column exists in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin'));

-- Check if user exists and create/update their profile with admin role
DO $$
DECLARE
  admin_user_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Get the user ID for admin@admin.com
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com';
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'User admin@admin.com not found. Please create the user first through Supabase Auth.';
  ELSE
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = admin_user_id) INTO profile_exists;
    
    IF profile_exists THEN
      -- Update existing profile to admin
      UPDATE public.profiles 
      SET 
        role = 'admin',
        full_name = COALESCE(full_name, 'System Administrator'),
        updated_at = NOW()
      WHERE id = admin_user_id;
      
      RAISE NOTICE 'Updated existing profile for admin@admin.com to admin role';
    ELSE
      -- Create new profile with admin role
      INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
      VALUES (
        admin_user_id,
        'System Administrator',
        'admin',
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created admin profile for admin@admin.com';
    END IF;
  END IF;
END $$;

-- Verify the admin user was created/updated successfully
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.role,
  p.full_name,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Admin access granted'
    ELSE '❌ Not an admin'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@admin.com';

-- List all admin users in the system
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin'
ORDER BY p.created_at;