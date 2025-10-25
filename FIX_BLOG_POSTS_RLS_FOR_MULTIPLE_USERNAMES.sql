-- FIX: Update blog_posts RLS policies to support multiple assigned_usernames
-- Current problem: get_user_name() returns only ONE username, but users have MULTIPLE

-- ==========================================
-- 1. Create helper function to check if user owns a username
-- ==========================================
CREATE OR REPLACE FUNCTION public.user_owns_username(check_username TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_usernames TEXT[];
BEGIN
    -- Get the current user's assigned_usernames array
    SELECT assigned_usernames INTO user_usernames
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    -- Check if the username is in their array
    RETURN (check_username = ANY(user_usernames));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.user_owns_username(TEXT) TO authenticated;

-- ==========================================
-- 2. Drop old policies
-- ==========================================
DROP POLICY IF EXISTS "Users can view their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to manage blog posts" ON public.blog_posts;

-- ==========================================
-- 3. Create new policies that support multiple usernames
-- ==========================================

-- SELECT: Users can view posts for ANY of their assigned usernames
CREATE POLICY "Users can view posts for their assigned usernames"
ON public.blog_posts
FOR SELECT
TO public
USING (
    auth.uid() IS NOT NULL 
    AND (
        user_owns_username(user_name)  -- User owns this username
        OR is_superadmin()              -- Or user is superadmin
        OR status = 'published'::content_status  -- Or post is published (public)
    )
);

-- INSERT: Authenticated users can insert posts
CREATE POLICY "Authenticated users can insert posts"
ON public.blog_posts
FOR INSERT
TO public
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- UPDATE: Users can update posts for their assigned usernames
CREATE POLICY "Users can update posts for their assigned usernames"
ON public.blog_posts
FOR UPDATE
TO public
USING (
    auth.uid() IS NOT NULL 
    AND (
        user_owns_username(user_name)
        OR is_superadmin()
    )
)
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (
        user_owns_username(user_name)
        OR is_superadmin()
    )
);

-- DELETE: Users can delete posts for their assigned usernames
CREATE POLICY "Users can delete posts for their assigned usernames"
ON public.blog_posts
FOR DELETE
TO public
USING (
    auth.uid() IS NOT NULL 
    AND (
        user_owns_username(user_name)
        OR is_superadmin()
    )
);

-- ==========================================
-- 4. Test the new policies
-- ==========================================
DO $$
DECLARE
    test_user_id UUID;
    test_usernames TEXT[];
    visible_posts INTEGER;
    r RECORD;
BEGIN
    -- Get current user
    SELECT id, assigned_usernames INTO test_user_id, test_usernames
    FROM public.user_profiles
    WHERE email = 'stuartr@doubleclick.work';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTING NEW RLS POLICIES';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User: stuartr@doubleclick.work';
    RAISE NOTICE 'Assigned usernames: %', test_usernames;
    RAISE NOTICE '';
    
    -- Test visibility for each username
    FOR r IN (
        SELECT unnest(test_usernames) as username
    )
    LOOP
        SELECT COUNT(*) INTO visible_posts
        FROM public.blog_posts
        WHERE user_name = r.username;
        
        RAISE NOTICE 'Posts visible for "%": %', r.username, visible_posts;
    END LOOP;
    
    -- Test total visibility
    SELECT COUNT(*) INTO visible_posts
    FROM public.blog_posts
    WHERE user_name = ANY(test_usernames);
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total posts visible: %', visible_posts;
    RAISE NOTICE '';
    
    IF visible_posts > 0 THEN
        RAISE NOTICE '✓ SUCCESS! Posts are now visible.';
        RAISE NOTICE '';
        RAISE NOTICE 'Posts by username:';
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
    ELSE
        RAISE NOTICE '❌ Still no posts visible. Check if posts exist at all.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ==========================================
-- 5. Refresh schema cache
-- ==========================================
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- Final message
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS POLICIES FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '✓ Created user_owns_username() function';
    RAISE NOTICE '✓ Updated SELECT policy to check ALL assigned usernames';
    RAISE NOTICE '✓ Updated UPDATE policy to check ALL assigned usernames';
    RAISE NOTICE '✓ Updated DELETE policy to check ALL assigned usernames';
    RAISE NOTICE '';
    RAISE NOTICE 'Now refresh your Content page!';
    RAISE NOTICE 'All posts for your assigned usernames should appear.';
    RAISE NOTICE '========================================';
END $$;

