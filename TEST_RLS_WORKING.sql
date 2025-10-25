-- Test if RLS is now working properly

-- 1. Check how many posts are visible WITH RLS enabled
SELECT COUNT(*) as posts_visible_with_rls
FROM public.blog_posts;

-- 2. Show posts by username
SELECT 
    user_name,
    COUNT(*) as count
FROM public.blog_posts
GROUP BY user_name
ORDER BY count DESC;

-- 3. Show specific posts for devstuartr
SELECT 
    id,
    title,
    user_name,
    status
FROM public.blog_posts
WHERE user_name = 'devstuartr'
ORDER BY created_date DESC;

-- 4. Verify the RLS policies are active
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY policyname;

