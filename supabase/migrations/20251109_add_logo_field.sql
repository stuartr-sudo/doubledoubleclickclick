-- Add logo fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS logo_image text,
ADD COLUMN IF NOT EXISTS logo_text text DEFAULT 'SEWO';

-- logo_image: URL to the logo image (optional)
-- logo_text: Text to display if no logo image (fallback)

