-- Check constraints on revisions table
-- This will help identify why requested_by field is showing NOT NULL constraint error

-- 1. Check column definitions and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'revisions'
ORDER BY ordinal_position;

-- 2. Check table constraints
SELECT 
    constraint_name,
    constraint_type,
    column_name,
    is_deferrable,
    initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'revisions';

-- 3. Check if there are any CHECK constraints
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
    AND constraint_name IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
            AND table_name = 'revisions'
            AND constraint_type = 'CHECK'
    );

-- 4. Test insert to see actual error
DO $$
BEGIN
    -- Try to insert a revision without requested_by to see the error
    BEGIN
        INSERT INTO public.revisions (order_item_id, notes, status)
        VALUES (gen_random_uuid(), 'Test revision', 'pending');
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Expected error: %', SQLERRM;
    END;
    
    -- Try to insert with requested_by set to NULL
    BEGIN
        INSERT INTO public.revisions (order_item_id, requested_by, notes, status)
        VALUES (gen_random_uuid(), NULL, 'Test revision with NULL', 'pending');
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error with NULL requested_by: %', SQLERRM;
    END;
END $$;