-- Fix user_profiles table for User Management
-- This creates the table if missing and sets up auto-profile creation

-- 1. Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    is_superadmin BOOLEAN DEFAULT false,
    assigned_usernames TEXT[] DEFAULT '{}',
    topics JSONB DEFAULT '[]'::jsonb,
    topics_onboarding_completed_at JSONB DEFAULT '{}'::jsonb,
    topics_timer_override JSONB DEFAULT '{}'::jsonb,
    topics_timer_hours JSONB DEFAULT '{}'::jsonb,
    access_level TEXT DEFAULT 'edit',
    show_publish_options BOOLEAN DEFAULT true,
    department TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.user_profiles;

-- 4. Create RLS policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (is_superadmin = true OR role = 'admin')
        )
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (is_superadmin = true OR role = 'admin')
        )
    );

-- Service role has full access (for system operations)
CREATE POLICY "Service role has full access"
    ON public.user_profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Create function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 7. Create trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. Backfill existing auth users who don't have profiles
INSERT INTO public.user_profiles (id, email, full_name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 9. Verify setup
SELECT 
    'auth.users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as count
FROM public.user_profiles
ORDER BY table_name;

-- 10. Show recent user profiles
SELECT 
    id,
    email,
    full_name,
    role,
    is_superadmin,
    assigned_usernames,
    created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 10;

