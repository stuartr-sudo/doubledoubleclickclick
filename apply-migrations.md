# How to Apply Database Migrations to Supabase

Your User Management page is not showing users because these database migrations have not been applied yet:

## Pending Migrations (CRITICAL):
1. **023_add_admin_read_all_policy.sql** - Allows admins to view all users
2. **024_fix_user_profiles_schema.sql** - Adds missing columns to user_profiles table

## Option 1: Using Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/023_add_admin_read_all_policy.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Repeat for `supabase/migrations/024_fix_user_profiles_schema.sql`

## Option 2: Using Supabase CLI

```bash
# If you have Supabase CLI installed:
cd /Users/stuarta/Documents/GitHub/sewo
supabase db push

# Or apply migrations one by one:
supabase db execute --file supabase/migrations/023_add_admin_read_all_policy.sql
supabase db execute --file supabase/migrations/024_fix_user_profiles_schema.sql
```

## After Applying Migrations:

1. **Hard refresh** the User Management page (Cmd+Shift+R or Ctrl+Shift+F5)
2. Users should now appear
3. All user fields will be properly populated (tokens, onboarding status, topics, etc.)

## Why This Happened:

- Migrations are just SQL files in your git repo
- They don't automatically apply to your live Supabase database
- You need to run them manually or set up automatic deployment
- Vercel only rebuilds the frontend app, not the database

## Verification:

After applying, you can verify in Supabase SQL Editor:

```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if admin function exists
SELECT proname FROM pg_proc WHERE proname = 'is_current_user_admin';

-- Test if you can see all users (run as admin)
SELECT id, email, full_name, role, is_superadmin, token_balance 
FROM user_profiles 
LIMIT 10;
```

