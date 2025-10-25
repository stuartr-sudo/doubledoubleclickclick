-- Step 1: Disable RLS to see everything
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;

-- Step 2: Show ALL posts (THIS IS THE IMPORTANT ONE)
SELECT 
    id,
    title,
    user_name,
    status,
    created_date
FROM public.blog_posts
ORDER BY created_date DESC;

