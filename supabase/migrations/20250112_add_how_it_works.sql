-- Add How It Works section fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS how_it_works_title text DEFAULT 'How it works',
ADD COLUMN IF NOT EXISTS how_it_works_steps jsonb DEFAULT '[]'::jsonb;

-- Example structure for how_it_works_steps:
-- [
--   {
--     "id": "1",
--     "number": "01",
--     "title": "Simple Booking",
--     "description": "Effortlessly schedule a consultation...",
--     "image": "https://example.com/image.jpg",
--     "link_text": "Discover More",
--     "link_url": "#"
--   },
--   {
--     "id": "2",
--     "number": "02",
--     "title": "Tailored Strategy",
--     "description": "We analyze your goals...",
--     "image": "",
--     "link_text": "Discover More",
--     "link_url": "#"
--   }
-- ]

