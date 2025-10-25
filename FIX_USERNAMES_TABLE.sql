-- Fix usernames table - missing is_active column
-- Error: "Could not find the 'is_active' column of 'usernames' in the schema cache"

-- 1. Check current usernames table structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'usernames'
ORDER BY ordinal_position;

-- 2. Add missing is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usernames' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.usernames 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        RAISE NOTICE 'Added is_active column to usernames table';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;
END $$;

-- 3. Ensure all existing usernames are marked as active
UPDATE public.usernames 
SET is_active = true
WHERE is_active IS NULL;

-- 4. Add other potentially missing columns based on Base44 schema

-- user_name (the actual username/brand identifier)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usernames' 
        AND column_name = 'user_name'
    ) THEN
        ALTER TABLE public.usernames 
        ADD COLUMN user_name TEXT NOT NULL;
        
        RAISE NOTICE 'Added user_name column';
    END IF;
END $$;

-- display_name (friendly name for the brand)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usernames' 
        AND column_name = 'display_name'
    ) THEN
        ALTER TABLE public.usernames 
        ADD COLUMN display_name TEXT;
        
        RAISE NOTICE 'Added display_name column';
    END IF;
END $$;

-- created_date
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usernames' 
        AND column_name = 'created_date'
    ) THEN
        ALTER TABLE public.usernames 
        ADD COLUMN created_date TIMESTAMPTZ DEFAULT NOW();
        
        RAISE NOTICE 'Added created_date column';
    END IF;
END $$;

-- 5. Ensure RLS is properly configured for usernames table
ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view usernames" ON public.usernames;
DROP POLICY IF EXISTS "Admins can manage usernames" ON public.usernames;

-- Allow authenticated users to view all usernames
CREATE POLICY "Users can view usernames"
    ON public.usernames
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow admins to manage usernames
CREATE POLICY "Admins can manage usernames"
    ON public.usernames
    FOR ALL
    TO authenticated
    USING (is_admin_user(auth.uid()))
    WITH CHECK (is_admin_user(auth.uid()));

-- 6. Grant permissions
GRANT SELECT ON public.usernames TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.usernames TO authenticated;

-- 7. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 8. Show updated table structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'usernames'
ORDER BY ordinal_position;

-- 9. Show existing usernames
SELECT 
    id,
    user_name,
    display_name,
    is_active,
    created_date
FROM public.usernames
ORDER BY created_date DESC
LIMIT 10;

-- 10. Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'USERNAMES TABLE FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Added columns:';
    RAISE NOTICE '- is_active (BOOLEAN)';
    RAISE NOTICE '- RLS policies configured';
    RAISE NOTICE 'Schema cache refreshed';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '1. Create new usernames/brands';
    RAISE NOTICE '2. Assign them to users';
    RAISE NOTICE '3. Manage active/inactive status';
    RAISE NOTICE '========================================';
END $$;

