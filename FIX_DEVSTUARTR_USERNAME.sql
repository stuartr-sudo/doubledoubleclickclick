-- Fix: Ensure devstuartr username exists in usernames table with correct mapping
-- The dropdown shows display names, but filtering uses username/user_name

-- 1. Check current state of usernames table
SELECT 
    id,
    username,
    user_name,
    display_name,
    is_active,
    assigned_to
FROM public.usernames
WHERE username LIKE '%dev%' OR user_name LIKE '%dev%' OR display_name LIKE '%Dev%'
ORDER BY created_date;

-- 2. Check if devstuartr exists
SELECT 
    id,
    username,
    user_name,
    display_name,
    is_active,
    assigned_to
FROM public.usernames
WHERE username = 'devstuartr' OR user_name = 'devstuartr';

-- 3. If it doesn't exist, create it
-- If it exists but has wrong values, update it
INSERT INTO public.usernames (username, user_name, display_name, is_active, assigned_to)
VALUES (
    'devstuartr',
    'devstuartr', 
    'Dev Stuart R',
    true,
    (SELECT id FROM public.user_profiles WHERE email = 'stuartr@doubleclick.work')
)
ON CONFLICT (username) 
DO UPDATE SET
    user_name = 'devstuartr',
    display_name = 'Dev Stuart R',
    is_active = true,
    assigned_to = (SELECT id FROM public.user_profiles WHERE email = 'stuartr@doubleclick.work');

-- 4. Verify the entry
SELECT 
    id,
    username,
    user_name,
    display_name,
    is_active,
    assigned_to
FROM public.usernames
WHERE username = 'devstuartr';

-- 5. Show all usernames for this user
SELECT 
    u.username,
    u.user_name,
    u.display_name,
    u.is_active,
    COUNT(bp.id) as post_count
FROM public.usernames u
LEFT JOIN public.blog_posts bp ON bp.user_name = u.user_name
WHERE u.assigned_to = (SELECT id FROM public.user_profiles WHERE email = 'stuartr@doubleclick.work')
GROUP BY u.id, u.username, u.user_name, u.display_name, u.is_active
ORDER BY u.created_date;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DEVSTUARTR USERNAME CONFIGURED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'username: devstuartr (for filtering)';
    RAISE NOTICE 'user_name: devstuartr (matches blog_posts)';
    RAISE NOTICE 'display_name: Dev Stuart R (shown in dropdown)';
    RAISE NOTICE '';
    RAISE NOTICE 'Now refresh your Content page!';
    RAISE NOTICE 'Select "Dev Stuart R" from dropdown';
    RAISE NOTICE 'Posts should appear!';
    RAISE NOTICE '========================================';
END $$;

