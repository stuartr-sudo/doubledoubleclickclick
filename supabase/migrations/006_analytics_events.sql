-- Create analytics events table for monitoring user behavior
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own analytics events"
ON analytics_events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics events"
ON analytics_events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all analytics events
CREATE POLICY "Admins can view all analytics events"
ON analytics_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND (is_superadmin = true OR role = 'admin')
  )
);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_analytics_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_analytics_events_updated_at
  BEFORE UPDATE ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_events_updated_at();
