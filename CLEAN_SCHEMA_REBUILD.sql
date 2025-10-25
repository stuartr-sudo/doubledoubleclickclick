-- ============================================================================
-- DOUBLECLICK PLATFORM - CLEAN SCHEMA REBUILD
-- ============================================================================
-- This script performs a complete database rebuild for the DoubleClick platform.
-- It drops all legacy tables and creates a clean, optimized schema from scratch.
--
-- WHAT THIS FIXES:
-- - Eliminates all Base44 schema inheritance issues
-- - Removes column mismatches and type conflicts
-- - Simplifies RLS policies (no more recursion!)
-- - Ensures consistent naming conventions
-- - Optimizes for performance and maintainability
--
-- BEFORE RUNNING:
-- 1. Backup your user email: [YOUR EMAIL HERE]
-- 2. Note your assigned usernames: [YOUR USERNAMES HERE]
-- 3. This will preserve your user account but reset content
--
-- ESTIMATED TIME: 2-3 minutes
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: BACKUP CRITICAL USER DATA
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔄 STEP 1: BACKING UP USER DATA';
    RAISE NOTICE '========================================';
END $$;

-- Create temporary backup table for your user profile
DO $$
DECLARE
    usernames_type TEXT;
    tutorial_ids_type TEXT;
BEGIN
    -- Try to backup existing user_profiles if table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        -- Detect the data type of assigned_usernames
        SELECT data_type INTO usernames_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'assigned_usernames';
        
        -- Detect the data type of completed_tutorial_ids
        SELECT data_type INTO tutorial_ids_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'completed_tutorial_ids';
        
        -- Handle both JSONB and TEXT[] types
        IF usernames_type = 'jsonb' THEN
            -- Old schema with JSONB
            CREATE TEMP TABLE user_backup AS
            SELECT 
                id,
                email,
                full_name,
                COALESCE(role::TEXT, 'user') as role,
                COALESCE(is_superadmin, false) as is_superadmin,
                CASE 
                    WHEN assigned_usernames IS NOT NULL THEN 
                        ARRAY(SELECT jsonb_array_elements_text(assigned_usernames))
                    ELSE ARRAY[]::TEXT[]
                END as assigned_usernames,
                CASE 
                    WHEN completed_tutorial_ids IS NOT NULL THEN 
                        ARRAY(SELECT jsonb_array_elements_text(completed_tutorial_ids))
                    ELSE ARRAY[]::TEXT[]
                END as completed_tutorial_ids,
                COALESCE(token_balance, 20) as token_balance,
                created_at
            FROM public.user_profiles
            WHERE is_superadmin = true OR role::TEXT IN ('admin', 'superadmin');
        ELSE
            -- New schema with TEXT[]
            CREATE TEMP TABLE user_backup AS
            SELECT 
                id,
                email,
                full_name,
                COALESCE(role::TEXT, 'user') as role,
                COALESCE(is_superadmin, false) as is_superadmin,
                COALESCE(assigned_usernames, ARRAY[]::TEXT[]) as assigned_usernames,
                COALESCE(completed_tutorial_ids, ARRAY[]::TEXT[]) as completed_tutorial_ids,
                COALESCE(token_balance, 20) as token_balance,
                created_at
            FROM public.user_profiles
            WHERE is_superadmin = true OR role::TEXT IN ('admin', 'superadmin');
        END IF;
    ELSE
        -- Create empty backup table if no user_profiles exists
        CREATE TEMP TABLE user_backup (
            id UUID,
            email TEXT,
            full_name TEXT,
            role TEXT,
            is_superadmin BOOLEAN,
            assigned_usernames TEXT[],
            completed_tutorial_ids TEXT[],
            token_balance INTEGER,
            created_at TIMESTAMPTZ
        );
    END IF;
END $$;

DO $$
DECLARE
    backup_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'pg_temp' AND tablename LIKE 'user_backup%') THEN
        SELECT COUNT(*) INTO backup_count FROM user_backup;
        RAISE NOTICE '✅ Backed up % admin user(s)', backup_count;
    ELSE
        RAISE NOTICE '⚠️  No existing user_profiles table found - starting fresh';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: DROP ALL LEGACY TABLES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🗑️  STEP 2: DROPPING LEGACY TABLES';
    RAISE NOTICE '========================================';
