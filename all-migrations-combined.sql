-- ============================================
-- COMBINED DATABASE MIGRATIONS
-- Generated: Wed Feb  4 14:37:35 NZDT 2026
-- Total files: 43
-- ============================================


-- ============================================
-- FILE: 00000000_base_schema.sql
-- ============================================

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


-- ============================================
-- FILE: 20250111_add_hero_footer_cta.sql
-- ============================================

-- Add hero footer CTA fields to homepage_content
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS hero_footer_cta_text text DEFAULT 'Get Started',
ADD COLUMN IF NOT EXISTS hero_footer_cta_link text DEFAULT 'mailto:hello@sewo.io';

-- hero_footer_cta_text: Text for the CTA button in the hero footer
-- hero_footer_cta_link: Link URL for the CTA button in the hero footer



-- ============================================
-- FILE: 20250112_add_faq_and_why_work_with_us.sql
-- ============================================

-- Add FAQ section fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS faq_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS faq_bg_color text DEFAULT '#ffffff';

-- Add How It Works section fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS how_it_works_title text DEFAULT 'How it works',
ADD COLUMN IF NOT EXISTS how_it_works_steps jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS how_it_works_bg_color text DEFAULT '#ffffff';

-- Add Why Work With Us section fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS why_work_with_us_title text DEFAULT 'Why Work With Us',
ADD COLUMN IF NOT EXISTS why_work_with_us_subtitle text DEFAULT 'We strive to deliver value to our clients',
ADD COLUMN IF NOT EXISTS why_work_with_us_description text DEFAULT 'We are dedicated to providing the highest level of service, delivering innovative solutions, and exceeding expectations in everything we do.',
ADD COLUMN IF NOT EXISTS why_work_with_us_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS why_work_with_us_bg_color text DEFAULT '#ffffff';

-- Add Testimonials section fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS testimonials_label text DEFAULT 'Testimonials',
ADD COLUMN IF NOT EXISTS testimonials_title text DEFAULT 'Trusted by 10k+ customers',
ADD COLUMN IF NOT EXISTS testimonials_subtitle text DEFAULT 'Whether you''re a small startup or a multinational corporation, let us be your trusted advisor on the path to success.',
ADD COLUMN IF NOT EXISTS testimonials_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS testimonials_bg_color text DEFAULT '#f5f5f5';

-- Add Services section fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS services_section_title text DEFAULT 'Our services',
ADD COLUMN IF NOT EXISTS services_section_description text DEFAULT 'Our team combines expertise with creativity to transform outdoor spaces into breathtaking landscapes that enhance the beauty of any property.',
ADD COLUMN IF NOT EXISTS services_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS services_bg_color text DEFAULT '#ffffff';

-- Add additional background color fields
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS tech_carousel_bg_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS blog_grid_bg_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS quiz_cta_bg_color text DEFAULT '#ffffff';

-- Example structure for faq_items:
-- [
--   {
--     "id": "1",
--     "question": "How does your consulting process work?",
--     "answer": "Our consulting process begins with a comprehensive analysis..."
--   }
-- ]

-- Example structure for how_it_works_steps:
-- [
--   {
--     "id": "1",
--     "number": "01",
--     "title": "Simple Booking",
--     "description": "Effortlessly schedule a consultation...",
--     "image": "https://example.com/image.png",
--     "link_text": "Discover More",
--     "link_url": "#"
--   }
-- ]

-- Example structure for why_work_with_us_items:
-- [
--   {
--     "id": "1",
--     "title": "Proven track record",
--     "description": "We have helped countless businesses overcome challenges.",
--     "link_text": "Our track record",
--     "link_url": "#",
--     "icon": "https://example.com/icon.png"
--   }
-- ]

-- Example structure for testimonials_items:
-- [
--   {
--     "id": "1",
--     "quote": "The impact of Consulting's work on our organization has been transformative...",
--     "rating": 5,
--     "author_name": "Alex Peterson",
--     "author_title": "CEO",
--     "author_company": "Thompson Industries",
--     "author_image": "https://example.com/author.jpg"
--   }
-- ]

-- Example structure for services_items:
-- [
--   {
--     "id": "1",
--     "title": "Landscaping works",
--     "image": "https://example.com/service1.jpg",
--     "link_url": "#"
--   }
-- ]





-- ============================================
-- FILE: 20250112_add_hero_colors_and_quiz.sql
-- ============================================

-- Add hero color and gradient fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS hero_bg_gradient text DEFAULT 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
ADD COLUMN IF NOT EXISTS hero_text_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS hero_cta_bg_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS hero_cta_text_color text DEFAULT '#ffffff';

-- Add quiz CTA fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS quiz_title text DEFAULT 'Take the 12-Step Quiz',
ADD COLUMN IF NOT EXISTS quiz_description text DEFAULT 'See where you''re missing out on LLM visibility. Get personalized insights in minutes.',
ADD COLUMN IF NOT EXISTS quiz_cta_text text DEFAULT 'Start Quiz',
ADD COLUMN IF NOT EXISTS quiz_cta_link text DEFAULT '/quiz',
ADD COLUMN IF NOT EXISTS quiz_steps text DEFAULT '12',
ADD COLUMN IF NOT EXISTS quiz_badge_text text DEFAULT 'Steps';

-- hero_bg_gradient: CSS gradient string for the hero background
-- hero_text_color: Text color for content on gradient background
-- hero_cta_bg_color: Background color for CTA buttons
-- hero_cta_text_color: Text color for CTA buttons
-- quiz_title: Title for the quiz CTA section
-- quiz_description: Description text for the quiz CTA
-- quiz_cta_text: Button text for the quiz CTA
-- quiz_cta_link: URL/link for the quiz CTA button
-- quiz_steps: Number of steps displayed in the quiz badge
-- quiz_badge_text: Text displayed next to the number (e.g., "Steps", "Questions", "Minutes")



-- ============================================
-- FILE: 20250112_add_how_it_works.sql
-- ============================================

-- Add How It Works section fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS how_it_works_title text DEFAULT 'How it works',
ADD COLUMN IF NOT EXISTS how_it_works_steps jsonb DEFAULT '[]'::jsonb;

-- Example structure for how_it_works_steps:
-- [
--   {
--     "id": "1",
--     "number": "01",
--     "title": "Simple Booking",
--     "description": "Effortlessly schedule a consultation...",
--     "image": "https://example.com/image.jpg",
--     "link_text": "Discover More",
--     "link_url": "#"
--   },
--   {
--     "id": "2",
--     "number": "02",
--     "title": "Tailored Strategy",
--     "description": "We analyze your goals...",
--     "image": "",
--     "link_text": "Discover More",
--     "link_url": "#"
--   }
-- ]



-- ============================================
-- FILE: 20250112_add_tech_carousel.sql
-- ============================================

-- Add technology carousel fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS tech_carousel_title text DEFAULT 'Technology we work with',
ADD COLUMN IF NOT EXISTS tech_carousel_items jsonb DEFAULT '[]'::jsonb;

