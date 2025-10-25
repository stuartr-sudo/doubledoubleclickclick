-- Fix infinite recursion in user_profiles RLS policies
-- Error: "infinite recursion detected in policy for relation user_profiles"

-- The problem: Admin policies query user_profiles to check if someone is an admin,
-- which triggers the policy again, causing infinite recursion.

-- Solution: Use a security definer function to bypass RLS when checking admin status

-- 1. Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.user_profiles;

-- 2. Create a security definer function to check if user is admin
-- This function runs with elevated privileges and doesn't trigger RLS
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_is_superadmin BOOLEAN;
BEGIN
    SELECT role, is_superadmin INTO user_role, user_is_superadmin
    FROM public.user_profiles
    WHERE id = user_id;
    
    RETURN (user_role IN ('admin', 'superadmin') OR user_is_superadmin = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Create simple, non-recursive RLS policies

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Allow users to insert their own profile (for auto-creation)
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles (using security definer function)
CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles
    FOR SELECT
    USING (public.is_admin_user(auth.uid()));

-- Allow admins to update all profiles (using security definer function)
CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles
    FOR UPDATE
    USING (public.is_admin_user(auth.uid()));

-- Allow admins to insert profiles (using security definer function)
CREATE POLICY "Admins can insert profiles"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (public.is_admin_user(auth.uid()));

-- 4. Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user TO authenticated;

-- 6. Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 7. Test query (should not cause recursion)
SELECT 
    id,
    email,
    full_name,
    role,
    is_superadmin,
    completed_tutorial_ids
FROM public.user_profiles
WHERE id = auth.uid()
LIMIT 1;

-- SUCCESS! RLS policies no longer cause infinite recursion
-- Users can access their own profile
-- Admins can access all profiles
-- The security definer function breaks the recursion cycle

