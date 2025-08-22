-- Create a function to get users with their email addresses
-- This allows the admin to see all users with their profile data and emails

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

-- Create a function that admins can use to get all users with emails
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
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Return the joined data
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

-- Grant execute permission to authenticated users (the function checks for admin internally)
GRANT EXECUTE ON FUNCTION public.get_users_with_email() TO authenticated;

-- Create a simpler view for non-admin access (optional)
CREATE OR REPLACE VIEW public.user_directory AS
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.department,
  p.created_at
FROM public.profiles p
WHERE p.is_active = true;

-- Test the function to see current users
SELECT * FROM public.get_users_with_email();

-- Count users by role
SELECT 
  COALESCE(role, 'customer') as role,
  COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;