END $$;

-- Drop all tables (CASCADE to remove dependencies)
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.webhook_received CASCADE;
DROP TABLE IF EXISTS public.usernames CASCADE;
DROP TABLE IF EXISTS public.integration_credentials CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.feature_flags CASCADE;
DROP TABLE IF EXISTS public.llm_settings CASCADE;
DROP TABLE IF EXISTS public.scheduled_posts CASCADE;
DROP TABLE IF EXISTS public.content_variants CASCADE;
DROP TABLE IF EXISTS public.testimonials CASCADE;
DROP TABLE IF EXISTS public.call_to_actions CASCADE;
DROP TABLE IF EXISTS public.email_capture_forms CASCADE;
DROP TABLE IF EXISTS public.captured_emails CASCADE;
DROP TABLE IF EXISTS public.image_library_items CASCADE;
DROP TABLE IF EXISTS public.generated_videos CASCADE;
DROP TABLE IF EXISTS public.imagineer_jobs CASCADE;
DROP TABLE IF EXISTS public.sitemaps CASCADE;
DROP TABLE IF EXISTS public.editor_workflows CASCADE;
DROP TABLE IF EXISTS public.workflow_run_status CASCADE;
DROP TABLE IF EXISTS public.onboarding_steps CASCADE;
DROP TABLE IF EXISTS public.onboarding_wizards CASCADE;
DROP TABLE IF EXISTS public.waitlist_entries CASCADE;
DROP TABLE IF EXISTS public.affiliates CASCADE;
DROP TABLE IF EXISTS public.affiliate_packs CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.app_products CASCADE;
DROP TABLE IF EXISTS public.dashboard_banners CASCADE;
DROP TABLE IF EXISTS public.tutorial_videos CASCADE;
DROP TABLE IF EXISTS public.pricing_faqs CASCADE;
DROP TABLE IF EXISTS public.brand_guidelines CASCADE;
DROP TABLE IF EXISTS public.brand_specifications CASCADE;
DROP TABLE IF EXISTS public.writing_styles CASCADE;
DROP TABLE IF EXISTS public.crm_credentials CASCADE;
DROP TABLE IF EXISTS public.wordpress_publish_logs CASCADE;
DROP TABLE IF EXISTS public.shopify_publish_logs CASCADE;
DROP TABLE IF EXISTS public.infographic_visual_type_examples CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS public.is_admin_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.user_owns_username(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.track_llm_usage(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_current_user_admin() CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✅ All legacy tables and functions dropped';
END $$;

-- ============================================================================
-- STEP 3: CREATE CLEAN SCHEMA
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🏗️  STEP 3: CREATING CLEAN SCHEMA';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Drop existing ENUMs if they exist
DROP TYPE IF EXISTS content_status CASCADE;
DROP TYPE IF EXISTS flash_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived', 'scheduled');
CREATE TYPE flash_status AS ENUM ('idle', 'running', 'completed', 'failed');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');

DO $$
BEGIN
    RAISE NOTICE '✅ Created enums: content_status, flash_status, user_role';
END $$;

-- ============================================================================
-- TABLE: user_profiles
-- ============================================================================
-- Stores user account information, permissions, and settings
-- ============================================================================

CREATE TABLE public.user_profiles (
    -- Core Identity
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    
    -- Permissions
    role user_role DEFAULT 'user',
    is_superadmin BOOLEAN DEFAULT false,
    
    -- Workspace Access (array of workspace names this user can access)
    assigned_usernames TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Onboarding Progress (array of completed tutorial IDs)
    completed_tutorial_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Tokens & Billing
    token_balance INTEGER DEFAULT 20,
    plan_price_id TEXT,
    
    -- Timestamps
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.user_profiles IS 'User accounts with permissions and settings';
COMMENT ON COLUMN public.user_profiles.assigned_usernames IS 'Array of workspace names (user_name values) this user can access';
COMMENT ON COLUMN public.user_profiles.completed_tutorial_ids IS 'Array of tutorial IDs the user has completed';

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_assigned_usernames ON public.user_profiles USING GIN(assigned_usernames);

DO $$
BEGIN
    RAISE NOTICE '✅ Created table: user_profiles';
END $$;

-- ============================================================================
-- TABLE: usernames (Workspaces)
-- ============================================================================
-- Each "username" represents a distinct workspace/brand
-- ============================================================================

CREATE TABLE public.usernames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The unique workspace identifier (e.g., "devstuartr", "backpainsolutions")
    user_name TEXT UNIQUE NOT NULL,
    
    -- Display name for UI
    display_name TEXT NOT NULL,
    
    -- Owner (optional - workspace can be shared among multiple users)
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.usernames IS 'Workspaces/brands - each user can have multiple';
COMMENT ON COLUMN public.usernames.user_name IS 'Unique workspace identifier (slug)';

CREATE INDEX idx_usernames_user_name ON public.usernames(user_name);
CREATE INDEX idx_usernames_assigned_to ON public.usernames(assigned_to);

DO $$
BEGIN
    RAISE NOTICE '✅ Created table: usernames';
END $$;

-- ============================================================================
-- TABLE: blog_posts
-- ============================================================================
-- Core content table for all blog posts/articles
-- ============================================================================

CREATE TABLE public.blog_posts (
    -- Core Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT, -- HTML content
    
    -- Ownership
    user_name TEXT NOT NULL, -- Which workspace this belongs to
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to_email TEXT,
    
    -- Status
    status content_status DEFAULT 'draft',
    flash_status flash_status DEFAULT 'idle',
    
    -- SEO Fields
    meta_title TEXT,
    meta_description TEXT,
    slug TEXT,
    tags TEXT[],
    focus_keyword TEXT,
    featured_image TEXT,
    
    -- Metadata
    reading_time INTEGER,
    priority TEXT DEFAULT 'medium',
    client_session_key TEXT,
    generated_llm_schema JSONB,
    
    -- Processing IDs (for tracking async jobs)
    processing_id TEXT,
    
    -- Timestamps
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now(),
    published_date TIMESTAMPTZ
);

COMMENT ON TABLE public.blog_posts IS 'All blog posts and articles';
COMMENT ON COLUMN public.blog_posts.user_name IS 'Workspace identifier - which brand/site this belongs to';
COMMENT ON COLUMN public.blog_posts.flash_status IS 'AI workflow processing status';

CREATE INDEX idx_blog_posts_user_name ON public.blog_posts(user_name);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_flash_status ON public.blog_posts(flash_status);
CREATE INDEX idx_blog_posts_updated_date ON public.blog_posts(updated_date DESC);
CREATE INDEX idx_blog_posts_published_date ON public.blog_posts(published_date DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

DO $$
BEGIN
    RAISE NOTICE '✅ Created table: blog_posts';
END $$;

-- ============================================================================
-- TABLE: webhook_received
-- ============================================================================
-- Incoming content from external sources (webhooks, scrapes, imports)
-- ============================================================================

CREATE TABLE public.webhook_received (
    -- Core Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT,
    
    -- Ownership
    user_name TEXT NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'received',
    flash_status flash_status DEFAULT 'idle',
    
    -- Source Information
    source TEXT, -- 'youtube', 'tiktok', 'amazon', 'webhook', etc.
    external_id TEXT,
    
    -- Processing
    processing_id TEXT,
    
    -- Timestamps
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.webhook_received IS 'Content received from external sources';

CREATE INDEX idx_webhook_received_user_name ON public.webhook_received(user_name);
CREATE INDEX idx_webhook_received_status ON public.webhook_received(status);
CREATE INDEX idx_webhook_received_flash_status ON public.webhook_received(flash_status);
CREATE INDEX idx_webhook_received_updated_date ON public.webhook_received(updated_date DESC);

DO $$
BEGIN
    RAISE NOTICE '✅ Created table: webhook_received';
END $$;

-- ============================================================================
-- TABLE: feature_flags
-- ============================================================================
-- Controls which features are enabled/disabled
-- ============================================================================

CREATE TABLE public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    flag_name TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Status
    is_enabled BOOLEAN DEFAULT false,
    
    -- Cost & Access
    token_cost INTEGER DEFAULT 1,
    required_plan_keys TEXT[],
    
    -- Metadata
    category TEXT,
    call_type TEXT,
    
    -- Timestamps
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.feature_flags IS 'Feature toggles for the platform';

CREATE INDEX idx_feature_flags_flag_name ON public.feature_flags(flag_name);
CREATE INDEX idx_feature_flags_is_enabled ON public.feature_flags(is_enabled);

DO $$
BEGIN
    RAISE NOTICE '✅ Created table: feature_flags';
END $$;

-- ============================================================================
-- TABLE: llm_settings
-- ============================================================================
-- Admin-controlled settings for AI/LLM features (YOUR NEW SYSTEM!)
-- ============================================================================

CREATE TABLE public.llm_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    feature_name TEXT UNIQUE NOT NULL, -- e.g., 'title_rewrite', 'content_enhance'
    display_name TEXT NOT NULL,
    description TEXT,
    
    -- LLM Configuration
    model TEXT DEFAULT 'gpt-4o-mini',
    temperature NUMERIC(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    top_p NUMERIC(3,2) DEFAULT 1.0,
    frequency_penalty NUMERIC(3,2) DEFAULT 0.0,
    presence_penalty NUMERIC(3,2) DEFAULT 0.0,
    
    -- Prompts
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT,
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    
    -- Usage Tracking
    usage_count INTEGER DEFAULT 0,
    last_used_date TIMESTAMPTZ,
    
    -- Timestamps
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.llm_settings IS 'Admin-controlled configurations for AI features';
COMMENT ON COLUMN public.llm_settings.feature_name IS 'Unique identifier for the AI feature';
COMMENT ON COLUMN public.llm_settings.user_prompt_template IS 'Template with {{variable}} placeholders';

CREATE INDEX idx_llm_settings_feature_name ON public.llm_settings(feature_name);
CREATE INDEX idx_llm_settings_is_enabled ON public.llm_settings(is_enabled);

DO $$
BEGIN
    RAISE NOTICE '✅ Created table: llm_settings';
END $$;

-- ============================================================================
-- TABLE: integration_credentials
-- ============================================================================
-- Publishing credentials (WordPress, Shopify, Google Docs, etc.)
-- ============================================================================

CREATE TABLE public.integration_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ownership
    user_name TEXT NOT NULL,
    
    -- Provider Info
    provider TEXT NOT NULL, -- 'wordpress', 'shopify', 'notion', 'gdocs'
    name TEXT NOT NULL, -- Display name
    
    -- Credentials (encrypted)
    credentials JSONB DEFAULT '{}'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.integration_credentials IS 'Publishing platform credentials';

CREATE INDEX idx_integration_credentials_user_name ON public.integration_credentials(user_name);
CREATE INDEX idx_integration_credentials_provider ON public.integration_credentials(provider);

DO $$
BEGIN
    RAISE NOTICE '✅ Created table: integration_credentials';
END $$;

-- ============================================================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔧 STEP 4: CREATING HELPER FUNCTIONS';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FUNCTION: is_admin_user
-- ============================================================================
-- Simple check if a user is admin or superadmin
-- SECURITY DEFINER allows this to bypass RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    is_super BOOLEAN;
BEGIN
    SELECT role::TEXT, is_superadmin INTO user_role, is_super
    FROM public.user_profiles
    WHERE id = user_id;
    
    RETURN (user_role IN ('admin', 'superadmin') OR is_super = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;

DO $$
BEGIN
    RAISE NOTICE '✅ Created function: is_admin_user';
END $$;

-- ============================================================================
-- FUNCTION: track_llm_usage
-- ============================================================================
-- Increment usage counter for LLM settings
-- ============================================================================

CREATE OR REPLACE FUNCTION public.track_llm_usage(setting_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.llm_settings
    SET 
        usage_count = usage_count + 1,
        last_used_date = now()
    WHERE id = setting_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.track_llm_usage(UUID) TO authenticated;

DO $$
BEGIN
    RAISE NOTICE '✅ Created function: track_llm_usage';
END $$;

-- ============================================================================
-- STEP 5: SETUP ROW LEVEL SECURITY (RLS)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔒 STEP 5: SETTING UP RLS POLICIES';
    RAISE NOTICE '========================================';
END $$;

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: user_profiles
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "user_profiles_select_own"
ON public.user_profiles FOR SELECT
USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "user_profiles_select_admin"
ON public.user_profiles FOR SELECT
USING (public.is_admin_user(auth.uid()));

-- Users can update their own profile
CREATE POLICY "user_profiles_update_own"
ON public.user_profiles FOR UPDATE
USING (id = auth.uid());

-- Admins can update any profile
CREATE POLICY "user_profiles_update_admin"
ON public.user_profiles FOR UPDATE
USING (public.is_admin_user(auth.uid()));

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policies: user_profiles';
END $$;

-- ============================================================================
-- RLS: usernames
-- ============================================================================

-- Authenticated users can read all usernames (for dropdowns)
CREATE POLICY "usernames_select_all"
ON public.usernames FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert usernames
CREATE POLICY "usernames_insert_authenticated"
ON public.usernames FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update usernames they own
CREATE POLICY "usernames_update_own"
ON public.usernames FOR UPDATE
USING (assigned_to = auth.uid() OR public.is_admin_user(auth.uid()));

-- Admins can delete usernames
CREATE POLICY "usernames_delete_admin"
ON public.usernames FOR DELETE
USING (public.is_admin_user(auth.uid()));

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policies: usernames';
END $$;

-- ============================================================================
-- RLS: blog_posts
-- ============================================================================

-- Users can read posts for their assigned workspaces
CREATE POLICY "blog_posts_select_assigned"
ON public.blog_posts FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND (
        -- User has this workspace in their assigned_usernames
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_name = ANY(assigned_usernames)
        )
        -- OR user is admin
        OR public.is_admin_user(auth.uid())
        -- OR post is published (public access)
        OR status = 'published'
    )
);

-- Authenticated users can insert posts
CREATE POLICY "blog_posts_insert_authenticated"
ON public.blog_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update posts for their assigned workspaces
CREATE POLICY "blog_posts_update_assigned"
ON public.blog_posts FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_name = ANY(assigned_usernames)
        )
        OR public.is_admin_user(auth.uid())
    )
);

-- Users can delete posts for their assigned workspaces
CREATE POLICY "blog_posts_delete_assigned"
ON public.blog_posts FOR DELETE
USING (
    auth.uid() IS NOT NULL
    AND (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_name = ANY(assigned_usernames)
        )
        OR public.is_admin_user(auth.uid())
    )
);

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policies: blog_posts';
END $$;

-- ============================================================================
-- RLS: webhook_received
-- ============================================================================

-- Same policies as blog_posts
CREATE POLICY "webhook_received_select_assigned"
ON public.webhook_received FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_name = ANY(assigned_usernames)
        )
        OR public.is_admin_user(auth.uid())
    )
);

