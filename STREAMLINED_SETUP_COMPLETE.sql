-- ============================================================================
-- STREAMLINED SETUP - ONE-TIME RUN
-- Removes all onboarding friction and sets up everything automatically
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
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

  -- 1. Set assigned_usernames to "keppi" (from screenshot)
  UPDATE user_profiles
  SET assigned_usernames = ARRAY['keppi'],
      updated_date = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ 1. Assigned username: keppi';

  -- 2. Mark Topics onboarding as complete for "keppi"
  UPDATE user_profiles
  SET topics_onboarding_completed_at = jsonb_build_object('keppi', NOW()),
      updated_date = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ 2. Topics onboarding: COMPLETE for keppi';

  -- 3. Mark all tutorials as complete (skip onboarding)
  UPDATE user_profiles
  SET completed_tutorial_ids = ARRAY[
    'welcome_onboarding',
    'getting_started_scrape',
    'topics_onboarding'
  ],
  updated_date = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ 3. All tutorials marked complete';

  -- 4. Give generous token balance
  UPDATE user_profiles
  SET token_balance = 1000,
      updated_date = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ 4. Token balance set to 1000';

  -- 5. Disable use_workspace_scoping feature flag (simplifies UX)
  UPDATE feature_flags
  SET is_enabled = false,
      updated_date = NOW()
  WHERE flag_name = 'use_workspace_scoping';
  
  RAISE NOTICE '✅ 5. Workspace scoping disabled (simpler UX)';

  -- 6. Enable all essential feature flags
  UPDATE feature_flags
  SET is_enabled = true,
      updated_date = NOW()
  WHERE flag_name IN (
    'show_content_feed_link',
    'show_editor_link',
    'show_flash_workflows_link',
    'ai_title_rewrite'
  );
  
  RAISE NOTICE '✅ 6. Essential features enabled';

  -- Final verification
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  
  -- Show final state
  FOR r IN 
    SELECT 
      email,
      role::TEXT,
      assigned_usernames,
      token_balance,
      completed_tutorial_ids,
      topics_onboarding_completed_at
    FROM user_profiles
    WHERE id = v_user_id
  LOOP
    RAISE NOTICE 'Email: %', r.email;
    RAISE NOTICE 'Role: %', r.role;
    RAISE NOTICE 'Usernames: %', r.assigned_usernames;
    RAISE NOTICE 'Tokens: %', r.token_balance;
    RAISE NOTICE 'Tutorials: %', array_length(r.completed_tutorial_ids, 1);
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '1. Log out and log back in';
  RAISE NOTICE '2. Go to Topics page';
  RAISE NOTICE '3. Select "keppi" from username dropdown';
  RAISE NOTICE '4. You should see your Topics/Keywords';
  RAISE NOTICE '';
  RAISE NOTICE '✨ No more onboarding friction!';
  RAISE NOTICE '========================================';

END $$;

-- Refresh schema
NOTIFY pgrst, 'reload schema';

