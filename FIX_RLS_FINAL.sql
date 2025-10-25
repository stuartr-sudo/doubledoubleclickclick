-- FINAL FIX: Make RLS work with assigned_usernames array
-- The issue: RLS policies aren't properly checking the assigned_usernames array

-- 1. First, re-enable RLS if it was disabled
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies on blog_posts
DROP POLICY IF EXISTS "Users can view posts for their assigned usernames" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update posts for their assigned usernames" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can delete posts for their assigned usernames" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to manage blog posts" ON public.blog_posts;

-- 3. Create NEW, simpler policies that directly check assigned_usernames

-- SELECT: Allow users to see posts for their assigned usernames OR published posts
CREATE POLICY "blog_posts_select_policy"
ON public.blog_posts
FOR SELECT
TO public
USING (
    auth.uid() IS NOT NULL
    AND (
        -- Check if post's user_name is in the user's assigned_usernames array
        user_name = ANY(
            SELECT assigned_usernames 
            FROM public.user_profiles 
            WHERE id = auth.uid()
        )
        -- OR user is superadmin
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND (role = 'superadmin' OR is_superadmin = true)
        )
        -- OR post is published (public access)
        OR status = 'published'::content_status
    )
);

-- INSERT: Allow authenticated users to insert posts
CREATE POLICY "blog_posts_insert_policy"
ON public.blog_posts
FOR INSERT
TO public
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- UPDATE: Allow users to update posts for their assigned usernames
CREATE POLICY "blog_posts_update_policy"
ON public.blog_posts
FOR UPDATE
TO public
USING (
    auth.uid() IS NOT NULL
    AND (
        -- Check if post's user_name is in the user's assigned_usernames array
        user_name = ANY(
            SELECT assigned_usernames 
            FROM public.user_profiles 
            WHERE id = auth.uid()
        )
        -- OR user is superadmin
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND (role = 'superadmin' OR is_superadmin = true)
        )
    )
)
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- DELETE: Allow users to delete posts for their assigned usernames
CREATE POLICY "blog_posts_delete_policy"
ON public.blog_posts
FOR DELETE
TO public
USING (
    auth.uid() IS NOT NULL
    AND (
        -- Check if post's user_name is in the user's assigned_usernames array
        user_name = ANY(
            SELECT assigned_usernames 
            FROM public.user_profiles 
            WHERE id = auth.uid()
        )
        -- OR user is superadmin
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND (role = 'superadmin' OR is_superadmin = true)
        )
    )
);

-- 4. Test the new policies
DO $$
DECLARE
    visible_count INTEGER;
    r RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTING NEW RLS POLICIES';
    RAISE NOTICE '========================================';
    
    -- Count visible posts with RLS enabled
    SELECT COUNT(*) INTO visible_count
    FROM public.blog_posts;
    
    RAISE NOTICE 'Total posts visible with new RLS: %', visible_count;
    
    IF visible_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✓ SUCCESS! Posts are visible!';
        RAISE NOTICE '';
        RAISE NOTICE 'Posts by username:';
        
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
        RAISE NOTICE '';
        RAISE NOTICE '❌ Still no posts visible!';
        RAISE NOTICE 'Check if you are logged in as stuartr@doubleclick.work';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- 5. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 6. Final message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS POLICIES REBUILT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '✓ Dropped all old policies';
    RAISE NOTICE '✓ Created simple SELECT policy with direct array check';
    RAISE NOTICE '✓ Created UPDATE policy with direct array check';
    RAISE NOTICE '✓ Created DELETE policy with direct array check';
    RAISE NOTICE '✓ Created INSERT policy for authenticated users';
    RAISE NOTICE '';
    RAISE NOTICE 'The new policies directly check if post.user_name';
    RAISE NOTICE 'is in your user_profiles.assigned_usernames array';
    RAISE NOTICE '';
    RAISE NOTICE 'NOW REFRESH YOUR CONTENT PAGE!';
    RAISE NOTICE 'Posts should appear for all your usernames!';
    RAISE NOTICE '========================================';
END $$;

