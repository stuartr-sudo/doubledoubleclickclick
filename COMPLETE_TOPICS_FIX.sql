-- Complete Topics Page Fix
-- Fixes: tutorial video errors, enables global dropdown, adds keppi to global usernames

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔧 COMPLETE TOPICS PAGE FIX';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- 1. Fix tutorial_videos table
    RAISE NOTICE '--- STEP 1: Fix tutorial_videos table ---';
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_videos' 
        AND column_name = 'assigned_page_name'
    ) THEN
        ALTER TABLE public.tutorial_videos
        ADD COLUMN assigned_page_name TEXT;
        RAISE NOTICE '✓ Added assigned_page_name column';
    ELSE
        RAISE NOTICE '✓ assigned_page_name already exists';
    END IF;
    
    -- Update existing records
    UPDATE public.tutorial_videos
    SET assigned_page_name = page_id
    WHERE assigned_page_name IS NULL AND page_id IS NOT NULL;
    RAISE NOTICE '✓ Updated existing tutorial records';
    RAISE NOTICE '';

    -- 2. Enable workspace scoping (global dropdown)
    RAISE NOTICE '--- STEP 2: Enable workspace scoping ---';
    UPDATE feature_flags
    SET is_enabled = true, updated_date = NOW()
    WHERE flag_name = 'use_workspace_scoping';
    RAISE NOTICE '✓ Workspace scoping enabled (uses global dropdown)';
    RAISE NOTICE '';

    -- 3. Add "keppi" to user's assigned_usernames
    RAISE NOTICE '--- STEP 3: Add keppi to global usernames ---';
    UPDATE user_profiles
    SET assigned_usernames = CASE 
        WHEN 'keppi' = ANY(assigned_usernames) THEN assigned_usernames
        ELSE array_append(COALESCE(assigned_usernames, ARRAY[]::text[]), 'keppi')
    END
    WHERE id = auth.uid();
    RAISE NOTICE '✓ Added keppi to your assigned_usernames';
    RAISE NOTICE '';

    -- 4. Verify keppi username exists in usernames table
    RAISE NOTICE '--- STEP 4: Verify keppi username ---';
    IF NOT EXISTS (SELECT 1 FROM public.usernames WHERE user_name = 'keppi') THEN
        INSERT INTO public.usernames (user_name, display_name, is_active)
        VALUES ('keppi', 'Keppi', true)
        ON CONFLICT (user_name) DO NOTHING;
        RAISE NOTICE '✓ Created keppi username entry';
    ELSE
        -- Make sure it's active
        UPDATE public.usernames
        SET is_active = true
        WHERE user_name = 'keppi';
        RAISE NOTICE '✓ Keppi username verified and activated';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL FIXES APPLIED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Hard refresh browser (Cmd+Shift+R)';
    RAISE NOTICE '2. Select "keppi" from TOP NAV dropdown';
    RAISE NOTICE '3. Go to Topics page';
    RAISE NOTICE '4. Data should load automatically';
    RAISE NOTICE '5. NO local dropdown should appear';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';

END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT 
    'Your assigned usernames' as info,
    assigned_usernames 
FROM user_profiles 
WHERE id = auth.uid();

