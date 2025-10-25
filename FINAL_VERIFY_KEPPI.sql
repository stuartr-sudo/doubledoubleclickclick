-- ============================================================================
-- FINAL VERIFICATION: Is "keppi" properly set up?
-- ============================================================================

DO $$
DECLARE
  v_user RECORD;
  v_keppi_in_usernames BOOLEAN;
  v_user_exists BOOLEAN := false;
  v_has_keppi BOOLEAN := false;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 FINAL KEPPI VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check user_profiles
  SELECT 
    id,
    email,
    full_name,
    role::TEXT,
    is_superadmin,
    assigned_usernames,
    token_balance
  INTO v_user
  FROM user_profiles
  WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%'
  ORDER BY created_date DESC
  LIMIT 1;

  IF v_user.id IS NULL THEN
    RAISE NOTICE '❌ No user found';
    v_user_exists := false;
  ELSE
    v_user_exists := true;
    RAISE NOTICE '✅ USER FOUND';
    RAISE NOTICE 'Email: %', v_user.email;
    RAISE NOTICE 'Full Name: %', v_user.full_name;
    RAISE NOTICE 'Role: %', v_user.role;
    RAISE NOTICE 'Is Superadmin: %', v_user.is_superadmin;
    RAISE NOTICE 'Token Balance: %', v_user.token_balance;
    RAISE NOTICE '';
    
    -- Check assigned_usernames
    IF v_user.assigned_usernames IS NULL OR array_length(v_user.assigned_usernames, 1) IS NULL THEN
      RAISE NOTICE '❌ NO ASSIGNED USERNAMES';
      v_has_keppi := false;
    ELSIF 'keppi' = ANY(v_user.assigned_usernames) THEN
      RAISE NOTICE '✅ "keppi" IS IN assigned_usernames: %', v_user.assigned_usernames;
      v_has_keppi := true;
    ELSE
      RAISE NOTICE '❌ "keppi" NOT IN assigned_usernames: %', v_user.assigned_usernames;
      RAISE NOTICE '🔧 FIXING NOW...';
      
      UPDATE user_profiles
      SET assigned_usernames = ARRAY['keppi'],
          updated_date = NOW()
      WHERE id = v_user.id;
      
      RAISE NOTICE '✅ FIXED: "keppi" added to assigned_usernames';
      v_has_keppi := true;
    END IF;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '--- Checking usernames table ---';
  
  -- Check usernames table
  SELECT EXISTS (
    SELECT 1 FROM usernames WHERE user_name = 'keppi'
  ) INTO v_keppi_in_usernames;

  IF v_keppi_in_usernames THEN
    RAISE NOTICE '✅ "keppi" exists in usernames table';
    
    FOR v_user IN 
      SELECT user_name, display_name, is_active
      FROM usernames
      WHERE user_name = 'keppi'
    LOOP
      RAISE NOTICE '   Username: %', v_user.user_name;
      RAISE NOTICE '   Display Name: %', v_user.display_name;
      RAISE NOTICE '   Is Active: %', v_user.is_active;
    END LOOP;
  ELSE
    RAISE NOTICE '❌ "keppi" NOT in usernames table';
    RAISE NOTICE '🔧 CREATING NOW...';
    
    INSERT INTO usernames (user_name, display_name, is_active, created_date)
    VALUES ('keppi', 'Keppi', true, NOW())
    ON CONFLICT (user_name) DO NOTHING;
    
    RAISE NOTICE '✅ CREATED: "keppi" added to usernames table';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. User account: %', CASE WHEN v_user_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '2. "keppi" in assigned_usernames: %', CASE WHEN v_has_keppi THEN '✅' ELSE '❌' END;
  RAISE NOTICE '3. "keppi" in usernames table: %', CASE WHEN v_keppi_in_usernames THEN '✅' ELSE '❌' END;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 ACTION REQUIRED:';
  RAISE NOTICE '1. Wait for Vercel deployment to finish (2-3 min)';
  RAISE NOTICE '2. Hard refresh browser (Cmd+Shift+R)';
  RAISE NOTICE '3. Clear browser cache if needed';
  RAISE NOTICE '4. Log out and log back in';
  RAISE NOTICE '';
  RAISE NOTICE 'Then "keppi" should appear in the dropdown!';
  RAISE NOTICE '========================================';

  -- Refresh schema
  NOTIFY pgrst, 'reload schema';

END $$;

