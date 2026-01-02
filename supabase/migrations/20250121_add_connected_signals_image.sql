-- Add connected_signals_image column to homepage_content table
ALTER TABLE public.homepage_content 
  ADD COLUMN IF NOT EXISTS connected_signals_image text;

-- Add comment to clarify usage
COMMENT ON COLUMN public.homepage_content.connected_signals_image IS 'Image for the "AI Recommendations Are Shaped By Connected Signals" section. Displayed on the left side of the two-column layout.';
