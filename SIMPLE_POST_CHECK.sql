-- SIMPLE CHECK: Do posts exist at all?

-- Disable RLS temporarily to see ALL data
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;

-- 1. Show ALL posts in the table
SELECT 
    id,
    title,
    user_name,
    status,
    created_date
FROM public.blog_posts
ORDER BY created_date DESC;

-- 2. Count by user_name
SELECT 
    user_name,
    COUNT(*) as post_count
FROM public.blog_posts
GROUP BY user_name
ORDER BY post_count DESC;

-- 3. Check for devstuartr specifically
SELECT COUNT(*) as devstuartr_post_count
FROM public.blog_posts
WHERE user_name = 'devstuartr';

-- Re-enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 4. Now test WITH RLS enabled
SELECT COUNT(*) as posts_visible_with_rls
FROM public.blog_posts;

-- 5. Test the function directly
SELECT 
    user_owns_username('devstuartr') as owns_devstuartr,
    user_owns_username('keppi') as owns_keppi;

-- 6. Check your assigned usernames
SELECT 
    id,
    email,
    assigned_usernames
FROM public.user_profiles
WHERE email = 'stuartr@doubleclick.work';

