# 🔍 WHY ONLY 3 POSTS SHOW ON BLOG

## **The Issue:**

You have **100 posts** in the database:
- ✅ **3 published** (shown on blog)
- 📝 **97 drafts** (hidden from blog)

**Most drafts don't have slugs**, which means they're incomplete.

---

## **Why This Happened:**

When Base44 creates posts, they're created with `status="draft"` by default. Only posts with `status="published"` show on the blog.

---

## **Solution 1: Bulk Publish Complete Drafts (Quick Fix)**

Run this script to publish all draft posts that have slugs (complete posts):

```bash
./publish-complete-drafts.sh
```

This will:
1. Find all drafts with slugs (complete posts)
2. Show you the list
3. Ask for confirmation
4. Publish them all

---

## **Solution 2: Auto-Publish When Base44 Sends Posts**

Edit the API to auto-publish posts if Base44 doesn't specify status:

### In `app/api/blog/route.ts`, change:

```typescript
// OLD (line ~32):
status = 'draft',

// NEW:
status = 'published',  // Default to published instead of draft
```

This will make new posts from Base44 automatically published.

---

## **Solution 3: Base44 Configuration**

Configure Base44 to send `"status": "published"` in the payload:

```json
{
  "postId": "uuid-123",
  "title": "Article Title",
  "content": "<p>Content...</p>",
  "status": "published"  // ← Add this
}
```

---

## **Check Current Status:**

```bash
# Count published vs draft posts
curl -s "https://www.sewo.io/api/blog?status=all&limit=100" | python3 -c "
import sys, json
posts = json.load(sys.stdin)['data']
published = sum(1 for p in posts if p.get('status') == 'published')
draft = sum(1 for p in posts if p.get('status') == 'draft')
print(f'Published: {published}')
print(f'Draft: {draft}')
print(f'Total: {len(posts)}')
"
```

---

## **Recommended Action:**

**Immediate:** Run `./publish-complete-drafts.sh` to publish existing complete drafts

**Long-term:** Change API default from `'draft'` to `'published'` so new posts auto-publish

---

## **Result:**

After publishing, you'll see **dozens of posts** on your blog instead of just 3! 🎉

