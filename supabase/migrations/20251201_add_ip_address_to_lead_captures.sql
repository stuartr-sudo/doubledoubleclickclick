-- Add ip_address column to lead_captures table for spam protection
ALTER TABLE public.lead_captures 
  ADD COLUMN IF NOT EXISTS ip_address text;

-- Add index for faster IP lookups (used in spam protection)
CREATE INDEX IF NOT EXISTS idx_lead_captures_ip_address 
  ON public.lead_captures(ip_address);

-- Add index for faster email lookups (used in duplicate checking)
CREATE INDEX IF NOT EXISTS idx_lead_captures_email 
  ON public.lead_captures(email);

-- Add index for source + IP combination (used in rate limiting)
CREATE INDEX IF NOT EXISTS idx_lead_captures_source_ip 
  ON public.lead_captures(source, ip_address);

