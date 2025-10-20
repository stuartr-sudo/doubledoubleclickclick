-- Add ai_youtube feature flag for YouTube search functionality
-- The frontend uses 'ai_youtube' for token consumption
INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) 
VALUES ('ai_youtube', true, 1) 
ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;

