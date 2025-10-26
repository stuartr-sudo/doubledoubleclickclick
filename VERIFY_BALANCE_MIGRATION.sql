-- ============================================================================
-- VERIFICATION SCRIPT: Dollar Balance System Migration
-- ============================================================================
-- Run this to verify the migration completed successfully
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 VERIFYING MIGRATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- Check 1: Verify new tables exist
DO $$
BEGIN
    RAISE NOTICE '1️⃣ Checking new tables...';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'balance_transactions') THEN
        RAISE NOTICE '   ✅ balance_transactions table exists';
    ELSE
        RAISE NOTICE '   ❌ balance_transactions table NOT FOUND';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'balance_top_ups') THEN
        RAISE NOTICE '   ✅ balance_top_ups table exists';
    ELSE
        RAISE NOTICE '   ❌ balance_top_ups table NOT FOUND';
    END IF;
END $$;

-- Check 2: Verify column renames
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣ Checking column renames...';
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'account_balance') THEN
        RAISE NOTICE '   ✅ user_profiles.account_balance exists';
    ELSE
        RAISE NOTICE '   ❌ user_profiles.account_balance NOT FOUND (still token_balance?)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'dollar_cost') THEN
        RAISE NOTICE '   ✅ feature_flags.dollar_cost exists';
    ELSE
        RAISE NOTICE '   ❌ feature_flags.dollar_cost NOT FOUND (still token_cost?)';
    END IF;
END $$;

-- Check 3: Verify default balance
DO $$
DECLARE
    default_val TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '3️⃣ Checking default balance...';
    
    SELECT column_default INTO default_val
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'account_balance';
    
    IF default_val IS NOT NULL THEN
        RAISE NOTICE '   ✅ Default account_balance: %', default_val;
    ELSE
        RAISE NOTICE '   ⚠️  No default set for account_balance';
    END IF;
END $$;

-- Check 4: Verify feature costs
DO $$
DECLARE
    feature_count INTEGER;
    min_cost NUMERIC;
    max_cost NUMERIC;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '4️⃣ Checking feature costs...';
    
    SELECT COUNT(*), MIN(dollar_cost), MAX(dollar_cost)
    INTO feature_count, min_cost, max_cost
    FROM public.feature_flags
    WHERE dollar_cost IS NOT NULL;
    
    RAISE NOTICE '   ✅ Features with costs: %', feature_count;
    RAISE NOTICE '   💰 Cost range: $% - $%', min_cost, max_cost;
END $$;

-- Check 5: Show sample feature costs
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '5️⃣ Sample feature costs:';
END $$;

SELECT 
    flag_name,
    '$' || dollar_cost::TEXT as cost,
    is_enabled
FROM public.feature_flags
WHERE flag_name IN (
    'ai_title_rewrite',
    'ai_rewriter',
    'generate_image',
    'ai_imagineer',
    'voice_ai'
)
ORDER BY dollar_cost;

-- Check 6: Verify helper function
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '6️⃣ Checking helper functions...';
    
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'log_balance_transaction'
    ) THEN
        RAISE NOTICE '   ✅ log_balance_transaction() function exists';
    ELSE
        RAISE NOTICE '   ❌ log_balance_transaction() function NOT FOUND';
    END IF;
END $$;

-- Check 7: Verify RLS is enabled
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '7️⃣ Checking Row Level Security...';
    
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'balance_transactions' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '   ✅ RLS enabled on balance_transactions';
    ELSE
        RAISE NOTICE '   ❌ RLS NOT enabled on balance_transactions';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'balance_top_ups' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '   ✅ RLS enabled on balance_top_ups';
    ELSE
        RAISE NOTICE '   ❌ RLS NOT enabled on balance_top_ups';
    END IF;
END $$;

-- Check 8: Count current users and their balances
DO $$
DECLARE
    total_users INTEGER;
    users_with_balance INTEGER;
    avg_balance NUMERIC;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '8️⃣ User balance summary...';
    
    SELECT COUNT(*) INTO total_users FROM public.user_profiles;
    SELECT COUNT(*) INTO users_with_balance FROM public.user_profiles WHERE account_balance > 0;
    SELECT AVG(account_balance) INTO avg_balance FROM public.user_profiles;
    
    RAISE NOTICE '   👥 Total users: %', total_users;
    RAISE NOTICE '   💵 Users with balance: %', users_with_balance;
    RAISE NOTICE '   📊 Average balance: $%', ROUND(avg_balance, 2);
END $$;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ VERIFICATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next: Deploy your app to Vercel';
    RAISE NOTICE '   The frontend is already updated!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Remember to set environment variables:';
    RAISE NOTICE '   • STRIPE_PUBLISHABLE_KEY';
    RAISE NOTICE '   • STRIPE_SECRET_KEY';
    RAISE NOTICE '   • STRIPE_WEBHOOK_SECRET';
    RAISE NOTICE '========================================';
END $$;

