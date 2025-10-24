-- Check blog_posts table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
ORDER BY ordinal_position;
