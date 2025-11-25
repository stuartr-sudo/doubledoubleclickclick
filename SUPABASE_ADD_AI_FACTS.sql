-- Add AI facts fields to homepage_content table for Questions Discovery loading state
-- Run this in your Supabase SQL Editor

ALTER TABLE homepage_content 
ADD COLUMN IF NOT EXISTS ai_fact_1 TEXT DEFAULT 'Did you know? Over 85% of consumers use AI-powered search before making purchase decisions.',
ADD COLUMN IF NOT EXISTS ai_fact_2 TEXT DEFAULT 'ChatGPT reaches 100 million users in just 2 months - the fastest growing app in history.',
ADD COLUMN IF NOT EXISTS ai_fact_3 TEXT DEFAULT 'Brands optimized for AI discovery see up to 300% more referral traffic.',
ADD COLUMN IF NOT EXISTS ai_fact_4 TEXT DEFAULT 'By 2025, 50% of all searches will be conducted through AI assistants.',
ADD COLUMN IF NOT EXISTS ai_fact_5 TEXT DEFAULT 'AI citations drive 4x higher conversion rates than traditional search results.';

-- Verify the columns were added
SELECT 
  ai_fact_1,
  ai_fact_2,
  ai_fact_3,
  ai_fact_4,
  ai_fact_5
FROM homepage_content
LIMIT 1;

