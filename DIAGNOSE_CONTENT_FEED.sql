-- Diagnose why Content Feed shows 0 items
-- Run this in Supabase SQL Editor

-- 1. Check all blog posts and their user_name
SELECT 
  'blog_posts' as source,
  id,
  title,
  user_name,
  status,
  created_date
FROM blog_posts
ORDER BY created_date DESC
LIMIT 10;

-- 2. Check which usernames are assigned to your user
SELECT 
  id,
  email,
  assigned_usernames,
  topics
FROM user_profiles
WHERE email = 'YOUR_EMAIL_HERE';

-- 3. Check the usernames table
SELECT 
  id,
  user_name,
  display_name,
  is_active
FROM usernames
ORDER BY created_date DESC;

-- 4. Recommendation:
-- If your posts have user_name='devstuartr' but workspace shows 'keppi',
-- either:
-- A) Change workspace dropdown to 'devstuartr' or 'All'
-- B) Run this to update posts:
-- UPDATE blog_posts SET user_name = 'keppi' WHERE user_name = 'devstuartr';
