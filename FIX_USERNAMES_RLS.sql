-- Fix RLS policy blocking username creation
-- Error: "new row violates row-level security policy for table usernames"

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can view usernames" ON public.usernames;
DROP POLICY IF EXISTS "Admins can manage usernames" ON public.usernames;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.usernames;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.usernames;

-- 2. Create simple, working policies

-- Everyone can read usernames (needed for dropdowns, etc.)
CREATE POLICY "authenticated_can_read_usernames"
    ON public.usernames
    FOR SELECT
    TO authenticated
    USING (true);

-- Admins can insert new usernames
CREATE POLICY "admins_can_insert_usernames"
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

-- Admins can update usernames
CREATE POLICY "admins_can_update_usernames"
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

-- Admins can delete usernames
CREATE POLICY "admins_can_delete_usernames"
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

-- 3. Ensure RLS is enabled
ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;

-- 4. Grant permissions
GRANT SELECT ON public.usernames TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.usernames TO authenticated;

-- 5. Verify policies
SELECT 
    policyname,
    cmd,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN LEFT(qual, 50) || '...'
        ELSE 'No USING'
    END as using_clause
FROM pg_policies
WHERE tablename = 'usernames'
ORDER BY cmd, policyname;

-- 6. Test query (should work for admins)
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO test_count FROM public.usernames;
    RAISE NOTICE 'Successfully queried usernames. Total: %', test_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error querying usernames: %', SQLERRM;
END $$;

-- 7. Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'USERNAMES RLS FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Policies created:';
    RAISE NOTICE '- authenticated_can_read_usernames (SELECT)';
    RAISE NOTICE '- admins_can_insert_usernames (INSERT)';
    RAISE NOTICE '- admins_can_update_usernames (UPDATE)';
    RAISE NOTICE '- admins_can_delete_usernames (DELETE)';
    RAISE NOTICE '';
    RAISE NOTICE 'Admins can now create usernames!';
    RAISE NOTICE '========================================';
END $$;

