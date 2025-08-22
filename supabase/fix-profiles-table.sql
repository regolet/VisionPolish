-- Fix Profiles Table - Add Missing Columns
-- Run this FIRST to add missing columns, then run the sync

-- Step 1: Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Update the role constraint to include all role types
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer', 'editor', 'staff', 'admin'));

-- Step 3: Create profiles for all existing auth users who don't have one
INSERT INTO public.profiles (id, role, is_active, created_at, updated_at)
SELECT 
  id,
  'customer' as role,
  true as is_active,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Update any NULL values
UPDATE public.profiles 
SET 
  role = 'customer' 
WHERE role IS NULL;

UPDATE public.profiles 
SET 
  is_active = true 
WHERE is_active IS NULL;

-- Step 5: Verify the fix worked
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

-- Step 6: Show all users with their profiles (now with is_active column)
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.role,
  p.full_name,
  p.department,
  p.is_active,
  CASE 
    WHEN p.id IS NULL THEN 'Missing Profile!'
    ELSE 'Profile OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;

-- Step 7: Count users by role
SELECT 
  COALESCE(role, 'not set') as role,
  COUNT(*) as user_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
FROM public.profiles
GROUP BY role
ORDER BY user_count DESC;