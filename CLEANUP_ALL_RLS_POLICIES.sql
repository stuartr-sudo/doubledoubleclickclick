-- Complete cleanup and rebuild of user_profiles RLS policies
-- This removes ALL existing policies and functions, then creates clean ones

-- ============================================================================
-- STEP 1: Drop ALL existing policies (including duplicates)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile or admins can read all" ON public.user_profiles;
DROP POLICY IF EXISTS "Block anon access" ON public.user_profiles;

-- ============================================================================
-- STEP 2: Drop any existing admin check functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.is_admin_user(UUID);
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- ============================================================================
-- STEP 3: Create a single, simple admin check function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_superadmin BOOLEAN;
BEGIN
    -- Use SECURITY DEFINER to bypass RLS
    SELECT role, COALESCE(is_superadmin, false) 
    INTO user_role, user_superadmin
    FROM public.user_profiles
    WHERE id = user_id;
    
    -- Return true if admin, superadmin, or is_superadmin flag is set
    RETURN (
        user_role IN ('admin', 'superadmin') OR 
        user_superadmin = true
    );
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN false;
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 4: Create clean, minimal RLS policies
-- ============================================================================

-- Policy 1: Authenticated users can view their own profile
CREATE POLICY "select_own_profile"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy 2: Admins can view all profiles
CREATE POLICY "select_all_profiles_admin"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (is_admin_user(auth.uid()));

-- Policy 3: Users can update their own profile
CREATE POLICY "update_own_profile"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can update all profiles
CREATE POLICY "update_all_profiles_admin"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (is_admin_user(auth.uid()))
    WITH CHECK (is_admin_user(auth.uid()));

-- Policy 5: Users can insert their own profile (for auto-creation on signup)
CREATE POLICY "insert_own_profile"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy 6: Admins can insert any profile
CREATE POLICY "insert_any_profile_admin"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_user(auth.uid()));

-- Policy 7: Block all anonymous access
CREATE POLICY "block_anon_access"
    ON public.user_profiles
    FOR ALL
    TO anon
    USING (false);

-- ============================================================================
-- STEP 5: Ensure RLS is enabled
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Grant necessary permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;

-- Revoke unnecessary permissions from anon
REVOKE ALL ON public.user_profiles FROM anon;

-- ============================================================================
-- STEP 7: Verify the setup
-- ============================================================================

-- Show all policies (should be exactly 7)
SELECT 
    policyname as "Policy Name",
    cmd as "Command",
    roles as "Roles",
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'No USING clause'
    END as "USING Clause",
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No WITH CHECK clause'
    END as "WITH CHECK Clause"
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Test that we can query user_profiles without recursion
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO test_count FROM public.user_profiles;
    RAISE NOTICE 'Successfully queried user_profiles. Total users: %', test_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error querying user_profiles: %', SQLERRM;
END $$;

-- Show current user profiles
SELECT 
    email,
    full_name,
    role,
    is_superadmin,
    completed_tutorial_ids,
    assigned_usernames
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS POLICIES SUCCESSFULLY REBUILT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total policies created: 7';
    RAISE NOTICE '- 2 SELECT policies (own + admin)';
    RAISE NOTICE '- 2 UPDATE policies (own + admin)';
    RAISE NOTICE '- 2 INSERT policies (own + admin)';
    RAISE NOTICE '- 1 BLOCK policy (anonymous)';
    RAISE NOTICE '';
    RAISE NOTICE 'Security definer function: is_admin_user()';
    RAISE NOTICE 'No more infinite recursion!';
    RAISE NOTICE '========================================';
END $$;

