-- Enable the workspace scoping feature flag
-- This makes the global username dropdown appear in the top navigation

INSERT INTO feature_flags (flag_name, description, is_enabled, created_date, updated_date)
VALUES (
  'use_workspace_scoping',
  'Enables global username selector in top navigation bar',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (flag_name)
DO UPDATE SET
  is_enabled = true,
  updated_date = NOW();

-- Verify it's enabled
SELECT flag_name, is_enabled, description
FROM feature_flags
WHERE flag_name = 'use_workspace_scoping';

-- Refresh schema
NOTIFY pgrst, 'reload schema';

