-- Add comprehensive SEO fields to blog_posts table
-- These fields support full Base44 API integration with JSON-LD, keywords, and advanced SEO

-- Add SEO metadata fields
ALTER TABLE public.blog_posts 
  ADD COLUMN IF NOT EXISTS focus_keyword text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS generated_llm_schema text,
  ADD COLUMN IF NOT EXISTS export_seo_as_tags boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_name text DEFAULT 'api';

-- Add comment explaining the schema field
COMMENT ON COLUMN public.blog_posts.generated_llm_schema IS 'JSON-LD schema markup (stringified JSON) for rich search results and AI optimization';
COMMENT ON COLUMN public.blog_posts.focus_keyword IS 'Primary SEO keyword for targeting';
COMMENT ON COLUMN public.blog_posts.excerpt IS 'Brief summary or excerpt of the blog post';
COMMENT ON COLUMN public.blog_posts.user_name IS 'Brand/username associated with the content for multi-tenant support';

