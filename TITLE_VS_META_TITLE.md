# Title vs Meta Title - Clear Documentation

## Field Purposes

### `title` (Regular Title)
**Purpose:** The main display title shown on the page  
**Used for:**
- `<h1>` heading on blog post pages
- Blog post cards in listings
- Article titles in carousels
- Any visible title on the site

**Example:** "10 Ways AI is Transforming SEO"

### `meta_title` (SEO Title)
**Purpose:** SEO-optimized title for search engines and social media **ONLY**  
**Used for:**
- `<title>` tag (browser tab/search results)
- OpenGraph title (Facebook/LinkedIn previews)
- Twitter card title
- **NEVER displayed as the main heading**

**Example:** "AI SEO Guide 2024: 10 Proven Strategies | SEWO"

## How It Works

### On Blog Post Pages (`/blog/[slug]`)

```tsx
// SEO metadata (in <title> tag, OpenGraph, etc)
const seoTitle = post.meta_title || post.title  // Prefers meta_title for SEO

// Main page heading (what users see)
<h1>{post.title}</h1>  // ALWAYS uses regular title, NEVER meta_title
```

### When Creating Posts

**Via Admin Interface:**
- Only `title` field is used
- `meta_title` is automatically empty
- Result: `title` is used for both display AND SEO

**Via API (e.g., Base44):**
- Send `title` for main display title
- Send `meta_title` for SEO-optimized version (optional)
- Result: `title` for display, `meta_title` for SEO

## Example API Request

```json
{
  "title": "How AI is Changing SEO",
  "meta_title": "AI SEO Guide 2024: Complete Strategy | SEWO",
  "content": "<p>Article content...</p>",
  "meta_description": "Learn how AI is revolutionizing SEO with proven strategies and real examples.",
  "slug": "ai-changing-seo"
}
```

**Result:**
- Page shows: **"How AI is Changing SEO"** (from `title`)
- Browser tab shows: **"AI SEO Guide 2024: Complete Strategy | SEWO"** (from `meta_title`)
- Google shows: **"AI SEO Guide 2024: Complete Strategy | SEWO"** (from `meta_title`)

## Verification

To confirm correct behavior:

1. **Check page heading:**
   - Open any blog post
   - Look at the `<h1>` title at the top
   - This should show the `title` field value

2. **Check browser tab:**
   - Look at the browser tab title
   - This should show `meta_title` (or `title` if meta_title is empty)

3. **Check page source:**
   ```html
   <title>SEO optimized title here</title>  <!-- meta_title or title -->
   <h1>Main display title here</h1>         <!-- title only -->
   ```

## Code Reference

**File:** `app/blog/[slug]/page.tsx`

**Line 60-67:** SEO metadata uses `meta_title || title`
```tsx
const seoTitle = post.meta_title || post.title
return {
  title: seoTitle,  // For <title> tag
  // ...
}
```

**Line 249:** Page heading uses `post.title` only
```tsx
<h1 className="blog-post-title">{post.title}</h1>
```

## Summary

✅ **`title`** = What users see on the page  
✅ **`meta_title`** = What Google/Facebook see (SEO only)  
✅ Main heading ALWAYS shows `title`  
✅ SEO tags prefer `meta_title` but fallback to `title`

