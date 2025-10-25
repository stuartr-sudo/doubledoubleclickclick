-- Diagnose Airtable connection and Topics page data loading

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
    SELECT user_name, display_name, is_active, assigned_to_user_id
    INTO keppi_username
    FROM public.usernames
    WHERE user_name = 'keppi';
    
    IF keppi_username IS NOT NULL THEN
        RAISE NOTICE '✓ Keppi username exists';
        RAISE NOTICE '  Display Name: %', keppi_username.display_name;
        RAISE NOTICE '  Is Active: %', keppi_username.is_active;
        RAISE NOTICE '  Assigned To: %', keppi_username.assigned_to_user_id;
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
    RAISE NOTICE '📋 AIRTABLE DATA REQUIREMENTS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'The Topics page fetches data from Airtable using:';
    RAISE NOTICE '1. VITE_AIRTABLE_API_KEY (in Vercel env vars)';
    RAISE NOTICE '2. VITE_AIRTABLE_BASE_ID (in Vercel env vars)';
    RAISE NOTICE '3. VITE_AIRTABLE_KEYWORD_MAP_TABLE_ID (in Vercel env vars)';
    RAISE NOTICE '4. VITE_AIRTABLE_FAQ_TABLE_ID (in Vercel env vars)';
    RAISE NOTICE '';
    RAISE NOTICE 'Data flow:';
    RAISE NOTICE '1. User selects "keppi" from dropdown';
    RAISE NOTICE '2. Frontend calls Airtable API via serverless function';
    RAISE NOTICE '3. Filters records by Username field = "keppi"';
    RAISE NOTICE '4. Returns keywords with fields:';
    RAISE NOTICE '   - Keyword';
    RAISE NOTICE '   - Target Market (array)';
    RAISE NOTICE '   - Promoted Product (array)';
    RAISE NOTICE '   - Search Volume';
    RAISE NOTICE '   - Select Keyword (boolean)';
    RAISE NOTICE '   - Flash Template (text)';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔧 NEXT STEPS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Check browser console for:';
    RAISE NOTICE '1. Airtable API errors';
    RAISE NOTICE '2. "loadDataForUser" log messages';
    RAISE NOTICE '3. Network tab for failed API calls';
    RAISE NOTICE '';
    RAISE NOTICE 'Verify Vercel environment variables:';
    RAISE NOTICE '1. Go to Vercel dashboard';
    RAISE NOTICE '2. Project Settings > Environment Variables';
    RAISE NOTICE '3. Confirm all VITE_AIRTABLE_* variables are set';
    RAISE NOTICE '4. Redeploy if you just added them';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';

END $$;

