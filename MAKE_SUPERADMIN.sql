-- Promote your account to superadmin
-- Run this with YOUR actual email address

-- First, let's see what users exist
SELECT id, email, role, is_superadmin, assigned_usernames
FROM user_profiles;

-- Now update YOUR account (replace with your email!)
UPDATE user_profiles
SET 
    role = 'superadmin'::user_role,  -- Cast to the ENUM type
    is_superadmin = true,
    token_balance = 1000,
    completed_tutorial_ids = ARRAY['welcome_onboarding', 'getting_started_scrape']
WHERE email = 'YOUR_EMAIL_HERE';  -- REPLACE THIS!

-- Verify it worked
SELECT email, role, is_superadmin, token_balance, completed_tutorial_ids
FROM user_profiles;

-- You should see:
-- email: your@email.com
-- role: superadmin
-- is_superadmin: true
-- token_balance: 1000
-- completed_tutorial_ids: {welcome_onboarding,getting_started_scrape}

