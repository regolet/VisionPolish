-- Admin User Management Functions
-- These functions allow admins to create and update user profiles bypassing RLS policies
-- Run this in Supabase SQL Editor to add admin user management functions

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.admin_create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.admin_update_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN);

-- Function to create user profile (admin only)
CREATE OR REPLACE FUNCTION public.admin_create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL,
  user_role TEXT DEFAULT 'customer',
  user_department TEXT DEFAULT NULL,
  user_is_active BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if the current user is an admin
  SELECT public.get_user_role(auth.uid()) INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Validate role
  IF user_role NOT IN ('customer', 'editor', 'staff', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be one of: customer, editor, staff, admin';
  END IF;

  -- Insert or update the profile
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    role,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_full_name,
    user_phone,
    user_role,
    user_department,
    user_is_active,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  RETURN user_id;
END;
$$;

-- Function to update user profile (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
  user_id UUID,
  user_full_name TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL,
  user_role TEXT DEFAULT NULL,
  user_department TEXT DEFAULT NULL,
  user_is_active BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if the current user is an admin
  SELECT public.get_user_role(auth.uid()) INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Validate role if provided
  IF user_role IS NOT NULL AND user_role NOT IN ('customer', 'editor', 'staff', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be one of: customer, editor, staff, admin';
  END IF;

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  -- Update the profile
  UPDATE public.profiles SET
    full_name = COALESCE(user_full_name, full_name),
    phone = COALESCE(user_phone, phone),
    role = COALESCE(user_role, role),
    department = COALESCE(user_department, department),
    is_active = COALESCE(user_is_active, is_active),
    updated_at = NOW()
  WHERE id = user_id;

  RETURN true;
END;
$$;

-- Grant execute permissions to authenticated users (function will check admin role internally)
GRANT EXECUTE ON FUNCTION public.admin_create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.admin_create_user_profile IS 'Admin function to create user profiles bypassing RLS policies';
COMMENT ON FUNCTION public.admin_update_user_profile IS 'Admin function to update user profiles bypassing RLS policies';

SELECT 'Admin user management functions created successfully!' as message;