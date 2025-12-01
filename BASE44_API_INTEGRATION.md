# Base44 API Integration Guide

Complete guide for integrating Base44's custom API endpoint with your SEWO blog.

## Quick Setup

### 1. Run Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add comprehensive SEO fields to blog_posts table
ALTER TABLE public.blog_posts 
  ADD COLUMN IF NOT EXISTS focus_keyword text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS generated_llm_schema text,
  ADD COLUMN IF NOT EXISTS export_seo_as_tags boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_name text DEFAULT 'api';

COMMENT ON COLUMN public.blog_posts.generated_llm_schema IS 'JSON-LD schema markup (stringified JSON) for rich search results and AI optimization';
COMMENT ON COLUMN public.blog_posts.focus_keyword IS 'Primary SEO keyword for targeting';
COMMENT ON COLUMN public.blog_posts.excerpt IS 'Brief summary or excerpt of the blog post';
COMMENT ON COLUMN public.blog_posts.user_name IS 'Brand/username associated with the content for multi-tenant support';
```

### 2. Configure Base44

In Base44, set your custom API endpoint to:

```
https://www.sewo.io/api/blog
```

Or for testing:
```
http://localhost:3000/api/blog
```

## API Endpoint Documentation

### Endpoint URL

```
POST https://www.sewo.io/api/blog
```

### Headers

```json
{
  "Content-Type": "application/json",
  "User-Agent": "Base44-Publisher/1.0"
}
```

Note: Authorization is optional - your endpoint is currently public for ease of use.

### Request Payload

All fields from Base44 are supported:

```json
{
  // ===== CORE CONTENT (Required) =====
  "title": "Your Blog Post Title",
  "content": "<h1>Full HTML Content</h1><p>Your article content here...</p>",
  
  // ===== CORE CONTENT (Optional) =====
  "slug": "your-blog-post-title",          // Auto-generated if not provided
  "status": "published",                    // "published", "draft", or "active"
  "category": "Technology",                 // Blog category
  "tags": ["ai", "seo", "marketing"],      // Array of tags
  "featured_image": "https://example.com/image.jpg",
  "author": "John Doe",                     // Author name
  
  // ===== SEO METADATA =====
  "meta_title": "SEO Optimized Title - Brand Name",
  "meta_description": "Compelling meta description for search engines (150-160 chars)",
  "focus_keyword": "ai seo optimization",
  "excerpt": "Brief summary of the article for previews and social sharing",
  
  // ===== ADVANCED SEO =====
  "generated_llm_schema": "{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"Your Title\",...}",
  "export_seo_as_tags": true,
  
  // ===== USER ASSOCIATION =====
  "user_name": "your-brand-name"           // Defaults to "api" if not provided
}
```

### Field Details

#### Required Fields
- **`title`** (string): Blog post title
- **`content`** (string): Full HTML content

#### Optional Core Fields
- **`slug`** (string): URL-friendly slug (auto-generated from title if not provided)
- **`status`** (string): `"published"`, `"draft"`, or `"active"` (defaults to `"draft"`)
- **`category`** (string): Category name for grouping posts
- **`tags`** (array of strings): Tags for categorization
- **`featured_image`** (string): URL to featured/hero image
- **`author`** (string): Author name

#### SEO Metadata Fields
- **`meta_title`** (string): SEO-optimized title for search engines
- **`meta_description`** (string): Meta description (150-160 characters recommended)
- **`focus_keyword`** (string): Primary keyword for SEO targeting
- **`excerpt`** (string): Brief summary for previews

#### Advanced SEO Fields
- **`generated_llm_schema`** (string): JSON-LD schema markup as a **stringified JSON object**
  - This should be a string containing valid JSON-LD schema
  - Will be parsed and injected into the page's `<head>` for rich search results
  - Supports BlogPosting, FAQPage, Organization, etc.
  - Example: `"{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"Title\"}"`
  
- **`export_seo_as_tags`** (boolean): Whether SEO metadata should be exported as tags

#### User Association
- **`user_name`** (string): Brand or username for multi-tenant content (defaults to `"api"`)

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "3f488259-c3ad-4cee-a52f-32fc05a710f8",
    "title": "Your Blog Post Title",
    "slug": "your-blog-post-title",
    "status": "published",
    "created_date": "2025-12-01T13:45:00.000Z",
    "user_name": "your-brand-name"
  }
}
```

Your published post will be available at:
```
https://www.sewo.io/blog/your-blog-post-title
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Title and content are required"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to create blog post",
  "details": "Specific error message here"
}
```

## Example: Full Request with All Fields

```bash
curl -X POST https://www.sewo.io/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How AI is Transforming SEO in 2025",
    "slug": "ai-transforming-seo-2025",
    "content": "<h1>AI and SEO</h1><p>Artificial intelligence is revolutionizing how we optimize for search engines...</p>",
    "status": "published",
    "category": "Technology",
    "tags": ["ai", "seo", "technology", "2025"],
    "featured_image": "https://example.com/ai-seo-hero.jpg",
    "author": "Jane Smith",
    "meta_title": "How AI is Transforming SEO in 2025 | SEWO",
    "meta_description": "Discover how artificial intelligence is revolutionizing SEO strategies and what it means for your business in 2025.",
    "focus_keyword": "ai seo 2025",
    "excerpt": "Learn about the latest AI-powered SEO techniques that are changing the digital marketing landscape.",
    "generated_llm_schema": "{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"How AI is Transforming SEO in 2025\",\"description\":\"Discover how artificial intelligence is revolutionizing SEO strategies\",\"author\":{\"@type\":\"Person\",\"name\":\"Jane Smith\"},\"publisher\":{\"@type\":\"Organization\",\"name\":\"SEWO\"}}",
    "export_seo_as_tags": true,
    "user_name": "sewo-blog"
  }'
```

