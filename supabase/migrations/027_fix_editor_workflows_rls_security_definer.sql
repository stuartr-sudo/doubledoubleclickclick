-- Use SECURITY DEFINER function to check admin status (bypasses RLS)
-- This is the same pattern used for user_profiles admin access

-- Create helper function to check if current user is admin
-- This runs with elevated privileges, bypassing RLS
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges, bypassing RLS
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_is_superadmin BOOLEAN;
BEGIN
    -- Get current user's role and superadmin status directly
    SELECT role, is_superadmin
    INTO user_role, user_is_superadmin
    FROM public.user_profiles
    WHERE id = auth.uid()
    LIMIT 1;
    
    -- Return true if admin or superadmin
    RETURN (user_role = 'admin' OR user_role = 'superadmin' OR user_is_superadmin = true);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_admin() TO authenticated;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read workflows" ON public.editor_workflows;
DROP POLICY IF EXISTS "Admins can create workflows" ON public.editor_workflows;
DROP POLICY IF EXISTS "Admins can update workflows" ON public.editor_workflows;
DROP POLICY IF EXISTS "Admins can delete workflows" ON public.editor_workflows;

-- Policy 1: All authenticated users can READ workflows
CREATE POLICY "Users can read workflows"
    ON public.editor_workflows
    FOR SELECT
    TO authenticated
    USING (true);  -- Allow all users to read all workflows for now

-- Policy 2: Admins can CREATE workflows (using SECURITY DEFINER function)
CREATE POLICY "Admins can create workflows"
    ON public.editor_workflows
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_user_admin() = true);

-- Policy 3: Admins can UPDATE workflows (using SECURITY DEFINER function)
CREATE POLICY "Admins can update workflows"
    ON public.editor_workflows
    FOR UPDATE
    TO authenticated
    USING (public.is_user_admin() = true)
    WITH CHECK (public.is_user_admin() = true);

-- Policy 4: Admins can DELETE workflows (using SECURITY DEFINER function)
CREATE POLICY "Admins can delete workflows"
    ON public.editor_workflows
    FOR DELETE
    TO authenticated
    USING (public.is_user_admin() = true);

COMMENT ON FUNCTION public.is_user_admin() IS 'Security definer function to check if current user is admin/superadmin, bypassing RLS';