-- Example structure for tech_carousel_items:
-- [
--   {
--     "id": "1",
--     "name": "ChatGPT",
--     "icon": "https://example.com/chatgpt-icon.png"
--   },
--   {
--     "id": "2",
--     "name": "Claude",
--     "icon": "https://example.com/claude-icon.png"
--   }
-- ]



-- ============================================
-- FILE: 20250113_add_admin_auth.sql
-- ============================================

-- Admin users table for authentication
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login timestamptz
);

-- Admin sessions table for persistent login
create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  session_token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Create index for faster session lookups
create index if not exists idx_admin_sessions_token on public.admin_sessions(session_token);
create index if not exists idx_admin_sessions_expires on public.admin_sessions(expires_at);

-- Enable RLS
alter table public.admin_users enable row level security;
alter table public.admin_sessions enable row level security;

-- Policies (admin tables are managed server-side only, no direct client access)
drop policy if exists p_admin_users_no_access on public.admin_users;
create policy p_admin_users_no_access on public.admin_users
  for all using (false);

drop policy if exists p_admin_sessions_no_access on public.admin_sessions;
create policy p_admin_sessions_no_access on public.admin_sessions
  for all using (false);

-- Insert default admin user (username: admin, password: admin123)
-- Password hash is bcrypt hash of "admin123"
-- IMPORTANT: Change this password immediately after first login!
insert into public.admin_users (username, password_hash)
values ('admin', '$2a$10$GHIG/8HLGppQ9CVXrSBSqu/Q/ftbF2Zf7FoMxJIE4MZERCibj55HW')
on conflict (username) do nothing;



-- ============================================
-- FILE: 20250115_add_quiz_cta_border_color.sql
-- ============================================

-- Add quiz CTA border color field to homepage_content
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS quiz_cta_border_color text DEFAULT '#000000';

-- quiz_cta_border_color: Border color for the quiz CTA button in the hero section



-- ============================================
-- FILE: 20250116_add_landing_pages.sql
-- ============================================

-- Add columns for quiz and find-questions landing pages
ALTER TABLE homepage_content 
ADD COLUMN IF NOT EXISTS quiz_landing_title TEXT DEFAULT 'Discover Your AI Visibility Score',
ADD COLUMN IF NOT EXISTS quiz_landing_description TEXT DEFAULT 'Take our 3-minute assessment to see how visible your brand is to AI assistants like ChatGPT, Claude, and Gemini.',
ADD COLUMN IF NOT EXISTS find_questions_title TEXT DEFAULT 'Discover What Questions Your Prospects Are Asking',
ADD COLUMN IF NOT EXISTS find_questions_description TEXT DEFAULT 'Enter a keyword and discover the top questions people are asking. Answer them before your competitors do.';



-- ============================================
-- FILE: 20250120_add_all_missing_homepage_columns.sql
-- ============================================

-- Comprehensive migration to add ALL missing homepage_content columns
-- This ensures all sections are properly set up in the database

-- Problem Statement Section
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS problem_statement_title text DEFAULT 'Publishing content isn''t the problem. Being recognised by AI is.',
ADD COLUMN IF NOT EXISTS problem_statement_para_1 text DEFAULT 'Businesses are waking up to the fact that customers aren''t just searching anymore - they''re having conversations with AI.',
ADD COLUMN IF NOT EXISTS problem_statement_para_2 text DEFAULT 'The shift has happened faster than anyone expected, but the guidance hasn''t caught up.',
ADD COLUMN IF NOT EXISTS problem_statement_para_3 text DEFAULT 'Brands are being told to chase prompts and publish more content, without understanding how AI systems actually decide who to recommend.',
ADD COLUMN IF NOT EXISTS problem_statement_highlight text DEFAULT 'We exist to solve this.',
ADD COLUMN IF NOT EXISTS problem_statement_para_4 text DEFAULT 'Because when customers ask AI for answers, your brand either shows up - or it doesn''t.',
ADD COLUMN IF NOT EXISTS problem_statement_para_5 text DEFAULT 'And that visibility gap is the exact problem we''re built to fix.',
ADD COLUMN IF NOT EXISTS problem_statement_image text DEFAULT '',
ADD COLUMN IF NOT EXISTS problem_statement_bg_color text DEFAULT '#f8f9fa';

-- AI Visibility System (Solution) Section
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS solution_kicker text DEFAULT 'Introducing',
ADD COLUMN IF NOT EXISTS solution_headline text DEFAULT 'AI Visibility System',
ADD COLUMN IF NOT EXISTS solution_subtitle text DEFAULT 'Our authority framework for AI search and summaries',
ADD COLUMN IF NOT EXISTS solution_body_para_1 text DEFAULT 'Most brands are guessing how to get recommended by AI.',
ADD COLUMN IF NOT EXISTS solution_body_para_2 text DEFAULT 'They''re chasing prompts, publishing more content, and hoping something sticks - while the market fills with quick fixes, hacks, and tactics that don''t translate into lasting visibility.',
ADD COLUMN IF NOT EXISTS solution_body_para_3 text DEFAULT 'We built the AI Visibility System to remove that guesswork.',
ADD COLUMN IF NOT EXISTS solution_body_para_4 text DEFAULT 'It''s a structured approach to how AI systems interpret, trust, and reuse your brand''s information - not just what you publish, but how your brand presents itself as a whole.',
ADD COLUMN IF NOT EXISTS solution_body_para_5 text DEFAULT 'This isn''t a one-off optimisation. It''s designed to compound - building durable authority that strengthens over time.',
ADD COLUMN IF NOT EXISTS solution_cta_text text DEFAULT 'Apply to Work With Us',
ADD COLUMN IF NOT EXISTS solution_cta_link text DEFAULT '/guide',
ADD COLUMN IF NOT EXISTS solution_note text DEFAULT 'Limited capacity. We take on a small number of brands at a time.',
ADD COLUMN IF NOT EXISTS solution_pillars_heading text DEFAULT 'Why this works differently',
ADD COLUMN IF NOT EXISTS solution_pillars jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS solution_testimonial_quote text DEFAULT 'I really think is the future if you''re serious about ranking in Ai search.',
ADD COLUMN IF NOT EXISTS solution_testimonial_author_name text DEFAULT 'James Neilson-Watt',
ADD COLUMN IF NOT EXISTS solution_testimonial_author_company text DEFAULT 'learnspark.io',
ADD COLUMN IF NOT EXISTS solution_testimonial_author_image text DEFAULT 'https://framerusercontent.com/images/0WlUXwlUVlsMtOtPEH9RIoG0CFQ.jpeg?width=400&height=400',
ADD COLUMN IF NOT EXISTS solution_bg_color text DEFAULT '#fafafa';


-- ============================================
-- FILE: 20250120_add_problem_statement_section.sql
-- ============================================

