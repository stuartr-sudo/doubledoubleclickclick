-- FIX LOGIN LOOP: Completely rebuild RLS policies for user_profiles
-- This migration addresses the root cause: user cannot read their own profile after authentication

-- Step 1: Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_profiles';
    END LOOP;
END $$;

-- Step 2: Create simple, working policies

-- Policy 1: Users can ALWAYS read their own profile (this is critical for auth)
CREATE POLICY "Users can read own profile"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can read ALL profiles
CREATE POLICY "Admins can read all profiles"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.user_profiles admin_check 
            WHERE admin_check.id = auth.uid() 
            AND (
                admin_check.role = 'admin' 
                OR admin_check.role = 'superadmin' 
                OR admin_check.is_superadmin = TRUE
            )
        )
    );

-- Policy 5: Admins can update ALL profiles
CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.user_profiles admin_check 
            WHERE admin_check.id = auth.uid() 
            AND (
                admin_check.role = 'admin' 
                OR admin_check.role = 'superadmin' 
                OR admin_check.is_superadmin = TRUE
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.user_profiles admin_check 
            WHERE admin_check.id = auth.uid() 
            AND (
                admin_check.role = 'admin' 
                OR admin_check.role = 'superadmin' 
                OR admin_check.is_superadmin = TRUE
            )
        )
    );

-- Policy 6: Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
    ON public.user_profiles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.user_profiles admin_check 
            WHERE admin_check.id = auth.uid() 
            AND (
                admin_check.role = 'admin' 
                OR admin_check.role = 'superadmin' 
                OR admin_check.is_superadmin = TRUE
            )
        )
    );

-- Step 3: Ensure authenticated role has proper grants
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT DELETE ON public.user_profiles TO authenticated;

-- Step 4: Verify RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Add comment for documentation
COMMENT ON TABLE public.user_profiles IS 'User profiles with RLS policies. Users can always read/update their own profile. Admins can manage all profiles.';

