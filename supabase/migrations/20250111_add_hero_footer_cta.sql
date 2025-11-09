-- Add hero footer CTA fields to homepage_content
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS hero_footer_cta_text text DEFAULT 'Get Started',
ADD COLUMN IF NOT EXISTS hero_footer_cta_link text DEFAULT 'mailto:hello@doubleclicker.com';

-- hero_footer_cta_text: Text for the CTA button in the hero footer
-- hero_footer_cta_link: Link URL for the CTA button in the hero footer

