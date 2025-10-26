-- Quick check: View your current balance in the database
SELECT 
    email,
    full_name,
    role,
    is_superadmin,
    account_balance,
    '$' || account_balance::TEXT as formatted_balance
FROM public.user_profiles
WHERE is_superadmin = true OR role = 'superadmin'
ORDER BY email;

-- Expected result: account_balance should be 1000.00

