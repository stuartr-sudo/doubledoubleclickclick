-- Migration to add topics onboarding fields to user_profiles table
-- This migration adds the necessary fields for the Topics Onboarding Flow

-- Add topics_onboarding_completed_at to user_profiles
-- This stores completion timestamps for each username as JSON
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS topics_onboarding_completed_at JSONB DEFAULT '{}'::jsonb;

-- Add topics_timer_override to user_profiles
-- This stores timer overrides for each username as JSON
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS topics_timer_override JSONB DEFAULT '{}'::jsonb;

-- Add topics_timer_hours to user_profiles
-- This stores timer hours for each username as JSON
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS topics_timer_hours JSONB DEFAULT '{}'::jsonb;

-- Add topics (array of strings) to user_profiles
-- This stores the list of usernames that have completed topics onboarding
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Add article_creation_timestamps to user_profiles
-- This stores timestamps of article creation for rate limiting
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS article_creation_timestamps TIMESTAMPTZ[] DEFAULT '{}';

-- Add topics field to usernames table if it doesn't exist
-- This stores the topics/keywords for each username
ALTER TABLE usernames
ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Add target_market field to usernames table if it doesn't exist
-- This stores the target market description for each username
ALTER TABLE usernames
ADD COLUMN IF NOT EXISTS target_market TEXT;

-- Update RLS policies for user_profiles to include new columns
-- The existing policies should automatically cover new columns, but we'll ensure they do

-- Ensure users can read their own profile data (including new columns)
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
CREATE POLICY "Users can read their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Ensure users can update their own profile data (including new columns)
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Ensure users can insert their own profile data (including new columns)
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Update RLS policies for usernames to include new columns
-- Ensure users can read usernames they have access to
DROP POLICY IF EXISTS "Users can read their usernames" ON usernames;
CREATE POLICY "Users can read their usernames" ON usernames
  FOR SELECT USING (
    auth.uid() IN (
      SELECT unnest(assigned_usernames)::uuid 
      FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Ensure users can update usernames they have access to
DROP POLICY IF EXISTS "Users can update their usernames" ON usernames;
CREATE POLICY "Users can update their usernames" ON usernames
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT unnest(assigned_usernames)::uuid 
      FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Ensure users can insert usernames
DROP POLICY IF EXISTS "Users can insert usernames" ON usernames;
CREATE POLICY "Users can insert usernames" ON usernames
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT unnest(assigned_usernames)::uuid 
      FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_user_profiles_topics ON user_profiles USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_user_profiles_topics_onboarding ON user_profiles USING GIN (topics_onboarding_completed_at);
CREATE INDEX IF NOT EXISTS idx_usernames_topics ON usernames USING GIN (topics);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.topics_onboarding_completed_at IS 'JSON object storing completion timestamps for each username';
COMMENT ON COLUMN user_profiles.topics_timer_override IS 'JSON object storing timer overrides for each username';
COMMENT ON COLUMN user_profiles.topics_timer_hours IS 'JSON object storing timer hours for each username';
COMMENT ON COLUMN user_profiles.topics IS 'Array of usernames that have completed topics onboarding';
COMMENT ON COLUMN user_profiles.article_creation_timestamps IS 'Array of timestamps for article creation rate limiting';
COMMENT ON COLUMN usernames.topics IS 'Array of topics/keywords for this username';
COMMENT ON COLUMN usernames.target_market IS 'Target market description for this username';
