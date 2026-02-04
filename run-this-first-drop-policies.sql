-- ============================================
-- DROP ALL EXISTING POLICIES
-- Run this FIRST to clear any conflicts
-- ============================================

-- Drop all policies on homepage_content
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'homepage_content'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.homepage_content', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on site_posts
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'site_posts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.site_posts', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on blog_posts (if exists)
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_posts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.blog_posts', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on newsletter_subscribers
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'newsletter_subscribers'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.newsletter_subscribers', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on lead_captures
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lead_captures'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.lead_captures', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on authors
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'authors'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.authors', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on landing_pages
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'landing_pages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.landing_pages', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on cta_conversions
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cta_conversions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.cta_conversions', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on apply_to_work_with_us
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'apply_to_work_with_us'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.apply_to_work_with_us', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on admin_users
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on admin_sessions
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_sessions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_sessions', pol.policyname);
    END LOOP;
END $$;

-- Drop storage policies
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if storage schema doesn't exist
END $$;

SELECT 'All policies dropped successfully!' as status;
