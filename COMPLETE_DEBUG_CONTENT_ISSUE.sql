-- COMPLETE DEBUG: Why content isn't showing for devstuartr
-- This will trace the entire data flow from database to frontend

-- ==========================================
-- 1. What does the frontend actually query?
-- ==========================================
-- The frontend calls: BlogPost.filter({ user_name: usernames })
-- This becomes: SELECT * FROM blog_posts WHERE user_name = ANY(ARRAY[...])

-- Check what user sees
SELECT 
    email,
    full_name,
    assigned_usernames,
    role
FROM public.user_profiles
WHERE email = 'stuartr@doubleclick.work';

-- ==========================================
-- 2. What usernames exist in the table?
-- ==========================================
SELECT 
    id,
    username,
    user_name,
    display_name,
    is_active,
    assigned_to,
    created_date
FROM public.usernames
ORDER BY created_date DESC;

-- ==========================================
-- 3. What blog posts exist and their user_name?
-- ==========================================
SELECT 
    id,
    title,
    user_name,
    status,
    created_date,
    updated_date
FROM public.blog_posts
ORDER BY updated_date DESC
LIMIT 20;

-- ==========================================
-- 4. CRITICAL: Exact match test
-- ==========================================
-- Check if there's any case sensitivity or whitespace issue
DO $$
DECLARE
    r RECORD;
    test_usernames TEXT[] := ARRAY['devstuartr', 'keppi', 'backpainsolutions', 'stockpools'];
    matching_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTING BLOG POST QUERY';
    RAISE NOTICE '========================================';
    
    -- Test the exact query the frontend uses
    SELECT COUNT(*) INTO matching_count
    FROM public.blog_posts
    WHERE user_name = ANY(test_usernames);
    
    RAISE NOTICE 'Total posts matching assigned_usernames: %', matching_count;
    RAISE NOTICE '';
    
    -- Break down by username
    RAISE NOTICE 'Posts per username:';
    FOR r IN (
        SELECT 
            user_name,
            COUNT(*) as count,
            array_agg(title ORDER BY created_date DESC) as titles
        FROM public.blog_posts
        WHERE user_name = ANY(test_usernames)
        GROUP BY user_name
    )
    LOOP
        RAISE NOTICE '  % (%): %', r.user_name, r.count, r.titles;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CHECKING DEVSTUARTR SPECIFICALLY';
    RAISE NOTICE '========================================';
    
    -- Test devstuartr explicitly
    SELECT COUNT(*) INTO matching_count
    FROM public.blog_posts
    WHERE user_name = 'devstuartr';
    
    RAISE NOTICE 'Posts with user_name = ''devstuartr'': %', matching_count;
    
    IF matching_count > 0 THEN
        RAISE NOTICE 'Titles:';
        FOR r IN (
            SELECT id, title, status, created_date
            FROM public.blog_posts
            WHERE user_name = 'devstuartr'
            ORDER BY created_date DESC
        )
        LOOP
            RAISE NOTICE '  - % (%) [%]', r.title, r.status, r.id;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ NO POSTS FOUND with user_name = ''devstuartr''';
    END IF;
    
    -- Check for variations
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for case/whitespace variations:';
    
    FOR r IN (
        SELECT DISTINCT user_name
        FROM public.blog_posts
        WHERE LOWER(user_name) LIKE '%stuart%' OR LOWER(user_name) LIKE '%dev%'
    )
    LOOP
        RAISE NOTICE '  Found: ''%'' (length: %)', r.user_name, LENGTH(r.user_name);
    END LOOP;
    
END $$;

-- ==========================================
-- 5. Check RLS policies on blog_posts
-- ==========================================
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY policyname;

-- ==========================================
-- 6. FINAL TEST: Simulate exact frontend behavior
-- ==========================================
DO $$
DECLARE
    user_id UUID;
    user_usernames TEXT[];
    post_count INTEGER;
    r RECORD;
BEGIN
    -- Get the authenticated user's data
    SELECT id, assigned_usernames INTO user_id, user_usernames
    FROM public.user_profiles
    WHERE email = 'stuartr@doubleclick.work';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FRONTEND SIMULATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User ID: %', user_id;
    RAISE NOTICE 'Assigned usernames: %', user_usernames;
    RAISE NOTICE '';
    
    -- This is EXACTLY what the frontend does
    SELECT COUNT(*) INTO post_count
    FROM public.blog_posts
    WHERE user_name = ANY(user_usernames);
    
    RAISE NOTICE 'Query: SELECT * FROM blog_posts WHERE user_name = ANY(assigned_usernames)';
    RAISE NOTICE 'Result: % posts', post_count;
    RAISE NOTICE '';
    
    IF post_count = 0 THEN
        RAISE NOTICE '❌ PROBLEM: Query returns 0 posts';
        RAISE NOTICE '';
        RAISE NOTICE 'Possible causes:';
        RAISE NOTICE '1. user_name values in blog_posts don''t match assigned_usernames';
        RAISE NOTICE '2. RLS policies are blocking access';
        RAISE NOTICE '3. Case sensitivity mismatch';
        RAISE NOTICE '';
        
        -- Check what user_names exist in blog_posts
        RAISE NOTICE 'All user_name values in blog_posts:';
        FOR r IN (
            SELECT DISTINCT user_name, COUNT(*) as count
            FROM public.blog_posts
            GROUP BY user_name
            ORDER BY count DESC
        )
        LOOP
            RAISE NOTICE '  - ''%'': % posts', r.user_name, r.count;
        END LOOP;
        
        RAISE NOTICE '';
        RAISE NOTICE 'Checking if any blog_posts user_names match assigned_usernames:';
        FOR r IN (
            SELECT unnest(user_usernames) as username
        )
        LOOP
            SELECT COUNT(*) INTO post_count
            FROM public.blog_posts
            WHERE user_name = r.username;
            
            RAISE NOTICE '  ''%'': % posts', r.username, post_count;
        END LOOP;
    ELSE
        RAISE NOTICE '✓ Query works! Posts should be visible.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

