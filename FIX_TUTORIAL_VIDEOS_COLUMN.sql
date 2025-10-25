-- Fix tutorial_videos table to add missing assigned_page_name column

DO $$
BEGIN
    -- Add the missing column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_videos' 
        AND column_name = 'assigned_page_name'
    ) THEN
        ALTER TABLE public.tutorial_videos
        ADD COLUMN assigned_page_name TEXT;
        
        RAISE NOTICE '✓ Added assigned_page_name column to tutorial_videos';
    ELSE
        RAISE NOTICE '✓ assigned_page_name column already exists';
    END IF;
    
    -- Update existing records to use page_id as assigned_page_name if null
    UPDATE public.tutorial_videos
    SET assigned_page_name = page_id
    WHERE assigned_page_name IS NULL AND page_id IS NOT NULL;
    
    RAISE NOTICE '✓ Updated existing records';
    
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ TUTORIAL_VIDEOS TABLE FIXED';
    RAISE NOTICE '========================================';
END $$;

