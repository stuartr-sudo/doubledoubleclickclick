-- Add "keppi" to your assigned_usernames array

UPDATE user_profiles
SET 
  assigned_usernames = ARRAY['keppi'],
  updated_date = NOW()
WHERE email = 'stuarta@doubleclick.work';

-- Verify it worked
SELECT 
  email,
  assigned_usernames,
  CASE 
    WHEN 'keppi' = ANY(assigned_usernames) THEN '✅ SUCCESS - keppi added!'
    ELSE '❌ FAILED - still not there'
  END as status
FROM user_profiles
WHERE email = 'stuarta@doubleclick.work';

-- Also ensure "keppi" exists in the usernames table
INSERT INTO usernames (user_name, display_name, is_active, created_date)
VALUES ('keppi', 'Keppi', true, NOW())
ON CONFLICT (user_name) DO UPDATE SET
  is_active = true,
  updated_date = NOW();

-- Show all usernames
SELECT user_name, display_name, is_active
FROM usernames
ORDER BY created_date DESC;

-- Refresh schema
NOTIFY pgrst, 'reload schema';

