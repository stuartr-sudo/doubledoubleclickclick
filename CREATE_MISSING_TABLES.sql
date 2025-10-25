-- Create missing tables that are causing 404 errors
-- These are referenced in the frontend but don't exist in the database

-- ============================================================================
-- 1. app_products table (for product linking in Topics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.app_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    image_url TEXT,
    product_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    category TEXT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for app_products
ALTER TABLE public.app_products ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read active products
CREATE POLICY "app_products_select_policy"
ON public.app_products
FOR SELECT
TO authenticated
USING (is_active = TRUE OR EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND (role IN ('admin', 'superadmin') OR is_superadmin = TRUE)
));

-- Only admins can manage products
CREATE POLICY "app_products_admin_policy"
ON public.app_products
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (role IN ('admin', 'superadmin') OR is_superadmin = TRUE)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (role IN ('admin', 'superadmin') OR is_superadmin = TRUE)
    )
);

-- ============================================================================
-- 2. tutorial_videos table (for educational content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tutorial_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    category TEXT,
    page_id TEXT, -- Links to specific pages in the app
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for tutorial_videos
ALTER TABLE public.tutorial_videos ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read active tutorials
CREATE POLICY "tutorial_videos_select_policy"
ON public.tutorial_videos
FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Only admins can manage tutorials
CREATE POLICY "tutorial_videos_admin_policy"
ON public.tutorial_videos
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (role IN ('admin', 'superadmin') OR is_superadmin = TRUE)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (role IN ('admin', 'superadmin') OR is_superadmin = TRUE)
    )
);

-- ============================================================================
-- Add some sample data
-- ============================================================================

-- Sample app products (if none exist)
INSERT INTO public.app_products (name, description, price, is_active, category)
SELECT 
    'Sample Product 1',
    'This is a sample product for testing',
    99.99,
    true,
    'Sample'
WHERE NOT EXISTS (SELECT 1 FROM public.app_products LIMIT 1);

INSERT INTO public.app_products (name, description, price, is_active, category)
SELECT 
    'Sample Product 2',
    'Another sample product for testing',
    149.99,
    true,
    'Sample'
WHERE NOT EXISTS (SELECT 1 FROM public.app_products WHERE name = 'Sample Product 2');

-- Sample tutorial video (if none exist)
INSERT INTO public.tutorial_videos (title, description, video_url, category, page_id, is_active)
SELECT 
    'Getting Started with Topics',
    'Learn how to use the Topics page to manage your content keywords',
    'https://www.youtube.com/watch?v=sample',
    'Onboarding',
    'Topics',
    true
WHERE NOT EXISTS (SELECT 1 FROM public.tutorial_videos LIMIT 1);

-- ============================================================================
-- Refresh PostgREST schema cache
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MISSING TABLES CREATED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  ✓ app_products';
    RAISE NOTICE '  ✓ tutorial_videos';
    RAISE NOTICE '';
    RAISE NOTICE 'The 404 errors should now be gone!';
    RAISE NOTICE 'Hard refresh your browser (Cmd+Shift+R)';
    RAISE NOTICE '========================================';
END $$;

-- Show table counts
SELECT 'app_products' as table_name, COUNT(*) as record_count FROM public.app_products
UNION ALL
SELECT 'tutorial_videos' as table_name, COUNT(*) as record_count FROM public.tutorial_videos;