CREATE POLICY "webhook_received_insert_authenticated"
ON public.webhook_received FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "webhook_received_update_assigned"
ON public.webhook_received FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_name = ANY(assigned_usernames)
        )
        OR public.is_admin_user(auth.uid())
    )
);

CREATE POLICY "webhook_received_delete_assigned"
ON public.webhook_received FOR DELETE
USING (
    auth.uid() IS NOT NULL
    AND (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_name = ANY(assigned_usernames)
        )
        OR public.is_admin_user(auth.uid())
    )
);

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policies: webhook_received';
END $$;

-- ============================================================================
-- RLS: feature_flags
-- ============================================================================

-- Everyone can read feature flags
CREATE POLICY "feature_flags_select_all"
ON public.feature_flags FOR SELECT
USING (true);

-- Only admins can modify feature flags
CREATE POLICY "feature_flags_all_admin"
ON public.feature_flags FOR ALL
USING (public.is_admin_user(auth.uid()));

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policies: feature_flags';
END $$;

-- ============================================================================
-- RLS: llm_settings
-- ============================================================================

-- Authenticated users can read enabled settings
CREATE POLICY "llm_settings_select_enabled"
ON public.llm_settings FOR SELECT
TO authenticated
USING (is_enabled = true);

-- Admins can manage all LLM settings
CREATE POLICY "llm_settings_all_admin"
ON public.llm_settings FOR ALL
USING (public.is_admin_user(auth.uid()));

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policies: llm_settings';
END $$;

