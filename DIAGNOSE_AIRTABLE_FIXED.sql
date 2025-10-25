-- Diagnose Airtable connection and Topics page data loading (FIXED)

DO $$
DECLARE
    user_profile RECORD;
    keppi_username RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 AIRTABLE CONNECTION DIAGNOSTIC';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- 1. Check current user profile
    RAISE NOTICE '--- USER PROFILE ---';
    SELECT email, role::TEXT, is_superadmin, assigned_usernames
    INTO user_profile
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF user_profile IS NOT NULL THEN
        RAISE NOTICE 'Email: %', user_profile.email;
        RAISE NOTICE 'Role: %', user_profile.role;
        RAISE NOTICE 'Is Superadmin: %', user_profile.is_superadmin;
        RAISE NOTICE 'Assigned Usernames: %', user_profile.assigned_usernames;
    ELSE
        RAISE NOTICE '❌ No user profile found for current user';
    END IF;

    RAISE NOTICE '';

    -- 2. Check if keppi username exists
    RAISE NOTICE '--- KEPPI USERNAME ---';
    SELECT user_name, display_name, is_active
    INTO keppi_username
    FROM public.usernames
    WHERE user_name = 'keppi';
    
    IF keppi_username IS NOT NULL THEN
        RAISE NOTICE '✓ Keppi username exists';
        RAISE NOTICE '  Display Name: %', keppi_username.display_name;
        RAISE NOTICE '  Is Active: %', keppi_username.is_active;
    ELSE
        RAISE NOTICE '❌ Keppi username NOT FOUND in usernames table';
    END IF;

    RAISE NOTICE '';

    -- 3. Check if "keppi" is in assigned_usernames array
    IF user_profile.assigned_usernames IS NOT NULL THEN
        IF 'keppi' = ANY(user_profile.assigned_usernames) THEN
            RAISE NOTICE '✓ "keppi" is in your assigned_usernames array';
        ELSE
            RAISE NOTICE '❌ "keppi" is NOT in your assigned_usernames array';
            RAISE NOTICE '   Current assigned_usernames: %', user_profile.assigned_usernames;
        END IF;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 AIRTABLE DATA FLOW';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'When you select "keppi" from the dropdown:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Frontend calls: /api/airtable/list';
    RAISE NOTICE '   - With tableId and username filter';
    RAISE NOTICE '';
    RAISE NOTICE '2. Serverless function needs these ENV VARS:';
    RAISE NOTICE '   ✓ VITE_AIRTABLE_API_KEY';
    RAISE NOTICE '   ✓ VITE_AIRTABLE_BASE_ID';
    RAISE NOTICE '   ✓ VITE_AIRTABLE_KEYWORD_MAP_TABLE_ID';
    RAISE NOTICE '   ✓ VITE_AIRTABLE_FAQ_TABLE_ID';
    RAISE NOTICE '';
    RAISE NOTICE '3. Returns Airtable records filtered by:';
    RAISE NOTICE '   - Username field = "keppi"';
    RAISE NOTICE '';
    RAISE NOTICE '4. Topics page displays:';
    RAISE NOTICE '   - Keywords with Target Market, Promoted Product';
    RAISE NOTICE '   - FAQs linked to keywords';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔧 TROUBLESHOOTING STEPS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '1. Type "allow pasting" in browser console';
    RAISE NOTICE '';
    RAISE NOTICE '2. Paste this code in console:';
    RAISE NOTICE '   console.log({';
    RAISE NOTICE '     apiKey: import.meta.env.VITE_AIRTABLE_API_KEY,';
    RAISE NOTICE '     baseId: import.meta.env.VITE_AIRTABLE_BASE_ID,';
    RAISE NOTICE '     keywordTable: import.meta.env.VITE_AIRTABLE_KEYWORD_MAP_TABLE_ID,';
    RAISE NOTICE '     faqTable: import.meta.env.VITE_AIRTABLE_FAQ_TABLE_ID';
    RAISE NOTICE '   });';
    RAISE NOTICE '';
    RAISE NOTICE '3. Check Network tab for:';
    RAISE NOTICE '   - /api/airtable/list requests';
    RAISE NOTICE '   - Look for 401/403 errors (auth)';
    RAISE NOTICE '   - Look for 404 errors (wrong table ID)';
    RAISE NOTICE '';
    RAISE NOTICE '4. Check Console tab for:';
    RAISE NOTICE '   - "loadDataForUser" messages';
    RAISE NOTICE '   - Airtable API errors';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';

END $$;

