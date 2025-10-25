-- ============================================================================
-- CREATE EDITOR_WORKFLOWS TABLE
-- This table stores Flash workflow configurations
-- ============================================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.editor_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  workflow_steps JSONB[] DEFAULT ARRAY[]::JSONB[],
  token_cost INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  user_name TEXT, -- Optional: for user-specific workflows
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_editor_workflows_is_default 
ON public.editor_workflows(is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_editor_workflows_is_active 
ON public.editor_workflows(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_editor_workflows_user_name 
ON public.editor_workflows(user_name) WHERE user_name IS NOT NULL;

-- Add comments
COMMENT ON TABLE public.editor_workflows IS 'Stores Flash workflow configurations for automated content enhancement';
COMMENT ON COLUMN public.editor_workflows.workflow_steps IS 'Array of JSONB objects defining workflow steps: [{"type": "tldr", "enabled": true}]';
COMMENT ON COLUMN public.editor_workflows.token_cost IS 'Estimated token cost for this workflow';
COMMENT ON COLUMN public.editor_workflows.is_default IS 'Whether this workflow appears in Flash Template dropdown';
COMMENT ON COLUMN public.editor_workflows.user_name IS 'If set, workflow is only visible to this user';

-- 2. Enable RLS
ALTER TABLE public.editor_workflows ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies

-- All authenticated users can view active workflows
CREATE POLICY "Authenticated users can view active workflows"
ON public.editor_workflows
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND (
    is_default = true 
    OR user_name IS NULL
    OR user_name = (
      SELECT user_name 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  )
);

-- Superadmins can view all workflows
CREATE POLICY "Superadmins can view all workflows"
ON public.editor_workflows
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND (role = 'superadmin' OR is_superadmin = true)
  )
);

-- Only superadmins can create workflows
CREATE POLICY "Superadmins can create workflows"
ON public.editor_workflows
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND (role = 'superadmin' OR is_superadmin = true)
  )
);

-- Only superadmins can update workflows
CREATE POLICY "Superadmins can update workflows"
ON public.editor_workflows
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND (role = 'superadmin' OR is_superadmin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND (role = 'superadmin' OR is_superadmin = true)
  )
);

-- Only superadmins can delete workflows
CREATE POLICY "Superadmins can delete workflows"
ON public.editor_workflows
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND (role = 'superadmin' OR is_superadmin = true)
  )
);

-- 4. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ EDITOR_WORKFLOWS TABLE CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table: editor_workflows';
  RAISE NOTICE 'RLS: ENABLED';
  RAISE NOTICE 'Policies: 5 created';
  RAISE NOTICE '';
  RAISE NOTICE 'Now run: 030_flash_automation_system.sql';
  RAISE NOTICE '========================================';
END $$;

-- Verify
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'editor_workflows'
ORDER BY ordinal_position;

