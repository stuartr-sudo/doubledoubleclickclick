-- 🚨 URGENT: Set costs for 15 AI features that are currently FREE
-- Users are using expensive AI features without paying!

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🚨 FIXING FREE FEATURES - URGENT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Users are currently using these for FREE!';
    RAISE NOTICE '';
END $$;

-- Set appropriate costs for each feature based on complexity and API costs
UPDATE public.feature_flags
SET 
    dollar_cost = CASE flag_name
        -- High-Cost Features (Complex AI / External APIs)
        WHEN 'ai_imagineer' THEN 0.25        -- Image generation via Midjourney/DALL-E
        WHEN 'ai_rewriter' THEN 0.15         -- Full content rewriting
        WHEN 'ai_localize' THEN 0.18         -- Translation/localization
        WHEN 'ai_humanize' THEN 0.15         -- AI humanization
        
        -- Medium-Cost Features (Moderate AI usage)
        WHEN 'ai_faq' THEN 0.12              -- FAQ generation
        WHEN 'ai_title_rewrite' THEN 0.10    -- Title optimization
        WHEN 'ai_brand_it' THEN 0.12         -- Brand voice application
        WHEN 'ai_seo' THEN 0.12              -- SEO optimization
        WHEN 'ai_tldr' THEN 0.10             -- Summary generation
        WHEN 'ai_links_references' THEN 0.10 -- Link/reference finding
        WHEN 'ai_schema' THEN 0.08           -- Schema generation
        
        -- Low-Cost Features (Simple AI tasks)
        WHEN 'ai_autolink' THEN 0.08         -- Automatic linking
        WHEN 'ai_autoscan' THEN 0.08         -- Content scanning
        WHEN 'ai_content_detection' THEN 0.08 -- AI content detection
        WHEN 'ai_html_cleanup' THEN 0.05     -- HTML cleanup
        
        ELSE 0.10  -- Default for any other AI features
    END,
    updated_date = now()
WHERE flag_name IN (
    'ai_autolink',
    'ai_autoscan',
    'ai_brand_it',
    'ai_content_detection',
    'ai_faq',
    'ai_html_cleanup',
    'ai_humanize',
    'ai_imagineer',
    'ai_links_references',
    'ai_localize',
    'ai_rewriter',
    'ai_schema',
    'ai_seo',
    'ai_title_rewrite',
    'ai_tldr'
);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Show what was updated
SELECT 
    flag_name,
    description,
    CASE 
        WHEN dollar_cost >= 0.20 THEN '🔴 High Cost: $' || dollar_cost::TEXT
        WHEN dollar_cost >= 0.10 THEN '🟡 Medium Cost: $' || dollar_cost::TEXT
        ELSE '🟢 Low Cost: $' || dollar_cost::TEXT
    END as pricing_tier,
    is_enabled
FROM public.feature_flags
WHERE flag_name IN (
    'ai_autolink',
    'ai_autoscan',
    'ai_brand_it',
    'ai_content_detection',
    'ai_faq',
    'ai_html_cleanup',
    'ai_humanize',
    'ai_imagineer',
    'ai_links_references',
    'ai_localize',
    'ai_rewriter',
    'ai_schema',
    'ai_seo',
    'ai_title_rewrite',
    'ai_tldr'
)
ORDER BY dollar_cost DESC, flag_name;

-- Final verification
DO $$
DECLARE
    free_count INTEGER;
    total_cost NUMERIC;
BEGIN
    SELECT COUNT(*), SUM(dollar_cost)
    INTO free_count, total_cost
    FROM public.feature_flags
    WHERE flag_name IN (
        'ai_autolink', 'ai_autoscan', 'ai_brand_it', 'ai_content_detection',
        'ai_faq', 'ai_html_cleanup', 'ai_humanize', 'ai_imagineer',
        'ai_links_references', 'ai_localize', 'ai_rewriter', 'ai_schema',
        'ai_seo', 'ai_title_rewrite', 'ai_tldr'
    )
    AND (dollar_cost IS NULL OR dollar_cost = 0);
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FEATURES UPDATED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Features still free: %', free_count;
    RAISE NOTICE 'Total AI feature value: $%', total_cost;
    RAISE NOTICE '';
    
    IF free_count = 0 THEN
        RAISE NOTICE '🎉 SUCCESS! All 15 features now have costs!';
        RAISE NOTICE '💰 Users will now be charged for AI usage';
        RAISE NOTICE '📊 Average cost per feature: $%', ROUND(total_cost / 15, 2);
    ELSE
        RAISE NOTICE '⚠️  % features still have no cost!', free_count;
        RAISE NOTICE 'Please investigate and fix manually.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

