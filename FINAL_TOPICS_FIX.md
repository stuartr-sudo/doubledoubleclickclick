# 🔧 Final Topics Page Fix

## Issues to Fix

1. ❌ **Tutorial video error** - Invalid Video URL modal appearing
2. ❌ **Duplicate username dropdowns** - One in top nav, one on Topics page
3. ❌ **Topics page uses local dropdown instead of global**

## Solutions

### 1. Disable Tutorial Video Checking

The error "Invalid Video URL" is happening because the app is checking for tutorial videos on every page load. We need to disable this completely.

**File**: `src/components/hooks/useTutorialVideo.js` or wherever tutorial checking happens

**Action**: Comment out or remove the tutorial video check, or update the `tutorial_videos` table.

### 2. Remove Local Username Dropdown from Topics Page

The Topics page currently has its OWN username dropdown that conflicts with the global one.

**What needs to change**:
- Topics page should use `globalSelectedUsername` from `useWorkspace()` hook
- Remove the local "Select username" dropdown UI
- Remove `localSelectedUsername` state
- Use only the global username from the top nav

### 3. Enable Workspace Scoping

Run this SQL to enable workspace scoping (uses global dropdown):

```sql
UPDATE feature_flags
SET is_enabled = true, updated_date = NOW()
WHERE flag_name = 'use_workspace_scoping';

-- Refresh schema
NOTIFY pgrst, 'reload schema';
```

### 4. Ensure "keppi" is in Global Usernames

Run this SQL to make sure "keppi" appears in the global dropdown:

```sql
-- Check current assigned_usernames
SELECT id, email, assigned_usernames 
FROM user_profiles 
WHERE id = auth.uid();

-- Add "keppi" if not already there
UPDATE user_profiles
SET assigned_usernames = CASE 
  WHEN 'keppi' = ANY(assigned_usernames) THEN assigned_usernames
  ELSE array_append(assigned_usernames, 'keppi')
END
WHERE id = auth.uid();

-- Verify
SELECT assigned_usernames FROM user_profiles WHERE id = auth.uid();
```

## Quick Fix Script

Run these in order:

1. **FIX_TUTORIAL_VIDEOS_COLUMN.sql** - Adds missing column
2. **ENABLE_WORKSPACE_SCOPING.sql** - Enables global dropdown
3. **ADD_KEPPI_TO_GLOBAL.sql** (create this) - Adds keppi to global usernames

## After Running Scripts

1. Hard refresh browser (Cmd+Shift+R)
2. Select "keppi" from top nav dropdown
3. Topics page should load Airtable data automatically
4. NO local dropdown should appear on Topics page

## If It Still Doesn't Work

The Topics page JSX needs to be modified to:
- Remove the local dropdown UI component
- Use `globalSelectedUsername` instead of `localSelectedUsername`
- Remove the "Select a Workspace" empty state message

I can make these code changes if needed!