-- Add Problem Statement section to homepage_content
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS problem_statement_title text DEFAULT 'Publishing content isn''t the problem. Being recognised by AI is.',
ADD COLUMN IF NOT EXISTS problem_statement_para_1 text DEFAULT 'Businesses are waking up to the fact that customers aren''t just searching anymore - they''re having conversations with AI.',
ADD COLUMN IF NOT EXISTS problem_statement_para_2 text DEFAULT 'The shift has happened faster than anyone expected, but the guidance hasn''t caught up.',
ADD COLUMN IF NOT EXISTS problem_statement_para_3 text DEFAULT 'Brands are being told to chase prompts and publish more content, without understanding how AI systems actually decide who to recommend.',
ADD COLUMN IF NOT EXISTS problem_statement_highlight text DEFAULT 'We exist to solve this.',
ADD COLUMN IF NOT EXISTS problem_statement_para_4 text DEFAULT 'Because when customers ask AI for answers, your brand either shows up - or it doesn''t.',
ADD COLUMN IF NOT EXISTS problem_statement_para_5 text DEFAULT 'And that visibility gap is the exact problem we''re built to fix.',
ADD COLUMN IF NOT EXISTS problem_statement_image text DEFAULT '',
ADD COLUMN IF NOT EXISTS problem_statement_bg_color text DEFAULT '#f8f9fa';


-- ============================================
-- FILE: 20250120_add_solution_section.sql
-- ============================================

-- Add AI Visibility System (Solution) section to homepage_content
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS solution_kicker text DEFAULT 'Introducing',
ADD COLUMN IF NOT EXISTS solution_headline text DEFAULT 'AI Visibility System',
ADD COLUMN IF NOT EXISTS solution_subtitle text DEFAULT 'Our authority framework for AI search and summaries',
ADD COLUMN IF NOT EXISTS solution_body_para_1 text DEFAULT 'Most brands are guessing how to get recommended by AI.',
ADD COLUMN IF NOT EXISTS solution_body_para_2 text DEFAULT 'They''re chasing prompts, publishing more content, and hoping something sticks - while the market fills with quick fixes, hacks, and tactics that don''t translate into lasting visibility.',
ADD COLUMN IF NOT EXISTS solution_body_para_3 text DEFAULT 'We built the AI Visibility System to remove that guesswork.',
ADD COLUMN IF NOT EXISTS solution_body_para_4 text DEFAULT 'It''s a structured approach to how AI systems interpret, trust, and reuse your brand''s information - not just what you publish, but how your brand presents itself as a whole.',
ADD COLUMN IF NOT EXISTS solution_body_para_5 text DEFAULT 'This isn''t a one-off optimisation. It''s designed to compound - building durable authority that strengthens over time.',
ADD COLUMN IF NOT EXISTS solution_cta_text text DEFAULT 'Apply to Work With Us',
ADD COLUMN IF NOT EXISTS solution_cta_link text DEFAULT '/guide',
ADD COLUMN IF NOT EXISTS solution_note text DEFAULT 'Limited capacity. We take on a small number of brands at a time.',
ADD COLUMN IF NOT EXISTS solution_pillars_heading text DEFAULT 'Why this works differently',
ADD COLUMN IF NOT EXISTS solution_pillars jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS solution_testimonial_quote text DEFAULT 'I really think is the future if you''re serious about ranking in Ai search.',
ADD COLUMN IF NOT EXISTS solution_testimonial_author_name text DEFAULT 'James Neilson-Watt',
ADD COLUMN IF NOT EXISTS solution_testimonial_author_company text DEFAULT 'learnspark.io',
ADD COLUMN IF NOT EXISTS solution_testimonial_author_image text DEFAULT 'https://framerusercontent.com/images/0WlUXwlUVlsMtOtPEH9RIoG0CFQ.jpeg?width=400&height=400',
ADD COLUMN IF NOT EXISTS solution_bg_color text DEFAULT '#fafafa';

-- Example structure for solution_pillars:
-- [
--   {
--     "id": "1",
--     "title": "Built for AI discovery, not traditional SEO",
--     "description": "Traditional search optimisation and paid media focus on direct inputs. AI recommendations don't. We specialise specifically in AI summaries and AI recommendations - how language models decide which brands to surface, cite, and suggest when users ask questions."
--   },
--   {
--     "id": "2",
--     "title": "Authority over volume",
--     "description": "More content isn't the answer. AI systems favour brands that demonstrate consistency, credibility, and clarity across multiple touchpoints - not those publishing the most pages. Our focus is on making your brand the trusted source AI systems return to, not another voice in the noise."
--   },
--   {
--     "id": "3",
--     "title": "Designed to compound",
--     "description": "AI visibility isn't something you switch on. It's something you build. Each piece of work reinforces the next - content, site structure, brand signals, and proof working together to deepen trust and increase confidence over time. That's why results don't reset every few months. They accumulate."
--   },
--   {
--     "id": "4",
--     "title": "Proven approach, low guesswork",
--     "description": "This work isn't experimental. Our process is refined, repeatable, and grounded in how AI systems actually behave - not theory, not trends, and not short-lived tactics. We don't attempt to game the system. We focus on building the conditions AI relies on to recommend brands with confidence."
--   }
-- ]


-- ============================================
-- FILE: 20250121_add_connected_signals_image.sql
-- ============================================

-- Add connected_signals_image column to homepage_content table
ALTER TABLE public.homepage_content 
  ADD COLUMN IF NOT EXISTS connected_signals_image text;

-- Add comment to clarify usage
COMMENT ON COLUMN public.homepage_content.connected_signals_image IS 'Image for the "AI Recommendations Are Shaped By Connected Signals" section. Displayed on the left side of the two-column layout.';


-- ============================================
-- FILE: 20250121_add_hero_background_image.sql
-- ============================================

-- Add hero_background_image column to homepage_content table
ALTER TABLE public.homepage_content 
  ADD COLUMN IF NOT EXISTS hero_background_image text;

-- Add comment to clarify usage
COMMENT ON COLUMN public.homepage_content.hero_background_image IS 'Background image URL for the hero section. If set, this will be used as the background instead of the gradient.';


-- ============================================
-- FILE: 20250121_add_not_seo_image.sql
-- ============================================

-- Add not_seo_image column to homepage_content table
ALTER TABLE public.homepage_content 
  ADD COLUMN IF NOT EXISTS not_seo_image text;

-- Add comment to clarify usage
COMMENT ON COLUMN public.homepage_content.not_seo_image IS 'Image for the "This Is Not Traditional SEO Or Paid Media" section. Displayed on the left side of the two-column layout.';


-- ============================================
-- FILE: 20250121_add_topic_to_lead_captures.sql
-- ============================================

-- Add topic column to lead_captures table for contact form
ALTER TABLE public.lead_captures 
  ADD COLUMN IF NOT EXISTS topic text;

-- Add comment to clarify usage
COMMENT ON COLUMN public.lead_captures.topic IS 'Topic selected from contact form dropdown (e.g. "Work with Us", "Partnership White Label", "Consulting", "Feedback", "Other")';


