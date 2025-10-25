-- Enable Title Rewrite Feature Flag
-- Run this in Supabase SQL Editor to enable the AI title rewrite button

-- Check if the feature flag already exists
DO $$
BEGIN
  -- Insert or update the feature flag
  INSERT INTO public.feature_flags (
    flag_name,
    description,
    is_enabled,
    created_date,
    updated_date
  ) VALUES (
    'ai_title_rewrite',
    'Enables AI-powered title rewriting button in the Editor',
    true,
    now(),
    now()
  )
  ON CONFLICT (flag_name) 
  DO UPDATE SET 
    is_enabled = true,
    updated_date = now();

  RAISE NOTICE '✅ Feature flag "ai_title_rewrite" has been enabled!';
  RAISE NOTICE '';
  RAISE NOTICE 'The AI title rewrite button should now appear in the Editor.';
  RAISE NOTICE 'Refresh your browser to see the button.';
END $$;

-- Verify the feature flag
SELECT 
  flag_name,
  is_enabled,
  description
FROM public.feature_flags
WHERE flag_name = 'ai_title_rewrite';

