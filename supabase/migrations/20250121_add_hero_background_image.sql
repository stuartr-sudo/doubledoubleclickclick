-- Add hero_background_image column to homepage_content table
ALTER TABLE public.homepage_content 
  ADD COLUMN IF NOT EXISTS hero_background_image text;

-- Add comment to clarify usage
COMMENT ON COLUMN public.homepage_content.hero_background_image IS 'Background image URL for the hero section. If set, this will be used as the background instead of the gradient.';
