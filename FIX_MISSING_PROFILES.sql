-- Create user_profiles for any auth.users that are missing them
INSERT INTO public.user_profiles (id, email, full_name, role, is_superadmin, token_balance)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', ''),
    'user'::user_role,
    false,
    20
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Now promote yourself to superadmin
UPDATE user_profiles
SET 
    role = 'superadmin'::user_role,
    is_superadmin = true,
    token_balance = 1000
WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%';

-- Verify
SELECT 
    email, 
    role::TEXT, 
    is_superadmin, 
    token_balance,
    created_date
FROM user_profiles
ORDER BY created_date DESC;

