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


