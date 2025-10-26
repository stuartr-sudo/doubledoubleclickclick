-- Credit superadmin with $1000
UPDATE public.user_profiles
SET account_balance = 1000.00
WHERE is_superadmin = true OR role = 'superadmin';

-- Verify the update
SELECT 
    email,
    full_name,
    role,
    is_superadmin,
    account_balance
FROM public.user_profiles
WHERE is_superadmin = true OR role = 'superadmin';

