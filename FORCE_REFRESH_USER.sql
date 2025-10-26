-- Force refresh: This will help debug the issue
-- Run this to see what the API is returning

-- 1. Check what's in the database
SELECT 
    id,
    email,
    full_name,
    account_balance,
    created_date,
    updated_date
FROM public.user_profiles
WHERE email = 'stuarta@doubleclick.work';

-- 2. Check if there's a session caching issue
-- You should log out completely and log back in

-- 3. Alternative: Update the updated_date to force a cache refresh
UPDATE public.user_profiles
SET updated_date = now()
WHERE is_superadmin = true OR role = 'superadmin';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'User data updated - please hard refresh your browser (Cmd+Shift+R)' as message;

