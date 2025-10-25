# Frontend Debug Instructions

## The database is working perfectly (16 posts visible with RLS), but the frontend isn't showing them.

### Step 1: Check Browser Console

1. Open https://sewo-sooty.vercel.app/content
2. Open Browser DevTools (F12 or Right-click → Inspect)
3. Go to the **Console** tab
4. Refresh the page (Cmd+Shift+R or Ctrl+Shift+F5)
5. Look for any RED errors

### Step 2: Check Network Tab

1. In DevTools, go to **Network** tab
2. Refresh the page
3. Look for requests to `blog_posts`
4. Click on the request
5. Check the **Preview** or **Response** tab
6. Tell me:
   - What's the status code? (200, 400, 403, 500?)
   - Does the response show any posts?
   - Are there any error messages?

### Step 3: Console Logs to Look For

Look for these specific console messages:
- "Loaded posts: X, webhooks: Y"
- "Final items with content:"
- Any errors about "Failed to load content"
- Any 403 (Forbidden) or 400 (Bad Request) errors

### What to Send Me:

**Please copy and paste:**
1. Any RED error messages from Console
2. The output of any "Loaded posts" or "Final items" logs
3. The status code and response from the `blog_posts` API request in Network tab

---

## Possible Issues:

1. **PostgREST cache not refreshed** - The schema cache might not have updated
2. **Frontend filtering issue** - The `normalizePost` function might be filtering posts out
3. **API request failing** - The request to Supabase might be failing
4. **Token/auth issue** - Your auth token might not be valid

---

## Quick Fix to Try:

Run this in Supabase SQL Editor:

```sql
-- Force refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```

Then refresh your Content page again.

