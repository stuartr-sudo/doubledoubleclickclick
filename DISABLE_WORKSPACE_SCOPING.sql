-- Disable workspace scoping feature flag
-- This will make the Topics page work like before

UPDATE feature_flags
SET is_enabled = false, updated_date = NOW()
WHERE flag_name = 'use_workspace_scoping';

-- Verify it's disabled
SELECT flag_name, is_enabled, description
FROM feature_flags
WHERE flag_name = 'use_workspace_scoping';

-- Refresh schema
NOTIFY pgrst, 'reload schema';

