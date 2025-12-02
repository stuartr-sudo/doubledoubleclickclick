# 🎯 EXACT API STRUCTURE - NO GUESSING

## POST Request to: `https://sewo.io/api/blog`

### Method: `POST`
### Content-Type: `application/json`
### Endpoint: `/api/blog`

---

## ✅ CORRECT JSON STRUCTURE

```json
{
  "title": "AI Optimization for Brand Growth",
  "meta_title": "What is AI Optimization? A Complete Guide to Brand Growth Strategies | SEWO",
  "slug": "ai-optimization-for-brand-growth",
  "content": "<h1 style=\"text-align: center;\">AI Optimization for Brand Growth</h1><p>Your full HTML content here...</p>",
  "status": "published",
  "category": "Marketing",
  "tags": ["ai", "seo", "marketing"],
  "featured_image": "https://images.unsplash.com/photo-123456",
  "user_name": "stuart",
  "author": "stuart",
  "excerpt": "Discover how AI optimization can transform your brand's digital presence.",
  "meta_description": "Learn about AI optimization for brands: improve search rankings, automate content, and enhance digital marketing.",
  "focus_keyword": "ai optimization",
  "generated_llm_schema": "{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",...}",
  "export_seo_as_tags": false
}
```

---

## 📋 FIELD-BY-FIELD BREAKDOWN

### REQUIRED FIELDS (Must be present)

| Field | Type | Example | What It's Used For |
|-------|------|---------|-------------------|
| `title` | string | `"AI Optimization for Brand Growth"` | **H1 heading on page** (what users see) |
| `content` | string | `"<h1>...</h1><p>Full HTML...</p>"` | **Body content** (must be ≥ 50 chars) |

### OPTIONAL FIELDS (Can be omitted or null)

| Field | Type | Example | What It's Used For |
|-------|------|---------|-------------------|
| `slug` | string | `"ai-optimization-for-brand-growth"` | URL slug (auto-generated from title if missing) |
| `status` | string | `"published"` or `"draft"` | Publication status (default: "draft") |
| `meta_title` | string | `"What is AI Optimization? | SEWO"` | **Browser tab / SEO title** (NOT displayed as H1) |
| `meta_description` | string | `"Learn about AI optimization..."` | SEO meta description |
| `category` | string | `"Marketing"` | Post category |
| `tags` | array | `["ai", "seo"]` | Array of tag strings |
| `featured_image` | string | `"https://..."` | Featured image URL |
| `user_name` | string | `"stuart"` | Publisher username |
| `author` | string | `"stuart"` | Author name |
| `excerpt` | string | `"Brief summary..."` | Short excerpt |
| `focus_keyword` | string | `"ai optimization"` | Primary SEO keyword |
| `generated_llm_schema` | string | `"{...}"` | JSON-LD schema as string |
| `export_seo_as_tags` | boolean | `false` | Whether to export SEO as tags |

---

## ⚠️ CRITICAL RULES

### Rule #1: `title` vs `meta_title`

**`title` = What users see on the page (H1 heading)**
- ✅ Short, clean, readable
- ✅ Example: `"AI Optimization for Brand Growth"`
- ❌ DON'T include "| Brand Name" here
- ❌ DON'T make it super long

**`meta_title` = What Google/browser tab sees (SEO only)**
- ✅ Can be longer, include brand name
- ✅ Example: `"What is AI Optimization? A Complete Guide | SEWO"`
- ✅ Can include "| Brand Name"
- ✅ Optimized for search engines

**THEY MUST BE DIFFERENT!**

### Rule #2: `content` Must Have Real Content

**Minimum 50 characters required**

✅ **GOOD:**
```json
{
  "content": "<h1>Title</h1><p>This is a full paragraph with actual content that explains the topic in detail.</p>"
}
```

❌ **BAD (Will be rejected):**
```json
{
  "content": "<h1>Title</h1>"
}
```

### Rule #3: `slug` Should Match `title`

**If you provide `slug`, it should be based on `title`:**

- `title`: `"AI Optimization for Brand Growth"`
- `slug`: `"ai-optimization-for-brand-growth"` ✅

**If `slug` is missing, it's auto-generated from `title`**

---

## 📝 EXAMPLES

### Example 1: Minimal (Required Fields Only)

```json
{
  "title": "How to Use AI for SEO",
  "content": "<h1 style=\"text-align: center;\">How to Use AI for SEO</h1><p>Artificial intelligence is revolutionizing search engine optimization. In this guide, we'll explore how AI tools can help you improve your SEO strategy and achieve better rankings.</p>",
  "status": "published"
}
```

**Result:**
- ✅ Post created with auto-generated slug
- ✅ `title` = "How to Use AI for SEO" (shown as H1)
- ✅ `meta_title` = null (falls back to `title` for SEO)
- ✅ `content` = Full HTML content

### Example 2: Full Featured (All Fields)

```json
{
  "title": "AI Optimization for Brand Growth",
  "meta_title": "What is AI Optimization? A Complete Guide to Brand Growth Strategies | SEWO",
  "slug": "ai-optimization-for-brand-growth",
  "content": "<h1 style=\"text-align: center;\">AI Optimization for Brand Growth</h1><p>Artificial intelligence is transforming how brands grow and engage with customers. This comprehensive guide covers everything you need to know about AI optimization.</p><h2>What is AI Optimization?</h2><p>AI optimization involves using artificial intelligence tools to improve your brand's visibility, automate processes, and enhance customer experiences.</p>",
  "status": "published",
  "category": "Marketing",
  "tags": ["ai", "seo", "marketing", "brand-growth"],
  "featured_image": "https://images.unsplash.com/photo-1677442136019-21780ecad995",
  "user_name": "stuart",
  "author": "stuart",
  "excerpt": "Discover how AI optimization can transform your brand's digital presence and boost search rankings.",
  "meta_description": "Learn about AI optimization for brands: improve search rankings, automate content, and enhance digital marketing with artificial intelligence tools.",
  "focus_keyword": "ai optimization",
  "export_seo_as_tags": false
}
```

