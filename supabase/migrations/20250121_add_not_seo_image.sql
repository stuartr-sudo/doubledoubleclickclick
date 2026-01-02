-- Add not_seo_image column to homepage_content table
ALTER TABLE public.homepage_content 
  ADD COLUMN IF NOT EXISTS not_seo_image text;

-- Add comment to clarify usage
COMMENT ON COLUMN public.homepage_content.not_seo_image IS 'Image for the "This Is Not Traditional SEO Or Paid Media" section. Displayed on the left side of the two-column layout.';
