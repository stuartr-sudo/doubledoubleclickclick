-- ============================================
-- BASE SCHEMA - Run this FIRST before other migrations
-- Creates all core tables for the blog
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HOMEPAGE CONTENT TABLE
-- Stores all homepage CMS content
-- ============================================
CREATE TABLE IF NOT EXISTS public.homepage_content (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Logo
    logo_image text,
    logo_text text DEFAULT 'My Blog',
    
    -- Hero Section
    hero_title text,
    hero_description text,
    hero_image text,
    hero_cta_text text DEFAULT 'Get Started',
    hero_cta_link text DEFAULT '#contact'
);

-- Insert default row if none exists
INSERT INTO public.homepage_content (id, logo_text, hero_title, hero_description)
SELECT uuid_generate_v4(), 'My Blog', 'Welcome to My Blog', 'Your blog description here'
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_content);

-- ============================================
-- SITE POSTS TABLE (Blog Posts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.site_posts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id text UNIQUE,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    excerpt text,
    featured_image text,
    category text,
    tags jsonb DEFAULT '[]'::jsonb,
    author text,
    status text DEFAULT 'draft',
    meta_title text,
    meta_description text,
    focus_keyword text,
    generated_llm_schema text,
    export_seo_as_tags boolean DEFAULT false,
    is_popular boolean DEFAULT false,
    user_name text DEFAULT 'default',
    created_date timestamptz DEFAULT now(),
    updated_date timestamptz DEFAULT now(),
    published_date timestamptz
);

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_posts_slug ON public.site_posts(slug);

-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    source text,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- LEAD CAPTURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_captures (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text,
    email text NOT NULL,
    company text,
    website text,
    message text,
    plan_type text,
    source text,
    topic text,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- CTA CONVERSIONS TABLE (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cta_conversions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cta_type text,
    page_url text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- AUTHORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.authors (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    bio text,
    avatar_url text,
    linkedin_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- LANDING PAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.landing_pages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- BLOG POSTS TABLE (Legacy compatibility)
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id text,
    title text,
    slug text,
    content text,
    excerpt text,
    featured_image text,
    category text,
    tags jsonb DEFAULT '[]'::jsonb,
    author text,
    status text DEFAULT 'draft',
    meta_title text,
    meta_description text,
    focus_keyword text,
    user_name text,
    created_date timestamptz DEFAULT now(),
    updated_date timestamptz DEFAULT now(),
    published_date timestamptz
);

-- ============================================
-- APPLY TO WORK WITH US TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.apply_to_work_with_us (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name text NOT NULL,
    contact_name text NOT NULL,
    email_address text NOT NULL,
    website_url text,
    company_description text,
    current_challenges text,
    goals text,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- ADMIN USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    username text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'admin',
    created_at timestamptz DEFAULT now(),
    last_login timestamptz
);

-- ============================================
-- ADMIN SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id uuid REFERENCES public.admin_users(id) ON DELETE CASCADE,
    session_token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create default admin user (password: admin123)
INSERT INTO public.admin_users (username, password_hash, role)
VALUES ('admin', '$2a$10$GHIG/8HLGppQ9CVXrSBSqu/Q/ftbF2Zf7FoMxJIE4MZERCibj55HW', 'admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cta_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apply_to_work_with_us ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first to avoid conflicts
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Homepage content: public read, service role write
CREATE POLICY "Public can read homepage" ON public.homepage_content
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage homepage" ON public.homepage_content
    FOR ALL USING (auth.role() = 'service_role');

-- Site posts: public read published, service role write
CREATE POLICY "Public can read published posts" ON public.site_posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Service role can manage posts" ON public.site_posts
    FOR ALL USING (auth.role() = 'service_role');

-- Newsletter: insert only for public
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can read subscribers" ON public.newsletter_subscribers
    FOR SELECT USING (auth.role() = 'service_role');

-- Lead captures: insert only for public
CREATE POLICY "Anyone can submit lead" ON public.lead_captures
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can read leads" ON public.lead_captures
    FOR SELECT USING (auth.role() = 'service_role');

-- CTA conversions: insert only for public
CREATE POLICY "Anyone can track conversion" ON public.cta_conversions
    FOR INSERT WITH CHECK (true);

-- Authors: public read
CREATE POLICY "Public can read authors" ON public.authors
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage authors" ON public.authors
    FOR ALL USING (auth.role() = 'service_role');

-- Landing pages: public read active
CREATE POLICY "Public can read active landing pages" ON public.landing_pages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage landing pages" ON public.landing_pages
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Base schema created successfully!';
END $$;