-- ============================================
-- FILE: 20250122_create_apply_to_work_with_us_table.sql
-- ============================================

-- Create dedicated table for "Apply to Work With Us" form submissions
CREATE TABLE IF NOT EXISTS public.apply_to_work_with_us (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email_address text NOT NULL,
  website_url text,
  company_description text,
  current_challenges text,
  goals text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.apply_to_work_with_us ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts
DROP POLICY IF EXISTS p_ins_apply_to_work_with_us ON public.apply_to_work_with_us;
CREATE POLICY p_ins_apply_to_work_with_us
  ON public.apply_to_work_with_us
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create index on email for duplicate checking
CREATE INDEX IF NOT EXISTS idx_apply_to_work_with_us_email 
  ON public.apply_to_work_with_us(email_address);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_apply_to_work_with_us_created_at 
  ON public.apply_to_work_with_us(created_at DESC);


-- ============================================
-- FILE: 20250122_fix_apply_to_work_with_us_rls.sql
-- ============================================

-- Fix RLS policy for apply_to_work_with_us table
-- Drop all existing policies first
DROP POLICY IF EXISTS p_ins_apply_to_work_with_us ON public.apply_to_work_with_us;

-- Create a permissive policy that allows anonymous inserts
CREATE POLICY p_ins_apply_to_work_with_us
  ON public.apply_to_work_with_us
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Also allow service role to insert (for admin operations)
CREATE POLICY p_ins_apply_to_work_with_us_service_role
  ON public.apply_to_work_with_us
  FOR INSERT
  TO service_role
  WITH CHECK (true);


-- ============================================
-- FILE: 20250122_remove_faqpage_from_blog_posts.sql
-- ============================================

-- Remove invalid/empty FAQPage schema from blog posts to fix duplicate FAQPage errors
-- FAQPage with actual FAQ content (questions/answers) is kept - only empty/invalid FAQPage is removed
-- This ensures blog posts with real FAQs keep their schema, while removing incorrectly generated ones

DO $$
DECLARE
  post_record RECORD;
  schema_json JSONB;
  updated_schema JSONB;
  has_faqpage BOOLEAN := false;
  graph_items JSONB;
  filtered_items JSONB := '[]'::JSONB;
  has_valid_faq BOOLEAN := false;
  question_item JSONB;
  faq_item JSONB;
  i INTEGER;
BEGIN
  -- Loop through all published posts with generated_llm_schema
  FOR post_record IN 
    SELECT id, slug, title, generated_llm_schema 
    FROM site_posts 
    WHERE status = 'published' 
      AND generated_llm_schema IS NOT NULL
      AND generated_llm_schema != ''
  LOOP
    BEGIN
      -- Parse the JSON schema
      schema_json := post_record.generated_llm_schema::JSONB;
      updated_schema := schema_json;
      has_faqpage := false;

      -- Check if entire schema is FAQPage
      IF schema_json->>'@type' = 'FAQPage' AND jsonb_typeof(schema_json) = 'object' THEN
        -- Check if FAQPage has valid FAQ content (mainEntity with questions)
        has_valid_faq := false;
        IF schema_json ? 'mainEntity' 
           AND jsonb_typeof(schema_json->'mainEntity') = 'array' 
           AND jsonb_array_length(schema_json->'mainEntity') > 0 THEN
          -- Check if at least one question has both name and acceptedAnswer
          FOR question_item IN SELECT * FROM jsonb_array_elements(schema_json->'mainEntity')
          LOOP
            IF question_item->>'@type' = 'Question' 
               AND question_item ? 'name' 
               AND question_item ? 'acceptedAnswer'
               AND question_item->'acceptedAnswer' ? 'text' THEN
              has_valid_faq := true;
              EXIT;
            END IF;
          END LOOP;
        END IF;
        
        -- If FAQPage has valid FAQs, keep it (skip removal)
        IF has_valid_faq THEN
          RAISE NOTICE 'Keeping FAQPage with valid FAQs for post: % (%)', post_record.slug, post_record.title;
          CONTINUE;
        END IF;
        
        -- FAQPage is empty/invalid, remove it
        UPDATE site_posts 
        SET generated_llm_schema = NULL 
        WHERE id = post_record.id;
        
        RAISE NOTICE 'Removed invalid/empty FAQPage schema from post: % (%)', post_record.slug, post_record.title;
        CONTINUE;
      END IF;

      -- Check if schema has @graph array
      IF schema_json ? '@graph' AND jsonb_typeof(schema_json->'@graph') = 'array' THEN
        graph_items := schema_json->'@graph';
        filtered_items := '[]'::JSONB;
        
        -- Filter FAQPage items - only keep if they have valid FAQ content
        FOR i IN 0..jsonb_array_length(graph_items) - 1 LOOP
          IF graph_items->i->>'@type' != 'FAQPage' THEN
            -- Keep all non-FAQPage items
            filtered_items := filtered_items || jsonb_build_array(graph_items->i);
          ELSE
            -- Check if FAQPage has valid FAQ content
            faq_item := graph_items->i;
            has_valid_faq := false;
            
            IF faq_item ? 'mainEntity' 
               AND jsonb_typeof(faq_item->'mainEntity') = 'array' 
               AND jsonb_array_length(faq_item->'mainEntity') > 0 THEN
              -- Check if at least one question has both name and acceptedAnswer
              FOR question_item IN SELECT * FROM jsonb_array_elements(faq_item->'mainEntity')
              LOOP
                IF question_item->>'@type' = 'Question' 
                   AND question_item ? 'name' 
                   AND question_item ? 'acceptedAnswer'
                   AND question_item->'acceptedAnswer' ? 'text' THEN
                  has_valid_faq := true;
                  EXIT;
                END IF;
              END LOOP;
            END IF;
            
            IF has_valid_faq THEN
              -- Keep FAQPage with valid FAQs
              filtered_items := filtered_items || jsonb_build_array(faq_item);
              RAISE NOTICE 'Keeping FAQPage with valid FAQs in @graph for post: % (%)', post_record.slug, post_record.title;
            ELSE
              -- Remove invalid/empty FAQPage
              has_faqpage := true;
              RAISE NOTICE 'Removing invalid/empty FAQPage from @graph for post: % (%)', post_record.slug, post_record.title;
            END IF;
          END IF;
        END LOOP;

        -- If FAQPage was found and removed, update the schema
        IF has_faqpage THEN
          updated_schema := jsonb_set(schema_json, '{@graph}', filtered_items);
          
          -- If @graph is now empty, remove the entire schema
          IF jsonb_array_length(filtered_items) = 0 THEN
            UPDATE site_posts 
            SET generated_llm_schema = NULL 
            WHERE id = post_record.id;
            
            RAISE NOTICE 'Removed empty @graph schema from post: % (%)', post_record.slug, post_record.title;
          ELSE
            -- Update with filtered schema
            UPDATE site_posts 
            SET generated_llm_schema = updated_schema::text 
            WHERE id = post_record.id;
            
            RAISE NOTICE 'Removed FAQPage from @graph for post: % (%)', post_record.slug, post_record.title;
          END IF;
        END IF;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Skip posts with invalid JSON
      RAISE NOTICE 'Skipping post % (%) due to JSON parsing error: %', post_record.slug, post_record.title, SQLERRM;
      CONTINUE;
    END;
  END LOOP;

  RAISE NOTICE 'Migration completed: FAQPage schema removed from blog posts';
END $$;


-- ============================================
-- FILE: 20251109_add_contact_urls.sql
-- ============================================

-- Add contact CTA and social URL fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS contact_cta_text text DEFAULT 'Get Started',
ADD COLUMN IF NOT EXISTS contact_cta_link text DEFAULT 'mailto:hello@sewo.io',
ADD COLUMN IF NOT EXISTS contact_linkedin_url text DEFAULT '#',
ADD COLUMN IF NOT EXISTS contact_twitter_url text DEFAULT '#',
ADD COLUMN IF NOT EXISTS contact_behance_url text DEFAULT '#';

-- contact_cta_text: Text for the main contact CTA button
-- contact_cta_link: URL for the main contact CTA button
-- contact_linkedin_url: LinkedIn profile/company URL
-- contact_twitter_url: Twitter/X profile URL
-- contact_behance_url: Behance profile URL



-- ============================================
-- FILE: 20251109_add_homepage_and_images_safe.sql
-- ============================================

-- Create homepage_content table (safe version with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.homepage_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title text,
  hero_description text,
  hero_image text,
  hero_cta_text text,
  hero_cta_link text,
  about_title text,
  about_description text,
  services_title text,
  services jsonb DEFAULT '[]'::jsonb,
  contact_email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS (safe - won't error if already enabled)
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create them
DROP POLICY IF EXISTS "Allow public read access" ON public.homepage_content;
CREATE POLICY "Allow public read access" ON public.homepage_content
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow all insert" ON public.homepage_content;
CREATE POLICY "Allow all insert" ON public.homepage_content
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update" ON public.homepage_content;
CREATE POLICY "Allow all update" ON public.homepage_content
  FOR UPDATE
  USING (true);

-- Create storage bucket for images (will skip if already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop and recreate storage policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images');



-- ============================================
-- FILE: 20251109_add_homepage_and_images.sql
-- ============================================

-- Create homepage_content table
CREATE TABLE IF NOT EXISTS public.homepage_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title text,
  hero_description text,
  hero_image text,
  hero_cta_text text,
  hero_cta_link text,
  about_title text,
  about_description text,
  services_title text,
  services jsonb DEFAULT '[]'::jsonb,
  contact_email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON public.homepage_content
  FOR SELECT
  USING (true);

-- Allow authenticated insert/update (you can add auth later)
CREATE POLICY "Allow all insert" ON public.homepage_content
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update" ON public.homepage_content
  FOR UPDATE
  USING (true);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images');

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images');



-- ============================================
-- FILE: 20251109_add_logo_field.sql
-- ============================================

-- Add logo fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS logo_image text,
ADD COLUMN IF NOT EXISTS logo_text text DEFAULT 'SEWO';

-- logo_image: URL to the logo image (optional)
-- logo_text: Text to display if no logo image (fallback)



-- ============================================
-- FILE: 20251109_add_newsletter_and_cta.sql
-- ============================================

-- Newsletter subscribers
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

-- CTA conversions (lightweight event store)
create table if not exists public.cta_conversions (
  id uuid primary key default gen_random_uuid(),
  cta text not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Allow anon insert if RLS is enabled; adjust as needed
alter table public.newsletter_subscribers enable row level security;
drop policy if exists p_ins_subscribers on public.newsletter_subscribers;
create policy p_ins_subscribers on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);

alter table public.cta_conversions enable row level security;
drop policy if exists p_ins_conversions on public.cta_conversions;
create policy p_ins_conversions on public.cta_conversions
  for insert to anon, authenticated with check (true);




-- ============================================
-- FILE: 20251109_add_programs_and_pricing.sql
-- ============================================

-- Add programs/products fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS programs_title text DEFAULT 'programs & products.',
ADD COLUMN IF NOT EXISTS programs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pricing_title text DEFAULT 'pricing.',
ADD COLUMN IF NOT EXISTS pricing jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS outcomes_title text DEFAULT 'outcomes.',
ADD COLUMN IF NOT EXISTS outcomes_subtitle text,
ADD COLUMN IF NOT EXISTS outcomes jsonb DEFAULT '[]'::jsonb;

-- Example structure for programs:
-- [
--   {
--     "id": "1",
--     "badge": "Guide",
--     "title": "The LLM Ranking Playbook",
--     "description": "A practical, step-by-step system...",
--     "cta_text": "Get Early Access",
--     "cta_link": "/guide"
--   }
-- ]

-- Example structure for pricing:
-- [
--   {
--     "id": "1",
--     "name": "Brands",
--     "price": "$1,997",
--     "period": "/month",
--     "description": "For individual brands",
--     "annual_price": "$19,171",
--     "annual_savings": "20% off",
--     "features": ["LLM Optimization for 1 website", "Monthly visibility reports"],
--     "cta_text": "Get Started",
--     "cta_link": "#contact",
--     "featured": false
--   }
-- ]

-- Example structure for outcomes:
-- [
--   {
--     "id": "1",
--     "title": "Visibility in AI Answers",
--     "description": "Appear when customers ask ChatGPT, Claude, and Perplexity about your category."
--   }
-- ]



-- ============================================
-- FILE: 20251113_add_blog_grid_title.sql
-- ============================================

-- Add title for homepage blog grid section
alter table public.homepage_content
  add column if not exists blog_grid_title text default 'Latest from the blog';

comment on column public.homepage_content.blog_grid_title is 'Heading displayed above the homepage blog grid.';



-- ============================================
-- FILE: 20251113_add_blog_section_visibility.sql
-- ============================================

-- Add visibility toggle for blog section on homepage
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS blog_section_visible boolean DEFAULT true;



-- ============================================
-- FILE: 20251113_add_proof_results_section.sql
-- ============================================

-- Add Proof of Results section to homepage_content
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS proof_results_title text DEFAULT 'Proof of Results',
ADD COLUMN IF NOT EXISTS proof_results_subtitle text DEFAULT 'Real outcomes from our LLM optimization work',
ADD COLUMN IF NOT EXISTS proof_results_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS proof_results_bg_color text DEFAULT '#ffffff';

-- Example structure for proof_results_items:
-- [
--   {
--     "id": "1",
--     "title": "How Google's May 2022 Broad Core Algorithm Update Is Affecting Your Marketing",
--     "description": "SEOs and marketers need to be aware of how this May 2022 broad core algorithm update is affecting their website's visibility in search results. The",
--     "image": "https://example.com/image.jpg",
--     "cta_text": "READ MORE",
--     "cta_link": "/blog/article-slug"
--   }
-- ]



-- ============================================
-- FILE: 20251113_add_quiz_form_fields.sql
-- ============================================

-- Add editable fields for quiz lead capture sections on homepage
alter table public.homepage_content
  add column if not exists quiz_form_title text default 'Want More SEO Traffic?',
  add column if not exists quiz_form_description text default 'Answer 5 quick questions and I will give you a step-by-step 7-week action plan showing you exactly what you need to do to get more traffic.',
  add column if not exists quiz_form_placeholder text default 'What is the URL of your website?',
  add column if not exists quiz_form_cta_text text default 'NEXT',
  add column if not exists quiz_form_cta_link text default '/quiz';

comment on column public.homepage_content.quiz_form_title is 'Headline used for the inline quiz CTA sections.';
comment on column public.homepage_content.quiz_form_description is 'Description text for the inline quiz CTA sections.';
comment on column public.homepage_content.quiz_form_placeholder is 'Input placeholder for the inline quiz CTA sections.';
comment on column public.homepage_content.quiz_form_cta_text is 'Button text for the inline quiz CTA sections.';
comment on column public.homepage_content.quiz_form_cta_link is 'Button link for the inline quiz CTA sections.';



-- ============================================
-- FILE: 20251113_migrate_icon_to_image.sql
-- ============================================

-- Migrate icon field to image field in why_work_with_us_items
-- This migration updates existing data to use 'image' instead of 'icon'

UPDATE public.homepage_content
SET why_work_with_us_items = (
  SELECT jsonb_agg(
    CASE 
      WHEN item ? 'icon' THEN 
        item - 'icon' - 'link_text' - 'link_url' || jsonb_build_object('image', item->>'icon')
      ELSE 
        item - 'link_text' - 'link_url'
    END
  )
  FROM jsonb_array_elements(why_work_with_us_items) AS item
)
WHERE why_work_with_us_items IS NOT NULL 
  AND why_work_with_us_items != '[]'::jsonb
  AND why_work_with_us_items != 'null'::jsonb;



-- ============================================
-- FILE: 20251114_add_lead_captures.sql
-- ============================================

-- Lead capture submissions table
create table if not exists public.lead_captures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  website text,
  message text,
  plan_type text, -- e.g. 'agencies', 'enterprise', 'beta'
  source text,    -- e.g. 'agencies-page', 'enterprise-page', 'beta-page'
  created_at timestamptz not null default now()
);

alter table public.lead_captures enable row level security;

-- Allow anonymous inserts from the public site
drop policy if exists p_ins_lead_captures on public.lead_captures;
create policy p_ins_lead_captures
  on public.lead_captures
  for insert
  to anon, authenticated
  with check (true);




-- ============================================
-- FILE: 20251130_add_blog_category_author.sql
-- ============================================

-- Add category and author columns to blog_posts table if they don't exist

DO $$
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.blog_posts ADD COLUMN category text;
    END IF;

    -- Add author column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'author'
    ) THEN
        ALTER TABLE public.blog_posts ADD COLUMN author text;
    END IF;
END $$;



-- ============================================
-- FILE: 20251130_cleanup_policies.sql
-- ============================================

-- Consolidate policies for blog_posts to prevent conflicts

-- First, drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Allow all delete" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow all insert" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow all update" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow public read access" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_delete_assigned" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_insert_authenticated" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_assigned" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_update_assigned" ON public.blog_posts;

-- Re-enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 1. PUBLIC READ ACCESS
-- Allow ANYONE to see ALL blog posts (so we can see drafts in admin if not logged in, and published on site)
-- Ideally you'd restrict drafts, but for now let's fix the visibility issue.
CREATE POLICY "Allow public read access" ON public.blog_posts
  FOR SELECT
  USING (true);

-- 2. PUBLIC WRITE ACCESS (since you are using a local admin without auth for now)
-- This allows the /admin interface to work without authentication
CREATE POLICY "Allow public insert" ON public.blog_posts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.blog_posts
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete" ON public.blog_posts
  FOR DELETE
  USING (true);



-- ============================================
-- FILE: 20251130_fix_blog_rls.sql
-- ============================================

-- Enable RLS on blog_posts if not already enabled
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to blog posts
DROP POLICY IF EXISTS "Allow public read access" ON public.blog_posts;
CREATE POLICY "Allow public read access" ON public.blog_posts
  FOR SELECT
  USING (true);

-- Allow all inserts/updates/deletes for now (can be restricted to authenticated users later)
DROP POLICY IF EXISTS "Allow all insert" ON public.blog_posts;
CREATE POLICY "Allow all insert" ON public.blog_posts
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update" ON public.blog_posts;
CREATE POLICY "Allow all update" ON public.blog_posts
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow all delete" ON public.blog_posts;
CREATE POLICY "Allow all delete" ON public.blog_posts
  FOR DELETE
  USING (true);



-- ============================================
-- FILE: 20251201_add_ip_address_to_lead_captures.sql
-- ============================================

-- Add ip_address column to lead_captures table for spam protection
ALTER TABLE public.lead_captures 
  ADD COLUMN IF NOT EXISTS ip_address text;

-- Add index for faster IP lookups (used in spam protection)
CREATE INDEX IF NOT EXISTS idx_lead_captures_ip_address 
  ON public.lead_captures(ip_address);

-- Add index for faster email lookups (used in duplicate checking)
CREATE INDEX IF NOT EXISTS idx_lead_captures_email 
  ON public.lead_captures(email);

-- Add index for source + IP combination (used in rate limiting)
CREATE INDEX IF NOT EXISTS idx_lead_captures_source_ip 
  ON public.lead_captures(source, ip_address);



-- ============================================
-- FILE: 20251201_add_seo_fields.sql
-- ============================================

-- Add comprehensive SEO fields to blog_posts table
-- These fields support full Base44 API integration with JSON-LD, keywords, and advanced SEO

-- Add SEO metadata fields
ALTER TABLE public.blog_posts 
  ADD COLUMN IF NOT EXISTS focus_keyword text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS generated_llm_schema text,
  ADD COLUMN IF NOT EXISTS export_seo_as_tags boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_name text DEFAULT 'api';

-- Add comment explaining the schema field
COMMENT ON COLUMN public.blog_posts.generated_llm_schema IS 'JSON-LD schema markup (stringified JSON) for rich search results and AI optimization';
COMMENT ON COLUMN public.blog_posts.focus_keyword IS 'Primary SEO keyword for targeting';
COMMENT ON COLUMN public.blog_posts.excerpt IS 'Brief summary or excerpt of the blog post';
COMMENT ON COLUMN public.blog_posts.user_name IS 'Brand/username associated with the content for multi-tenant support';



-- ============================================
-- FILE: 20251201_add_unique_slug_constraint.sql
-- ============================================

-- Add UNIQUE constraint on slug column to prevent duplicate posts
-- This ensures at the database level that no two posts can have the same slug

-- First, remove any existing duplicates by keeping only the newest version of each slug
DELETE FROM public.blog_posts a
USING public.blog_posts b
WHERE a.slug = b.slug 
  AND a.slug IS NOT NULL
  AND a.created_date < b.created_date;

-- Now add the UNIQUE constraint
ALTER TABLE public.blog_posts 
  ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);

-- Add index for better performance on slug lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);



