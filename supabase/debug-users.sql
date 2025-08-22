-- Debug: Check current database state
-- Run these queries to see what's happening

-- 1. Check if profiles table has the new columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Count auth users
SELECT 'Total auth.users' as table_name, COUNT(*) as count FROM auth.users;

-- 3. Count profiles
SELECT 'Total public.profiles' as table_name, COUNT(*) as count FROM public.profiles;

-- 4. Show all auth users with their emails
SELECT id, email, created_at, confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 5. Show all profiles
SELECT id, role, full_name, department, is_active, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- 6. Check if get_users_with_email function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_users_with_email';

-- 7. Try to call the function (if it exists)
-- SELECT * FROM public.get_users_with_email();