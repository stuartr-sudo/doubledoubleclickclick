-- Create sitemaps table
CREATE TABLE IF NOT EXISTS public.sitemaps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    domain text NOT NULL,
    user_name text NOT NULL,
    pages jsonb DEFAULT '[]'::jsonb,
    total_pages integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sitemaps ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view sitemaps for their assigned usernames
CREATE POLICY IF NOT EXISTS "Users can view their own sitemaps" ON public.sitemaps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND user_name = ANY(assigned_usernames)
        )
    );

-- RLS: Users can create sitemaps for their assigned usernames
CREATE POLICY IF NOT EXISTS "Users can create sitemaps for their usernames" ON public.sitemaps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND user_name = ANY(assigned_usernames)
        )
    );

-- RLS: Users can update sitemaps for their assigned usernames
CREATE POLICY IF NOT EXISTS "Users can update their own sitemaps" ON public.sitemaps
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND user_name = ANY(assigned_usernames)
        )
    );

-- RLS: Users can delete sitemaps for their assigned usernames
CREATE POLICY IF NOT EXISTS "Users can delete their own sitemaps" ON public.sitemaps
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND user_name = ANY(assigned_usernames)
        )
    );

-- Add feature flags for Topics onboarding
DO $$ BEGIN
    INSERT INTO public.feature_flags (flag_name, token_cost, is_enabled, is_coming_soon) VALUES
    ('topics_onboarding_ai_target_market', 3, true, false) ON CONFLICT (flag_name) DO NOTHING;
    INSERT INTO public.feature_flags (flag_name, token_cost, is_enabled, is_coming_soon) VALUES
    ('topics_onboarding_product_scrape', 2, true, false) ON CONFLICT (flag_name) DO NOTHING;
END $$;

