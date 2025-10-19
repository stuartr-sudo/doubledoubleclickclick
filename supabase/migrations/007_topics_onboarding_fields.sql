-- Add topics onboarding fields to user_profiles table
-- This migration adds the necessary fields for the Topics Onboarding Flow

-- Add topics_onboarding_completed_at field (JSON string mapping usernames to timestamps)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS topics_onboarding_completed_at TEXT DEFAULT '{}';

-- Add topics_timer_override field (JSON string mapping usernames to boolean overrides)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS topics_timer_override TEXT DEFAULT '{}';

-- Add topics_timer_hours field (JSON string mapping usernames to timer hours)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS topics_timer_hours TEXT DEFAULT '{}';

-- Add topics field (array of usernames that have completed topics onboarding)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Add topics field to usernames table
ALTER TABLE usernames 
ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Add onboarding_video_url field to usernames table
ALTER TABLE usernames 
ADD COLUMN IF NOT EXISTS onboarding_video_url TEXT;

-- Add target_market field to usernames table
ALTER TABLE usernames 
ADD COLUMN IF NOT EXISTS target_market TEXT;

-- Add article_creation_timestamps field to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS article_creation_timestamps TEXT[] DEFAULT '{}';

-- Update the updated_at trigger to include the new fields
-- The existing trigger should already handle this, but let's make sure
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_topics ON user_profiles USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_usernames_topics ON usernames USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_user_profiles_article_creation_timestamps ON user_profiles USING GIN(article_creation_timestamps);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.topics_onboarding_completed_at IS 'JSON string mapping usernames to ISO timestamps when topics onboarding was completed';
COMMENT ON COLUMN user_profiles.topics_timer_override IS 'JSON string mapping usernames to boolean overrides for timer settings';
COMMENT ON COLUMN user_profiles.topics_timer_hours IS 'JSON string mapping usernames to timer hours for topics generation';
COMMENT ON COLUMN user_profiles.topics IS 'Array of usernames that have completed topics onboarding';
COMMENT ON COLUMN user_profiles.article_creation_timestamps IS 'Array of ISO timestamps for article creation rate limiting';
COMMENT ON COLUMN usernames.topics IS 'Array of topics/keywords associated with this username';
COMMENT ON COLUMN usernames.onboarding_video_url IS 'Optional Loom embed URL for onboarding tutorial video';
COMMENT ON COLUMN usernames.target_market IS 'Description of the target market for this username';
