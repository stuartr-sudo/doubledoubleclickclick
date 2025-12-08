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

