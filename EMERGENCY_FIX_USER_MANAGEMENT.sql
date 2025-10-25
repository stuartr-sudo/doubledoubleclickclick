-- EMERGENCY FIX: User Management page showing no users
-- Issue: Superadmins can't see the user list

-- The problem: RLS policies are blocking even superadmins from listing users
-- Quick fix: Ensure the security definer function is correct and policies allow superadmin access

-- 1. Verify and fix the is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_superadmin BOOLEAN;
BEGIN
    -- Query with SECURITY DEFINER to bypass RLS
    SELECT 
        COALESCE(role, ''), 
        COALESCE(is_superadmin, false)
    INTO user_role, user_superadmin
    FROM public.user_profiles
    WHERE id = user_id;
    
    -- Return true if any admin condition is met
    IF user_role IN ('admin', 'superadmin') OR user_superadmin = true THEN
        RETURN true;
    END IF;
    
    RETURN false;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN false;
    WHEN OTHERS THEN
        RAISE WARNING 'Error in is_admin_user: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;

-- 3. Test the function with your user ID
DO $$
DECLARE
    test_user_id UUID := '2c7c7bb6-da79-46ae-9004-d18b7fcd7607'; -- Your stuartr@doubleclick.work ID
    is_admin BOOLEAN;
BEGIN
    is_admin := public.is_admin_user(test_user_id);
    RAISE NOTICE 'Test user is_admin: %', is_admin;
    
    IF is_admin THEN
        RAISE NOTICE '✓ Function working correctly';
    ELSE
        RAISE NOTICE '✗ Function NOT working - user should be admin';
    END IF;
END $$;

-- 4. Verify all users can be queried
SELECT 
    id,
    email,
    full_name,
    role,
    is_superadmin,
    CASE 
        WHEN role IN ('admin', 'superadmin') OR is_superadmin = true 
        THEN '✓ Admin'
        ELSE '○ User'
    END as admin_status
FROM public.user_profiles
ORDER BY created_at DESC;

-- 5. Show current RLS policies
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies
WHERE tablename = 'user_profiles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- 6. If policies are still blocking, temporarily disable RLS for testing
-- UNCOMMENT ONLY IF NEEDED FOR EMERGENCY ACCESS:
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
-- RAISE NOTICE 'RLS DISABLED - Remember to re-enable after fixing!';

-- 7. Show a test query that User.list() would execute
SELECT COUNT(*) as total_users FROM public.user_profiles;

-- 8. Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'EMERGENCY FIX APPLIED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'If you still cannot see users:';
    RAISE NOTICE '1. Check browser console for errors';
    RAISE NOTICE '2. Verify you are logged in as superadmin';
    RAISE NOTICE '3. Try logging out and back in';
    RAISE NOTICE '4. Check if RLS needs to be temporarily disabled';
    RAISE NOTICE '========================================';
END $$;

