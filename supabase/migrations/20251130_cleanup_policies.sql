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

