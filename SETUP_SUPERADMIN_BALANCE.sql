-- ============================================================================
-- SETUP: Credit Superadmin & Enable Balance Display
-- ============================================================================
-- This script:
-- 1. Credits superadmin with $1000.00
-- 2. Enables the account balance display feature flag
-- 3. Verifies everything is working
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '💰 SUPERADMIN BALANCE SETUP';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- Step 1: Credit superadmin with $1000
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    RAISE NOTICE '1️⃣ Crediting superadmin with $1000...';
    
    UPDATE public.user_profiles
    SET account_balance = 1000.00
    WHERE is_superadmin = true OR role = 'superadmin';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count > 0 THEN
        RAISE NOTICE '   ✅ Updated % superadmin account(s)', updated_count;
    ELSE
        RAISE NOTICE '   ⚠️  No superadmin accounts found';
    END IF;
END $$;

-- Step 2: Enable balance display feature flag
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣ Enabling balance display feature flag...';
    
    -- Insert or update the feature flag
    INSERT INTO public.feature_flags (
      flag_name,
      description,
      is_enabled,
      created_date,
      updated_date
    ) VALUES (
      'show_account_balance',
      'Shows the account balance in the top menu bar',
      true,
      now(),
      now()
    )
    ON CONFLICT (flag_name)
    DO UPDATE SET
      is_enabled = true,
      description = 'Shows the account balance in the top menu bar',
      updated_date = now();
    
    RAISE NOTICE '   ✅ Feature flag "show_account_balance" enabled';
    
    -- Also migrate old flag if it exists
    UPDATE public.feature_flags
    SET 
      flag_name = 'show_account_balance_legacy',
      is_enabled = false
    WHERE flag_name = 'show_token_balance';
    
END $$;

-- Step 3: Verify superadmin balance
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '3️⃣ Verifying superadmin accounts:';
END $$;

SELECT 
    email,
    full_name,
    role,
    is_superadmin,
    '$' || account_balance::TEXT as balance
FROM public.user_profiles
WHERE is_superadmin = true OR role = 'superadmin'
ORDER BY email;

-- Step 4: Verify feature flag
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '4️⃣ Verifying feature flags:';
END $$;

SELECT 
    flag_name,
    description,
    is_enabled
FROM public.feature_flags
WHERE flag_name IN ('show_account_balance', 'show_token_balance', 'show_account_balance_legacy')
ORDER BY flag_name;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Final summary
DO $$
DECLARE
    superadmin_count INTEGER;
    total_balance NUMERIC;
BEGIN
    SELECT COUNT(*), COALESCE(SUM(account_balance), 0)
    INTO superadmin_count, total_balance
    FROM public.user_profiles
    WHERE is_superadmin = true OR role = 'superadmin';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SETUP COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '   • Superadmin accounts: %', superadmin_count;
    RAISE NOTICE '   • Total balance: $%', total_balance;
    RAISE NOTICE '   • Feature flag: ENABLED';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '   1. Deploy your app to Vercel';
    RAISE NOTICE '   2. Refresh the page';
    RAISE NOTICE '   3. You should see $1000.00 in top menu';
    RAISE NOTICE '   4. User Management should show balance';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

