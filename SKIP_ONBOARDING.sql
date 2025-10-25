-- Mark onboarding as complete for all users
-- This prevents any lingering tutorial checks

UPDATE user_profiles
SET completed_tutorial_ids = ARRAY['welcome_onboarding', 'getting_started_scrape']
WHERE completed_tutorial_ids IS NULL OR array_length(completed_tutorial_ids, 1) = 0;

-- Verify
SELECT email, completed_tutorial_ids
FROM user_profiles;

