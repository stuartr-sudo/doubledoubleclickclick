-- Direct UPDATE for each feature - no CASE statement complexity
-- This will definitely work!

DO $$
BEGIN
    RAISE NOTICE 'Updating feature costs...';
END $$;

-- High-Cost Features
UPDATE public.feature_flags SET dollar_cost = 0.25, updated_date = now() WHERE flag_name = 'ai_imagineer';
UPDATE public.feature_flags SET dollar_cost = 0.18, updated_date = now() WHERE flag_name = 'ai_localize';
UPDATE public.feature_flags SET dollar_cost = 0.15, updated_date = now() WHERE flag_name = 'ai_rewriter';
UPDATE public.feature_flags SET dollar_cost = 0.15, updated_date = now() WHERE flag_name = 'ai_humanize';

-- Medium-Cost Features
UPDATE public.feature_flags SET dollar_cost = 0.12, updated_date = now() WHERE flag_name = 'ai_faq';
UPDATE public.feature_flags SET dollar_cost = 0.12, updated_date = now() WHERE flag_name = 'ai_seo';
UPDATE public.feature_flags SET dollar_cost = 0.12, updated_date = now() WHERE flag_name = 'ai_brand_it';
UPDATE public.feature_flags SET dollar_cost = 0.10, updated_date = now() WHERE flag_name = 'ai_title_rewrite';
UPDATE public.feature_flags SET dollar_cost = 0.10, updated_date = now() WHERE flag_name = 'ai_tldr';
UPDATE public.feature_flags SET dollar_cost = 0.10, updated_date = now() WHERE flag_name = 'ai_links_references';

-- Low-Cost Features
UPDATE public.feature_flags SET dollar_cost = 0.08, updated_date = now() WHERE flag_name = 'ai_schema';
UPDATE public.feature_flags SET dollar_cost = 0.08, updated_date = now() WHERE flag_name = 'ai_autolink';
UPDATE public.feature_flags SET dollar_cost = 0.08, updated_date = now() WHERE flag_name = 'ai_autoscan';
UPDATE public.feature_flags SET dollar_cost = 0.08, updated_date = now() WHERE flag_name = 'ai_content_detection';
UPDATE public.feature_flags SET dollar_cost = 0.05, updated_date = now() WHERE flag_name = 'ai_html_cleanup';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Show results
SELECT 
    flag_name,
    '$' || dollar_cost::TEXT as cost,
    CASE 
        WHEN dollar_cost >= 0.20 THEN '🔴 High'
        WHEN dollar_cost >= 0.10 THEN '🟡 Medium'
        ELSE '🟢 Low'
    END as tier,
    is_enabled
FROM public.feature_flags
WHERE flag_name IN (
    'ai_autolink', 'ai_autoscan', 'ai_brand_it', 'ai_content_detection',
    'ai_faq', 'ai_html_cleanup', 'ai_humanize', 'ai_imagineer',
    'ai_links_references', 'ai_localize', 'ai_rewriter', 'ai_schema',
    'ai_seo', 'ai_title_rewrite', 'ai_tldr'
)
ORDER BY dollar_cost DESC;

-- Verify none are free
DO $$
DECLARE
    free_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO free_count
    FROM public.feature_flags
    WHERE flag_name IN (
        'ai_autolink', 'ai_autoscan', 'ai_brand_it', 'ai_content_detection',
        'ai_faq', 'ai_html_cleanup', 'ai_humanize', 'ai_imagineer',
        'ai_links_references', 'ai_localize', 'ai_rewriter', 'ai_schema',
        'ai_seo', 'ai_title_rewrite', 'ai_tldr'
    )
    AND (dollar_cost IS NULL OR dollar_cost = 0);
    
    IF free_count = 0 THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ SUCCESS! All 15 features now have costs!';
        RAISE NOTICE '💰 Users will be charged for AI usage';
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE '⚠️  % features still free - something went wrong!', free_count;
    END IF;
END $$;

