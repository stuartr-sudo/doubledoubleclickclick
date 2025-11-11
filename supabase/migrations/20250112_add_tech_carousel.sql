-- Add technology carousel fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS tech_carousel_title text DEFAULT 'Technology we work with',
ADD COLUMN IF NOT EXISTS tech_carousel_items jsonb DEFAULT '[]'::jsonb;

-- Example structure for tech_carousel_items:
-- [
--   {
--     "id": "1",
--     "name": "ChatGPT",
--     "icon": "https://example.com/chatgpt-icon.png"
--   },
--   {
--     "id": "2",
--     "name": "Claude",
--     "icon": "https://example.com/claude-icon.png"
--   }
-- ]

