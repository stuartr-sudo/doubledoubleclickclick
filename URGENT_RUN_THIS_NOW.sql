-- ⚠️ URGENT: RUN THIS IMMEDIATELY TO FIX DUPLICATES ⚠️
-- This SQL MUST be run in your Supabase dashboard SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- STEP 1: Remove existing duplicates (keeps newest version of each slug)
DELETE FROM public.blog_posts a
USING public.blog_posts b
WHERE a.slug = b.slug 
  AND a.slug IS NOT NULL
  AND a.created_date < b.created_date;

-- STEP 2: Add UNIQUE constraint to prevent future duplicates
-- This will FAIL if the constraint already exists (which is fine)
DO $$ 
BEGIN
  -- Try to add the constraint
  ALTER TABLE public.blog_posts 
    ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);
  
  RAISE NOTICE 'SUCCESS: UNIQUE constraint added to slug column';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'ALREADY EXISTS: UNIQUE constraint already present';
END $$;

-- STEP 3: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);

-- STEP 4: Verify the constraint exists
SELECT 
  constraint_name, 
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'blog_posts' 
  AND constraint_type = 'UNIQUE'
  AND constraint_name = 'blog_posts_slug_unique';

-- If you see 'blog_posts_slug_unique' in the results above, YOU'RE DONE!
-- If you see NO RESULTS, the constraint failed to add - contact support

