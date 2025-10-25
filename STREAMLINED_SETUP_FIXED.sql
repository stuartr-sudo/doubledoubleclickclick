-- ============================================================================
-- STREAMLINED SETUP - FIXED VERSION
-- Removes all onboarding friction (no non-existent columns)
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_role TEXT;
  v_usernames TEXT[];
  v_tokens INTEGER;
BEGIN
  -- Get current user
  SELECT id, email INTO v_user_id, v_email
  FROM user_profiles
  WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%'
  ORDER BY created_date DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '🚀 STREAMLINED SETUP STARTING';
  RAISE NOTICE 'User: % (%)', v_email, v_user_id;
  RAISE NOTICE '========================================';

  -- 1. Set assigned_usernames to "keppi"
  UPDATE user_profiles
  SET assigned_usernames = ARRAY['keppi'],
      updated_date = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ 1. Assigned username: keppi';

  -- 2. Mark all tutorials as complete (skip onboarding)
  UPDATE user_profiles
  SET completed_tutorial_ids = ARRAY[
    'welcome_onboarding',
    'getting_started_scrape',
    'topics_onboarding'
  ],
  updated_date = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ 2. All tutorials marked complete';

  -- 3. Ensure generous token balance
  UPDATE user_profiles
  SET token_balance = GREATEST(COALESCE(token_balance, 0), 1000),
      updated_date = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ 3. Token balance set to 1000';

  -- 4. Ensure superadmin status
  UPDATE user_profiles
  SET role = 'superadmin'::user_role,
      is_superadmin = true,
      updated_date = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ 4. Superadmin status confirmed';

  -- Get final state
  SELECT 
    role::TEXT,
    assigned_usernames,
    token_balance
  INTO v_role, v_usernames, v_tokens
  FROM user_profiles
  WHERE id = v_user_id;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Role: %', v_role;
  RAISE NOTICE 'Usernames: %', v_usernames;
  RAISE NOTICE 'Tokens: %', v_tokens;
  RAISE NOTICE 'Tutorials: 3/3 complete';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '1. Refresh your browser (Cmd+R)';
  RAISE NOTICE '2. Go to Topics page';
  RAISE NOTICE '3. Select "keppi" from dropdown';
  RAISE NOTICE '4. Start using Flash automation!';
  RAISE NOTICE '';
  RAISE NOTICE '✨ No more onboarding friction!';
  RAISE NOTICE '========================================';

END $$;

-- Refresh schema
NOTIFY pgrst, 'reload schema';

