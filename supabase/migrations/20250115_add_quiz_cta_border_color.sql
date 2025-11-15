-- Add quiz CTA border color field to homepage_content
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS quiz_cta_border_color text DEFAULT '#000000';

-- quiz_cta_border_color: Border color for the quiz CTA button in the hero section

