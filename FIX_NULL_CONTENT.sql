-- Fix posts with NULL content

-- 1. Find posts with NULL content
SELECT 
    id,
    title,
    user_name,
    status,
    content IS NULL as is_null,
    LENGTH(content) as content_length
FROM public.blog_posts
WHERE user_name IN ('keppi', 'backpainsolutions', 'stockpools', 'devstuartr')
AND content IS NULL;

-- 2. Update posts with NULL content to have placeholder content
UPDATE public.blog_posts
SET content = '<p>' || title || '</p><p>This is placeholder content for testing purposes.</p>'
WHERE content IS NULL
AND user_name IN ('keppi', 'backpainsolutions', 'stockpools', 'devstuartr');

-- 3. Verify all posts now have content
SELECT 
    user_name,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN content IS NULL THEN 1 END) as null_content,
    COUNT(CASE WHEN content IS NOT NULL THEN 1 END) as has_content
FROM public.blog_posts
WHERE user_name IN ('keppi', 'backpainsolutions', 'stockpools', 'devstuartr')
GROUP BY user_name
ORDER BY user_name;

-- 4. Show all posts that should be visible
SELECT 
    id,
    title,
    user_name,
    status,
    LENGTH(content) as content_length,
    created_date
FROM public.blog_posts
WHERE user_name IN ('keppi', 'backpainsolutions', 'stockpools', 'devstuartr')
ORDER BY created_date DESC;

-- Success message
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fixed_count
    FROM public.blog_posts
    WHERE user_name IN ('keppi', 'backpainsolutions', 'stockpools', 'devstuartr')
    AND content IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NULL CONTENT FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All % posts now have content', fixed_count;
    RAISE NOTICE '';
    RAISE NOTICE 'NOW REFRESH YOUR CONTENT PAGE!';
    RAISE NOTICE 'Posts should appear now!';
    RAISE NOTICE '========================================';
END $$;

