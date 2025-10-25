-- Add flash_template column to blog_posts and webhook_received tables
-- This stores the selected Flash Template (Product Review, How-To Guide, etc.)

-- Add to blog_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'blog_posts'
      AND column_name = 'flash_template'
  ) THEN
    ALTER TABLE public.blog_posts
    ADD COLUMN flash_template TEXT DEFAULT 'None';
    
    RAISE NOTICE '✓ Added flash_template column to blog_posts';
  ELSE
    RAISE NOTICE '✓ flash_template column already exists in blog_posts';
  END IF;
END $$;

-- Add to webhook_received
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhook_received'
      AND column_name = 'flash_template'
  ) THEN
    ALTER TABLE public.webhook_received
    ADD COLUMN flash_template TEXT DEFAULT 'None';
    
    RAISE NOTICE '✓ Added flash_template column to webhook_received';
  ELSE
    RAISE NOTICE '✓ flash_template column already exists in webhook_received';
  END IF;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FLASH TEMPLATE COLUMN READY';
  RAISE NOTICE 'Content page now uses same templates as Topics!';
  RAISE NOTICE '========================================';
END $$;
