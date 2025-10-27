-- Flash AI Enhancement System - Database Schema Overhaul
-- This script updates the database to support the new simplified Flash system

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔧 FLASH OVERHAUL - DATABASE SCHEMA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Step 1: Add new columns to blog_posts
    RAISE NOTICE '1. Updating blog_posts table...';
    
    -- Add flash_enabled boolean (replaces flash_template)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_posts' 
        AND column_name = 'flash_enabled'
    ) THEN
        ALTER TABLE public.blog_posts 
        ADD COLUMN flash_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE '   ✅ Added flash_enabled column';
    ELSE
        RAISE NOTICE '   ✓ flash_enabled column already exists';
    END IF;

    -- Add word_count for validation
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_posts' 
        AND column_name = 'word_count'
    ) THEN
        ALTER TABLE public.blog_posts 
        ADD COLUMN word_count INTEGER;
        RAISE NOTICE '   ✅ Added word_count column';
    ELSE
        RAISE NOTICE '   ✓ word_count column already exists';
    END IF;

    -- Drop flash_template column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_posts' 
        AND column_name = 'flash_template'
    ) THEN
        ALTER TABLE public.blog_posts 
        DROP COLUMN flash_template;
        RAISE NOTICE '   ✅ Removed flash_template column';
    ELSE
        RAISE NOTICE '   ✓ flash_template column already removed';
    END IF;

    -- Step 2: Add new columns to webhook_received
    RAISE NOTICE '';
    RAISE NOTICE '2. Updating webhook_received table...';
    
    -- Add flash_enabled boolean
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_received' 
        AND column_name = 'flash_enabled'
    ) THEN
        ALTER TABLE public.webhook_received 
        ADD COLUMN flash_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE '   ✅ Added flash_enabled column';
    ELSE
        RAISE NOTICE '   ✓ flash_enabled column already exists';
    END IF;

    -- Add word_count for validation
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_received' 
        AND column_name = 'word_count'
    ) THEN
        ALTER TABLE public.webhook_received 
        ADD COLUMN word_count INTEGER;
        RAISE NOTICE '   ✅ Added word_count column';
    ELSE
        RAISE NOTICE '   ✓ word_count column already exists';
    END IF;

    -- Drop flash_template column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_received' 
        AND column_name = 'flash_template'
    ) THEN
        ALTER TABLE public.webhook_received 
        DROP COLUMN flash_template;
        RAISE NOTICE '   ✅ Removed flash_template column';
    ELSE
        RAISE NOTICE '   ✓ flash_template column already removed';
    END IF;

    -- Step 3: Create user_website_styles table
    RAISE NOTICE '';
    RAISE NOTICE '3. Creating user_website_styles table...';
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_website_styles'
    ) THEN
        CREATE TABLE public.user_website_styles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_name TEXT NOT NULL,
            website_url TEXT,
            extracted_css JSONB, -- Colors, fonts, spacing, button styles
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Add indexes for performance
        CREATE INDEX idx_user_website_styles_user_name ON public.user_website_styles(user_name);
        CREATE INDEX idx_user_website_styles_website_url ON public.user_website_styles(website_url);
        
        RAISE NOTICE '   ✅ Created user_website_styles table with indexes';
    ELSE
        RAISE NOTICE '   ✓ user_website_styles table already exists';
    END IF;

    -- Step 4: Create content_placeholders table
    RAISE NOTICE '';
    RAISE NOTICE '4. Creating content_placeholders table...';
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'content_placeholders'
    ) THEN
        CREATE TABLE public.content_placeholders (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
            type TEXT NOT NULL, -- 'image', 'video', 'product', 'opinion'
            position INTEGER NOT NULL, -- Order in content
            context TEXT, -- AI reasoning for placement
            fulfilled BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Add indexes
        CREATE INDEX idx_content_placeholders_post_id ON public.content_placeholders(post_id);
        CREATE INDEX idx_content_placeholders_type ON public.content_placeholders(type);
        CREATE INDEX idx_content_placeholders_fulfilled ON public.content_placeholders(fulfilled);
        
        RAISE NOTICE '   ✅ Created content_placeholders table with indexes';
    ELSE
        RAISE NOTICE '   ✓ content_placeholders table already exists';
    END IF;

    -- Step 5: Create flash_execution_log table
    RAISE NOTICE '';
    RAISE NOTICE '5. Creating flash_execution_log table...';
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'flash_execution_log'
    ) THEN
        CREATE TABLE public.flash_execution_log (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
            feature_type TEXT NOT NULL, -- 'tldr', 'table', 'cta', etc.
            success BOOLEAN NOT NULL,
            execution_time_ms INTEGER,
            error_message TEXT,
            tokens_used INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Add indexes
        CREATE INDEX idx_flash_execution_log_post_id ON public.flash_execution_log(post_id);
        CREATE INDEX idx_flash_execution_log_feature_type ON public.flash_execution_log(feature_type);
        CREATE INDEX idx_flash_execution_log_success ON public.flash_execution_log(success);
        CREATE INDEX idx_flash_execution_log_created_at ON public.flash_execution_log(created_at);
        
        RAISE NOTICE '   ✅ Created flash_execution_log table with indexes';
    ELSE
        RAISE NOTICE '   ✓ flash_execution_log table already exists';
    END IF;

    -- Step 6: Enable RLS on new tables
    RAISE NOTICE '';
    RAISE NOTICE '6. Setting up Row Level Security...';
    
    -- Enable RLS on user_website_styles
    ALTER TABLE public.user_website_styles ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Users can only see their own website styles
    DROP POLICY IF EXISTS "Users can view own website styles" ON public.user_website_styles;
    CREATE POLICY "Users can view own website styles" ON public.user_website_styles
        FOR ALL TO authenticated
        USING (
            user_name = ANY(
                SELECT assigned_usernames FROM public.user_profiles 
                WHERE id = auth.uid()
            )
        );
    
    -- Enable RLS on content_placeholders
    ALTER TABLE public.content_placeholders ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Users can manage placeholders for their posts
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
    
    -- Enable RLS on flash_execution_log
    ALTER TABLE public.flash_execution_log ENABLE ROW LEVEL SECURITY;
    
    -- Policy: Users can view logs for their posts
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
    
    RAISE NOTICE '   ✅ RLS policies created for all new tables';

    -- Step 7: Add comments for documentation
    RAISE NOTICE '';
    RAISE NOTICE '7. Adding table comments...';
    
    COMMENT ON TABLE public.user_website_styles IS 'Stores extracted CSS styles from user websites for Flash content matching';
    COMMENT ON COLUMN public.user_website_styles.extracted_css IS 'JSON object containing colors, fonts, spacing, button styles extracted from website';
    
    COMMENT ON TABLE public.content_placeholders IS 'Tracks AI-suggested placeholder locations for images, videos, products, opinions';
    COMMENT ON COLUMN public.content_placeholders.type IS 'Type of placeholder: image, video, product, opinion';
    COMMENT ON COLUMN public.content_placeholders.context IS 'AI reasoning for why this location was chosen';
    
    COMMENT ON TABLE public.flash_execution_log IS 'Logs execution of Flash features for debugging and analytics';
    COMMENT ON COLUMN public.flash_execution_log.feature_type IS 'Type of Flash feature executed: tldr, table, cta, citations, etc.';

    RAISE NOTICE '   ✅ Table comments added';

    -- Step 8: Refresh schema cache
    RAISE NOTICE '';
    RAISE NOTICE '8. Refreshing schema cache...';
    NOTIFY pgrst, 'reload schema';
    RAISE NOTICE '   ✅ Schema cache refreshed';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FLASH OVERHAUL SCHEMA COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '  • blog_posts: +flash_enabled, +word_count, -flash_template';
    RAISE NOTICE '  • webhook_received: +flash_enabled, +word_count, -flash_template';
    RAISE NOTICE '  • user_website_styles: NEW table for CSS matching';
    RAISE NOTICE '  • content_placeholders: NEW table for tracking placeholders';
    RAISE NOTICE '  • flash_execution_log: NEW table for execution tracking';
    RAISE NOTICE '  • RLS policies: Secure access to all new tables';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update frontend to use flash_enabled boolean';
    RAISE NOTICE '  2. Create Flash toggle UI components';
    RAISE NOTICE '  3. Build Edge Function orchestrator';
    RAISE NOTICE '========================================';

END $$;