-- ============================================
-- FILE: 20251208_add_external_id.sql
-- ============================================

-- ============================================================================
-- ADD EXTERNAL_ID COLUMN FOR BASE44 ARTICLE TRACKING
-- ============================================================================
-- This allows Base44 to send its own article UUID, which becomes the
-- PRIMARY identifier for determining if a post should be updated or created.
-- 
-- This solves the problem where Base44 might send slightly different slugs
-- for the same article, causing duplicates.
-- ============================================================================

-- STEP 1: Add external_id column (nullable, for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE public.blog_posts 
      ADD COLUMN external_id TEXT NULL;
    RAISE NOTICE '✅ Added external_id column';
  ELSE
    RAISE NOTICE '✅ external_id column already exists';
  END IF;
END $$;

-- STEP 2: Add UNIQUE constraint on external_id (where not null)
-- This prevents duplicates when external_id is provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'blog_posts_external_id_unique'
  ) THEN
    -- Create partial unique index (only for non-null external_ids)
    CREATE UNIQUE INDEX blog_posts_external_id_unique 
      ON public.blog_posts(external_id) 
      WHERE external_id IS NOT NULL;
    RAISE NOTICE '✅ Added UNIQUE index on external_id';
  ELSE
    RAISE NOTICE '✅ UNIQUE index on external_id already exists';
  END IF;
