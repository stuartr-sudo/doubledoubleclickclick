-- Check the ai_title_rewrite feature flag configuration
-- This will show if there are any restrictions preventing the button from showing

SELECT 
  flag_name,
  is_enabled,
  description,
  require_admin,
  require_superadmin,
  enabled_for_roles,
  created_date,
  updated_date
FROM public.feature_flags
WHERE flag_name = 'ai_title_rewrite';

-- Also check your user's role
SELECT 
  id,
  email,
  full_name,
  role,
  is_superadmin,
  assigned_usernames
FROM public.user_profiles
WHERE id = auth.uid();

-- If the feature flag doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE flag_name = 'ai_title_rewrite') THEN
    INSERT INTO public.feature_flags (
      flag_name,
      description,
      is_enabled
    ) VALUES (
      'ai_title_rewrite',
      'Enables AI-powered title rewriting button in the Editor',
      true
    );
    RAISE NOTICE '✅ Feature flag created!';
  ELSE
    RAISE NOTICE '✓ Feature flag already exists';
  END IF;
END $$;

