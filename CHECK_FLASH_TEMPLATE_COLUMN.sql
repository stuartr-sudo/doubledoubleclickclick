-- Check if flash_template column exists in both tables

DO $$
DECLARE
    blog_posts_has_column BOOLEAN;
    webhook_received_has_column BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 CHECKING FLASH_TEMPLATE COLUMNS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Check blog_posts table
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_posts' 
        AND column_name = 'flash_template'
    ) INTO blog_posts_has_column;
    
    IF blog_posts_has_column THEN
        RAISE NOTICE '✅ blog_posts.flash_template EXISTS';
        FOR r IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'blog_posts' 
            AND column_name = 'flash_template'
        LOOP
            RAISE NOTICE '   Type: %, Nullable: %, Default: %', r.data_type, r.is_nullable, COALESCE(r.column_default, 'None');
        END LOOP;
    ELSE
        RAISE NOTICE '❌ blog_posts.flash_template DOES NOT EXIST - Need to add it!';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check webhook_received table
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_received' 
        AND column_name = 'flash_template'
    ) INTO webhook_received_has_column;
    
    IF webhook_received_has_column THEN
        RAISE NOTICE '✅ webhook_received.flash_template EXISTS';
        FOR r IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'webhook_received' 
            AND column_name = 'flash_template'
        LOOP
            RAISE NOTICE '   Type: %, Nullable: %, Default: %', r.data_type, COALESCE(r.is_nullable, 'N/A'), COALESCE(r.column_default, 'None');
        END LOOP;
    ELSE
        RAISE NOTICE '❌ webhook_received.flash_template DOES NOT EXIST - Need to add it!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    
    IF blog_posts_has_column AND webhook_received_has_column THEN
        RAISE NOTICE '✅ ALL COLUMNS EXIST - Flash feature ready!';
    ELSE
        RAISE NOTICE '⚠️  MISSING COLUMNS - Run ADD_FLASH_TEMPLATE_COLUMNS.sql';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
