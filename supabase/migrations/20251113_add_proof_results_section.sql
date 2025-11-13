-- Add Proof of Results section to homepage_content
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS proof_results_title text DEFAULT 'Proof of Results',
ADD COLUMN IF NOT EXISTS proof_results_subtitle text DEFAULT 'Real outcomes from our LLM optimization work',
ADD COLUMN IF NOT EXISTS proof_results_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS proof_results_bg_color text DEFAULT '#ffffff';

-- Example structure for proof_results_items:
-- [
--   {
--     "id": "1",
--     "title": "How Google's May 2022 Broad Core Algorithm Update Is Affecting Your Marketing",
--     "description": "SEOs and marketers need to be aware of how this May 2022 broad core algorithm update is affecting their website's visibility in search results. The",
--     "image": "https://example.com/image.jpg",
--     "cta_text": "READ MORE",
--     "cta_link": "/blog/article-slug"
--   }
-- ]

