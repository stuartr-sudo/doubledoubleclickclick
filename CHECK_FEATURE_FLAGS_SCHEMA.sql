-- Check the actual schema of feature_flags table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'feature_flags'
ORDER BY ordinal_position;

-- Check if dollar_cost column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'feature_flags' 
          AND column_name = 'dollar_cost'
    ) THEN
        RAISE NOTICE '✅ dollar_cost column EXISTS';
    ELSE
        RAISE NOTICE '❌ dollar_cost column DOES NOT EXIST!';
        RAISE NOTICE 'You need to run the migration: 031_dollar_balance_system.sql';
    END IF;
END $$;

-- Show sample data from one feature
SELECT * FROM public.feature_flags WHERE flag_name = 'ai_title_rewrite' LIMIT 1;

