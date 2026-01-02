-- Add topic column to lead_captures table for contact form
ALTER TABLE public.lead_captures 
  ADD COLUMN IF NOT EXISTS topic text;

-- Add comment to clarify usage
COMMENT ON COLUMN public.lead_captures.topic IS 'Topic selected from contact form dropdown (e.g. "Work with Us", "Partnership White Label", "Consulting", "Feedback", "Other")';
