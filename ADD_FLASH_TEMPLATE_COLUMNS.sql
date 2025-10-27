-- Add flash_template column to blog_posts and webhook_received tables

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔧 ADDING FLASH_TEMPLATE COLUMNS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Add to blog_posts if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_posts' 
        AND column_name = 'flash_template'
    ) THEN
        ALTER TABLE public.blog_posts
        ADD COLUMN flash_template TEXT DEFAULT 'None';
        
        RAISE NOTICE '✅ Added flash_template to blog_posts';
    ELSE
        RAISE NOTICE '✓ blog_posts.flash_template already exists';
    END IF;
    
    -- Add to webhook_received if not exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_received' 
        AND column_name = 'flash_template'
    ) THEN
        ALTER TABLE public.webhook_received
        ADD COLUMN flash_template TEXT DEFAULT 'None';
        
        RAISE NOTICE '✅ Added flash_template to webhook_received';
    ELSE
        RAISE NOTICE '✓ webhook_received.flash_template already exists';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FLASH TEMPLATE COLUMNS READY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Flash templates available:';
    RAISE NOTICE '  • None (default)';
    RAISE NOTICE '  • Product Review';
    RAISE NOTICE '  • How-To Guide';
    RAISE NOTICE '  • Listicle';
    RAISE NOTICE '  • Educational';
    RAISE NOTICE '  • News & Blog';
    RAISE NOTICE '';
    RAISE NOTICE 'Users can now set Flash templates in:';
    RAISE NOTICE '  ✓ Editor (Ask AI → Flash button)';
    RAISE NOTICE '  ✓ Content Feed (Flash button)';
    RAISE NOTICE '  ✓ Topics Page (Flash Template dropdown)';
    RAISE NOTICE '========================================';
    
    -- Refresh schema cache
    NOTIFY pgrst, 'reload schema';
END $$;
