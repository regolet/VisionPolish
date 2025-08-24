-- Test current orders policies to identify the issue
-- Run this BEFORE applying the fix to see the problem

-- 1. Check current policies on orders table
SELECT 
  polname as policy_name,
  CASE polcmd 
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END as command,
  pg_get_expr(polqual, polrelid) as using_clause,
  pg_get_expr(polwithcheck, polrelid) as with_check_clause,
  CASE 
    WHEN polcmd = 'w' AND pg_get_expr(polwithcheck, polrelid) IS NULL 
    THEN '⚠️ MISSING WITH CHECK - This will cause updates to fail!'
    ELSE '✅ OK'
  END as status
FROM pg_policy
WHERE polrelid = 'public.orders'::regclass
ORDER BY polcmd;

-- 2. Test if has_role function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'has_role' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    )
    THEN '✅ has_role function exists'
    ELSE '❌ has_role function missing - run add-missing-functions.sql'
  END as function_status;

-- 3. Check if there are any pending orders that might be affected
SELECT 
  COUNT(*) as pending_orders_count,
  COUNT(DISTINCT user_id) as affected_users
FROM public.orders
WHERE status = 'pending';

-- 4. Show a sample order to understand the data structure
SELECT 
  id,
  order_number,
  user_id,
  status,
  payment_status,
  total_amount,
  created_at
FROM public.orders
WHERE status = 'pending'
LIMIT 1;