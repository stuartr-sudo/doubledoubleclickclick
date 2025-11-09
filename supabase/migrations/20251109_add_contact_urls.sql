-- Add contact CTA and social URL fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS contact_cta_text text DEFAULT 'Get Started',
ADD COLUMN IF NOT EXISTS contact_cta_link text DEFAULT 'mailto:hello@doubleclicker.com',
ADD COLUMN IF NOT EXISTS contact_linkedin_url text DEFAULT '#',
ADD COLUMN IF NOT EXISTS contact_twitter_url text DEFAULT '#',
ADD COLUMN IF NOT EXISTS contact_behance_url text DEFAULT '#';

-- contact_cta_text: Text for the main contact CTA button
-- contact_cta_link: URL for the main contact CTA button
-- contact_linkedin_url: LinkedIn profile/company URL
-- contact_twitter_url: Twitter/X profile URL
-- contact_behance_url: Behance profile URL

