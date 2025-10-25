-- Check the ai_title_rewrite feature flag (simple version)

-- 1. Check what columns exist in feature_flags table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'feature_flags'
ORDER BY ordinal_position;

-- 2. Check the feature flag itself
SELECT *
FROM public.feature_flags
WHERE flag_name = 'ai_title_rewrite';

-- 3. Check your user profile
SELECT 
  id,
  email,
  full_name,
  role,
  is_superadmin,
  assigned_usernames,
  token_balance
FROM public.user_profiles
WHERE id = auth.uid();

-- 4. Ensure feature flag is enabled (in case it got disabled)
UPDATE public.feature_flags
SET is_enabled = true
WHERE flag_name = 'ai_title_rewrite';

-- 5. Verify LLM settings
SELECT 
  feature_name,
  display_name,
  model,
  is_enabled,
  usage_count,
  last_used_date
FROM public.llm_settings
WHERE feature_name = 'title_rewrite';

-- Success message
DO $$
DECLARE
  flag_enabled BOOLEAN;
  settings_exist BOOLEAN;
BEGIN
  SELECT is_enabled INTO flag_enabled
  FROM public.feature_flags
  WHERE flag_name = 'ai_title_rewrite';
  
  SELECT EXISTS(
    SELECT 1 FROM public.llm_settings 
    WHERE feature_name = 'title_rewrite' AND is_enabled = true
  ) INTO settings_exist;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TITLE REWRITE STATUS CHECK';
  RAISE NOTICE '========================================';
  
  IF flag_enabled THEN
    RAISE NOTICE '✅ Feature flag: ENABLED';
  ELSE
    RAISE NOTICE '❌ Feature flag: DISABLED';
  END IF;
  
  IF settings_exist THEN
    RAISE NOTICE '✅ LLM settings: CONFIGURED';
  ELSE
    RAISE NOTICE '❌ LLM settings: MISSING';
  END IF;
  
  IF flag_enabled AND settings_exist THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ALL SYSTEMS GO!';
    RAISE NOTICE 'The title rewrite button should be visible.';
    RAISE NOTICE '';
    RAISE NOTICE 'If you still don''t see it:';
    RAISE NOTICE '1. Hard refresh browser (Cmd+Shift+R)';
    RAISE NOTICE '2. Check browser console for errors';
    RAISE NOTICE '3. Verify you''re logged in';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ SETUP INCOMPLETE';
    RAISE NOTICE 'Please complete the missing steps above.';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

