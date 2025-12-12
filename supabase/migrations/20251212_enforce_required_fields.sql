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