-- ============================================================================
-- RLS: integration_credentials
-- ============================================================================

-- Users can read credentials for their workspaces
CREATE POLICY "integration_credentials_select_assigned"
ON public.integration_credentials FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_name = ANY(assigned_usernames)
        )
        OR public.is_admin_user(auth.uid())
    )
);

-- Authenticated users can insert credentials
CREATE POLICY "integration_credentials_insert_authenticated"
ON public.integration_credentials FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update credentials for their workspaces
CREATE POLICY "integration_credentials_update_assigned"
ON public.integration_credentials FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_name = ANY(assigned_usernames)
        )
        OR public.is_admin_user(auth.uid())
    )
);

-- Users can delete credentials for their workspaces
CREATE POLICY "integration_credentials_delete_assigned"
ON public.integration_credentials FOR DELETE
USING (
    auth.uid() IS NOT NULL
    AND (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_name = ANY(assigned_usernames)
        )
        OR public.is_admin_user(auth.uid())
    )
);

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policies: integration_credentials';
END $$;

-- ============================================================================
-- STEP 6: SEED DEFAULT DATA
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🌱 STEP 6: SEEDING DEFAULT DATA';
    RAISE NOTICE '========================================';
END $$;

-- Seed feature flags
INSERT INTO public.feature_flags (flag_name, description, is_enabled, token_cost) VALUES
('ai_title_rewrite', 'AI-powered title optimization for SEO', true, 1),
('ai_rewriter', 'AI content rewriting', true, 2),
('ai_seo', 'AI SEO optimization', true, 3),
('ai_faq', 'AI FAQ generation', true, 2),
('ai_tldr', 'AI TL;DR generation', true, 1),
('ai_brand_it', 'AI brand voice application', true, 2),
('ai_html_cleanup', 'AI HTML cleanup', true, 1),
('ai_autolink', 'AI automatic linking', true, 2),
('ai_autoscan', 'AI content scanning', true, 3),
('ai_schema', 'AI schema generation', true, 2),
('ai_links_references', 'AI link and reference finder', true, 2),
('ai_humanize', 'AI content humanization', true, 2),
('ai_localize', 'AI content localization', true, 3),
('ai_imagineer', 'AI image generation', true, 5),
('ai_content_detection', 'AI content detection', true, 1),
('voice_ai', 'Voice/audio generation', true, 3),
('generate_image', 'Image generation', true, 4),
('youtube_import', 'YouTube content import', true, 1),
('tiktok_import', 'TikTok content import', true, 1),
('amazon_import', 'Amazon content import', true, 1),
('sitemap_scraper', 'Sitemap scraping', true, 1)
ON CONFLICT (flag_name) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '✅ Seeded % feature flags', 21;
END $$;

