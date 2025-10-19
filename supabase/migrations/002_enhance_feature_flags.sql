-- Add missing columns to existing feature_flags table
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS token_cost numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_coming_soon boolean DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS required_plan_keys jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS user_overrides jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS youtube_tutorial_url text,
ADD COLUMN IF NOT EXISTS loom_tutorial_url text;

-- Update user_profiles to add missing columns
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email text UNIQUE,
ADD COLUMN IF NOT EXISTS assigned_usernames jsonb DEFAULT '[]'::jsonb;

-- Update email from auth.users if missing
UPDATE public.user_profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE user_profiles.id = auth.users.id AND user_profiles.email IS NULL;

-- Seed feature flags using EXISTING column names
DO $$
BEGIN
    -- Insert using flag_name and is_enabled (the existing columns)
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_rewriter', true, 2) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_seo', true, 3) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_faq', true, 2) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_tldr', true, 1) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_brand_it', true, 2) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_html_cleanup', true, 1) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_autolink', true, 2) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_autoscan', true, 3) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_schema', true, 2) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_links_references', true, 2) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_humanize', true, 2) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_localize', true, 3) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_imagineer', true, 5) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('ai_content_detection', true, 1) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('voice_ai', true, 3) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('generate_image', true, 4) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('youtube_import', true, 1) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('tiktok_import', true, 1) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('amazon_import', true, 1) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) VALUES ('sitemap_scraper', true, 1) ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;
END $$;

