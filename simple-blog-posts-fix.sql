-- Simple fix for blog_posts RLS policies

-- Enable RLS if not already enabled
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can create their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can read their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can update their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can delete their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to create blog posts during onboarding" ON blog_posts;

-- Create simple policies that allow all authenticated users to manage blog posts
CREATE POLICY "Allow authenticated users to manage blog posts" ON blog_posts
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