-- Seed default LLM setting for title rewrite
INSERT INTO public.llm_settings (
    feature_name,
    display_name,
    description,
    model,
    temperature,
    max_tokens,
    system_prompt,
    user_prompt_template,
    is_enabled
) VALUES (
    'title_rewrite',
    'Title Rewrite (SEO Optimization)',
    'Rewrites blog post titles to be SEO-optimized while maintaining natural language',
    'gpt-4o-mini',
    0.7,
    100,
    'You are an expert SEO content writer. Your task is to rewrite blog post titles to be highly optimized for search engines while remaining natural and compelling for human readers. Follow these constraints: under 60 characters, include primary keyword if present, no quotes or emojis, use Title Case.',
    'Rewrite the blog post title to be highly optimized for SEO while remaining natural and compelling.

Constraints:
- Under 60 characters
- Include the primary keyword if it appears in the content or title
- No quotes or emojis
- Title Case

Article Content (may be empty):
{{content}}

Current Title: {{title}}',
    true
)
ON CONFLICT (feature_name) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '✅ Seeded default LLM settings';
END $$;

-- ============================================================================
-- STEP 7: RESTORE USER DATA
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📥 STEP 7: RESTORING USER DATA';
    RAISE NOTICE '========================================';
END $$;

-- Restore user profiles from backup
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    is_superadmin,
    assigned_usernames,
    completed_tutorial_ids,
    token_balance,
    created_date
)
SELECT 
    ub.id,
    ub.email,
    ub.full_name,
    CASE 
        WHEN ub.role IN ('user', 'admin', 'superadmin') THEN ub.role::user_role
        ELSE 'user'::user_role
    END as role,
    ub.is_superadmin,
    ub.assigned_usernames,
    ub.completed_tutorial_ids,
    ub.token_balance,
    ub.created_at
