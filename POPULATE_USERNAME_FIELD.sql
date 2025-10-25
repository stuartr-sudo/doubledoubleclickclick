-- Populate user_name field from display_name for existing usernames
-- The user_name field should contain the lowercase, URL-friendly version

-- 1. Show current state
SELECT 
    id,
    display_name,
    user_name,
    is_active
FROM public.usernames
ORDER BY created_date;

-- 2. Update user_name based on display_name
-- Convert to lowercase and replace spaces with nothing or hyphens
UPDATE public.usernames
SET user_name = CASE
    WHEN display_name = 'Keppi Fitness' THEN 'keppi'
    WHEN display_name = 'Back Pain Solutions' THEN 'backpainsolutions'
    WHEN display_name = 'Stock Pools' THEN 'stockpools'
    ELSE LOWER(REGEXP_REPLACE(display_name, '[^a-zA-Z0-9]', '', 'g'))
END
WHERE user_name IS NULL AND display_name IS NOT NULL;

-- 3. Show updated state
SELECT 
    id,
    display_name,
    user_name,
    is_active,
    created_date
FROM public.usernames
ORDER BY created_date;

-- 4. Success message
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM public.usernames 
    WHERE user_name IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'USERNAMES POPULATED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total usernames with user_name: %', updated_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Usernames now ready to assign to users!';
    RAISE NOTICE '========================================';
END $$;

