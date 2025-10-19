-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    is_superadmin BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user',
    assigned_usernames JSONB DEFAULT '[]'::jsonb,
    token_balance NUMERIC DEFAULT 20,
    plan_price_id TEXT,
    completed_tutorial_ids JSONB DEFAULT '[]'::jsonb,
    topics JSONB DEFAULT '[]'::jsonb,
    topics_onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    enabled_globally BOOLEAN DEFAULT TRUE,
    is_coming_soon BOOLEAN DEFAULT FALSE,
    token_cost NUMERIC DEFAULT 1,
    required_plan_keys JSONB DEFAULT '[]'::jsonb,
    user_overrides JSONB DEFAULT '{}'::jsonb,
    youtube_tutorial_url TEXT,
    loom_tutorial_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON public.feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Seed initial feature flags
INSERT INTO public.feature_flags (name, token_cost, enabled_globally) 
SELECT name, token_cost, enabled_globally FROM (VALUES
    ('ai_rewriter', 2, true),
    ('ai_seo', 3, true),
    ('ai_faq', 2, true),
    ('ai_tldr', 1, true),
    ('ai_brand_it', 2, true),
    ('ai_html_cleanup', 1, true),
    ('ai_autolink', 2, true),
    ('ai_autoscan', 3, true),
    ('ai_schema', 2, true),
    ('ai_links_references', 2, true),
    ('ai_humanize', 2, true),
    ('ai_localize', 3, true),
    ('ai_imagineer', 5, true),
    ('ai_content_detection', 1, true),
    ('voice_ai', 3, true),
    ('generate_image', 4, true),
    ('youtube_import', 1, true),
    ('tiktok_import', 1, true),
    ('amazon_import', 1, true),
    ('sitemap_scraper', 1, true)
) AS t(name, token_cost, enabled_globally)
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE feature_flags.name = t.name);

-- Enable RLS (but allow all for now - we'll tighten later)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all authenticated users to read feature flags
CREATE POLICY "Anyone can read feature flags"
    ON public.feature_flags FOR SELECT
    USING (true);

-- Policies: Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Policies: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Grant access
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;

