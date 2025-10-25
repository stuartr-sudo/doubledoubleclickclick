-- Check if the Topics page local dropdown should show usernames

DO $$
DECLARE
    user_profile RECORD;
    username_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 TOPICS PAGE DROPDOWN DIAGNOSTIC';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- 1. Get current user's assigned usernames
    SELECT 
        id,
        email, 
        role::TEXT, 
        is_superadmin, 
        assigned_usernames,
        COALESCE(array_length(assigned_usernames, 1), 0) as username_count
    INTO user_profile
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF user_profile IS NOT NULL THEN
        RAISE NOTICE '--- YOUR USER PROFILE ---';
        RAISE NOTICE 'Email: %', user_profile.email;
        RAISE NOTICE 'Role: %', user_profile.role;
        RAISE NOTICE 'Is Superadmin: %', user_profile.is_superadmin;
        RAISE NOTICE 'Assigned Usernames: %', user_profile.assigned_usernames;
        RAISE NOTICE 'Username Count: %', user_profile.username_count;
        RAISE NOTICE '';
        
        IF user_profile.username_count = 0 THEN
            RAISE NOTICE '❌ NO USERNAMES ASSIGNED!';
            RAISE NOTICE '   The Topics page dropdown will be empty.';
            RAISE NOTICE '';
        ELSIF 'keppi' = ANY(user_profile.assigned_usernames) THEN
            RAISE NOTICE '✅ "keppi" is in your assigned_usernames';
            RAISE NOTICE '   It should appear in the dropdown!';
            RAISE NOTICE '';
        ELSE
            RAISE NOTICE '⚠️  "keppi" is NOT in your assigned_usernames';
            RAISE NOTICE '   Available usernames: %', user_profile.assigned_usernames;
            RAISE NOTICE '';
        END IF;
    ELSE
        RAISE NOTICE '❌ No user profile found';
    END IF;

    -- 2. Check all active usernames in the system
    RAISE NOTICE '--- ALL ACTIVE USERNAMES ---';
    FOR r IN (
        SELECT user_name, display_name, is_active 
        FROM public.usernames 
        WHERE is_active = true 
        ORDER BY user_name
    )
    LOOP
        RAISE NOTICE '  • % (display: %)', r.user_name, r.display_name;
    END LOOP;

    SELECT COUNT(*) INTO username_count 
    FROM public.usernames 
    WHERE is_active = true;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total active usernames: %', username_count;
    RAISE NOTICE '';

    -- 3. Explain the dropdown logic
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 TOPICS PAGE DROPDOWN LOGIC';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'The "Select username" dropdown on Topics page shows:';
    RAISE NOTICE '';
    RAISE NOTICE 'IF workspace_scoping is DISABLED (current):';
    RAISE NOTICE '  → Shows your assigned_usernames array';
    RAISE NOTICE '  → Current: %', user_profile.assigned_usernames;
    RAISE NOTICE '';
    RAISE NOTICE 'IF workspace_scoping is ENABLED:';
    RAISE NOTICE '  → Would use the global dropdown (top nav)';
    RAISE NOTICE '  → Currently disabled, so not applicable';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔧 SOLUTION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF user_profile.username_count = 0 THEN
        RAISE NOTICE '❌ PROBLEM: No usernames assigned to your account';
        RAISE NOTICE '';
        RAISE NOTICE '✅ FIX: Run this SQL:';
        RAISE NOTICE '';
        RAISE NOTICE 'UPDATE user_profiles';
        RAISE NOTICE 'SET assigned_usernames = ARRAY[''keppi'']';
        RAISE NOTICE 'WHERE id = auth.uid();';
        RAISE NOTICE '';
    ELSIF 'keppi' = ANY(user_profile.assigned_usernames) THEN
        RAISE NOTICE '✅ You have "keppi" assigned';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps:';
        RAISE NOTICE '1. Hard refresh browser (Cmd+Shift+R)';
        RAISE NOTICE '2. Click "Select username" dropdown on Topics page';
        RAISE NOTICE '3. Choose "keppi" from the list';
        RAISE NOTICE '4. Keywords and FAQs should load!';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '⚠️  "keppi" not in your assigned usernames';
        RAISE NOTICE '';
        RAISE NOTICE '✅ FIX: Run this SQL:';
        RAISE NOTICE '';
        RAISE NOTICE 'UPDATE user_profiles';
        RAISE NOTICE 'SET assigned_usernames = array_append(assigned_usernames, ''keppi'')';
        RAISE NOTICE 'WHERE id = auth.uid();';
        RAISE NOTICE '';
    END IF;

    RAISE NOTICE '========================================';

END $$;

