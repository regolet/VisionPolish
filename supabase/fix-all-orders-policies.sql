-- Comprehensive fix for all orders table RLS policies
-- This ensures users can properly interact with their orders

-- First, drop all existing orders policies
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;

-- Create comprehensive SELECT policy
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (
    user_id = auth.uid() OR                    -- User owns the order
    assigned_editor = auth.uid() OR            -- User is the assigned editor
    public.has_role('staff') OR                -- User is staff
    public.has_role('admin')                   -- User is admin
  );

-- Create comprehensive INSERT policy
CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR                    -- User is creating their own order
    public.has_role('staff') OR                -- Staff can create orders
    public.has_role('admin')                   -- Admin can create orders
  );

-- Create comprehensive UPDATE policy with both USING and WITH CHECK
CREATE POLICY "orders_update_policy" ON public.orders
  FOR UPDATE 
  USING (
    -- Can select the row for update if:
    user_id = auth.uid() OR                    -- User owns the order
    assigned_editor = auth.uid() OR            -- User is the assigned editor
    public.has_role('staff') OR                -- User is staff
    public.has_role('admin')                   -- User is admin
  )
  WITH CHECK (
    -- Can update to new values if:
    user_id = auth.uid() OR                    -- User owns the order
    assigned_editor = auth.uid() OR            -- User is the assigned editor  
    public.has_role('staff') OR                -- User is staff
    public.has_role('admin')                   -- User is admin
  );

-- Create DELETE policy (optional, but good to have)
CREATE POLICY "orders_delete_policy" ON public.orders
  FOR DELETE USING (
    public.has_role('admin')                   -- Only admin can delete orders
  );

-- Verify all policies were created correctly
SELECT 
  polname as policy_name,
  CASE polcmd 
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END as command,
  CASE 
    WHEN pg_get_expr(polqual, polrelid) IS NOT NULL 
    THEN 'USING: ' || pg_get_expr(polqual, polrelid)
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN pg_get_expr(polwithcheck, polrelid) IS NOT NULL 
    THEN 'WITH CHECK: ' || pg_get_expr(polwithcheck, polrelid)
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policy
WHERE polrelid = 'public.orders'::regclass
ORDER BY polcmd;

-- Also ensure the has_role function exists (it should from previous migrations)
-- This is just a safety check
DO $$
BEGIN
  -- Check if has_role function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'has_role' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE NOTICE 'has_role function not found. Please run add-missing-functions.sql first.';
  ELSE
    RAISE NOTICE 'has_role function exists. Policies should work correctly.';
  END IF;
END $$;