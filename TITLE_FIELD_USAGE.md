# Title vs Meta_Title - EXACT Field Usage

## Where Each Field is Used

### `title` Field (Display Title)
**Used for VISIBLE content on pages:**

1. **Blog Post Page** (`app/blog/[slug]/page.tsx` line 249)
   ```tsx
   <h1 className="blog-post-title">{post.title}</h1>
   ```
   This is THE MAIN HEADING users see.

2. **Blog Listing Page** (`app/blog/page.tsx` line 124)
   ```tsx
   <h2 className="blog-card-title">{post.title}</h2>
   ```
   Card titles on the blog index.

3. **JSON-LD Schema** (lines 176, 197)
   ```tsx
   headline: post.title
   ```
   Structured data uses the clean title.

4. **Analytics** (line 218)
   ```tsx
   <BlogTracker title={post.title} />
   ```

### `meta_title` Field (SEO Only)
**Used for SEO metadata ONLY:**

1. **Browser `<title>` Tag** (`app/blog/[slug]/page.tsx` line 61-65)
   ```tsx
   const seoTitle = post.meta_title || post.title
   return {
     title: seoTitle,  // What shows in browser tab
     // ...
   }
   ```

2. **OpenGraph Title** (line 68)
   ```tsx
   openGraph: {
     title: seoTitle,  // What shows on Facebook/LinkedIn
   }
   ```

3. **Twitter Card Title** (line 74)
   ```tsx
   twitter: {
     title: seoTitle,  // What shows on Twitter
   }
   ```

---

## What Base44 Should Send

Based on the payload structure you showed:

```json
{
  "title": "Clean Display Title Here",
  "meta_title": "SEO Optimized Title | Brand Name",
  "content": "...",
  "slug": "clean-display-title-here"
}
```

### Example 1: Blog Post About AI

**What Base44 sends:**
```json
{
  "title": "How AI is Transforming SEO",
  "meta_title": "How AI is Transforming SEO in 2024 | Complete Guide | SEWO"
}
```

**What users see:**
- Page H1: **"How AI is Transforming SEO"** ← from `title`
- Browser tab: **"How AI is Transforming SEO in 2024 | Complete Guide | SEWO"** ← from `meta_title`
- Google results: **"How AI is Transforming SEO in 2024 | Complete Guide | SEWO"** ← from `meta_title`

### Example 2: If They're The Same (NOT recommended)

**What Base44 sends:**
```json
{
  "title": "Complete Guide to SEO | SEWO",
  "meta_title": "Complete Guide to SEO | SEWO"
}
```

**What users see:**
- Page H1: **"Complete Guide to SEO | SEWO"** ← looks bad, too long
- Browser tab: **"Complete Guide to SEO | SEWO"** ← same
- You'll get a WARNING in logs: `⚠️  WARNING: title and meta_title are identical!`

---

## How To Verify What's Stored

### Option 1: Check API Response

When Base44 publishes, check the response JSON:

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "Clean Display Title",
    "meta_title": "SEO Title | Brand",
    "_debug": {
      "title_for_display": "Clean Display Title",
      "meta_title_for_seo": "SEO Title | Brand"
    }
  }
}
```

The `_debug` object shows exactly what will be used where.

### Option 2: Check Vercel Logs

After publishing, check Vercel logs for:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[BLOG API] INCOMING FROM BASE44:
  title: How AI is Transforming SEO
  meta_title: How AI is Transforming SEO in 2024 | Complete Guide | SEWO
  slug: how-ai-is-transforming-seo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[BLOG API] INSERTING new post with slug: how-ai-is-transforming-seo
[BLOG API] Successfully INSERTED new post 123
[BLOG API] STORED IN DATABASE:
  title: How AI is Transforming SEO
  meta_title: How AI is Transforming SEO in 2024 | Complete Guide | SEWO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If you see:
```
⚠️  WARNING: title and meta_title are identical!
⚠️  title should be clean, meta_title should be SEO-optimized
```

Then Base44 is sending the same value in both fields.

### Option 3: Check Database Directly

Go to Supabase Dashboard → Table Editor → `blog_posts` → Find your post

Look at these columns:
- `title` = What shows as the H1
- `meta_title` = What shows in browser tab/SEO

If they're the same, the issue is in Base44's configuration.

---

## Troubleshooting

### Problem: H1 shows "SEO Title | Brand Name"

**Cause:** The `title` field in the database contains the SEO-optimized value.

**Solution:** Check what Base44 is sending in the `title` field. It should be the clean version, not the SEO version.

### Problem: Both fields have the same value

**Cause:** Base44 is configured to send the same text in both fields.

**Solution:** In Base44's settings, make sure:
- `title` = Clean display title (short, readable)
- `meta_title` = SEO-optimized title (can be longer, include brand name)

### Problem: meta_title is empty

**Cause:** Base44 isn't sending the `meta_title` field.

**Solution:** This is OK! The code uses `post.title` as a fallback for SEO if `meta_title` is empty.

---

## Code References

**API Input:** `app/api/blog/route.ts` lines 14-33  
**API Storage:** `app/api/blog/route.ts` lines 51, 65  
**Page Display:** `app/blog/[slug]/page.tsx` line 249  
**SEO Metadata:** `app/blog/[slug]/page.tsx` lines 60-78  

---

## Summary

✅ `title` = MAIN H1 ON PAGE (what users read)  
✅ `meta_title` = SEO ONLY (browser tab, Google, social media)  
✅ If `meta_title` is empty, `title` is used for SEO too  
✅ If they're the same, you get a warning (but it still works)  
✅ The H1 on the page is ALWAYS `post.title`, NEVER `post.meta_title`

