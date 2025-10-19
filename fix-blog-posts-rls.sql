-- Fix RLS policies for blog_posts table to allow users to create their own posts

-- First, let's check if the blog_posts table exists and create it if needed
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft',
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on blog_posts table
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can read their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can update their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can delete their own blog posts" ON blog_posts;

-- Create new policies that allow users to manage their own blog posts
CREATE POLICY "Users can create their own blog posts" ON blog_posts
  FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE assigned_usernames @> ARRAY[blog_posts.user_name]
    )
  );

CREATE POLICY "Users can read their own blog posts" ON blog_posts
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE assigned_usernames @> ARRAY[blog_posts.user_name]
    )
  );

CREATE POLICY "Users can update their own blog posts" ON blog_posts
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE assigned_usernames @> ARRAY[blog_posts.user_name]
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE assigned_usernames @> ARRAY[blog_posts.user_name]
    )
  );

CREATE POLICY "Users can delete their own blog posts" ON blog_posts
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE assigned_usernames @> ARRAY[blog_posts.user_name]
    )
  );

-- Also create a more permissive policy for the getting started flow
-- This allows any authenticated user to create blog posts during onboarding
CREATE POLICY "Allow authenticated users to create blog posts during onboarding" ON blog_posts
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT ALL ON blog_posts TO authenticated;
GRANT ALL ON blog_posts TO anon;
