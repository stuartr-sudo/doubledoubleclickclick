-- Add FAQ section fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS faq_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS faq_bg_color text DEFAULT '#ffffff';

-- Add How It Works section fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS how_it_works_title text DEFAULT 'How it works',
ADD COLUMN IF NOT EXISTS how_it_works_steps jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS how_it_works_bg_color text DEFAULT '#ffffff';

-- Add Why Work With Us section fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS why_work_with_us_title text DEFAULT 'Why Work With Us',
ADD COLUMN IF NOT EXISTS why_work_with_us_subtitle text DEFAULT 'We strive to deliver value to our clients',
ADD COLUMN IF NOT EXISTS why_work_with_us_description text DEFAULT 'We are dedicated to providing the highest level of service, delivering innovative solutions, and exceeding expectations in everything we do.',
ADD COLUMN IF NOT EXISTS why_work_with_us_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS why_work_with_us_bg_color text DEFAULT '#ffffff';

-- Add Testimonials section fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS testimonials_label text DEFAULT 'Testimonials',
ADD COLUMN IF NOT EXISTS testimonials_title text DEFAULT 'Trusted by 10k+ customers',
ADD COLUMN IF NOT EXISTS testimonials_subtitle text DEFAULT 'Whether you''re a small startup or a multinational corporation, let us be your trusted advisor on the path to success.',
ADD COLUMN IF NOT EXISTS testimonials_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS testimonials_bg_color text DEFAULT '#f5f5f5';

-- Add additional background color fields
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS tech_carousel_bg_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS blog_grid_bg_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS quiz_cta_bg_color text DEFAULT '#ffffff';

-- Example structure for faq_items:
-- [
--   {
--     "id": "1",
--     "question": "How does your consulting process work?",
--     "answer": "Our consulting process begins with a comprehensive analysis..."
--   }
-- ]

-- Example structure for how_it_works_steps:
-- [
--   {
--     "id": "1",
--     "number": "01",
--     "title": "Simple Booking",
--     "description": "Effortlessly schedule a consultation...",
--     "image": "https://example.com/image.png",
--     "link_text": "Discover More",
--     "link_url": "#"
--   }
-- ]

-- Example structure for why_work_with_us_items:
-- [
--   {
--     "id": "1",
--     "title": "Proven track record",
--     "description": "We have helped countless businesses overcome challenges.",
--     "link_text": "Our track record",
--     "link_url": "#",
--     "icon": "https://example.com/icon.png"
--   }
-- ]

-- Example structure for testimonials_items:
-- [
--   {
--     "id": "1",
--     "quote": "The impact of Consulting's work on our organization has been transformative...",
--     "rating": 5,
--     "author_name": "Alex Peterson",
--     "author_title": "CEO",
--     "author_company": "Thompson Industries",
--     "author_image": "https://example.com/author.jpg"
--   }
-- ]



