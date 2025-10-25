-- Assign devstuartr username to your user account
-- This adds 'devstuartr' to your assigned_usernames array

-- 1. Show current user assignments
SELECT 
    email,
    full_name,
    role,
    assigned_usernames
FROM public.user_profiles
WHERE email LIKE '%stuartr%' OR email LIKE '%stuart%'
ORDER BY created_at;

-- 2. Add devstuartr to your main account (stuartr@doubleclick.work)
UPDATE public.user_profiles
SET assigned_usernames = array_append(assigned_usernames, 'devstuartr')
WHERE email = 'stuartr@doubleclick.work'
AND NOT ('devstuartr' = ANY(assigned_usernames)); -- Only add if not already present

-- 3. Alternative: Add to stuarta account if you prefer
-- UPDATE public.user_profiles
-- SET assigned_usernames = array_append(assigned_usernames, 'devstuartr')
-- WHERE email = 'stuarta@doubleclick.work'
-- AND NOT ('devstuartr' = ANY(assigned_usernames));

-- 4. Show updated assignments
SELECT 
    email,
    full_name,
    assigned_usernames,
    array_length(assigned_usernames, 1) as username_count
FROM public.user_profiles
WHERE 'devstuartr' = ANY(assigned_usernames);

-- 5. Success message
DO $$
DECLARE
    assigned_user TEXT;
BEGIN
    SELECT email INTO assigned_user
    FROM public.user_profiles
    WHERE 'devstuartr' = ANY(assigned_usernames)
    LIMIT 1;
    
    IF assigned_user IS NOT NULL THEN
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'USERNAME ASSIGNED TO USER';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'devstuartr is now assigned to: %', assigned_user;
        RAISE NOTICE '';
        RAISE NOTICE 'You can now:';
        RAISE NOTICE '1. View devstuartr posts in Content page';
        RAISE NOTICE '2. Create new posts under devstuartr';
        RAISE NOTICE '3. Switch between usernames in the dropdown';
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE 'No user found with devstuartr assignment';
    END IF;
END $$;

