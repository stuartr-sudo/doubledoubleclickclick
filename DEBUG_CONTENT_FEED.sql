-- DEBUG: Why isn't devstuartr content showing up in Content feed?
-- This investigates the complete flow from database to frontend

-- ==========================================
-- STEP 1: Check if posts exist in blog_posts
-- ==========================================
SELECT 
    id,
    title,
    user_name,
    status,
    created_date,
    updated_date
FROM public.blog_posts
WHERE user_name = 'devstuartr'
ORDER BY updated_date DESC;

-- ==========================================
-- STEP 2: Check user's assigned_usernames
-- ==========================================
SELECT 
    email,
    full_name,
    assigned_usernames,
    role,
    is_superadmin
FROM public.user_profiles
WHERE email LIKE '%stuartr%'
ORDER BY email;

-- ==========================================
-- STEP 3: Check if username exists in usernames table
-- ==========================================
SELECT 
    id,
    username,
    user_name,
    display_name,
    is_active,
    assigned_to
FROM public.usernames
WHERE username = 'devstuartr' OR user_name = 'devstuartr';

-- ==========================================
-- STEP 4: Verify RLS policies on blog_posts
-- ==========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY policyname;

-- ==========================================
-- STEP 5: Test query as authenticated user
-- ==========================================
-- This simulates what the frontend does
DO $$
DECLARE
    test_user_id UUID;
    test_usernames TEXT[];
    post_count INTEGER;
    r RECORD;
BEGIN
    -- Get the user ID for stuartr@doubleclick.work
    SELECT id, assigned_usernames INTO test_user_id, test_usernames
    FROM public.user_profiles
    WHERE email = 'stuartr@doubleclick.work';
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '❌ User stuartr@doubleclick.work not found';
        RETURN;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'USER INFO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE 'Assigned usernames: %', test_usernames;
    RAISE NOTICE '';
    
    -- Check if devstuartr is in assigned_usernames
    IF 'devstuartr' = ANY(test_usernames) THEN
        RAISE NOTICE '✓ devstuartr IS in assigned_usernames';
    ELSE
        RAISE NOTICE '❌ devstuartr is NOT in assigned_usernames';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BLOG POSTS FOR DEVSTUARTR';
    RAISE NOTICE '========================================';
    
    -- Count posts
    SELECT COUNT(*) INTO post_count
    FROM public.blog_posts
    WHERE user_name = 'devstuartr';
    
    RAISE NOTICE 'Total posts with user_name=devstuartr: %', post_count;
    RAISE NOTICE '';
    
    -- Show posts
    FOR r IN (
        SELECT id, title, user_name, status, created_date
        FROM public.blog_posts
        WHERE user_name = 'devstuartr'
        ORDER BY created_date DESC
        LIMIT 10
    )
    LOOP
        RAISE NOTICE '- % (%) - %', r.title, r.status, r.user_name;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FRONTEND QUERY SIMULATION';
    RAISE NOTICE '========================================';
    
    -- This is what the frontend does: BlogPost.filter({ user_name: usernames })
    -- It queries: WHERE user_name = ANY(ARRAY['devstuartr'])
    SELECT COUNT(*) INTO post_count
    FROM public.blog_posts
    WHERE user_name = ANY(test_usernames);
    
    RAISE NOTICE 'Posts matching assigned_usernames: %', post_count;
    RAISE NOTICE '';
    
    FOR r IN (
        SELECT user_name, COUNT(*) as count
        FROM public.blog_posts
        WHERE user_name = ANY(test_usernames)
        GROUP BY user_name
        ORDER BY count DESC
    )
    LOOP
        RAISE NOTICE '  %: % posts', r.user_name, r.count;
    END LOOP;
    
END $$;

-- ==========================================
-- STEP 6: Check for orphaned posts
-- ==========================================
SELECT 
    user_name,
    COUNT(*) as post_count
FROM public.blog_posts
GROUP BY user_name
ORDER BY post_count DESC;

-- ==========================================
-- FINAL DIAGNOSIS
-- ==========================================
DO $$
DECLARE
    posts_exist BOOLEAN;
    username_assigned BOOLEAN;
    username_in_table BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSIS';
    RAISE NOTICE '========================================';
    
    -- Check 1: Posts exist
    SELECT EXISTS(SELECT 1 FROM public.blog_posts WHERE user_name = 'devstuartr') INTO posts_exist;
    
    -- Check 2: Username assigned to user
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles 
        WHERE email = 'stuartr@doubleclick.work' 
        AND 'devstuartr' = ANY(assigned_usernames)
    ) INTO username_assigned;
    
    -- Check 3: Username exists in usernames table
    SELECT EXISTS(
        SELECT 1 FROM public.usernames 
        WHERE username = 'devstuartr' OR user_name = 'devstuartr'
    ) INTO username_in_table;
    
    IF posts_exist THEN
        RAISE NOTICE '✓ Posts exist with user_name=devstuartr';
    ELSE
        RAISE NOTICE '❌ NO posts found with user_name=devstuartr';
    END IF;
    
    IF username_assigned THEN
        RAISE NOTICE '✓ devstuartr is assigned to stuartr@doubleclick.work';
    ELSE
        RAISE NOTICE '❌ devstuartr is NOT assigned to user';
    END IF;
    
    IF username_in_table THEN
        RAISE NOTICE '✓ devstuartr exists in usernames table';
    ELSE
        RAISE NOTICE '❌ devstuartr NOT in usernames table';
    END IF;
    
    RAISE NOTICE '';
    
    IF posts_exist AND username_assigned THEN
        RAISE NOTICE '🎯 ISSUE: Posts exist and username is assigned';
        RAISE NOTICE '   Problem is likely:';
        RAISE NOTICE '   1. Frontend not filtering correctly';
        RAISE NOTICE '   2. RLS policies blocking access';
        RAISE NOTICE '   3. Case sensitivity mismatch';
        RAISE NOTICE '   4. Frontend cache issue';
    ELSIF NOT posts_exist THEN
        RAISE NOTICE '🎯 ISSUE: Posts do not exist in database';
        RAISE NOTICE '   The test posts were not created properly';
    ELSIF NOT username_assigned THEN
        RAISE NOTICE '🎯 ISSUE: Username not assigned to user';
        RAISE NOTICE '   Run ASSIGN_DEVSTUARTR_TO_USER.sql again';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

