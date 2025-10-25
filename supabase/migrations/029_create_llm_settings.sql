-- Create LLM Settings table for admin-controlled AI parameters
-- This allows superadmins to fine-tune AI behavior without code changes

CREATE TABLE IF NOT EXISTS public.llm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Setting identification
  feature_name TEXT NOT NULL UNIQUE, -- e.g., 'title_rewrite', 'content_generation', etc.
  display_name TEXT NOT NULL, -- User-friendly name for admin UI
  description TEXT, -- What this setting controls
  
  -- OpenAI Configuration
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini', -- Model to use
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER NOT NULL DEFAULT 1000 CHECK (max_tokens > 0),
  top_p DECIMAL(3,2) DEFAULT 1.0 CHECK (top_p >= 0 AND top_p <= 1),
  frequency_penalty DECIMAL(3,2) DEFAULT 0.0 CHECK (frequency_penalty >= -2 AND frequency_penalty <= 2),
  presence_penalty DECIMAL(3,2) DEFAULT 0.0 CHECK (presence_penalty >= -2 AND presence_penalty <= 2),
  
  -- Prompts
  system_prompt TEXT NOT NULL, -- System message
  user_prompt_template TEXT, -- Template with {{variables}}
  
  -- Metadata
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_date TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_llm_settings_feature_name ON public.llm_settings(feature_name);
CREATE INDEX IF NOT EXISTS idx_llm_settings_is_enabled ON public.llm_settings(is_enabled);

-- RLS Policies
ALTER TABLE public.llm_settings ENABLE ROW LEVEL SECURITY;

-- Superadmins can do anything
CREATE POLICY "llm_settings_superadmin_all"
ON public.llm_settings
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND (role = 'superadmin' OR is_superadmin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND (role = 'superadmin' OR is_superadmin = true)
  )
);

-- All authenticated users can read enabled settings (needed for API calls)
CREATE POLICY "llm_settings_read_enabled"
ON public.llm_settings
FOR SELECT
TO public
USING (
  auth.uid() IS NOT NULL AND is_enabled = true
);

-- Function to update usage tracking
CREATE OR REPLACE FUNCTION public.track_llm_usage(setting_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.llm_settings
  SET 
    usage_count = usage_count + 1,
    last_used_date = now()
  WHERE id = setting_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.track_llm_usage(UUID) TO authenticated;

-- Insert default settings for title rewrite
INSERT INTO public.llm_settings (
  feature_name,
  display_name,
  description,
  model,
  temperature,
  max_tokens,
  system_prompt,
  user_prompt_template,
  is_enabled
) VALUES (
  'title_rewrite',
  'Title Rewrite (SEO Optimization)',
  'Rewrites blog post titles to be SEO-optimized while maintaining natural language',
  'gpt-4o-mini',
  0.7,
  100,
  'You are an expert SEO copywriter. Your task is to rewrite blog post titles to maximize search engine visibility while keeping them natural, compelling, and click-worthy. Follow these principles:

1. Keep titles under 60 characters (ideal for Google SERPs)
2. Include the primary keyword naturally
3. Use Title Case formatting
4. Make it compelling and benefit-driven
5. Avoid clickbait or misleading language
6. No quotes, emojis, or special characters
7. Focus on clarity and search intent

Return ONLY the rewritten title, nothing else.',
  'Current Title: {{title}}

Article Content (first 15k characters):
{{content}}

Rewrite this title for maximum SEO impact while keeping it natural and compelling:',
  true
) ON CONFLICT (feature_name) DO NOTHING;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'LLM SETTINGS TABLE CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Table: llm_settings';
  RAISE NOTICE '✓ RLS Policies: Enabled';
  RAISE NOTICE '✓ Default Setting: title_rewrite';
  RAISE NOTICE '✓ Usage Tracking: Enabled';
  RAISE NOTICE '';
  RAISE NOTICE 'Superadmins can now:';
  RAISE NOTICE '- Configure AI models and parameters';
  RAISE NOTICE '- Customize system prompts';
  RAISE NOTICE '- Track usage statistics';
  RAISE NOTICE '========================================';
END $$;

