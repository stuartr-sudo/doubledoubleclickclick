-- Fix RLS policies for Flash overhaul schema
-- This fixes the text = text[] comparison error

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔧 FIXING RLS POLICIES';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Fix user_website_styles policy
    RAISE NOTICE '1. Fixing user_website_styles RLS policy...';
    
    DROP POLICY IF EXISTS "Users can view own website styles" ON public.user_website_styles;
    
    CREATE POLICY "Users can view own website styles" ON public.user_website_styles
        FOR ALL TO authenticated
        USING (
            user_name = ANY(
                SELECT assigned_usernames FROM public.user_profiles 
                WHERE id = auth.uid()
            )
        );
    
    RAISE NOTICE '   ✅ Fixed user_website_styles policy';

    -- Fix content_placeholders policy
    RAISE NOTICE '';
    RAISE NOTICE '2. Fixing content_placeholders RLS policy...';
    
    DROP POLICY IF EXISTS "Users can manage own placeholders" ON public.content_placeholders;
    
    CREATE POLICY "Users can manage own placeholders" ON public.content_placeholders
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.blog_posts 
                WHERE id = post_id 
                AND user_name = ANY(
                    SELECT assigned_usernames FROM public.user_profiles 
                    WHERE id = auth.uid()
                )
            )
        );
    
    RAISE NOTICE '   ✅ Fixed content_placeholders policy';

    -- Fix flash_execution_log policy
    RAISE NOTICE '';
    RAISE NOTICE '3. Fixing flash_execution_log RLS policy...';
    
    DROP POLICY IF EXISTS "Users can view own flash logs" ON public.flash_execution_log;
    
    CREATE POLICY "Users can view own flash logs" ON public.flash_execution_log
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.blog_posts 
                WHERE id = post_id 
                AND user_name = ANY(
                    SELECT assigned_usernames FROM public.user_profiles 
                    WHERE id = auth.uid()
                )
            )
        );
    
    RAISE NOTICE '   ✅ Fixed flash_execution_log policy';

    -- Refresh schema cache
    RAISE NOTICE '';
    RAISE NOTICE '4. Refreshing schema cache...';
    NOTIFY pgrst, 'reload schema';
    RAISE NOTICE '   ✅ Schema cache refreshed';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS POLICIES FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All policies now use proper array comparison syntax';
    RAISE NOTICE 'The text = text[] error should be resolved';
    RAISE NOTICE '========================================';

END $$;
