-- Fix infinite recursion in RLS policies
-- The admin check policies were recursively querying user_profiles, causing 500 errors

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for anon" ON public.user_profiles;

-- Create simple, non-recursive policies
-- Users can always read their own profile (no admin check)
CREATE POLICY "Users can read own profile"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for auto-creation)
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Block anonymous access
CREATE POLICY "Block anon access"
    ON public.user_profiles
    FOR ALL
    TO anon
    USING (false);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- Note: Admins will need to use service role or a SECURITY DEFINER function
-- to view all profiles without triggering infinite recursion

