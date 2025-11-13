-- Add visibility toggle for blog section on homepage
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS blog_section_visible boolean DEFAULT true;