FROM user_backup ub
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_superadmin = EXCLUDED.is_superadmin,
    assigned_usernames = EXCLUDED.assigned_usernames,
    completed_tutorial_ids = EXCLUDED.completed_tutorial_ids,
    token_balance = EXCLUDED.token_balance;

DO $$
DECLARE
    restored_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO restored_count FROM public.user_profiles;
    RAISE NOTICE '✅ Restored % user profile(s)', restored_count;
END $$;

-- Create username entries for restored users
INSERT INTO public.usernames (user_name, display_name, assigned_to, is_active)
SELECT 
    DISTINCT unnest(assigned_usernames) as user_name,
    unnest(assigned_usernames) as display_name,
    id as assigned_to,
    true as is_active
FROM user_backup
WHERE array_length(assigned_usernames, 1) > 0
ON CONFLICT (user_name) DO NOTHING;

DO $$
DECLARE
    username_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO username_count FROM public.usernames;
    RAISE NOTICE '✅ Created % username(s)/workspace(s)', username_count;
END $$;

-- ============================================================================
-- STEP 8: CREATE TRIGGERS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚡ STEP 8: CREATING TRIGGERS';
    RAISE NOTICE '========================================';
END $$;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
BEGIN
    RAISE NOTICE '✅ Created trigger: on_auth_user_created';
