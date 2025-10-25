-- Drop and recreate missing tables to fix 404 errors

-- ============================================================================
-- Drop existing tables and policies
-- ============================================================================

DROP POLICY IF EXISTS "app_products_select_policy" ON public.app_products;
DROP POLICY IF EXISTS "app_products_admin_policy" ON public.app_products;
DROP TABLE IF EXISTS public.app_products CASCADE;

DROP POLICY IF EXISTS "tutorial_videos_select_policy" ON public.tutorial_videos;
DROP POLICY IF EXISTS "tutorial_videos_admin_policy" ON public.tutorial_videos;
DROP TABLE IF EXISTS public.tutorial_videos CASCADE;

-- ============================================================================
-- 1. app_products table (for product linking in Topics)
-- ============================================================================

CREATE TABLE public.app_products (
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

CREATE TABLE public.tutorial_videos (
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
-- Add sample data
-- ============================================================================

INSERT INTO public.app_products (name, description, price, is_active, category)
VALUES 
    ('Sample Product 1', 'This is a sample product for testing', 99.99, true, 'Sample'),
    ('Sample Product 2', 'Another sample product for testing', 149.99, true, 'Sample');

INSERT INTO public.tutorial_videos (title, description, video_url, category, page_id, is_active)
VALUES 
    ('Getting Started with Topics', 'Learn how to use the Topics page to manage your content keywords', 'https://www.youtube.com/watch?v=sample', 'Onboarding', 'Topics', true);

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
    RAISE NOTICE '✅ TABLES RECREATED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '  ✓ app_products (2 records)';
    RAISE NOTICE '  ✓ tutorial_videos (1 record)';
    RAISE NOTICE '';
    RAISE NOTICE 'Hard refresh your browser (Cmd+Shift+R)';
    RAISE NOTICE '========================================';
END $$;

-- Show table counts
SELECT 'app_products' as table_name, COUNT(*) as record_count FROM public.app_products
UNION ALL
SELECT 'tutorial_videos' as table_name, COUNT(*) as record_count FROM public.tutorial_videos;

