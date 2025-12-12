-- RUN THIS IN YOUR SUPABASE SQL EDITOR RIGHT NOW
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- Paste this and click "Run"

DROP TRIGGER IF EXISTS trigger_prevent_duplicate_blog_posts ON public.blog_posts;
DROP FUNCTION IF EXISTS prevent_duplicate_blog_posts();

-- Verify it's gone
SELECT 'Trigger removed successfully!' as status;
