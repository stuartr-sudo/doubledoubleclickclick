-- VERIFY: Do the posts actually exist in blog_posts table?

-- 1. Check ALL posts in blog_posts table
SELECT 
    id,
    title,
    user_name,
    status,
    created_date
FROM public.blog_posts
ORDER BY created_date DESC;

-- 2. Count posts by user_name
SELECT 
    user_name,
    COUNT(*) as count
FROM public.blog_posts
GROUP BY user_name
ORDER BY count DESC;

-- 3. Check specifically for devstuartr
SELECT 
    id,
    title,
    user_name,
    status,
    content IS NOT NULL as has_content,
    LENGTH(content) as content_length
FROM public.blog_posts
WHERE user_name = 'devstuartr'
ORDER BY created_date DESC;

-- 4. Test the RLS policy with current user
DO $$
DECLARE
    current_user_id UUID := auth.uid();
    user_email TEXT;
    user_usernames TEXT[];
    visible_count INTEGER;
    total_count INTEGER;
    r RECORD;
BEGIN
    -- Get current user info
    SELECT email, assigned_usernames INTO user_email, user_usernames
    FROM public.user_profiles
    WHERE id = current_user_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CURRENT USER INFO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User ID: %', current_user_id;
    RAISE NOTICE 'Email: %', user_email;
    RAISE NOTICE 'Assigned usernames: %', user_usernames;
    RAISE NOTICE '';
    
    -- Count total posts in table (bypassing RLS)
    SELECT COUNT(*) INTO total_count FROM public.blog_posts;
    RAISE NOTICE 'Total posts in blog_posts table: %', total_count;
    
    -- Count posts visible to current user (with RLS)
    SELECT COUNT(*) INTO visible_count 
    FROM public.blog_posts;
    
    RAISE NOTICE 'Posts visible to current user: %', visible_count;
    RAISE NOTICE '';
    
    IF visible_count = 0 AND total_count > 0 THEN
        RAISE NOTICE '❌ RLS IS BLOCKING ALL POSTS!';
        RAISE NOTICE '';
        RAISE NOTICE 'Checking user_owns_username function:';
        
        FOR r IN SELECT unnest(user_usernames) as username LOOP
            RAISE NOTICE '  Testing username: %', r.username;
            
            -- Test the function
            IF user_owns_username(r.username) THEN
                RAISE NOTICE '    ✓ user_owns_username returns TRUE';
            ELSE
                RAISE NOTICE '    ❌ user_owns_username returns FALSE';
            END IF;
            
            -- Check if posts exist for this username
            SELECT COUNT(*) INTO visible_count
            FROM public.blog_posts
            WHERE user_name = r.username;
            
            RAISE NOTICE '    Posts with user_name=%: %', r.username, visible_count;
        END LOOP;
    ELSIF visible_count > 0 THEN
        RAISE NOTICE '✓ Posts are visible! Breaking down by username:';
        FOR r IN (
            SELECT user_name, COUNT(*) as count
            FROM public.blog_posts
            GROUP BY user_name
            ORDER BY count DESC
        )
        LOOP
            RAISE NOTICE '  %: % posts', r.user_name, r.count;
        END LOOP;
    ELSE
        RAISE NOTICE '⚠ No posts exist in blog_posts table at all!';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- 5. Check if user_owns_username function exists and works
SELECT 
    proname as function_name,
    proargnames as argument_names,
    prosrc as source
FROM pg_proc
WHERE proname = 'user_owns_username';

-- 6. Test user_owns_username directly
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Testing user_owns_username function:';
    
    IF user_owns_username('devstuartr') THEN
        RAISE NOTICE '✓ user_owns_username(''devstuartr'') = TRUE';
    ELSE
        RAISE NOTICE '❌ user_owns_username(''devstuartr'') = FALSE';
    END IF;
    
    IF user_owns_username('keppi') THEN
        RAISE NOTICE '✓ user_owns_username(''keppi'') = TRUE';
    ELSE
        RAISE NOTICE '❌ user_owns_username(''keppi'') = FALSE';
    END IF;
END $$;

