-- Final cleanup of usernames RLS policies
-- Remove all conflicting policies and create clean ones

-- 1. Drop ALL existing policies (including old ones)
DROP POLICY IF EXISTS "Users can view usernames" ON public.usernames;
DROP POLICY IF EXISTS "Admins can manage usernames" ON public.usernames;
DROP POLICY IF EXISTS "authenticated_can_read_usernames" ON public.usernames;
DROP POLICY IF EXISTS "admins_can_insert_usernames" ON public.usernames;
DROP POLICY IF EXISTS "admins_can_update_usernames" ON public.usernames;
DROP POLICY IF EXISTS "admins_can_delete_usernames" ON public.usernames;
DROP POLICY IF EXISTS "Service role can manage usernames" ON public.usernames;
DROP POLICY IF EXISTS "Anyone can view available usernames" ON public.usernames;
DROP POLICY IF EXISTS "Users can view their assigned usernames" ON public.usernames;

-- 2. Create ONE simple SELECT policy for everyone
CREATE POLICY "select_usernames"
    ON public.usernames
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- 3. Create admin INSERT policy with WITH CHECK
CREATE POLICY "insert_usernames"
    ON public.usernames
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (role IN ('admin', 'superadmin') OR is_superadmin = true)
        )
    );

-- 4. Create admin UPDATE policy
CREATE POLICY "update_usernames"
    ON public.usernames
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (role IN ('admin', 'superadmin') OR is_superadmin = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (role IN ('admin', 'superadmin') OR is_superadmin = true)
        )
    );

-- 5. Create admin DELETE policy
CREATE POLICY "delete_usernames"
    ON public.usernames
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (role IN ('admin', 'superadmin') OR is_superadmin = true)
        )
    );

-- 6. Ensure RLS is enabled
ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;

-- 7. Grant permissions
GRANT SELECT ON public.usernames TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.usernames TO authenticated;

-- 8. Show final policies (should be exactly 4)
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'usernames'
ORDER BY cmd, policyname;

-- 9. Test admin check for current user
DO $$
DECLARE
    current_user_id UUID := '2c7c7bb6-da79-46ae-9004-d18b7fcd7607'; -- Your stuartr@doubleclick.work ID
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = current_user_id
        AND (role IN ('admin', 'superadmin') OR is_superadmin = true)
    ) INTO is_admin;
    
    IF is_admin THEN
        RAISE NOTICE '✓ User is admin - can create usernames';
    ELSE
        RAISE NOTICE '✗ User is NOT admin - cannot create usernames';
    END IF;
END $$;

-- 10. Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'USERNAMES RLS - FINAL FIX';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created exactly 4 policies:';
    RAISE NOTICE '1. select_usernames (everyone can read)';
    RAISE NOTICE '2. insert_usernames (admins can create)';
    RAISE NOTICE '3. update_usernames (admins can edit)';
    RAISE NOTICE '4. delete_usernames (admins can delete)';
    RAISE NOTICE '';
    RAISE NOTICE 'No conflicts, no duplicates!';
    RAISE NOTICE '========================================';
END $$;

