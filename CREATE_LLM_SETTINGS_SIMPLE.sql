-- Simple LLM Settings Table Creation
-- Run this in Supabase SQL Editor

-- Drop existing table if it exists (start fresh)
DROP TABLE IF EXISTS public.llm_settings CASCADE;
DROP FUNCTION IF EXISTS public.track_llm_usage(UUID) CASCADE;

-- Create the table
CREATE TABLE public.llm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Setting identification
  feature_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- OpenAI Configuration
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7,
  max_tokens INTEGER NOT NULL DEFAULT 1000,
  top_p DECIMAL(3,2) DEFAULT 1.0,
  frequency_penalty DECIMAL(3,2) DEFAULT 0.0,
  presence_penalty DECIMAL(3,2) DEFAULT 0.0,
  
  -- Prompts
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  
  -- Metadata
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_date TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  
  -- Constraints
  CHECK (temperature >= 0 AND temperature <= 2),
  CHECK (max_tokens > 0),
  CHECK (top_p >= 0 AND top_p <= 1),
  CHECK (frequency_penalty >= -2 AND frequency_penalty <= 2),
  CHECK (presence_penalty >= -2 AND presence_penalty <= 2)
);

-- Create indexes
CREATE INDEX idx_llm_settings_feature_name ON public.llm_settings(feature_name);
CREATE INDEX idx_llm_settings_is_enabled ON public.llm_settings(is_enabled);

-- Enable RLS
ALTER TABLE public.llm_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Superadmins can do everything
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

-- RLS Policy: All authenticated users can read enabled settings
CREATE POLICY "llm_settings_read_enabled"
ON public.llm_settings
FOR SELECT
TO public
USING (
  auth.uid() IS NOT NULL AND is_enabled = true
);

-- Usage tracking function
CREATE FUNCTION public.track_llm_usage(setting_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.llm_settings
  SET 
    usage_count = usage_count + 1,
    last_used_date = now()
  WHERE id = setting_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.track_llm_usage(UUID) TO authenticated;

-- Insert default title rewrite setting
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
);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify
SELECT 
  feature_name,
  display_name,
  model,
  temperature,
  max_tokens,
  is_enabled
FROM public.llm_settings;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LLM SETTINGS TABLE CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table: llm_settings';
  RAISE NOTICE 'Default setting: title_rewrite';
  RAISE NOTICE 'Model: gpt-4o-mini';
  RAISE NOTICE 'Status: ENABLED';
  RAISE NOTICE '';
  RAISE NOTICE 'The AI title rewrite button should now work!';
  RAISE NOTICE '========================================';
END $$;

