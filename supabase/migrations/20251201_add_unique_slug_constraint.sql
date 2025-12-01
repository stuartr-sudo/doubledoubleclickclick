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

