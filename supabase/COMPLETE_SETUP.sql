-- ============================================
-- COMPLETE DATABASE SETUP
-- Run this SINGLE file to set up a new blog
-- ============================================
-- Generated for easy cloning - just copy/paste this entire file into Supabase SQL Editor

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================
DO $$
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Drop storage policies if they exist
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================
-- STEP 2: CREATE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 3: CREATE ALL TABLES
-- ============================================

-- Homepage Content
CREATE TABLE IF NOT EXISTS public.homepage_content (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    logo_image text,
    logo_text text DEFAULT 'My Blog',
    hero_title text,
    hero_description text,
    hero_image text,
    hero_cta_text text DEFAULT 'Get Started',
    hero_cta_link text DEFAULT '#contact'
);

-- Site Posts (Main blog posts table)
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_posts_slug ON public.site_posts(slug);

-- Blog Posts (Legacy compatibility)
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

-- Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    source text,
    created_at timestamptz DEFAULT now()
);

-- Lead Captures
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

-- CTA Conversions
CREATE TABLE IF NOT EXISTS public.cta_conversions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cta_type text,
    page_url text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- Authors
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

-- Landing Pages
CREATE TABLE IF NOT EXISTS public.landing_pages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Apply to Work With Us
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

-- Admin Users
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    username text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'admin',
    created_at timestamptz DEFAULT now(),
    last_login timestamptz
);

-- Admin Sessions
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id uuid REFERENCES public.admin_users(id) ON DELETE CASCADE,
    session_token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON public.admin_sessions(expires_at);

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cta_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apply_to_work_with_us ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE POLICIES
-- ============================================

-- Homepage: public read
CREATE POLICY "Public can read homepage" ON public.homepage_content FOR SELECT USING (true);
CREATE POLICY "Service role can manage homepage" ON public.homepage_content FOR ALL USING (auth.role() = 'service_role');

-- Site posts: public read published
CREATE POLICY "Public can read published posts" ON public.site_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Service role can manage posts" ON public.site_posts FOR ALL USING (auth.role() = 'service_role');

-- Blog posts: public read published
CREATE POLICY "Public can read published blog posts" ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Service role can manage blog posts" ON public.blog_posts FOR ALL USING (auth.role() = 'service_role');

-- Newsletter: public insert
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can read subscribers" ON public.newsletter_subscribers FOR SELECT USING (auth.role() = 'service_role');

-- Lead captures: public insert
CREATE POLICY "Anyone can submit lead" ON public.lead_captures FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can read leads" ON public.lead_captures FOR SELECT USING (auth.role() = 'service_role');

-- CTA conversions: public insert
CREATE POLICY "Anyone can track conversion" ON public.cta_conversions FOR INSERT WITH CHECK (true);

-- Authors: public read
CREATE POLICY "Public can read authors" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Service role can manage authors" ON public.authors FOR ALL USING (auth.role() = 'service_role');

-- Landing pages: public read active
CREATE POLICY "Public can read active landing pages" ON public.landing_pages FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage landing pages" ON public.landing_pages FOR ALL USING (auth.role() = 'service_role');

-- Apply to work with us: public insert
CREATE POLICY "Anyone can apply" ON public.apply_to_work_with_us FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can read applications" ON public.apply_to_work_with_us FOR SELECT USING (auth.role() = 'service_role');

-- Admin users/sessions: no public access
CREATE POLICY "No public access to admin users" ON public.admin_users FOR ALL USING (false);
CREATE POLICY "No public access to admin sessions" ON public.admin_sessions FOR ALL USING (false);

-- ============================================
-- STEP 6: ADD ALL EXTRA COLUMNS (from migrations)
-- ============================================

-- Homepage content extra columns
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS hero_footer_cta_text text DEFAULT 'Get Started';
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS hero_footer_cta_link text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS about_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS about_description text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS services_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS services jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS faq_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS faq_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS why_work_with_us_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS why_work_with_us_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS hero_primary_color text DEFAULT '#000000';
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS hero_accent_color text DEFAULT '#0066ff';
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS quiz_enabled boolean DEFAULT true;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS quiz_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS quiz_subtitle text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS quiz_steps text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS quiz_button_text text DEFAULT 'Start Quiz';
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS how_it_works_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS how_it_works_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS tech_carousel_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS tech_carousel_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS quiz_cta_border_color text DEFAULT '#e5e5e5';
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS programs jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS pricing_tiers jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS contact_urls jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS newsletter_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS newsletter_subtitle text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS cta_section_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS cta_section_subtitle text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS cta_section_button_text text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS cta_section_button_link text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS blog_grid_title text DEFAULT 'Latest Articles';
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS blog_section_visible boolean DEFAULT true;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS proof_results_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS proof_results_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS quiz_form_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS quiz_form_fields jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS hero_background_image text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS not_seo_image text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS connected_signals_image text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS problem_statement_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS problem_statement_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS solution_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS solution_items jsonb DEFAULT '[]'::jsonb;

-- Insert default homepage row if none exists
INSERT INTO public.homepage_content (id, logo_text, hero_title, hero_description)
SELECT uuid_generate_v4(), 'My Blog', 'Welcome', 'Your description here'
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_content);

-- ============================================
-- STEP 7: CREATE DEFAULT ADMIN USER
-- ============================================
-- Default credentials: admin / admin123
-- CHANGE THIS PASSWORD after first login!

INSERT INTO public.admin_users (username, password_hash, role)
VALUES ('admin', '$2a$10$GHIG/8HLGppQ9CVXrSBSqu/Q/ftbF2Zf7FoMxJIE4MZERCibj55HW', 'admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- STEP 8: CREATE STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Users can update images" ON storage.objects;
CREATE POLICY "Users can update images" ON storage.objects FOR UPDATE USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Users can delete images" ON storage.objects;
CREATE POLICY "Users can delete images" ON storage.objects FOR DELETE USING (bucket_id = 'images');

-- ============================================
-- DONE!
-- ============================================
SELECT 'Database setup complete! Default admin: admin / admin123' as status;
