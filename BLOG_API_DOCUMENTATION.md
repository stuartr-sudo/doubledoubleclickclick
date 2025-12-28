# SEWO Blog API - Complete Documentation (v3.0 FIXED)

**Last Updated:** December 28, 2025  
**API Version:** 3.0 (SINGLE TABLE ARCHITECTURE)  
**Base URL:** `https://www.sewo.io`

---

## 🚨 THE GOLDEN RULE 🚨
The SEWO blog system now uses a **Single Table** architecture (`site_posts`).
1. **API Posts are ALWAYS PUBLISHED** by default.
2. If you send a payload with `status: "draft"`, it is **DELETED** from the live site (this is how you unpublish).
3. Anything else (or no status at all) results in a **LIVE, PUBLISHED** article.

---

## 1. Endpoint
### Create or Update Blog Post
```http
POST https://www.sewo.io/api/blog
Content-Type: application/json
```

---

## 2. The Expected JSON Payload
This is the **EXACT** structure the API expects. Use these field names exactly.

```json
{
  "postId": "unique-id-from-your-editor",
  "title": "Your Article Title",
  "slug": "your-article-slug",
  "content": "<h1>Your Article HTML Content</h1><p>This content must be at least 50 characters long.</p>",
  "status": "published",
  "meta_title": "SEO Meta Title",
  "meta_description": "SEO Meta Description",
  "focus_keyword": "Primary Keyword",
  "excerpt": "Short summary of the post",
  "category": "Category Name",
  "tags": ["Tag1", "Tag2"],
  "author": "Author Name",
  "featured_image": "https://url-to-image.jpg",
  "generated_llm_schema": { 
    "@context": "https://schema.org", 
    "@type": "Article",
    "headline": "..."
  },
  "export_seo_as_tags": true,
  "user_name": "SEWO"
}
```

---

## 3. Field Definitions

| Field | Required? | Description |
|-------|-----------|-------------|
| `postId` | **YES** | Your unique identifier (UUID). Used to prevent duplicates and enable updates. |
| `title` | **YES** | The display title of the article. |
| `content` | **YES** | The full HTML content. (Alternatives: `html`, `content_html`). |
| `slug` | No | URL path. If missing, it's generated from the title. |
| `status` | No | Default is `"published"`. Use `"draft"` to **DELETE/UNPUBLISH** the post. |
| `category` | No | Article category. Optional. |
| `tags` | No | Array of strings. |
| `author` | No | Author display name. |
| `featured_image`| No | URL to the main header image. |
| `meta_title` | No | SEO Title tag. |
| `meta_description`| No | SEO Description tag. |
| `focus_keyword` | No | Primary keyword for SEO tools. |
| `excerpt` | No | Short summary. |
| `generated_llm_schema` | No | JSON-LD Structured Data object. |
| `export_seo_as_tags` | No | Boolean. |
| `user_name` | No | Tracking field (Defaults to `"SEWO"`). |

---

## 4. How Updates Work
When you send a request with a `postId`:
1. If that `postId` already exists in our database, we **OVERWRITE** the existing article with your new data.
2. If it does not exist, we create a **NEW** record.

---

## 5. Success Response Format
```json
{
  "success": true,
  "data": {
    "id": "db-uuid",
    "title": "Your Title",
    "slug": "your-slug",
    "status": "published",
    "operation": "upsert"
  },
  "api_version": "SEWO-v3-FIXED"
}
```

---

## 6. Testing with cURL
```bash
curl -X POST https://www.sewo.io/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "my-test-post-123",
    "title": "Hello World",
    "content": "<p>This is a test post that is long enough to pass validation.</p>",
    "status": "published"
  }'
```

---
**END OF DOCUMENTATION**
