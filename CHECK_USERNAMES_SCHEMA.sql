-- Check the actual usernames table schema to understand the issue
-- Error: "null value in column 'username' violates not-null constraint"

-- 1. Show the COMPLETE table structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'usernames'
ORDER BY ordinal_position;

-- 2. Show all constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'usernames'
ORDER BY tc.constraint_type, kcu.column_name;

-- 3. Show a sample row to understand the data structure
SELECT * FROM public.usernames LIMIT 1;

-- 4. Check if there's a 'username' column (singular) vs 'user_name' (with underscore)
DO $$
DECLARE
    has_username BOOLEAN;
    has_user_name BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usernames' AND column_name = 'username'
    ) INTO has_username;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usernames' AND column_name = 'user_name'
    ) INTO has_user_name;
    
    RAISE NOTICE 'Has "username" column: %', has_username;
    RAISE NOTICE 'Has "user_name" column: %', has_user_name;
END $$;