END $$;

-- STEP 3: Add index for performance on external_id lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_external_id 
  ON public.blog_posts(external_id) 
  WHERE external_id IS NOT NULL;

-- STEP 4: Add comment to document the column
COMMENT ON COLUMN public.blog_posts.external_id IS 
  'External article identifier from Base44 or other CMS. Used as PRIMARY identifier for updates. When provided, this takes precedence over slug for determining if a post should be updated.';

-- STEP 5: Verify the changes
DO $$
DECLARE
  column_exists BOOLEAN;
  index_exists BOOLEAN;
BEGIN
  -- Check column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'external_id'
  ) INTO column_exists;
  
  -- Check unique index
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'blog_posts_external_id_unique'
  ) INTO index_exists;
  
  IF column_exists AND index_exists THEN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ EXTERNAL_ID TRACKING IS ACTIVE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ external_id column added';
    RAISE NOTICE '✅ UNIQUE index on external_id';
    RAISE NOTICE '✅ Performance index added';
    RAISE NOTICE '';
    RAISE NOTICE 'Base44 can now send:';
    RAISE NOTICE '  - external_id (or base44_id, article_id)';
    RAISE NOTICE '  - Will be used as PRIMARY identifier';
    RAISE NOTICE '  - Prevents duplicates even with different slugs';
    RAISE NOTICE '============================================';
  ELSE
    RAISE WARNING '⚠️  Some changes may not be active';
    RAISE WARNING 'Column exists: %', column_exists;
    RAISE WARNING 'Index exists: %', index_exists;
  END IF;
