-- Simple verification of all fixes

SELECT 
  email,
  role::TEXT,
  is_superadmin,
  assigned_usernames,
  CASE 
    WHEN 'keppi' = ANY(assigned_usernames) THEN '✅ YES'
    ELSE '❌ NO'
  END as has_keppi,
  topics,
  topics_onboarding_completed_at,
  token_balance
FROM user_profiles
WHERE email = 'stuarta@doubleclick.work';