**Result:**
- ✅ Post created with all fields populated
- ✅ `title` = "AI Optimization for Brand Growth" (H1 on page)
- ✅ `meta_title` = "What is AI Optimization? A Complete Guide..." (browser tab)
- ✅ `slug` = "ai-optimization-for-brand-growth" (URL)
- ✅ All other fields stored correctly

### Example 3: Update Existing Post (Same Slug)

```json
{
  "title": "AI Optimization for Brand Growth - Updated",
  "meta_title": "What is AI Optimization? Updated Guide | SEWO",
  "slug": "ai-optimization-for-brand-growth",
  "content": "<h1>Updated content here...</h1><p>This is the updated version.</p>",
  "status": "published"
}
```

**Result:**
- ✅ Post with slug "ai-optimization-for-brand-growth" is **UPDATED**
- ✅ No new post created
- ✅ Title and content updated

---

## ❌ COMMON MISTAKES

### Mistake #1: Swapping `title` and `meta_title`

❌ **WRONG:**
```json
{
  "title": "What is AI Optimization? A Complete Guide | SEWO",
  "meta_title": "AI Optimization for Brand Growth"
}
```

✅ **CORRECT:**
```json
{
  "title": "AI Optimization for Brand Growth",
  "meta_title": "What is AI Optimization? A Complete Guide | SEWO"
}
```

### Mistake #2: Empty or Too Short Content

❌ **WRONG:**
```json
{
  "title": "My Post",
  "content": "<h1>Title</h1>"
}
```

✅ **CORRECT:**
```json
{
  "title": "My Post",
  "content": "<h1>Title</h1><p>This is a full paragraph with actual content that explains the topic in detail. It must be at least 50 characters long.</p>"
}
```

### Mistake #3: Missing `title` or `content`

❌ **WRONG:**
```json
{
  "meta_title": "SEO Title",
  "content": "<p>Content</p>"
}
```

✅ **CORRECT:**
```json
{
  "title": "Display Title",
  "meta_title": "SEO Title",
  "content": "<p>Content</p>"
}
```

---

## 🔍 HOW TO TEST

### Using cURL:

```bash
curl -X POST https://sewo.io/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "meta_title": "Test Post | SEWO",
    "slug": "test-post",
    "content": "<h1>Test Post</h1><p>This is a test post with enough content to pass validation. It must be at least 50 characters long.</p>",
    "status": "published"
  }'
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "id": "abc123-def456-...",
    "title": "Test Post",
    "meta_title": "Test Post | SEWO",
    "slug": "test-post",
    "status": "published",
    "created_date": "2025-12-02T12:00:00Z",
    "_debug": {
      "title_for_display": "Test Post",
      "meta_title_for_seo": "Test Post | SEWO"
    }
  }
}
```

---

## 📊 WHAT HAPPENS TO EACH FIELD

| Field | Stored In Database | Displayed On Page | Used For SEO |
|-------|-------------------|-------------------|--------------|
| `title` | `title` column | **H1 heading** ✅ | Fallback if `meta_title` empty |
| `meta_title` | `meta_title` column | **Never displayed** ❌ | **Browser tab / Google** ✅ |
| `content` | `content` column | **Body content** ✅ | Not used |
| `slug` | `slug` column | **URL** ✅ | Not used |
| `meta_description` | `meta_description` column | **Never displayed** ❌ | **Meta description** ✅ |
| `excerpt` | `excerpt` column | **Can be displayed** ✅ | Not used |
| `category` | `category` column | **Can be displayed** ✅ | Not used |
| `tags` | `tags` column | **Can be displayed** ✅ | Not used |
| `featured_image` | `featured_image` column | **Featured image** ✅ | OpenGraph image ✅ |

---

## ✅ CHECKLIST FOR BASE44

Before sending the API request, verify:

- [ ] `title` is short and clean (NOT the SEO title)
- [ ] `meta_title` is the SEO-optimized version (can include "| Brand")
- [ ] `content` is at least 50 characters
- [ ] `slug` matches the `title` (or let it auto-generate)
- [ ] `status` is "published" or "draft"
- [ ] All other fields are optional (can be omitted)

---

## 🎯 SUMMARY

**SEND THIS EXACT STRUCTURE:**

```json
{
  "title": "Short Display Title",
  "meta_title": "Long SEO Title | Brand Name",
  "slug": "short-display-title",
  "content": "<h1>Title</h1><p>Full content here (≥50 chars)...</p>",
  "status": "published"
}
```

**THAT'S IT. ONE REQUEST. ONE POST.**

---

## 🚨 IF YOU STILL GET DUPLICATES

1. **Check Vercel logs** - How many `[BLOG API]` log blocks do you see?
   - 1 block = Good ✅
   - 2 blocks = Base44 is sending TWO requests ❌

2. **Check the data** - Are `title` and `meta_title` different?
   - Same = Wrong ❌
   - Different = Good ✅

3. **Check `content` length** - Is it ≥ 50 characters?
   - Too short = Will be rejected ✅
   - Long enough = Will be accepted ✅

---

**THIS IS THE EXACT STRUCTURE. NO GUESSING. NO AMBIGUITY.**

