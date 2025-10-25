-- Check what users exist in the database
SELECT 
    id, 
    email, 
    full_name,
    role::TEXT as role,
    is_superadmin,
    token_balance,
    created_date
FROM user_profiles
ORDER BY created_date DESC;

-- If you see your user, copy the EXACT email and run:
-- UPDATE user_profiles
-- SET role = 'superadmin'::user_role, is_superadmin = true, token_balance = 1000
-- WHERE email = 'EXACT_EMAIL_FROM_ABOVE';

