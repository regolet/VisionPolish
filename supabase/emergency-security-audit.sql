-- CRITICAL SECURITY AUDIT: Check malipayong@gmail.com role assignment
-- Run this immediately in Supabase SQL Editor

-- Check current user profile role
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data,
  p.role as profile_role,
  p.full_name,
  p.created_at,
  p.updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'malipayong@gmail.com';

-- Check if there are any hardcoded admin roles in metadata
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as metadata_role,
  u.raw_user_meta_data
FROM auth.users u
WHERE u.email = 'malipayong@gmail.com';

-- Emergency fix: Reset to customer role
UPDATE public.profiles 
SET role = 'customer' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'malipayong@gmail.com'
);

-- Verify the fix
SELECT 
  u.email,
  p.role as current_role,
  public.get_user_role(u.id) as effective_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'malipayong@gmail.com';

SELECT 'SECURITY FIX APPLIED: malipayong@gmail.com role reset to customer' as message;