-- Add Questions Discovery fields to homepage_content table
-- Run this in your Supabase SQL Editor

ALTER TABLE homepage_content 
ADD COLUMN IF NOT EXISTS questions_discovery_title TEXT DEFAULT 'See What Questions Your Prospects Are Asking',
ADD COLUMN IF NOT EXISTS questions_discovery_description TEXT DEFAULT 'Enter a keyword and discover the top questions people are asking. Answer them before your competitors do.',
ADD COLUMN IF NOT EXISTS questions_discovery_cta_text TEXT DEFAULT 'Book a Discovery Call';

-- Verify the columns were added
SELECT 
  questions_discovery_title,
  questions_discovery_description,
  questions_discovery_cta_text
FROM homepage_content
LIMIT 1;

