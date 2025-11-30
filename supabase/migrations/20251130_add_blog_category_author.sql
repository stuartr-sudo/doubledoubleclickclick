-- Add category and author columns to blog_posts table if they don't exist

DO $$
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.blog_posts ADD COLUMN category text;
    END IF;

    -- Add author column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'author'
    ) THEN
        ALTER TABLE public.blog_posts ADD COLUMN author text;
    END IF;
END $$;

