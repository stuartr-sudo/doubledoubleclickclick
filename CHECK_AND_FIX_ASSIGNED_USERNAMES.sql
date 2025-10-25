-- ============================================================================
-- CHECK AND FIX ASSIGNED USERNAMES
-- The WorkspaceSelector needs assigned_usernames to display
-- ============================================================================

-- 1. Check current user's assigned_usernames
SELECT 
  email,
  role::TEXT,
  is_superadmin,
  assigned_usernames,
  CASE 
    WHEN assigned_usernames IS NULL THEN '❌ NULL'
    WHEN array_length(assigned_usernames, 1) IS NULL THEN '❌ EMPTY ARRAY'
    WHEN array_length(assigned_usernames, 1) > 0 THEN '✅ HAS USERNAMES'
    ELSE '⚠️  UNKNOWN'
  END as status
FROM user_profiles
WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%'
ORDER BY created_date DESC;

-- 2. Check what usernames exist in the usernames table
SELECT 
  id,
  user_name,
  display_name,
  user_id,
  is_active
FROM usernames
WHERE user_id = (
  SELECT id FROM user_profiles 
  WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%'
  LIMIT 1
)
OR is_active = true
ORDER BY created_date DESC;

-- 3. Auto-fix: Add usernames to your user's assigned_usernames array
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_usernames TEXT[];
BEGIN
  -- Get your user ID
  SELECT id, email INTO v_user_id, v_email
  FROM user_profiles
  WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%'
  ORDER BY created_date DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ No user found matching doubleclick or stuart';
    RETURN;
  END IF;

  RAISE NOTICE '👤 Found user: % (%)', v_email, v_user_id;

  -- Get all usernames for this user
  SELECT array_agg(user_name) INTO v_usernames
  FROM usernames
  WHERE user_id = v_user_id
  AND is_active = true;

  IF v_usernames IS NULL OR array_length(v_usernames, 1) IS NULL THEN
    RAISE NOTICE '⚠️  No usernames found in usernames table for this user';
    RAISE NOTICE '💡 You may need to create usernames in User Management first';
    RETURN;
  END IF;

  RAISE NOTICE '📝 Found % username(s): %', array_length(v_usernames, 1), v_usernames;

  -- Update user's assigned_usernames
  UPDATE user_profiles
  SET assigned_usernames = v_usernames,
      updated_date = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE '✅ Updated assigned_usernames for %', v_email;

  -- Verify the update
  SELECT assigned_usernames INTO v_usernames
  FROM user_profiles
  WHERE id = v_user_id;

  RAISE NOTICE '🔍 Verification: assigned_usernames = %', v_usernames;

END $$;

-- 4. Final verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL STATUS';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  email,
  role::TEXT,
  assigned_usernames,
  array_length(assigned_usernames, 1) as username_count
FROM user_profiles
WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%'
ORDER BY created_date DESC;

-- 5. If no usernames exist, show how to create one
DO $$
DECLARE
  v_user_id UUID;
  v_has_usernames BOOLEAN;
BEGIN
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE email LIKE '%doubleclick%' OR email LIKE '%stuart%'
  ORDER BY created_date DESC
  LIMIT 1;

  SELECT EXISTS (
    SELECT 1 FROM usernames WHERE user_id = v_user_id AND is_active = true
  ) INTO v_has_usernames;

  IF NOT v_has_usernames THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📝 TO CREATE A USERNAME:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Go to User Management page (/UserManagement)';
    RAISE NOTICE '2. Click "Add Username" button';
    RAISE NOTICE '3. Enter a username (e.g., "devstuartr")';
    RAISE NOTICE '4. Assign it to your user';
    RAISE NOTICE '';
    RAISE NOTICE 'OR run this SQL:';
    RAISE NOTICE '';
    RAISE NOTICE 'INSERT INTO usernames (user_name, display_name, user_id, is_active)';
    RAISE NOTICE 'VALUES (''devstuartr'', ''Dev Stuart'', ''%'', true);', v_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Then re-run this script to update assigned_usernames.';
    RAISE NOTICE '========================================';
  END IF;
END $$;

