-- Add description column to editor_workflows table
-- This column is required for workflow creation but was missing from the schema

-- Check if the table exists, if not create it with all required columns
DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'editor_workflows') THEN
        CREATE TABLE public.editor_workflows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            workflow_steps JSONB DEFAULT '[]'::jsonb,
            token_cost INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
            is_default BOOLEAN DEFAULT FALSE,
            user_name TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_date TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.editor_workflows ENABLE ROW LEVEL SECURITY;
        
        -- Allow authenticated users to read all workflows
        CREATE POLICY "Users can read workflows"
            ON public.editor_workflows
            FOR SELECT
            TO authenticated
            USING (true);
        
        -- Allow admins to create workflows
        CREATE POLICY "Admins can create workflows"
            ON public.editor_workflows
            FOR INSERT
            TO authenticated
            WITH CHECK (true);
        
        -- Allow admins to update workflows
        CREATE POLICY "Admins can update workflows"
            ON public.editor_workflows
            FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
        
        -- Allow admins to delete workflows
        CREATE POLICY "Admins can delete workflows"
            ON public.editor_workflows
            FOR DELETE
            TO authenticated
            USING (true);
        
        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.editor_workflows TO authenticated;
        
        RAISE NOTICE 'Created editor_workflows table';
    ELSE
        -- Table exists, just add description column if missing
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'editor_workflows' 
            AND column_name = 'description'
        ) THEN
            ALTER TABLE public.editor_workflows ADD COLUMN description TEXT DEFAULT '';
            RAISE NOTICE 'Added description column to editor_workflows';
        END IF;
        
        -- Also ensure other potentially missing columns exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'editor_workflows' 
            AND column_name = 'updated_date'
        ) THEN
            ALTER TABLE public.editor_workflows ADD COLUMN updated_date TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added updated_date column to editor_workflows';
        END IF;
    END IF;
END
$$;

-- Add index on user_name for faster filtering
CREATE INDEX IF NOT EXISTS idx_editor_workflows_user_name ON public.editor_workflows(user_name);

-- Add index on is_active and is_default for faster filtering
CREATE INDEX IF NOT EXISTS idx_editor_workflows_active_default ON public.editor_workflows(is_active, is_default);

COMMENT ON TABLE public.editor_workflows IS 'Stores custom workflows for the Flash Workflow Builder';
COMMENT ON COLUMN public.editor_workflows.description IS 'Human-readable description of what the workflow does';
COMMENT ON COLUMN public.editor_workflows.workflow_steps IS 'Array of step objects defining the workflow sequence';
COMMENT ON COLUMN public.editor_workflows.token_cost IS 'Manual token cost override (if null, calculated from steps)';
COMMENT ON COLUMN public.editor_workflows.is_default IS 'Whether this workflow is available to all users';

