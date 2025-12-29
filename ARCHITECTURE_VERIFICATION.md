# SEWO Architecture Verification - site_posts vs blog_posts

## Current Architecture (As of Dec 29, 2025)

### Tables Are COMPLETELY ISOLATED

1. **`site_posts`** (SEWO ONLY)
   - Contains ONLY published SEWO content
   - Managed exclusively via `/api/blog` endpoint
   - Primary key: `id` (UUID)
   - Unique constraint: `external_id`
   - Unique constraint: `slug`

2. **`blog_posts`** (OTHER USERS / BASE44)
   - Contains content from other users and Base44 editor
   - **NEVER** accessed by SEWO API endpoints
   - **NEVER** accessed by SEWO admin UI
   - **NEVER** displayed on SEWO website

### Database-Level Verification

#### Foreign Keys
```sql
-- RESULT: NO foreign keys between blog_posts and site_posts
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY'
  AND (table_name IN ('blog_posts', 'site_posts'));
```

#### Triggers
```sql
-- RESULT: NO triggers on blog_posts that affect site_posts
-- RESULT: NO triggers on site_posts at all
SELECT tgname, tgrelid::regclass, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid IN ('blog_posts'::regclass, 'site_posts'::regclass)
  AND tgisinternal = false;
```

#### Functions
```sql
-- RESULT: NO functions reference both tables
SELECT proname, prosrc 
FROM pg_proc
WHERE prosrc ILIKE '%site_posts%' AND prosrc ILIKE '%blog_posts%';
```

### API Endpoints (SEWO ONLY)

#### POST /api/blog
- **Reads from**: `site_posts` ONLY
- **Writes to**: `site_posts` ONLY
- **Logic**:
  - If `status === 'published'`: UPSERT into `site_posts`
  - If `status === 'draft'`: DELETE from `site_posts`

#### GET /api/blog
- **Reads from**: `site_posts` ONLY

#### GET /api/blog/[id]
- **Reads from**: `site_posts` ONLY

#### PUT /api/blog/[id]
- **Writes to**: `site_posts` ONLY

#### DELETE /api/blog/[id]
- **Deletes from**: `site_posts` ONLY

### Admin UI

#### /admin (AdminPageWrapper.tsx)
- **Fetches from**: `/api/blog` → `site_posts` ONLY
- **Displays**: ONLY content in `site_posts`
- **Header**: "EXISTING SITE CONTENT"

### Website (Public Pages)

#### /blog/[slug] (Blog Post Page)
- **Reads from**: `site_posts` WHERE `status = 'published'`

#### /blog (Blog Listing Page)
- **Reads from**: `site_posts` WHERE `status = 'published'`

#### /author/[slug] (Author Page)
- **Reads from**: `site_posts` WHERE `status = 'published'`

#### /tags/[tag] (Tag Page)
- **Reads from**: `site_posts` WHERE `status = 'published'`

#### / (Homepage)
- **Reads from**: `site_posts` WHERE `status = 'published'`

### NO Connections

1. **NO** database triggers linking the tables
2. **NO** foreign key constraints between tables
3. **NO** database functions syncing the tables
4. **NO** edge functions syncing the tables
5. **NO** API code that touches both tables
6. **NO** UI code that reads from both tables
7. **NO** Supabase Realtime subscriptions
8. **NO** webhooks (in codebase)

---

## Debugging Checklist

If a post disappeared from `site_posts` when deleted from `blog_posts`:

1. **Verify the external_id**: Check if the post you deleted from `blog_posts` had the same `external_id` as a post in `site_posts`
2. **Check Supabase UI**: Did you accidentally delete from `site_posts` instead of `blog_posts`?
3. **Check Supabase Webhooks**: Are there any webhooks configured in the Supabase dashboard (Database > Webhooks)?
4. **Check Supabase Triggers**: Run this query to double-check:
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgrelid = 'blog_posts'::regclass 
     AND tgisinternal = false;
   ```
5. **Check Row Level Security**: Could RLS be preventing you from seeing the post?
   ```sql
   SELECT * FROM site_posts WHERE external_id = 'YOUR_EXTERNAL_ID';
   ```

---

## Expected Behavior

### Scenario 1: Delete from `blog_posts` in Supabase UI
- **Expected**: Nothing happens to `site_posts`
- **Actual**: If a post disappeared from `site_posts`, this indicates an external connection (webhook, manual deletion, or confusion)

### Scenario 2: Delete from Admin UI
- **Expected**: Post is deleted from `site_posts` ONLY
- **Actual**: `blog_posts` remains untouched

### Scenario 3: Send API payload with `status: "draft"`
- **Expected**: Post is deleted from `site_posts`
- **Actual**: `blog_posts` remains untouched

---

## Verification Queries

Run these in Supabase SQL Editor to verify isolation:

```sql
-- 1. Check if post exists in site_posts
SELECT id, external_id, title, status 
FROM site_posts 
WHERE external_id = 'YOUR_EXTERNAL_ID';

-- 2. Check if post exists in blog_posts
SELECT id, external_id, title, status 
FROM blog_posts 
WHERE external_id = 'YOUR_EXTERNAL_ID';

-- 3. Check for any database-level connections
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS from_table,
  confrelid::regclass AS to_table
FROM pg_constraint
WHERE (conrelid = 'site_posts'::regclass OR confrelid = 'site_posts'::regclass)
  AND contype = 'f';

-- 4. Check for triggers on blog_posts
SELECT 
  tgname AS trigger_name,
  pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'blog_posts'::regclass
  AND tgisinternal = false;
```
