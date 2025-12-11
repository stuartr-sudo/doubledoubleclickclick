-- DISABLE THE DUPLICATE PREVENTION TRIGGER
-- This trigger was causing issues with updates creating title-only posts

DROP TRIGGER IF EXISTS trigger_prevent_duplicate_blog_posts ON public.blog_posts;
DROP FUNCTION IF EXISTS prevent_duplicate_blog_posts();

-- Keep the UNIQUE constraint on slug (this is good)
-- Keep the advisory lock functions (these are harmless)
-- Only remove the problematic trigger

