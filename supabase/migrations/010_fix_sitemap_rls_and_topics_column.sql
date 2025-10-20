-- Fix Sitemap RLS policies to allow authenticated users to insert
DROP POLICY IF EXISTS "Users can create sitemaps for their usernames" ON public.sitemaps;

CREATE POLICY "Authenticated users can create sitemaps" ON public.sitemaps
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add topics column to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'topics'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN topics text[] DEFAULT '{}';
    END IF;
END $$;

