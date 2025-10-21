-- Fix RLS policies for editor_workflows table
-- The previous policy was calling a non-existent get_user_name() function

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own workflows" ON public.editor_workflows;
DROP POLICY IF EXISTS "Users can read workflows" ON public.editor_workflows;
DROP POLICY IF EXISTS "Admins can create workflows" ON public.editor_workflows;
DROP POLICY IF EXISTS "Admins can update workflows" ON public.editor_workflows;
DROP POLICY IF EXISTS "Admins can delete workflows" ON public.editor_workflows;

-- Enable RLS
ALTER TABLE public.editor_workflows ENABLE ROW LEVEL SECURITY;

-- Policy 1: All authenticated users can READ workflows
-- (they can see their own workflows + default workflows)
CREATE POLICY "Users can read workflows"
    ON public.editor_workflows
    FOR SELECT
    TO authenticated
    USING (
        is_default = true OR 
        user_name = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        user_name IN (
            SELECT unnest(assigned_usernames) 
            FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy 2: Admins can CREATE workflows
CREATE POLICY "Admins can create workflows"
    ON public.editor_workflows
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (is_superadmin = true OR role = 'admin')
        )
    );

-- Policy 3: Admins can UPDATE workflows
CREATE POLICY "Admins can update workflows"
    ON public.editor_workflows
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (is_superadmin = true OR role = 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (is_superadmin = true OR role = 'admin')
        )
    );

-- Policy 4: Admins can DELETE workflows
CREATE POLICY "Admins can delete workflows"
    ON public.editor_workflows
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND (is_superadmin = true OR role = 'admin')
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.editor_workflows TO authenticated;

COMMENT ON POLICY "Users can read workflows" ON public.editor_workflows IS 'Users can see default workflows and workflows assigned to their usernames';
COMMENT ON POLICY "Admins can create workflows" ON public.editor_workflows IS 'Only admins and superadmins can create new workflows';

