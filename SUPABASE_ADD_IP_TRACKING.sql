-- Add IP address tracking to lead_captures table
-- Run this in your Supabase SQL Editor

ALTER TABLE lead_captures 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lead_captures_ip_source 
ON lead_captures(ip_address, source);

-- Create index for email + source lookups
CREATE INDEX IF NOT EXISTS idx_lead_captures_email_source 
ON lead_captures(email, source);

-- Verify the column was added
SELECT id, email, source, ip_address 
FROM lead_captures 
LIMIT 5;

