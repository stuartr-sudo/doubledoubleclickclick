-- Add columns for quiz and find-questions landing pages
ALTER TABLE homepage_content 
ADD COLUMN IF NOT EXISTS quiz_landing_title TEXT DEFAULT 'Discover Your AI Visibility Score',
ADD COLUMN IF NOT EXISTS quiz_landing_description TEXT DEFAULT 'Take our 3-minute assessment to see how visible your brand is to AI assistants like ChatGPT, Claude, and Gemini.',
ADD COLUMN IF NOT EXISTS find_questions_title TEXT DEFAULT 'Discover What Questions Your Prospects Are Asking',
ADD COLUMN IF NOT EXISTS find_questions_description TEXT DEFAULT 'Enter a keyword and discover the top questions people are asking. Answer them before your competitors do.';

