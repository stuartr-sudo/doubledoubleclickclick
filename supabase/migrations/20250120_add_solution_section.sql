-- Add AI Visibility System (Solution) section to homepage_content
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

-- Example structure for solution_pillars:
-- [
--   {
--     "id": "1",
--     "title": "Built for AI discovery, not traditional SEO",
--     "description": "Traditional search optimisation and paid media focus on direct inputs. AI recommendations don't. We specialise specifically in AI summaries and AI recommendations - how language models decide which brands to surface, cite, and suggest when users ask questions."
--   },
--   {
--     "id": "2",
--     "title": "Authority over volume",
--     "description": "More content isn't the answer. AI systems favour brands that demonstrate consistency, credibility, and clarity across multiple touchpoints - not those publishing the most pages. Our focus is on making your brand the trusted source AI systems return to, not another voice in the noise."
--   },
--   {
--     "id": "3",
--     "title": "Designed to compound",
--     "description": "AI visibility isn't something you switch on. It's something you build. Each piece of work reinforces the next - content, site structure, brand signals, and proof working together to deepen trust and increase confidence over time. That's why results don't reset every few months. They accumulate."
--   },
--   {
--     "id": "4",
--     "title": "Proven approach, low guesswork",
--     "description": "This work isn't experimental. Our process is refined, repeatable, and grounded in how AI systems actually behave - not theory, not trends, and not short-lived tactics. We don't attempt to game the system. We focus on building the conditions AI relies on to recommend brands with confidence."
--   }
-- ]
