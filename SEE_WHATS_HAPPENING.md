# 🚨 HOW TO SEE EXACTLY WHAT'S HAPPENING

## The Problem You're Seeing

1. **Post #1:** Everything correct EXCEPT the title is wrong
2. **Post #2:** Title is correct BUT no content

**This means Base44 is sending TWO SEPARATE API REQUESTS with different data.**

---

## Method 1: Watch API Requests in Real-Time (EASIEST)

### Step 1: Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Link Your Project

```bash
cd /Users/stuarta/Documents/GitHub/doubleclicker-1
vercel link
```

Select your project when prompted.

### Step 4: Watch API Requests

```bash
./watch-api-requests.sh
```

OR manually:

```bash
vercel logs --follow --filter="[BLOG API]"
```

### Step 5: Publish from Base44

While the watch script is running, publish a post from Base44.

You'll see EXACTLY what Base44 is sending in REAL-TIME.

---

## Method 2: Check Current Database State

### See what's in your database RIGHT NOW:

```bash
curl -s "https://sewo.io/api/blog?limit=100" | python3 -c "
import sys, json
data = json.load(sys.stdin)
posts = data.get('data', [])

print('=' * 80)
print(f'TOTAL POSTS: {len(posts)}')
print('=' * 80)

for i, p in enumerate(posts, 1):
    print(f'\n--- POST {i} ---')
    print(f'Title: \"{p.get(\"title\")}\"')
    print(f'Meta Title: \"{p.get(\"meta_title\", \"(none)\")}\"')
    print(f'Slug: {p.get(\"slug\")}')
    print(f'Content Length: {len(p.get(\"content\", \"\"))} characters')
    print(f'Has Featured Image: {\"YES\" if p.get(\"featured_image\") else \"NO\"}')
    print(f'Category: {p.get(\"category\", \"(none)\")}')
    print(f'Tags: {p.get(\"tags\", [])}')
    print(f'Created: {p.get(\"created_date\")}')
    print(f'ID: {p.get(\"id\")}')
"
```

This will show you EXACTLY what's in your database.

---

## Method 3: Vercel Dashboard (Manual)

1. Go to https://vercel.com/dashboard
2. Click your project
3. Click **"Logs"** in the sidebar
4. **Publish a post from Base44**
5. Look for logs containing `[BLOG API]`

You'll see something like this if Base44 sends TWO requests:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[BLOG API] Request ID: 1701234567890-0.123
[BLOG API] INCOMING FROM BASE44:
  title: What is AI Optimization? A Guide...
  meta_title: AI Optimization for Brand Growth
  content length: 5432
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[BLOG API] Request ID: 1701234567891-0.456
[BLOG API] INCOMING FROM BASE44:
  title: AI Optimization for Brand Growth
  meta_title: (none)
  content length: 50
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If you see TWO blocks like above, Base44 is sending TWO requests.**

---

## Method 4: Add a Webhook Logger

If you can't use Vercel logs, use a webhook logger:

1. Go to https://webhook.site
2. Copy the unique URL they give you
3. In Base44, configure it to send to that URL FIRST
4. Publish a post
5. Go back to webhook.site and see EXACTLY what Base44 sends

You'll see the full JSON payload of each request.

---

## What To Do After You See The Logs

### If you see ONE request:

Take a screenshot of the log showing:
- The `title` value
- The `meta_title` value
- The `content length`
- The full log block

Send it to me and I'll tell you exactly what's wrong.

### If you see TWO requests:

Take a screenshot showing BOTH log blocks and send it to me.

This proves Base44 is configured incorrectly.

---

## Quick Check: Delete All Posts and Test

```bash
# Delete all posts
curl -s "https://sewo.io/api/blog?limit=100" | python3 -c "
import sys, json, urllib.request
posts = json.load(sys.stdin).get('data', [])
for p in posts:
    req = urllib.request.Request(f'https://sewo.io/api/blog/{p[\"id\"]}', method='DELETE')
    try:
        urllib.request.urlopen(req)
        print(f'Deleted: {p[\"title\"]}')
    except:
        print(f'Failed to delete: {p[\"title\"]}')
print(f'\nTotal deleted: {len(posts)}')
"

# Verify all deleted
curl -s "https://sewo.io/api/blog" | python3 -c "
import sys, json
posts = json.load(sys.stdin).get('data', [])
print(f'Remaining posts: {len(posts)}')
"

# Now publish ONE post from Base44 and check again
echo ""
echo "Now publish ONE post from Base44..."
echo "Press Enter when done..."
read

# Check how many were created
curl -s "https://sewo.io/api/blog" | python3 -c "
import sys, json
posts = json.load(sys.stdin).get('data', [])
print(f'Posts created: {len(posts)}')
if len(posts) == 1:
    print('✅ GOOD: Only 1 post created')
elif len(posts) == 2:
    print('❌ BAD: 2 posts created (Base44 is sending 2 requests)')
    for i, p in enumerate(posts, 1):
        print(f'\nPost {i}:')
        print(f'  Title: {p.get(\"title\")}')
        print(f'  Content: {len(p.get(\"content\", \"\"))} chars')
else:
    print(f'⚠️  UNEXPECTED: {len(posts)} posts created')
"
```

---

## I NEED THIS FROM YOU

To fix this permanently, I need ONE screenshot showing:

**Option A: Vercel Logs**
- Screenshot of the logs after publishing ONE post from Base44
- Showing the `[BLOG API]` entries
- Showing how many request blocks appear

**Option B: Database State**
- Run the "See what's in your database" command above
- Send me the output showing the 2 posts

**Option C: Webhook.site Capture**
- Screenshot of webhook.site showing what Base44 sent
- Should show the full JSON payload(s)

With ANY of these, I can tell you EXACTLY what's wrong and how to fix it.

---

## The Most Likely Cause

Based on your description:

**Post 1:** Full content but wrong title → Base44 sent with `title` = long SEO title  
**Post 2:** Right title but no content → Base44 sent with `title` = short title, minimal content

This means Base44 is making TWO separate API calls with different payloads.

**To fix:** Configure Base44 to send ONE request with:
- `title` = long SEO title (what you want as H1)
- `meta_title` = short title (for browser tab)
- `content` = full HTML content
- All other fields

---

## Run This NOW

```bash
cd /Users/stuarta/Documents/GitHub/doubleclicker-1
./watch-api-requests.sh
```

Then publish from Base44 and you'll see EXACTLY what's happening in real-time.

