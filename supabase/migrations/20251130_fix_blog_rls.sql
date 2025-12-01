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

