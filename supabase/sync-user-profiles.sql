-- Sync User Profiles
-- This script ensures all auth.users have corresponding profiles
-- Run this to fix the issue of not seeing users in User Management

-- Step 1: Create profiles for all existing auth users who don't have one
INSERT INTO public.profiles (id, role, created_at, updated_at)
SELECT 
  id,
  'customer' as role,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update any NULL roles to 'customer'
UPDATE public.profiles 
SET role = 'customer' 
WHERE role IS NULL;

-- Step 3: Verify the sync worked
SELECT 
  'Total Auth Users' as metric,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Total Profiles' as metric,
  COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 
  'Users without Profiles' as metric,
  COUNT(*) as count
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Step 4: Show all users with their profiles
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.role,
  p.full_name,
  p.is_active,
  CASE 
    WHEN p.id IS NULL THEN 'Missing Profile!'
    ELSE 'OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;

-- Step 5: Count users by role
SELECT 
  COALESCE(role, 'not set') as role,
  COUNT(*) as user_count
FROM public.profiles
GROUP BY role
ORDER BY user_count DESC;