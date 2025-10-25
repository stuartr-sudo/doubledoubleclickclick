-- Quick check: Is keppi in your assigned_usernames?

SELECT 
  email,
  full_name,
  role::TEXT,
  is_superadmin,
  assigned_usernames,
  token_balance,
  CASE 
    WHEN 'keppi' = ANY(assigned_usernames) THEN '✅ YES'
    ELSE '❌ NO'
  END as has_keppi
FROM user_profiles
WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%'
ORDER BY created_date DESC
LIMIT 1;

