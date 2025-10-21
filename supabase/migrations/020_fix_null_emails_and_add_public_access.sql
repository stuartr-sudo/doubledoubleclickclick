-- Fix null emails and add anon role access
-- This is critical for login to work

-- Step 1: Fix profile with null email
UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id 
AND up.email IS NULL 
AND au.email IS NOT NULL;

-- Step 2: Add SELECT policy for anon role (needed for signup flow)
DROP POLICY IF EXISTS "Enable read access for anon" ON public.user_profiles;
CREATE POLICY "Enable read access for anon"
    ON public.user_profiles
    FOR SELECT
    TO anon
    USING (false); -- Anon can't read profiles, but policy must exist

-- Step 3: Grant necessary permissions to anon role (for auth flow)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.user_profiles TO anon;

-- Step 4: Ensure authenticated role has all permissions
GRANT ALL ON public.user_profiles TO authenticated;

-- Step 5: Add logging to help debug (temporary)
COMMENT ON TABLE public.user_profiles IS 'User profiles. RLS enabled. Users can read/update own profile. Admins can manage all.';

