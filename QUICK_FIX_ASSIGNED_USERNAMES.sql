-- ============================================================================
-- QUICK FIX: Assign username to your user
-- ============================================================================

-- 1. Check current state
SELECT 
  email,
  assigned_usernames,
  array_length(assigned_usernames, 1) as count
FROM user_profiles
WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%';

-- 2. Manually set assigned_usernames (based on your screenshot showing "keppi")
UPDATE user_profiles
SET assigned_usernames = ARRAY['keppi'],
    updated_date = NOW()
WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%';

-- 3. Mark Topics onboarding as complete for "keppi"
UPDATE user_profiles
SET topics_onboarding_completed_at = jsonb_build_object('keppi', NOW()),
    updated_date = NOW()
WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%';

-- 4. Verify
SELECT 
  email,
  assigned_usernames,
  topics_onboarding_completed_at
FROM user_profiles
WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ QUICK FIX APPLIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Username: keppi';
  RAISE NOTICE 'Assigned to your user';
  RAISE NOTICE 'Topics onboarding: COMPLETE';
  RAISE NOTICE '';
  RAISE NOTICE 'Now refresh the Topics page!';
  RAISE NOTICE '========================================';
END $$;

