-- Check if the dropdown username matches the database user_name

-- 1. What's in the usernames table (what the dropdown shows)
SELECT 
    id,
    username,
    user_name,
    display_name,
    is_active
FROM public.usernames
WHERE assigned_to = (SELECT id FROM public.user_profiles WHERE email = 'stuartr@doubleclick.work')
ORDER BY created_date;

-- 2. What's in blog_posts (what the filter checks against)
SELECT DISTINCT 
    user_name,
    COUNT(*) as post_count
FROM public.blog_posts
GROUP BY user_name
ORDER BY user_name;

-- 3. CRITICAL: Check if there's a mismatch
-- The dropdown uses `username` or `user_name` from usernames table
-- The filter checks against `user_name` in blog_posts
-- These MUST match!

DO $$
DECLARE
    r RECORD;
    dropdown_value TEXT;
    posts_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DROPDOWN VS DATABASE MISMATCH CHECK';
    RAISE NOTICE '========================================';
    
    FOR r IN (
        SELECT username, user_name, display_name
        FROM public.usernames
        WHERE assigned_to = (SELECT id FROM public.user_profiles WHERE email = 'stuartr@doubleclick.work')
    )
    LOOP
        -- Check which field the frontend uses
        RAISE NOTICE '';
        RAISE NOTICE 'Username entry:';
        RAISE NOTICE '  username: %', r.username;
        RAISE NOTICE '  user_name: %', r.user_name;
        RAISE NOTICE '  display_name: %', r.display_name;
        
        -- Check posts for username
        SELECT COUNT(*) INTO posts_count FROM public.blog_posts WHERE user_name = r.username;
        RAISE NOTICE '  Posts matching username field: %', posts_count;
        
        -- Check posts for user_name
        SELECT COUNT(*) INTO posts_count FROM public.blog_posts WHERE user_name = r.user_name;
        RAISE NOTICE '  Posts matching user_name field: %', posts_count;
        
        IF r.username != r.user_name THEN
            RAISE NOTICE '  ⚠️ MISMATCH! username != user_name';
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;

