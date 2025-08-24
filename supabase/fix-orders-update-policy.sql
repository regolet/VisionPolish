-- Fix orders table RLS update policy
-- The issue: orders_update_policy only has USING clause but no WITH CHECK clause
-- This causes PostgreSQL to deny updates even when the user owns the order

-- Drop the existing incomplete policy
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;

-- Create a complete update policy with both USING and WITH CHECK clauses
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

-- Verify the policy was created correctly
SELECT 
  polname as policy_name,
  polcmd as command,
  pg_get_expr(polqual, polrelid) as using_expression,
  pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy
WHERE polrelid = 'public.orders'::regclass
  AND polname = 'orders_update_policy';