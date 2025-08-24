-- Add missing security functions to existing database
-- Run this in Supabase SQL Editor to fix the 404 errors

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.get_user_profile(UUID);
DROP FUNCTION IF EXISTS public.has_role(TEXT, UUID);
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

-- Function to get user role securely
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN p.role IS NOT NULL THEN p.role
      WHEN u.raw_user_meta_data->>'role' IS NOT NULL THEN u.raw_user_meta_data->>'role'
      ELSE 'customer'
    END
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = user_id;
$$;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN required_role = 'customer' THEN true
      WHEN required_role = 'editor' THEN public.get_user_role(user_id) IN ('editor', 'staff', 'admin')
      WHEN required_role = 'staff' THEN public.get_user_role(user_id) IN ('staff', 'admin')
      WHEN required_role = 'admin' THEN public.get_user_role(user_id) = 'admin'
      ELSE false
    END;
$$;

-- Function to get user profile securely
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT,
  is_active BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name') as full_name,
    COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url') as avatar_url,
    p.phone,
    public.get_user_role(u.id) as role,
    COALESCE(p.is_active, true) as is_active
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = user_id AND COALESCE(p.is_active, true) = true;
$$;

SELECT 'Security functions created successfully!' as message;