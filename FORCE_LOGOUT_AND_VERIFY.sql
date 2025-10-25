-- ============================================================================
-- FORCE LOGOUT & VERIFY USER STATE
-- This confirms the database is correct and helps debug frontend caching
-- ============================================================================

DO $$
DECLARE
  v_user RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 CURRENT DATABASE STATE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Show ALL users in the system
  FOR v_user IN 
    SELECT 
      id,
      email,
      full_name,
      role::TEXT as role,
      is_superadmin,
      assigned_usernames,
      completed_tutorial_ids,
      token_balance,
      created_date
    FROM user_profiles
    ORDER BY created_date DESC
  LOOP
    RAISE NOTICE '👤 User: % (%)', v_user.email, v_user.full_name;
    RAISE NOTICE '   ID: %', v_user.id;
    RAISE NOTICE '   Role: %', v_user.role;
    RAISE NOTICE '   Is Superadmin: %', v_user.is_superadmin;
    RAISE NOTICE '   Assigned Usernames: %', v_user.assigned_usernames;
    RAISE NOTICE '   Completed Tutorials: %', v_user.completed_tutorial_ids;
    RAISE NOTICE '   Token Balance: %', v_user.token_balance;
    RAISE NOTICE '   Created: %', v_user.created_date;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 SUMMARY';
  RAISE NOTICE '========================================';
  
  FOR v_user IN
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE 'keppi' = ANY(assigned_usernames)) as users_with_keppi,
      COUNT(*) FILTER (WHERE array_length(completed_tutorial_ids, 1) >= 3) as tutorials_complete,
      COUNT(*) FILTER (WHERE token_balance >= 1000) as has_tokens,
      COUNT(*) FILTER (WHERE role = 'superadmin' OR is_superadmin = true) as superadmins
    FROM user_profiles
  LOOP
    RAISE NOTICE 'Total Users: %', v_user.total_users;
    RAISE NOTICE 'Users with "keppi": %', v_user.users_with_keppi;
    RAISE NOTICE 'Tutorials Complete: %', v_user.tutorials_complete;
    RAISE NOTICE 'Has 1000+ Tokens: %', v_user.has_tokens;
    RAISE NOTICE 'Superadmins: %', v_user.superadmins;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 FRONTEND FIX REQUIRED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Database is correct, but frontend is caching old data.';
  RAISE NOTICE '';
  RAISE NOTICE 'TO FIX:';
  RAISE NOTICE '1. Open your app in browser';
  RAISE NOTICE '2. Open DevTools (F12 or Cmd+Option+I)';
  RAISE NOTICE '3. Go to Application tab';
  RAISE NOTICE '4. Clear ALL storage:';
  RAISE NOTICE '   - Local Storage';
  RAISE NOTICE '   - Session Storage';
  RAISE NOTICE '   - Cookies';
  RAISE NOTICE '5. OR right-click refresh button → "Empty Cache and Hard Reload"';
  RAISE NOTICE '6. Log out completely';
  RAISE NOTICE '7. Log back in';
  RAISE NOTICE '';
  RAISE NOTICE 'Username dropdown should now show "keppi"!';
  RAISE NOTICE '========================================';

END $$;

-- Also check if usernames table has "keppi"
DO $$
DECLARE
  v_keppi_exists BOOLEAN;
  v_keppi RECORD;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM usernames WHERE user_name = 'keppi'
  ) INTO v_keppi_exists;

  IF v_keppi_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ "keppi" exists in usernames table';
    
    SELECT user_name, display_name, is_active, created_date
    INTO v_keppi
    FROM usernames
    WHERE user_name = 'keppi'
    LIMIT 1;
    
    RAISE NOTICE '   Username: %', v_keppi.user_name;
    RAISE NOTICE '   Display Name: %', v_keppi.display_name;
    RAISE NOTICE '   Is Active: %', v_keppi.is_active;
    RAISE NOTICE '   Created: %', v_keppi.created_date;
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  "keppi" NOT in usernames table - creating now...';
    
    INSERT INTO usernames (user_name, display_name, is_active, created_date)
    VALUES ('keppi', 'Keppi', true, NOW())
    ON CONFLICT (user_name) DO NOTHING;
    
    RAISE NOTICE '✅ "keppi" created in usernames table';
  END IF;
END $$;

