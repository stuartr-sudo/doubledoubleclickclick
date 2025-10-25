-- Fix username column NOT NULL constraint
-- The table has BOTH 'username' and 'user_name' columns
-- The 'username' column is NOT NULL, causing the insert to fail

-- 1. Make username column nullable
ALTER TABLE public.usernames 
ALTER COLUMN username DROP NOT NULL;

-- 2. Populate username from user_name for existing rows
UPDATE public.usernames
SET username = user_name
WHERE username IS NULL AND user_name IS NOT NULL;

-- 3. Or populate from display_name if user_name is also null
UPDATE public.usernames
SET username = LOWER(REGEXP_REPLACE(display_name, '[^a-zA-Z0-9]', '', 'g'))
WHERE username IS NULL AND display_name IS NOT NULL;

-- 4. Verify the fix
SELECT 
    id,
    username,
    user_name,
    display_name,
    is_active
FROM public.usernames
ORDER BY created_date;

-- 5. Show column info
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'usernames' 
    AND column_name IN ('username', 'user_name')
ORDER BY column_name;

-- 6. Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'USERNAME COLUMN FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Changed username column to nullable';
    RAISE NOTICE 'Populated username from user_name';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now create usernames!';
    RAISE NOTICE '========================================';
END $$;

