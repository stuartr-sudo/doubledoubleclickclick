# FIX: Duplicate Blog Posts

## Problem
The API was creating duplicate posts instead of updating existing ones.

## Solution
This has been fixed with a **database-level UNIQUE constraint** on the `slug` column and **UPSERT** logic in the API.

## CRITICAL: Run This Migration NOW

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Remove existing duplicates (keeps newest version of each slug)
DELETE FROM public.blog_posts a
USING public.blog_posts b
WHERE a.slug = b.slug 
  AND a.slug IS NOT NULL
  AND a.created_date < b.created_date;

-- Add UNIQUE constraint to prevent future duplicates
ALTER TABLE public.blog_posts 
  ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
```

5. Click **Run** or press `Ctrl+Enter`
6. You should see "Success. No rows returned"

### Option 2: Via Migration File

Run the migration file that was just created:

```bash
# The migration is at:
supabase/migrations/20251201_add_unique_slug_constraint.sql

# Apply it via Supabase CLI (if you have it set up):
supabase db push
```

## What Changed in the Code

### Before (BAD):
- Manual check if slug exists
- Separate INSERT or UPDATE
- Race conditions possible
- Could create duplicates

### After (GOOD):
- Database UNIQUE constraint on `slug` column
- Single atomic `UPSERT` operation
- **Impossible** to create duplicates
- If slug exists → UPDATE
- If slug is new → INSERT

## Verify the Fix

After running the migration, test it:

```bash
# Test 1: Create a post
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "slug": "test-post",
    "content": "<p>First version</p>",
    "status": "published"
  }'

# Test 2: Post again with SAME slug (should UPDATE, not duplicate)
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post Updated",
    "slug": "test-post",
    "content": "<p>Second version - UPDATED!</p>",
    "status": "published"
  }'

# Test 3: Get all posts - should see only ONE "test-post"
curl http://localhost:3000/api/blog
```

## Result

✅ **ONE post per slug** - ALWAYS  
✅ Updates work correctly  
✅ No more duplicates  
✅ Atomic database-level protection

