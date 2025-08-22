-- Initialize Admin User for VisionPolish
-- Email: admin@admin.com
-- Password: admin123
-- Role: admin

-- Note: This script creates an admin user directly in the database
-- Make sure to run add-roles.sql first to add the role column to profiles table

-- Step 1: Create the admin user in auth.users
-- We need to use Supabase's auth functions to create a user with encrypted password
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@admin.com';
  
  IF admin_user_id IS NULL THEN
    -- Create admin user (Note: This requires using Supabase Dashboard or API)
    -- The password needs to be encrypted, so we'll insert a placeholder
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      gen_random_uuid(),
      'admin@admin.com',
      crypt('admin123', gen_salt('bf')), -- This encrypts the password
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "System Administrator"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO admin_user_id;

    -- Create or update profile with admin role
    INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
    VALUES (
      admin_user_id,
      'System Administrator',
      'admin',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        full_name = 'System Administrator',
        updated_at = NOW();

    RAISE NOTICE 'Admin user created successfully with email: admin@admin.com';
  ELSE
    -- User exists, just update the role to admin
    UPDATE public.profiles 
    SET role = 'admin',
        full_name = COALESCE(full_name, 'System Administrator'),
        updated_at = NOW()
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Existing user admin@admin.com updated to admin role';
  END IF;
END $$;

-- Alternative approach: If the above doesn't work due to password encryption,
-- use this simpler approach after creating the user through Supabase Auth UI:

-- Step 1: Create user through Supabase Dashboard or using this SQL command:
-- Note: You'll need to create the user first via Supabase Dashboard Auth section
-- or via the application's signup flow, then run this to make them admin:

-- UPDATE public.profiles 
-- SET role = 'admin',
--     full_name = 'System Administrator'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@admin.com');

-- Verification query to check if admin was created successfully:
SELECT 
  u.email,
  u.created_at as user_created,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@admin.com';