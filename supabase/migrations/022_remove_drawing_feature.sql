-- Remove ai_drawing feature flag
-- This feature was removed from the platform as it was not working reliably

DELETE FROM public.feature_flags WHERE flag_name = 'ai_drawing';

