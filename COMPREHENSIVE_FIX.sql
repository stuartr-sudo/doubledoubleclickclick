-- ============================================================================
-- COMPREHENSIVE FIX: Username dropdown, Topics onboarding, and Airtable
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 COMPREHENSIVE FIX STARTING';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Get your user ID
  SELECT id, email INTO v_user_id, v_email
  FROM user_profiles
  WHERE email = 'stuarta@doubleclick.work';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found!';
  END IF;

  RAISE NOTICE '👤 Found user: % (%)', v_email, v_user_id;
  RAISE NOTICE '';

  -- 1. Ensure assigned_usernames has "keppi"
  RAISE NOTICE '1️⃣  Fixing assigned_usernames...';
  UPDATE user_profiles
  SET 
    assigned_usernames = ARRAY['keppi'],
    updated_date = NOW()
  WHERE id = v_user_id;
  RAISE NOTICE '   ✅ Set assigned_usernames = [keppi]';

  -- 2. Ensure "keppi" exists in usernames table
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  Ensuring keppi in usernames table...';
  INSERT INTO usernames (user_name, display_name, is_active, created_date)
  VALUES ('keppi', 'Keppi', true, NOW())
  ON CONFLICT (user_name) DO UPDATE SET
    is_active = true,
    display_name = 'Keppi',
    updated_date = NOW();
  RAISE NOTICE '   ✅ keppi exists in usernames table';

  -- 3. Mark Topics onboarding as complete
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  Marking Topics onboarding complete...';
  
  -- Check if topics field exists and what type it is
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' 
    AND column_name = 'topics'
  ) THEN
    -- Update topics array to include 'keppi'
    UPDATE user_profiles
    SET 
      topics = CASE 
        WHEN topics IS NULL THEN ARRAY['keppi']
        WHEN NOT ('keppi' = ANY(topics)) THEN array_append(topics, 'keppi')
        ELSE topics
      END,
      updated_date = NOW()
    WHERE id = v_user_id;
    RAISE NOTICE '   ✅ Added keppi to topics array';
  ELSE
    RAISE NOTICE '   ⚠️  topics column does not exist - creating it...';
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS topics TEXT[];
    UPDATE user_profiles
    SET topics = ARRAY['keppi']
    WHERE id = v_user_id;
    RAISE NOTICE '   ✅ Created topics column and added keppi';
  END IF;

  -- 4. Set topics_onboarding_completed_at
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  Setting onboarding completion timestamp...';
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' 
    AND column_name = 'topics_onboarding_completed_at'
  ) THEN
    UPDATE user_profiles
    SET topics_onboarding_completed_at = jsonb_build_object('keppi', NOW())::TEXT
    WHERE id = v_user_id;
    RAISE NOTICE '   ✅ Set topics_onboarding_completed_at';
  ELSE
    RAISE NOTICE '   ⚠️  topics_onboarding_completed_at column does not exist - creating it...';
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS topics_onboarding_completed_at TEXT;
    UPDATE user_profiles
    SET topics_onboarding_completed_at = jsonb_build_object('keppi', NOW())::TEXT
    WHERE id = v_user_id;
    RAISE NOTICE '   ✅ Created column and set timestamp';
  END IF;

  -- 5. Ensure feature flags are enabled
  RAISE NOTICE '';
  RAISE NOTICE '5️⃣  Checking feature flags...';
  
  INSERT INTO feature_flags (flag_name, description, is_enabled, created_date, updated_date)
  VALUES 
    ('use_workspace_scoping', 'Enables global username selector', true, NOW(), NOW()),
    ('show_user_management_link', 'Shows user management link', true, NOW(), NOW())
  ON CONFLICT (flag_name) DO UPDATE SET
    is_enabled = true,
    updated_date = NOW();
  RAISE NOTICE '   ✅ Feature flags enabled';

  -- 6. Verify final state
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 FINAL STATE';
  RAISE NOTICE '========================================';
  
  DECLARE
    v_final_email TEXT;
    v_final_role TEXT;
    v_final_superadmin BOOLEAN;
    v_final_usernames TEXT[];
    v_final_topics TEXT[];
    v_final_timestamp TEXT;
    v_final_tokens INTEGER;
  BEGIN
    SELECT 
      email,
      role::TEXT,
      is_superadmin,
      assigned_usernames,
      topics,
      topics_onboarding_completed_at,
      token_balance
    INTO
      v_final_email,
      v_final_role,
      v_final_superadmin,
      v_final_usernames,
      v_final_topics,
      v_final_timestamp,
      v_final_tokens
    FROM user_profiles
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Email: %', v_final_email;
    RAISE NOTICE 'Role: %', v_final_role;
    RAISE NOTICE 'Is Superadmin: %', v_final_superadmin;
    RAISE NOTICE 'Assigned Usernames: %', v_final_usernames;
    RAISE NOTICE 'Topics Complete: %', v_final_topics;
    RAISE NOTICE 'Topics Timestamp: %', v_final_timestamp;
    RAISE NOTICE 'Token Balance: %', v_final_tokens;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL FIXES APPLIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Hard refresh browser (Cmd+Shift+R)';
  RAISE NOTICE '2. Clear Application Storage in DevTools';
  RAISE NOTICE '3. Log out completely';
  RAISE NOTICE '4. Log back in';
  RAISE NOTICE '5. Username dropdown should appear in top nav';
  RAISE NOTICE '6. Go to /DebugUsernames to verify';
  RAISE NOTICE '';

  -- Refresh schema
  NOTIFY pgrst, 'reload schema';

END $$;

