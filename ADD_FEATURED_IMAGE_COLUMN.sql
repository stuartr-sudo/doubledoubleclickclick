-- Add featured_image column to blog_posts table
-- This column is used by the Editor for cover images

-- Check if column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'blog_posts'
      AND column_name = 'featured_image'
  ) THEN
    -- Add the column
    ALTER TABLE public.blog_posts
    ADD COLUMN featured_image TEXT;
    
    RAISE NOTICE '✅ Added featured_image column to blog_posts';
  ELSE
    RAISE NOTICE '✓ featured_image column already exists';
  END IF;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify and show success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FEATURED IMAGE COLUMN READY';
  RAISE NOTICE 'Autosave should now work without errors!';
  RAISE NOTICE '========================================';
END $$;

-- Show the column details
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'blog_posts'
  AND column_name = 'featured_image';

