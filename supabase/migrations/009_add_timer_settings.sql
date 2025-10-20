-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_name text UNIQUE NOT NULL,
    setting_value jsonb,
    description text,
    created_date timestamp with time zone DEFAULT now(),
    updated_date timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view app settings
CREATE POLICY IF NOT EXISTS "Anyone can view app settings" ON public.app_settings
    FOR SELECT USING (true);

-- RLS: Superadmins can manage app settings
CREATE POLICY IF NOT EXISTS "Superadmins can manage app settings" ON public.app_settings
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_superadmin = TRUE));

-- Add timer countdown setting and other app settings
DO $$ BEGIN
    INSERT INTO public.app_settings (setting_name, setting_value, description) VALUES
    ('topics_default_timer_hours', '24', 'Default countdown timer in hours for Topics onboarding.')
    ON CONFLICT (setting_name) DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        description = EXCLUDED.description;
    
    INSERT INTO public.app_settings (setting_name, setting_value, description) VALUES
    ('default_token_balance', '20', 'Default tokens granted to new users.')
    ON CONFLICT (setting_name) DO NOTHING;
    
    INSERT INTO public.app_settings (setting_name, setting_value, description) VALUES
    ('topics_onboarding_video', '""', 'Video embed code for Topics onboarding.')
    ON CONFLICT (setting_name) DO NOTHING;
END $$;

-- Add timer-related fields to user_profiles if they don't exist
DO $$
BEGIN
    -- Add topics_timer_hours (JSON map of username -> hours override)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'topics_timer_hours'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN topics_timer_hours jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Add topics_timer_override (JSON map of username -> boolean)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'topics_timer_override'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN topics_timer_override jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

