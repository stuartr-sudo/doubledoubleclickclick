-- ============================================================================
-- DISABLE ALL ONBOARDING FRICTION
-- Makes the platform immediately usable without setup steps
-- ============================================================================

-- 1. Disable Topics onboarding gate
UPDATE feature_flags
SET is_enabled = false,
    updated_date = NOW()
WHERE flag_name IN (
  'require_topics_onboarding',
  'use_workspace_scoping'
);

-- 2. Auto-complete onboarding for all existing users
UPDATE user_profiles
SET completed_tutorial_ids = ARRAY[
    'welcome_onboarding',
    'getting_started_scrape',
    'topics_onboarding'
  ],
  updated_date = NOW()
WHERE completed_tutorial_ids IS NULL 
   OR array_length(completed_tutorial_ids, 1) IS NULL
   OR array_length(completed_tutorial_ids, 1) = 0;

-- 3. Give all users starter tokens
UPDATE user_profiles
SET token_balance = GREATEST(COALESCE(token_balance, 0), 100),
    updated_date = NOW()
WHERE token_balance < 100 OR token_balance IS NULL;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL ONBOARDING DISABLED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Topics onboarding: DISABLED';
  RAISE NOTICE 'Workspace scoping: DISABLED';
  RAISE NOTICE 'All users: Auto-completed tutorials';
  RAISE NOTICE 'All users: Minimum 100 tokens';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Platform is now immediately usable!';
  RAISE NOTICE '========================================';
END $$;

-- Show affected users
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN array_length(completed_tutorial_ids, 1) >= 3 THEN 1 ELSE 0 END) as tutorials_complete,
  SUM(CASE WHEN token_balance >= 100 THEN 1 ELSE 0 END) as has_tokens
FROM user_profiles;

