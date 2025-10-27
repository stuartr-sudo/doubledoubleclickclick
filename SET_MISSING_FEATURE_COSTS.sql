-- Set dollar costs for all AI features that are currently free
-- These features are currently letting users use them WITHOUT payment!

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '💰 SETTING MISSING FEATURE COSTS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- Update features with reasonable costs based on their complexity
UPDATE public.feature_flags
SET 
    dollar_cost = CASE flag_name
        -- Core AI Features (High Usage)
        WHEN 'ai_cite_sources' THEN 0.10
        WHEN 'ai_sitemap_link' THEN 0.08
        WHEN 'ai_tiktok' THEN 0.15
        WHEN 'ai_brand_it' THEN 0.12
        WHEN 'ai_affilify' THEN 0.12
        WHEN 'ai_humanize' THEN 0.15
        WHEN 'ai_detect_content' THEN 0.08
        WHEN 'ai_cleanup_html' THEN 0.05
        
        -- Topics Features
        WHEN 'topics_get_questions' THEN 0.15
        WHEN 'topics_assignment_complete' THEN 0.05
        
        -- Workflow Features
        WHEN 'ai_workflow' THEN 0.20
        WHEN 'flash_workflow' THEN 0.25
        
        -- Localization/Translation
        WHEN 'ai_localize' THEN 0.18
        WHEN 'ai_translate' THEN 0.15
        
        -- SEO Features
        WHEN 'ai_seo_optimize' THEN 0.12
        WHEN 'ai_meta_description' THEN 0.08
        
        ELSE 0.10  -- Default cost for any other AI features
    END,
    updated_date = now()
WHERE (flag_name LIKE 'ai_%' OR flag_name LIKE 'topics_%' OR flag_name LIKE 'flash_%')
  AND dollar_cost IS NULL;

-- Get count of updated features
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Updated % features with dollar costs', updated_count;
    RAISE NOTICE '';
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Show all AI features with their costs
SELECT 
    flag_name,
    '$' || dollar_cost::TEXT as cost,
    is_enabled,
    CASE 
        WHEN is_enabled THEN '✅ Active'
        ELSE '⏸️  Disabled'
    END as status
FROM public.feature_flags
WHERE flag_name LIKE 'ai_%' 
   OR flag_name LIKE 'topics_%'
   OR flag_name LIKE 'flash_%'
ORDER BY dollar_cost DESC, flag_name;

-- Final summary
DO $$
DECLARE
    total_features INTEGER;
    free_features INTEGER;
    avg_cost NUMERIC;
BEGIN
    SELECT COUNT(*), SUM(CASE WHEN dollar_cost IS NULL OR dollar_cost = 0 THEN 1 ELSE 0 END), AVG(dollar_cost)
    INTO total_features, free_features, avg_cost
    FROM public.feature_flags
    WHERE flag_name LIKE 'ai_%' OR flag_name LIKE 'topics_%' OR flag_name LIKE 'flash_%';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 FEATURE COST SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total AI Features: %', total_features;
    RAISE NOTICE 'Free Features: %', free_features;
    RAISE NOTICE 'Average Cost: $%', ROUND(avg_cost, 2);
    RAISE NOTICE '';
    IF free_features = 0 THEN
        RAISE NOTICE '🎉 ALL FEATURES NOW HAVE COSTS!';
        RAISE NOTICE 'Users will be charged for all AI usage.';
    ELSE
        RAISE NOTICE '⚠️  % features are still free', free_features;
        RAISE NOTICE 'Users can use these without payment!';
    END IF;
    RAISE NOTICE '========================================';
END $$;

