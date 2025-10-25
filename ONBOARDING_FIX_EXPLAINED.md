# 🔧 Onboarding Flow Fix

## Problem

Users complete the **Welcome** page (watch video + agree to guidelines) but **don't progress to Getting Started**. The page just stays on Welcome or redirects incorrectly.

## Root Cause

The `user_profiles` table is **missing the `completed_tutorial_ids` column**, which is critical for tracking onboarding progress.

### How the Flow Should Work:

```
1. User signs up/logs in
   ↓
2. Welcome page (video + agreement)
   ↓ (User clicks "I Understand - Start Using DoubleClick")
3. App saves: completed_tutorial_ids = ["welcome_onboarding"]
   ↓
4. Redirects to Getting Started page
   ↓ (User imports a blog post)
5. App saves: completed_tutorial_ids = ["welcome_onboarding", "getting_started_scrape"]
   ↓
6. Redirects to Dashboard
```

### What's Happening Now:

```
1. User completes Welcome page ✓
   ↓
2. App tries to save: completed_tutorial_ids = ["welcome_onboarding"]
   ↓
3. ❌ ERROR: Column 'completed_tutorial_ids' doesn't exist
   ↓
4. User stuck on Welcome or redirect fails
```

## The Fix

### Option 1: Quick Fix (Recommended)
Run `FIX_ONBOARDING.sql` in Supabase SQL Editor

This will:
- ✅ Add `completed_tutorial_ids` column to `user_profiles`
- ✅ Add `token_balance` column (for credit system)
- ✅ Add `plan_price_id` column (for subscriptions)
- ✅ Initialize all existing users with empty tutorial array
- ✅ Show current onboarding status for all users
- ✅ Refresh PostgREST schema cache

### Option 2: Full User Profiles Fix
Run the updated `FIX_USER_PROFILES.sql` which now includes:
- All onboarding columns
- Complete user profile setup
- RLS policies
- Auto-profile creation trigger

## Expected Result After Fix

1. ✅ Users complete Welcome → automatically go to Getting Started
2. ✅ Users complete Getting Started → automatically go to Dashboard
3. ✅ Returning users skip completed steps
4. ✅ Progress is properly tracked in database

## Verification

After running the SQL fix:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
  AND column_name = 'completed_tutorial_ids';

-- Check user onboarding status
SELECT 
    email,
    completed_tutorial_ids,
    CASE 
        WHEN completed_tutorial_ids @> '["welcome_onboarding"]'::jsonb 
        THEN 'Welcome Complete ✓'
        ELSE 'Welcome Pending'
    END as status
FROM user_profiles;
```

## Code References

### Welcome.jsx (Line 113-118)
```javascript
const updatedCompleted = Array.from(new Set([
  ...currentCompleted, 
  "welcome_onboarding"
]));
const updatedUser = await User.updateMe({ 
  completed_tutorial_ids: updatedCompleted 
});
```

### GettingStarted.jsx (Line 298-301)
```javascript
const currentCompleted = user?.completed_tutorial_ids || [];
await app.auth.updateMe({
  completed_tutorial_ids: Array.from(new Set([
    ...currentCompleted, 
    "getting_started_scrape"
  ]))
});
```

## Testing the Fix

1. Create a new test user account
2. Should see Welcome page
3. Watch video (or click "I've Watched the Video")
4. Agree to guidelines
5. Click "I Understand - Start Using DoubleClick"
6. **Should automatically redirect to Getting Started** ✅
7. Import a blog post
8. **Should automatically redirect to Dashboard** ✅

## Notes

- The column uses JSONB type to store an array: `["welcome_onboarding", "getting_started_scrape"]`
- This is the same pattern from the original Base44 setup
- The column was defined in the initial schema migration but may not have been applied to your Supabase database
- After the fix, you may need to clear browser cache or force reload (Cmd+Shift+R)

