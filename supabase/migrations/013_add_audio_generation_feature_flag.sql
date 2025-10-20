-- Add ai_audio_generation feature flag for text-to-speech (ElevenLabs TTS)
INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost) 
VALUES ('ai_audio_generation', true, 5) 
ON CONFLICT (flag_name) DO UPDATE SET token_cost = EXCLUDED.token_cost;