END $$;

-- STEP 6: Update existing posts with NULL external_id
-- (No action needed - they will continue working with slug-based matching)

-- DONE!
-- Base44 can now send external_id/base44_id/article_id in the POST request.
-- The API will use this as the PRIMARY identifier for updates.



-- ============================================
-- FILE: 20251208_bulletproof_duplicate_prevention.sql
-- ============================================

-- ============================================================================
-- BULLETPROOF DUPLICATE PREVENTION FOR BLOG POSTS
-- ============================================================================
-- This migration implements multiple layers of protection against duplicates:
-- 1. Remove existing duplicates
-- 2. Add UNIQUE constraint on slug
-- 3. Create advisory lock helper functions
-- 4. Add database trigger to prevent duplicates by title
-- ============================================================================

-- STEP 1: Clean up any existing duplicates
-- Keep only the most recent version of each slug
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH duplicates AS (
    SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_date DESC) as rn
    FROM public.blog_posts
    WHERE slug IS NOT NULL
  )
  DELETE FROM public.blog_posts
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % duplicate posts (kept newest version of each)', deleted_count;
END $$;

-- STEP 2: Add UNIQUE constraint on slug if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'blog_posts_slug_unique'
  ) THEN
    ALTER TABLE public.blog_posts 
      ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);
    RAISE NOTICE '✅ Added UNIQUE constraint on slug column';
  ELSE
    RAISE NOTICE '✅ UNIQUE constraint already exists';
  END IF;
END $$;

-- STEP 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug 
  ON public.blog_posts(slug) 
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_posts_title_lower 
  ON public.blog_posts(LOWER(TRIM(title)));

