-- Show which features are currently FREE (no cost)
-- These are being used by users without payment!

SELECT 
    flag_name,
    description,
    is_enabled,
    CASE 
        WHEN is_enabled THEN '🚨 ACTIVE & FREE (users using for free!)'
        ELSE '⏸️  Disabled (not a problem)'
    END as urgency
FROM public.feature_flags
WHERE (flag_name LIKE 'ai_%' OR flag_name LIKE 'topics_%' OR flag_name LIKE 'flash_%')
  AND (dollar_cost IS NULL OR dollar_cost = 0)
ORDER BY 
    is_enabled DESC,  -- Show enabled (urgent) features first
    flag_name;

