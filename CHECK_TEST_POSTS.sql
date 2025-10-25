-- Check what test posts exist and their user_name values
SELECT 
  id,
  title,
  user_name,
  status,
  created_date
FROM blog_posts
WHERE title LIKE '%Test%' OR title LIKE '%test%'
ORDER BY created_date DESC
LIMIT 10;
