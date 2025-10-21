-- Add ai_drawing feature flag
DO $$
BEGIN
    INSERT INTO public.feature_flags (flag_name, is_enabled, token_cost, description)
    VALUES ('ai_drawing', TRUE, 0, 'Enable infinite canvas drawing tool (Tldraw) for sketches, diagrams, and brainstorming.')
    ON CONFLICT (flag_name) DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        token_cost = EXCLUDED.token_cost,
        description = EXCLUDED.description;
END $$;

