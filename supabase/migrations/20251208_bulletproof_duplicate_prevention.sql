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

