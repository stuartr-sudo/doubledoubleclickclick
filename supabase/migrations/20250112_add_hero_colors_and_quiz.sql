-- Add hero color and gradient fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS hero_bg_gradient text DEFAULT 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
ADD COLUMN IF NOT EXISTS hero_text_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS hero_cta_bg_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS hero_cta_text_color text DEFAULT '#ffffff';

-- Add quiz CTA fields to homepage_content
ALTER TABLE public.homepage_content 
ADD COLUMN IF NOT EXISTS quiz_title text DEFAULT 'Take the 12-Step Quiz',
ADD COLUMN IF NOT EXISTS quiz_description text DEFAULT 'See where you''re missing out on LLM visibility. Get personalized insights in minutes.',
ADD COLUMN IF NOT EXISTS quiz_cta_text text DEFAULT 'Start Quiz',
ADD COLUMN IF NOT EXISTS quiz_cta_link text DEFAULT '/quiz',
ADD COLUMN IF NOT EXISTS quiz_steps text DEFAULT '12';

-- hero_bg_gradient: CSS gradient string for the hero background
-- hero_text_color: Text color for content on gradient background
-- hero_cta_bg_color: Background color for CTA buttons
-- hero_cta_text_color: Text color for CTA buttons
-- quiz_title: Title for the quiz CTA section
-- quiz_description: Description text for the quiz CTA
-- quiz_cta_text: Button text for the quiz CTA
-- quiz_cta_link: URL/link for the quiz CTA button
-- quiz_steps: Number of steps displayed in the quiz badge

