-- Check what the frontend API (PostgREST) will return

-- 1. Simulate the exact query the frontend makes
-- Frontend calls: BlogPost.filter({ user_name: ['keppi', 'backpainsolutions', 'stockpools', 'devstuartr'] })
-- This becomes: GET /blog_posts?user_name=in.(keppi,backpainsolutions,stockpools,devstuartr)

-- Test this query:
SELECT 
    id,
    title,
    user_name,
    status,
    created_date,
    updated_date
FROM public.blog_posts
WHERE user_name IN ('keppi', 'backpainsolutions', 'stockpools', 'devstuartr')
ORDER BY updated_date DESC NULLS LAST;

-- 2. Count by username
SELECT 
    user_name,
    COUNT(*) as count
FROM public.blog_posts
WHERE user_name IN ('keppi', 'backpainsolutions', 'stockpools', 'devstuartr')
GROUP BY user_name
ORDER BY count DESC;

-- 3. Check if there are any NULL values that might cause issues
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN user_name IS NULL THEN 1 END) as null_user_name,
    COUNT(CASE WHEN title IS NULL THEN 1 END) as null_title,
    COUNT(CASE WHEN content IS NULL THEN 1 END) as null_content,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status
FROM public.blog_posts
WHERE user_name IN ('keppi', 'backpainsolutions', 'stockpools', 'devstuartr');

