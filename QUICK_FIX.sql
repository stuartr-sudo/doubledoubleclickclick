-- Quick fix for the one post with placeholder username
-- Run this in Supabase SQL Editor

UPDATE blog_posts 
SET user_name = 'stuartr@doubleclick.work'
WHERE id = 'c5d0c747-2013-4e66-a440-197fa501e8ff';

-- Verify it worked
SELECT id, title, user_name, status 
FROM blog_posts 
WHERE id = 'c5d0c747-2013-4e66-a440-197fa501e8ff';