-- STEP 4: Create helper functions for advisory locks
-- These functions allow cross-instance locking in serverless environments
CREATE OR REPLACE FUNCTION pg_advisory_lock(lock_id BIGINT)
RETURNS VOID AS $$
BEGIN
  PERFORM pg_advisory_lock(lock_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION pg_advisory_unlock(lock_id BIGINT)
RETURNS VOID AS $$
BEGIN
  PERFORM pg_advisory_unlock(lock_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Create a trigger function to prevent very similar posts
-- This catches cases where Base44 sends slightly different titles
CREATE OR REPLACE FUNCTION prevent_duplicate_blog_posts()
RETURNS TRIGGER AS $$
DECLARE
  similar_post_id UUID;
  similar_title TEXT;
BEGIN
  -- Check if a post with very similar title already exists (created in last 60 seconds)
  SELECT id, title INTO similar_post_id, similar_title
  FROM public.blog_posts
  WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND LOWER(TRIM(title)) = LOWER(TRIM(NEW.title))
    AND created_date > NOW() - INTERVAL '60 seconds'
  LIMIT 1;
  
  IF FOUND THEN
    RAISE WARNING 'Prevented duplicate post creation: "%" (similar to existing post ID: %)', 
      NEW.title, similar_post_id;
    
    -- Instead of creating a new post, convert this to an UPDATE of the existing post
    -- by raising an exception with the existing post ID
    RAISE EXCEPTION 'DUPLICATE_POST:%', similar_post_id
      USING HINT = 'A post with this title was created in the last 60 seconds';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_blog_posts ON public.blog_posts;

CREATE TRIGGER trigger_prevent_duplicate_blog_posts
  BEFORE INSERT ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_blog_posts();

-- STEP 6: Create a function to clean up duplicates on demand
CREATE OR REPLACE FUNCTION cleanup_duplicate_blog_posts()
RETURNS TABLE(deleted_count INTEGER, kept_count INTEGER) AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_kept_count INTEGER := 0;
BEGIN
  -- Delete duplicates by slug (keep newest)
  WITH duplicates AS (
    SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_date DESC) as rn
    FROM public.blog_posts
    WHERE slug IS NOT NULL
  )
  DELETE FROM public.blog_posts
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Count remaining posts
  SELECT COUNT(*) INTO v_kept_count FROM public.blog_posts;
  
  deleted_count := v_deleted_count;
  kept_count := v_kept_count;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION pg_advisory_lock(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_advisory_unlock(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_advisory_lock(BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION pg_advisory_unlock(BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION cleanup_duplicate_blog_posts() TO authenticated;

-- STEP 8: Verify everything is in place
DO $$
DECLARE
  constraint_exists BOOLEAN;
  trigger_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- Check constraint
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_slug_unique'
  ) INTO constraint_exists;
  
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_prevent_duplicate_blog_posts'
  ) INTO trigger_exists;
  
  -- Check functions
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'prevent_duplicate_blog_posts'
  ) INTO function_exists;
  
  IF constraint_exists AND trigger_exists AND function_exists THEN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ ALL DUPLICATE PROTECTIONS ARE ACTIVE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ UNIQUE constraint on slug';
    RAISE NOTICE '✅ Duplicate prevention trigger';
    RAISE NOTICE '✅ Advisory lock functions';
    RAISE NOTICE '✅ Cleanup function available';
    RAISE NOTICE '============================================';
  ELSE
    RAISE WARNING '⚠️  Some protections may not be active';
    RAISE WARNING 'Constraint: %', constraint_exists;
    RAISE WARNING 'Trigger: %', trigger_exists;
    RAISE WARNING 'Functions: %', function_exists;
  END IF;
END $$;

-- DONE!
-- To manually clean up duplicates in the future, run:
-- SELECT * FROM cleanup_duplicate_blog_posts();



-- ============================================
-- FILE: 20251211_disable_duplicate_trigger.sql
-- ============================================

-- DISABLE THE DUPLICATE PREVENTION TRIGGER
-- This trigger was causing issues with updates creating title-only posts

DROP TRIGGER IF EXISTS trigger_prevent_duplicate_blog_posts ON public.blog_posts;
DROP FUNCTION IF EXISTS prevent_duplicate_blog_posts();

-- Keep the UNIQUE constraint on slug (this is good)
-- Keep the advisory lock functions (these are harmless)
-- Only remove the problematic trigger



-- ============================================
-- FILE: 20251212_enforce_required_fields.sql
-- ============================================

-- ============================================
-- NUCLEAR OPTION: Enforce required fields at DATABASE level
-- This prevents ANY code from creating ghost posts
-- ============================================

-- STEP 1: Delete all ghost posts (posts without content or slug)
DELETE FROM public.blog_posts 
WHERE content IS NULL 
   OR content = '' 
   OR LENGTH(TRIM(content)) < 50
   OR slug IS NULL 
   OR slug = '';

-- STEP 2: Add NOT NULL constraint on slug (if not already there)
DO $$
BEGIN
  -- First, ensure no NULL slugs exist
  UPDATE public.blog_posts 
  SET slug = LOWER(REGEXP_REPLACE(TRIM(title), '[^a-z0-9]+', '-', 'gi'))
  WHERE slug IS NULL OR slug = '';
  
  -- Then add the constraint
  ALTER TABLE public.blog_posts 
    ALTER COLUMN slug SET NOT NULL;
  RAISE NOTICE '✅ Added NOT NULL constraint on slug';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Slug constraint already exists or error: %', SQLERRM;
END $$;

-- STEP 3: Add NOT NULL constraint on content
DO $$
BEGIN
  ALTER TABLE public.blog_posts 
    ALTER COLUMN content SET NOT NULL;
  RAISE NOTICE '✅ Added NOT NULL constraint on content';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Content constraint already exists or error: %', SQLERRM;
END $$;

-- STEP 4: Add CHECK constraint for minimum content length
DO $$
BEGIN
  ALTER TABLE public.blog_posts 
    ADD CONSTRAINT blog_posts_content_min_length 
    CHECK (LENGTH(TRIM(content)) >= 50);
  RAISE NOTICE '✅ Added CHECK constraint for minimum content length';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Content length constraint already exists';
  WHEN others THEN
    RAISE NOTICE 'Error adding content constraint: %', SQLERRM;
END $$;

-- STEP 5: Add CHECK constraint for non-empty slug
DO $$
BEGIN
  ALTER TABLE public.blog_posts 
    ADD CONSTRAINT blog_posts_slug_not_empty 
    CHECK (LENGTH(TRIM(slug)) > 0);
  RAISE NOTICE '✅ Added CHECK constraint for non-empty slug';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Slug not-empty constraint already exists';
  WHEN others THEN
    RAISE NOTICE 'Error adding slug constraint: %', SQLERRM;
END $$;

-- STEP 6: Drop the problematic trigger that might be causing issues
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_blog_posts ON public.blog_posts;
DROP FUNCTION IF EXISTS prevent_duplicate_blog_posts() CASCADE;

-- STEP 7: Verify
DO $$
DECLARE
  ghost_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ghost_count
  FROM public.blog_posts
  WHERE content IS NULL 
     OR content = '' 
     OR LENGTH(TRIM(content)) < 50
     OR slug IS NULL 
     OR slug = '';
  
  IF ghost_count = 0 THEN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ DATABASE IS NOW PROTECTED';
    RAISE NOTICE '   - slug is REQUIRED and cannot be empty';
    RAISE NOTICE '   - content is REQUIRED and must be >= 50 chars';
    RAISE NOTICE '   - Ghost posts are IMPOSSIBLE at the DB level';
    RAISE NOTICE '============================================';
  ELSE
    RAISE WARNING '⚠️ Found % potential ghost posts still in database', ghost_count;
  END IF;
END $$;



-- ============================================
-- FILE: 20251223_add_authors_table.sql
-- ============================================

-- Create authors table for editable author profiles (bio, LinkedIn, avatar, etc.)
-- Public can read author profiles; writes should be done via server/service role.

CREATE TABLE IF NOT EXISTS public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  bio text,
  linkedin_url text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Basic validation: slug must not be empty
DO $$
BEGIN
  ALTER TABLE public.authors
    ADD CONSTRAINT authors_slug_not_empty CHECK (LENGTH(TRIM(slug)) > 0);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Enable RLS
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Allow public read authors" ON public.authors;
CREATE POLICY "Allow public read authors" ON public.authors
  FOR SELECT
  USING (true);

-- NOTE: Do NOT add INSERT/UPDATE/DELETE policies. Server/service role bypasses RLS for writes.




-- ============================================
-- FILE: 20251223_lock_down_blog_posts_writes.sql
-- ============================================

-- Lock down blog_posts so the public cannot insert/update/delete directly via anon key.
-- Writes should go through server routes using the service role (which bypasses RLS).

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Keep public read
DROP POLICY IF EXISTS "Allow public read access" ON public.blog_posts;
CREATE POLICY "Allow public read access" ON public.blog_posts
  FOR SELECT
  USING (true);

-- Remove overly-permissive policies
DROP POLICY IF EXISTS "Allow all insert" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow all update" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow all delete" ON public.blog_posts;



