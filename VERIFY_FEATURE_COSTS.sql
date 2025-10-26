-- Verify that all AI features have dollar costs set

-- Show all features with their costs
SELECT 
    flag_name,
    description,
    is_enabled,
    COALESCE('$' || dollar_cost::TEXT, 'NOT SET') as cost,
    CASE 
        WHEN dollar_cost IS NULL THEN '❌ MISSING COST'
        WHEN dollar_cost = 0 THEN '⚠️  FREE'
        ELSE '✅ HAS COST'
    END as status
FROM public.feature_flags
WHERE flag_name LIKE 'ai_%' 
   OR flag_name LIKE 'topics_%'
   OR flag_name = 'voice_ai'
ORDER BY 
    CASE 
        WHEN dollar_cost IS NULL THEN 0
        ELSE 1
    END,
    flag_name;

-- Count features by cost status
SELECT 
    CASE 
        WHEN dollar_cost IS NULL THEN '❌ Missing Cost'
        WHEN dollar_cost = 0 THEN '⚠️  Free Features'
        ELSE '✅ Has Cost'
    END as category,
    COUNT(*) as count
FROM public.feature_flags
WHERE flag_name LIKE 'ai_%' 
   OR flag_name LIKE 'topics_%'
   OR flag_name = 'voice_ai'
GROUP BY 
    CASE 
        WHEN dollar_cost IS NULL THEN '❌ Missing Cost'
        WHEN dollar_cost = 0 THEN '⚠️  Free Features'
        ELSE '✅ Has Cost'
    END
ORDER BY category;

-- Features that need costs added
DO $$
DECLARE
    missing_features TEXT[];
BEGIN
    SELECT ARRAY_AGG(flag_name)
    INTO missing_features
    FROM public.feature_flags
    WHERE (flag_name LIKE 'ai_%' OR flag_name LIKE 'topics_%' OR flag_name = 'voice_ai')
    AND dollar_cost IS NULL;
    
    IF ARRAY_LENGTH(missing_features, 1) > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE '⚠️  FEATURES MISSING DOLLAR COSTS:';
        RAISE NOTICE '========================================';
        FOR i IN 1..ARRAY_LENGTH(missing_features, 1) LOOP
            RAISE NOTICE '  • %', missing_features[i];
        END LOOP;
        RAISE NOTICE '';
        RAISE NOTICE 'These features will be FREE until costs are set!';
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ ALL AI FEATURES HAVE COSTS SET';
        RAISE NOTICE '========================================';
    END IF;
END $$;

