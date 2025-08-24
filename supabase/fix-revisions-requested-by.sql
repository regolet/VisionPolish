-- Fix revisions table requested_by column constraint
-- This addresses the NOT NULL constraint error on requested_by field

-- First, check if the column has a NOT NULL constraint that shouldn't be there
-- The original schema shows it should allow NULL with ON DELETE SET NULL

-- Remove NOT NULL constraint if it exists
ALTER TABLE public.revisions 
ALTER COLUMN requested_by DROP NOT NULL;

-- Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'revisions' 
    AND column_name = 'requested_by';

-- Test that we can now insert with NULL requested_by (should work for system operations)
DO $$
BEGIN
    -- This should now work without error
    INSERT INTO public.revisions (order_item_id, requested_by, notes, status)
    VALUES (gen_random_uuid(), NULL, 'Test revision - should work', 'pending');
    
    -- Clean up test data
    DELETE FROM public.revisions WHERE notes = 'Test revision - should work';
    
    RAISE NOTICE 'SUCCESS: requested_by column can now accept NULL values';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;