-- Fix the test post with placeholder username
-- This will make it visible in your content feed

-- First, let's see what usernames you have assigned
SELECT email, assigned_usernames FROM user_profiles 
WHERE email = 'stuartr@doubleclick.work';

-- Fix the placeholder post to use your actual username
UPDATE blog_posts 
SET user_name = 'stuartr@doubleclick.work'  -- Using your email since it's in assigned_usernames
WHERE user_name = 'YOUR_USERNAME';

-- Verify all posts are now using correct usernames
SELECT id, title, user_name, status, created_date 
FROM blog_posts 
ORDER BY created_date DESC 
LIMIT 10;

-- Optional: Delete old test posts if you want to recreate them
-- Uncomment the lines below if needed:
-- DELETE FROM blog_posts WHERE title LIKE 'Test Post:%';
-- DELETE FROM blog_posts WHERE user_name = 'YOUR_USERNAME';

