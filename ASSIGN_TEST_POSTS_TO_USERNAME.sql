-- Assign test blog posts to devstuartr username
-- This updates the user_name field on existing test posts

-- 1. First, verify the username exists
SELECT 
    id,
    username,
    user_name,
    display_name,
    is_active
FROM public.usernames
WHERE username = 'devstuartr' OR user_name = 'devstuartr'
ORDER BY created_date;

-- 2. Show current test posts
SELECT 
    id,
    title,
    user_name,
    status,
    created_date
FROM public.blog_posts
WHERE title LIKE '%Test Post%' 
   OR title LIKE '%React%'
   OR title LIKE '%AI in Content%'
   OR title LIKE '%Color in Web Design%'
   OR title LIKE '%SEO Strategies%'
   OR title LIKE '%Content Marketing%'
ORDER BY created_date DESC
LIMIT 10;

-- 3. Update test posts to use devstuartr username
UPDATE public.blog_posts
SET user_name = 'devstuartr'
WHERE (
    title LIKE '%Test Post%' 
    OR title LIKE '%Getting Started with React%'
    OR title LIKE '%The Future of AI in Content%'
    OR title LIKE '%The Psychology of Color in Web Design%'
    OR title LIKE '%10 Essential SEO Strategies%'
    OR title LIKE '%Building a Successful Content Marketing%'
)
AND user_name != 'devstuartr'; -- Only update if not already assigned

-- 4. Show updated posts
SELECT 
    id,
    title,
    user_name,
    status,
    created_date
FROM public.blog_posts
WHERE user_name = 'devstuartr'
ORDER BY created_date DESC;

-- 5. Count posts by username
SELECT 
    user_name,
    COUNT(*) as post_count,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count
FROM public.blog_posts
GROUP BY user_name
ORDER BY post_count DESC;

-- 6. Success message
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM public.blog_posts 
    WHERE user_name = 'devstuartr';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST POSTS ASSIGNED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total posts assigned to devstuartr: %', updated_count;
    RAISE NOTICE '';
    RAISE NOTICE 'You can now view these posts in Content page';
    RAISE NOTICE 'by selecting devstuartr from the username filter';
    RAISE NOTICE '========================================';
END $$;