## Testing Your Integration

### 1. Test with Minimal Data
```bash
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "content": "<p>This is a test.</p>"
  }'
```

### 2. Test with Full SEO Data
```bash
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Full SEO Test Post",
    "content": "<h1>Test</h1><p>Content here.</p>",
    "status": "published",
    "meta_title": "Full SEO Test",
    "meta_description": "Testing all SEO fields",
    "focus_keyword": "test seo",
    "generated_llm_schema": "{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"Test\"}"
  }'
```

### 3. Verify the Post
- Check the response for the `slug`
- Visit: `http://localhost:3000/blog/{slug}`
- View page source to verify JSON-LD schema is injected

## JSON-LD Schema Usage

When you provide `generated_llm_schema`, it will:

1. **Replace the default schema** on the blog post page
2. **Be injected into the `<head>`** for search engines and AI to parse
3. **Support any schema.org types**: BlogPosting, Article, FAQPage, HowTo, etc.

### Example JSON-LD Schemas

#### Basic BlogPosting
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Your Post Title",
  "description": "Post description",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "SEWO"
  },
  "datePublished": "2025-12-01",
  "image": "https://example.com/image.jpg"
}
```

#### BlogPosting with FAQPage
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "headline": "Complete Guide to AI SEO",
      "author": {
        "@type": "Organization",
        "name": "SEWO"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is AI SEO?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI SEO is the practice of optimizing content for AI-powered search engines and chatbots."
          }
        }
      ]
    }
  ]
}
```

**Important:** When sending via API, the JSON-LD must be **stringified**:

```json
{
  "generated_llm_schema": "{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",...}"
}
```

## Database Schema

Your `blog_posts` table now has these columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated unique ID |
| `title` | TEXT | Post title (required) |
| `content` | TEXT | HTML content (required) |
| `slug` | TEXT | URL-friendly slug |
| `status` | TEXT | "published", "draft", or "active" |
| `category` | TEXT | Category name |
| `tags` | TEXT[] | Array of tags |
| `featured_image` | TEXT | Image URL |
| `author` | TEXT | Author name |
| `meta_title` | TEXT | SEO title |
| `meta_description` | TEXT | SEO description |
| `focus_keyword` | TEXT | Primary SEO keyword |
| `excerpt` | TEXT | Brief summary |
| `generated_llm_schema` | TEXT | JSON-LD schema (stringified) |
| `export_seo_as_tags` | BOOLEAN | Export SEO as tags flag |
| `user_name` | TEXT | Brand/user identifier |
| `created_date` | TIMESTAMPTZ | Auto-set creation date |
| `updated_date` | TIMESTAMPTZ | Auto-updated timestamp |
| `published_date` | TIMESTAMPTZ | Set when status="published" |

## Troubleshooting

### Issue: "Title and content are required" error
**Solution:** Ensure your request includes both `title` and `content` fields.

### Issue: JSON-LD schema not showing on page
**Solution:** 
1. Check that `generated_llm_schema` is valid JSON
2. Ensure it's **stringified** (wrapped in quotes)
3. View page source to see if schema is in `<head>`

### Issue: Slug conflicts
**Solution:** Each slug must be unique. Either:
- Provide a unique `slug` in your request
- Let the system auto-generate from title
- Check existing posts to avoid duplicates

## Base44 Configuration

In Base44's custom API settings, configure:

1. **Endpoint URL**: `https://www.sewo.io/api/blog`
2. **Method**: `POST`
3. **Headers**: `Content-Type: application/json`
4. **Enable these fields**:
   - Core: title, content, slug, status, category, tags, featured_image, author
   - SEO: meta_title, meta_description, focus_keyword, excerpt
   - Advanced: generated_llm_schema, export_seo_as_tags, user_name

## Getting Blog Posts (GET)

You can also retrieve blog posts via the API:

```bash
# Get all published posts (limit 10)
curl https://www.sewo.io/api/blog

# Get with custom limit
curl https://www.sewo.io/api/blog?limit=20

# Get all posts (including drafts)
curl https://www.sewo.io/api/blog?status=all

# Get only drafts
curl https://www.sewo.io/api/blog?status=draft
```

### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Post Title",
      "slug": "post-slug",
      "content": "<html>...</html>",
      "status": "published",
      "category": "Technology",
      "tags": ["ai", "seo"],
      "meta_title": "SEO Title",
      "meta_description": "Description",
      "focus_keyword": "keyword",
      "excerpt": "Brief summary",
      "generated_llm_schema": "{...}",
      "created_date": "2025-12-01T00:00:00Z",
      "user_name": "api"
    }
  ]
}
```

## Support

For issues or questions:
1. Check the Supabase logs for detailed error messages
2. Verify the migration was run successfully
3. Test with minimal payload first, then add fields incrementally

