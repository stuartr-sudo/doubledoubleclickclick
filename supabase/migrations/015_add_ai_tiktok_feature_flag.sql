-- Add ai_tiktok feature flag for TikTok search functionality
-- The frontend uses 'ai_tiktok' for token consumption
INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) 
VALUES ('ai_tiktok', true, 1) 
ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;

