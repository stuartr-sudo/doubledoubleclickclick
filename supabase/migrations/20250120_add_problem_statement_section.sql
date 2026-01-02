-- Add Problem Statement section to homepage_content
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS problem_statement_title text DEFAULT 'Publishing content isn''t the problem. Being recognised by AI is.',
ADD COLUMN IF NOT EXISTS problem_statement_para_1 text DEFAULT 'Businesses are waking up to the fact that customers aren''t just searching anymore — they''re having conversations with AI.',
ADD COLUMN IF NOT EXISTS problem_statement_para_2 text DEFAULT 'The shift has happened faster than anyone expected, but the guidance hasn''t caught up.',
ADD COLUMN IF NOT EXISTS problem_statement_para_3 text DEFAULT 'Brands are being told to chase prompts and publish more content, without understanding how AI systems actually decide who to recommend.',
ADD COLUMN IF NOT EXISTS problem_statement_highlight text DEFAULT 'We exist to solve this.',
ADD COLUMN IF NOT EXISTS problem_statement_para_4 text DEFAULT 'Because when customers ask AI for answers, your brand either shows up — or it doesn''t.',
ADD COLUMN IF NOT EXISTS problem_statement_para_5 text DEFAULT 'And that visibility gap is the exact problem we''re built to fix.',
ADD COLUMN IF NOT EXISTS problem_statement_image text DEFAULT '',
ADD COLUMN IF NOT EXISTS problem_statement_bg_color text DEFAULT '#f8f9fa';
