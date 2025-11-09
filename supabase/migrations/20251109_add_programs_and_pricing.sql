-- Add programs/products fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS programs_title text DEFAULT 'programs & products.',
ADD COLUMN IF NOT EXISTS programs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pricing_title text DEFAULT 'pricing.',
ADD COLUMN IF NOT EXISTS pricing jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS outcomes_title text DEFAULT 'outcomes.',
ADD COLUMN IF NOT EXISTS outcomes_subtitle text,
ADD COLUMN IF NOT EXISTS outcomes jsonb DEFAULT '[]'::jsonb;

-- Example structure for programs:
-- [
--   {
--     "id": "1",
--     "badge": "Guide",
--     "title": "The LLM Ranking Playbook",
--     "description": "A practical, step-by-step system...",
--     "cta_text": "Get Early Access",
--     "cta_link": "/guide"
--   }
-- ]

-- Example structure for pricing:
-- [
--   {
--     "id": "1",
--     "name": "Brands",
--     "price": "$1,997",
--     "period": "/month",
--     "description": "For individual brands",
--     "annual_price": "$19,171",
--     "annual_savings": "20% off",
--     "features": ["LLM Optimization for 1 website", "Monthly visibility reports"],
--     "cta_text": "Get Started",
--     "cta_link": "#contact",
--     "featured": false
--   }
-- ]

-- Example structure for outcomes:
-- [
--   {
--     "id": "1",
--     "title": "Visibility in AI Answers",
--     "description": "Appear when customers ask ChatGPT, Claude, and Perplexity about your category."
--   }
-- ]

