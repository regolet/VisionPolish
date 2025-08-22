-- Create a simplified function without admin check for testing
-- Run this first to create the function, then test it

-- First, ensure profiles exist for all auth users
INSERT INTO public.profiles (id, role, created_at, updated_at)
SELECT 
  id,
  'customer' as role,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Create a simple function without admin check (for now)
CREATE OR REPLACE FUNCTION public.get_users_with_email()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  department TEXT,
  is_active BOOLEAN,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the joined data (no admin check for now)
  RETURN QUERY
  SELECT 
    p.id,
    u.email::TEXT,
    p.full_name,
    p.phone,
    COALESCE(p.role, 'customer') as role,
    p.department,
    COALESCE(p.is_active, true) as is_active,
    p.avatar_url,
    COALESCE(p.created_at, u.created_at) as created_at,
    p.updated_at,
    u.last_sign_in_at as last_sign_in
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY COALESCE(p.created_at, u.created_at) DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_users_with_email() TO authenticated;

-- Test the function
SELECT * FROM public.get_users_with_email();