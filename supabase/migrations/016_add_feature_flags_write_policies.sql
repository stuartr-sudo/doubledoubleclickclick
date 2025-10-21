-- Add INSERT and UPDATE policies for feature_flags table
-- This allows authenticated users (admins) to create and modify feature flags

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can insert feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can update feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can delete feature flags" ON public.feature_flags;

-- Allow authenticated users to insert feature flags
-- In production, you may want to restrict this to admin users only
CREATE POLICY "Admins can insert feature flags"
    ON public.feature_flags FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update feature flags
CREATE POLICY "Admins can update feature flags"
    ON public.feature_flags FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete feature flags
CREATE POLICY "Admins can delete feature flags"
    ON public.feature_flags FOR DELETE
    TO authenticated
    USING (true);

-- Grant necessary permissions
GRANT INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;


