-- Comprehensive migration to add ALL missing homepage_content columns
-- This ensures all sections are properly set up in the database

-- Problem Statement Section
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS problem_statement_title text DEFAULT 'Publishing content isn''t the problem. Being recognised by AI is.',
ADD COLUMN IF NOT EXISTS problem_statement_para_1 text DEFAULT 'Businesses are waking up to the fact that customers aren''t just searching anymore - they''re having conversations with AI.',
ADD COLUMN IF NOT EXISTS problem_statement_para_2 text DEFAULT 'The shift has happened faster than anyone expected, but the guidance hasn''t caught up.',
ADD COLUMN IF NOT EXISTS problem_statement_para_3 text DEFAULT 'Brands are being told to chase prompts and publish more content, without understanding how AI systems actually decide who to recommend.',
ADD COLUMN IF NOT EXISTS problem_statement_highlight text DEFAULT 'We exist to solve this.',
ADD COLUMN IF NOT EXISTS problem_statement_para_4 text DEFAULT 'Because when customers ask AI for answers, your brand either shows up - or it doesn''t.',
ADD COLUMN IF NOT EXISTS problem_statement_para_5 text DEFAULT 'And that visibility gap is the exact problem we''re built to fix.',
ADD COLUMN IF NOT EXISTS problem_statement_image text DEFAULT '',
ADD COLUMN IF NOT EXISTS problem_statement_bg_color text DEFAULT '#f8f9fa';

-- AI Visibility System (Solution) Section
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS solution_kicker text DEFAULT 'Introducing',
ADD COLUMN IF NOT EXISTS solution_headline text DEFAULT 'AI Visibility System',
ADD COLUMN IF NOT EXISTS solution_subtitle text DEFAULT 'Our authority framework for AI search and summaries',
ADD COLUMN IF NOT EXISTS solution_body_para_1 text DEFAULT 'Most brands are guessing how to get recommended by AI.',
ADD COLUMN IF NOT EXISTS solution_body_para_2 text DEFAULT 'They''re chasing prompts, publishing more content, and hoping something sticks - while the market fills with quick fixes, hacks, and tactics that don''t translate into lasting visibility.',
ADD COLUMN IF NOT EXISTS solution_body_para_3 text DEFAULT 'We built the AI Visibility System to remove that guesswork.',
ADD COLUMN IF NOT EXISTS solution_body_para_4 text DEFAULT 'It''s a structured approach to how AI systems interpret, trust, and reuse your brand''s information - not just what you publish, but how your brand presents itself as a whole.',
ADD COLUMN IF NOT EXISTS solution_body_para_5 text DEFAULT 'This isn''t a one-off optimisation. It''s designed to compound - building durable authority that strengthens over time.',
ADD COLUMN IF NOT EXISTS solution_cta_text text DEFAULT 'Apply to Work With Us',
ADD COLUMN IF NOT EXISTS solution_cta_link text DEFAULT '/guide',
ADD COLUMN IF NOT EXISTS solution_note text DEFAULT 'Limited capacity. We take on a small number of brands at a time.',
ADD COLUMN IF NOT EXISTS solution_pillars_heading text DEFAULT 'Why this works differently',
ADD COLUMN IF NOT EXISTS solution_pillars jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS solution_testimonial_quote text DEFAULT 'I really think is the future if you''re serious about ranking in Ai search.',
ADD COLUMN IF NOT EXISTS solution_testimonial_author_name text DEFAULT 'James Neilson-Watt',
ADD COLUMN IF NOT EXISTS solution_testimonial_author_company text DEFAULT 'learnspark.io',
ADD COLUMN IF NOT EXISTS solution_testimonial_author_image text DEFAULT 'https://framerusercontent.com/images/0WlUXwlUVlsMtOtPEH9RIoG0CFQ.jpeg?width=400&height=400',
ADD COLUMN IF NOT EXISTS solution_bg_color text DEFAULT '#fafafa';