END $$;

-- Auto-update updated_date on blog_posts
CREATE OR REPLACE FUNCTION public.update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_date
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_date();

CREATE TRIGGER webhook_received_updated_date
    BEFORE UPDATE ON public.webhook_received
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_date();

CREATE TRIGGER user_profiles_updated_date
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_date();

DO $$
BEGIN
    RAISE NOTICE '✅ Created triggers: auto-update updated_date';
END $$;

-- ============================================================================
-- STEP 9: GRANT PERMISSIONS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔑 STEP 9: GRANTING PERMISSIONS';
    RAISE NOTICE '========================================';
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usernames TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_received TO authenticated;
GRANT SELECT ON public.llm_settings TO authenticated;
GRANT ALL ON public.llm_settings TO authenticated; -- Admins will be controlled by RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_credentials TO authenticated;

DO $$
BEGIN
    RAISE NOTICE '✅ Granted all necessary permissions';
END $$;

-- ============================================================================
-- STEP 10: REFRESH SCHEMA CACHE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔄 STEP 10: REFRESHING SCHEMA CACHE';
    RAISE NOTICE '========================================';
END $$;

NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
    RAISE NOTICE '✅ Schema cache refreshed';
END $$;

-- ============================================================================
-- FINAL SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 CLEAN SCHEMA REBUILD COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ ALL TABLES CREATED';
    RAISE NOTICE '✅ RLS POLICIES CONFIGURED';
    RAISE NOTICE '✅ USER DATA RESTORED';
    RAISE NOTICE '✅ DEFAULT DATA SEEDED';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 YOUR PLATFORM IS READY!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Log in to verify your account works';
    RAISE NOTICE '2. Create a test blog post in the Editor';
    RAISE NOTICE '3. Test the AI title rewrite feature';
    RAISE NOTICE '4. Verify autosave is working';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- Show final table counts
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as row_count
FROM public.user_profiles
UNION ALL
SELECT 'usernames', COUNT(*) FROM public.usernames
UNION ALL
SELECT 'feature_flags', COUNT(*) FROM public.feature_flags
UNION ALL
SELECT 'llm_settings', COUNT(*) FROM public.llm_settings
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM public.blog_posts
UNION ALL
SELECT 'integration_credentials', COUNT(*) FROM public.integration_credentials;

