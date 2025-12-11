# SEWO Blog API - Complete Documentation

**Last Updated:** December 11, 2025  
**API Version:** 2.0 (Complete Rebuild)  
**Base URL:** `https://www.sewo.io`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoint](#endpoint)
4. [Request Structure](#request-structure)
5. [Field Definitions](#field-definitions)
6. [JSON-LD Schema](#json-ld-schema)
7. [Complete Examples](#complete-examples)
8. [Response Format](#response-format)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)
11. [Testing](#testing)

---

## Overview

The SEWO Blog API allows you to create and update blog posts programmatically. The API uses a **single endpoint** for both creating new posts and updating existing ones.

### Key Features
- **Automatic Duplicate Prevention**: Uses `postId` to prevent duplicate posts
- **Exact Slug Usage**: Uses the exact slug you provide (no auto-generation)
- **Smart Updates**: Automatically updates existing posts when `postId` matches
- **JSON-LD Support**: Full support for structured data/schema markup
- **SEO Optimized**: Complete meta fields for search engine optimization

---

## Authentication

Currently, the API does not require authentication headers. This will be added in a future update.

---

## Endpoint

### Create or Update Blog Post

```
POST https://www.sewo.io/api/blog
```

**Method:** `POST`  
**Content-Type:** `application/json`  
**Rate Limit:** None (currently)

---

## Request Structure

### Headers

```http
POST /api/blog HTTP/1.1
Host: www.sewo.io
Content-Type: application/json
```

### Body

All requests must include a valid JSON body with at minimum the required fields.

---

## Field Definitions

### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `title` | string | Article title (used as display title) | Required, non-empty |
| `content` | string | Full HTML content of the article | Required, minimum 50 characters |

### Highly Recommended Fields

| Field | Type | Description | Why Important |
|-------|------|-------------|---------------|
| `postId` | string | Unique identifier from your CMS (UUID) | **CRITICAL** - Prevents duplicates and enables updates |
| `slug` | string | URL-friendly slug for the article | **CRITICAL** - Defines the URL path. API uses EXACT value provided |

### Content Fields (alternatives)

The API accepts content in multiple field names for compatibility:

| Field | Type | Priority | Description |
|-------|------|----------|-------------|
| `content` | string | 1st | Primary content field (use this) |
| `html` | string | 2nd | Alternative content field name |
| `content_html` | string | 3rd | Another alternative content field name |

**Note:** API checks fields in order above. First non-empty field is used.

### External ID Fields (alternatives)

The API accepts external identifiers in multiple field names:

| Field | Type | Priority | Description |
|-------|------|----------|-------------|
| `postId` | string | 1st | Base44/CMS article UUID (recommended) |
| `post_id` | string | 2nd | Snake_case alternative |
| `external_id` | string | 3rd | Generic external identifier |

**Note:** API checks fields in order above. First non-empty field is used.

### Status and Visibility

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | `"published"` | Publication status. Options: `"published"`, `"draft"` |

### SEO and Meta Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `meta_title` | string | SEO meta title (appears in search results) | `"Complete Guide to Stock Tank Pools \| SEWO"` |
| `meta_description` | string | SEO meta description (appears in search results) | `"Everything you need to know about stock tank pools including installation, maintenance, and costs."` |
| `focus_keyword` | string | Primary SEO keyword for the article | `"stock tank pools"` |
| `excerpt` | string | Short summary/excerpt of the article | `"Learn everything about stock tank pools in this comprehensive guide."` |

### Content Organization

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `category` | string | Article category | `"Home & Garden"` |
| `tags` | array of strings | Article tags for organization | `["pools", "diy", "outdoor", "summer"]` |
| `author` | string | Author name | `"John Smith"` |

### Media

| Field | Type | Description | Format |
|-------|------|-------------|--------|
| `featured_image` | string | URL to featured image | `"https://example.com/images/article.jpg"` |

### Structured Data (JSON-LD)

| Field | Type | Description |
|-------|------|-------------|
| `generated_llm_schema` | object | Complete JSON-LD schema markup (see [JSON-LD Schema](#json-ld-schema) section) |

### Advanced Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `export_seo_as_tags` | boolean | `false` | Whether to export SEO keywords as tags |
| `user_name` | string | `"api"` | Username for tracking who created/updated the post |

---

## JSON-LD Schema

JSON-LD (JavaScript Object Notation for Linked Data) is a method of encoding structured data for search engines. It helps Google and other search engines understand your content better.

### Why JSON-LD Matters

- **Rich Snippets**: Enables rich search results with images, ratings, etc.
- **Better SEO**: Helps search engines understand article context
- **Voice Search**: Improves discoverability in voice assistants
- **Knowledge Graph**: Can appear in Google's Knowledge Graph

### Basic Article Schema

Send this in the `generated_llm_schema` field:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Headline Here",
  "description": "Article description that appears in search results",
  "image": "https://example.com/featured-image.jpg",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "SEWO",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.sewo.io/logo.png"
    }
  },
  "datePublished": "2025-12-11T00:00:00Z",
  "dateModified": "2025-12-11T00:00:00Z"
}
```

### Complete Article Schema (Recommended)

For best SEO results, include all these fields:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Complete Guide to Stock Tank Pools: Installation, Costs & Maintenance",
  "alternativeHeadline": "Everything You Need to Know About Stock Tank Pools",
  "description": "Comprehensive guide covering stock tank pool installation, costs, maintenance, and tips for Australian summers.",
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/stock-tank-pool.jpg",
    "width": 1200,
    "height": 630
  },
  "author": {
    "@type": "Person",
    "name": "John Smith",
    "url": "https://www.sewo.io/authors/john-smith",
    "description": "Home improvement expert with 10+ years experience"
  },
  "publisher": {
    "@type": "Organization",
    "name": "SEWO",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.sewo.io/logo.png",
      "width": 600,
      "height": 60
    },
    "url": "https://www.sewo.io"
  },
  "datePublished": "2025-12-11T10:00:00+00:00",
  "dateModified": "2025-12-11T10:00:00+00:00",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.sewo.io/blog/complete-guide-to-stock-tank-pools"
  },
  "keywords": ["stock tank pools", "diy pools", "backyard pools", "pool installation"],
  "articleSection": "Home & Garden",
  "wordCount": 2500,
  "inLanguage": "en-US"
}
```

### HowTo Schema (for instructional content)

If your article is a how-to guide, use this schema:

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Install a Stock Tank Pool",
  "description": "Step-by-step guide to installing a stock tank pool in your backyard",
  "image": "https://example.com/howto-image.jpg",
  "totalTime": "PT4H",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "AUD",
    "value": "1500"
  },
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Level"
    },
    {
      "@type": "HowToTool",
      "name": "Shovel"
    }
  ],
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Stock Tank (2m diameter)"
    },
    {
      "@type": "HowToSupply",
      "name": "Sand"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Prepare the Ground",
      "text": "Level the ground where you'll place the pool",
      "image": "https://example.com/step1.jpg",
      "url": "https://www.sewo.io/blog/stock-tank-pool#step1"
    },
    {
      "@type": "HowToStep",
      "name": "Add Sand Base",
      "text": "Create a 2-inch sand base for drainage",
      "image": "https://example.com/step2.jpg",
      "url": "https://www.sewo.io/blog/stock-tank-pool#step2"
    }
  ]
}
```

### FAQ Schema (for Q&A content)

If your article contains frequently asked questions:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do stock tank pools get too hot?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, stock tank pools can get hot in direct sunlight. The water temperature can reach 85-95°F (29-35°C) during summer. You can prevent overheating by adding a shade structure or circulating the water."
      }
    },
    {
      "@type": "Question",
      "name": "How much does a stock tank pool cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A basic stock tank pool costs between $800-$2000 AUD for the tank, plus $500-$1000 for the pump, filter, and installation materials. Total cost typically ranges from $1500-$3000 AUD."
      }
    }
  ]
}
```

### Schema Type Reference

Choose the appropriate `@type` based on your content:

| Schema Type | Use When | Example |
|-------------|----------|---------|
| `Article` | General articles, blog posts | News, opinion pieces |
| `BlogPosting` | Blog-specific posts | Personal blog entries |
| `NewsArticle` | News content | Breaking news, updates |
| `HowTo` | Step-by-step guides | Tutorials, instructions |
| `FAQPage` | Q&A format content | FAQ sections |
| `Review` | Product/service reviews | Product comparisons |
| `Recipe` | Cooking recipes | Food articles |

---

## Complete Examples

### Example 1: Minimal Request (Required Fields Only)

```json
{
  "postId": "abc-123-uuid-456",
  "title": "My Article Title",
  "slug": "my-article-title",
  "content": "<p>This is my article content with HTML formatting. Must be at least 50 characters long.</p>"
}
```

### Example 2: Basic Article with SEO

```json
{
  "postId": "base44-article-uuid-789",
  "title": "Complete Guide to Stock Tank Pools",
  "slug": "complete-guide-to-stock-tank-pools",
  "content": "<h2>Introduction</h2><p>Stock tank pools have become increasingly popular...</p><h2>What is a Stock Tank Pool?</h2><p>A stock tank pool is a large galvanized steel tank originally designed for livestock watering...</p>",
  "status": "published",
  "category": "Home & Garden",
  "tags": ["pools", "diy", "outdoor", "summer"],
  "featured_image": "https://example.com/images/stock-tank-pool.jpg",
  "author": "John Smith",
  "meta_title": "Complete Guide to Stock Tank Pools | SEWO",
  "meta_description": "Everything you need to know about stock tank pools including installation, maintenance, and costs.",
  "focus_keyword": "stock tank pools",
  "excerpt": "Learn everything about stock tank pools in this comprehensive guide."
}
```

### Example 3: Full Article with JSON-LD Schema

```json
{
  "postId": "base44-article-uuid-12345",
  "title": "Complete Guide to Stock Tank Pools: Installation, Costs & Maintenance",
  "slug": "complete-guide-to-stock-tank-pools",
  "content": "<article><h1>Complete Guide to Stock Tank Pools</h1><p>Stock tank pools have revolutionized backyard cooling...</p><h2>What Are Stock Tank Pools?</h2><p>Stock tank pools are large galvanized steel containers originally designed for livestock...</p><h2>Installation Guide</h2><p>Installing a stock tank pool requires careful planning...</p><h3>Step 1: Choose Your Location</h3><p>Select a level area with good drainage...</p><h3>Step 2: Prepare the Ground</h3><p>Clear the area and create a solid base...</p></article>",
  "status": "published",
  "category": "Home & Garden",
  "tags": ["pools", "diy", "outdoor", "summer", "backyard"],
  "featured_image": "https://media.example.com/stock-tank-pool-featured.jpg",
  "author": "John Smith",
  "meta_title": "Complete Guide to Stock Tank Pools: Installation, Costs & Maintenance | SEWO",
  "meta_description": "Everything you need to know about stock tank pools including installation, maintenance, costs, and tips for Australian summers. Complete DIY guide.",
  "focus_keyword": "stock tank pools",
  "excerpt": "Learn everything about stock tank pools in this comprehensive guide covering installation, maintenance, costs, and expert tips for keeping your pool cool during Australian summers.",
  "generated_llm_schema": {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Complete Guide to Stock Tank Pools: Installation, Costs & Maintenance",
    "alternativeHeadline": "Everything You Need to Know About Stock Tank Pools",
    "description": "Comprehensive guide covering stock tank pool installation, costs, maintenance, and tips for Australian summers.",
    "image": {
      "@type": "ImageObject",
      "url": "https://media.example.com/stock-tank-pool-featured.jpg",
      "width": 1200,
      "height": 630
    },
    "author": {
      "@type": "Person",
      "name": "John Smith",
      "url": "https://www.sewo.io/authors/john-smith",
      "description": "Home improvement expert with 10+ years experience in outdoor living spaces"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SEWO",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.sewo.io/logo.png",
        "width": 600,
        "height": 60
      },
      "url": "https://www.sewo.io"
    },
    "datePublished": "2025-12-11T10:00:00+00:00",
    "dateModified": "2025-12-11T10:00:00+00:00",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://www.sewo.io/blog/complete-guide-to-stock-tank-pools"
    },
    "keywords": ["stock tank pools", "diy pools", "backyard pools", "pool installation", "outdoor living"],
    "articleSection": "Home & Garden",
    "wordCount": 2500,
    "inLanguage": "en-US"
  },
  "export_seo_as_tags": true,
  "user_name": "base44-api"
}
```

### Example 4: HowTo Article with Structured Data

```json
{
  "postId": "howto-stock-tank-installation-001",
  "title": "How to Install a Stock Tank Pool: Step-by-Step Guide",
  "slug": "how-to-install-stock-tank-pool",
  "content": "<article><h1>How to Install a Stock Tank Pool</h1><p>Installing a stock tank pool is a weekend DIY project...</p><h2>What You'll Need</h2><ul><li>Stock tank (2m diameter)</li><li>Level</li><li>Sand</li></ul><h2>Step 1: Prepare the Ground</h2><p>Level the ground where you'll place the pool...</p><h2>Step 2: Add Sand Base</h2><p>Create a 2-inch sand base...</p></article>",
  "status": "published",
  "category": "DIY Guides",
  "tags": ["howto", "diy", "pools", "installation"],
  "featured_image": "https://media.example.com/stock-tank-installation.jpg",
  "author": "Jane Doe",
  "meta_title": "How to Install a Stock Tank Pool: Complete DIY Guide | SEWO",
  "meta_description": "Step-by-step guide to installing a stock tank pool in your backyard. Includes tools needed, cost breakdown, and expert tips.",
  "focus_keyword": "install stock tank pool",
  "excerpt": "Complete step-by-step guide to installing your own stock tank pool, including tools, materials, and expert installation tips.",
  "generated_llm_schema": {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Install a Stock Tank Pool",
    "description": "Step-by-step guide to installing a stock tank pool in your backyard",
    "image": "https://media.example.com/stock-tank-installation.jpg",
    "totalTime": "PT4H",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "AUD",
      "value": "1500"
    },
    "tool": [
      {
        "@type": "HowToTool",
        "name": "Level"
      },
      {
        "@type": "HowToTool",
        "name": "Shovel"
      },
      {
        "@type": "HowToTool",
        "name": "Measuring Tape"
      }
    ],
    "supply": [
      {
        "@type": "HowToSupply",
        "name": "Stock Tank (2m diameter)"
      },
      {
        "@type": "HowToSupply",
        "name": "Sand (1 cubic meter)"
      },
      {
        "@type": "HowToSupply",
        "name": "Pool Filter System"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "name": "Prepare the Ground",
        "text": "Level the ground where you'll place the pool using a level and shovel. Remove any rocks or debris.",
        "image": "https://media.example.com/step1-ground-prep.jpg",
        "url": "https://www.sewo.io/blog/how-to-install-stock-tank-pool#step1"
      },
      {
        "@type": "HowToStep",
        "name": "Add Sand Base",
        "text": "Create a 2-inch sand base for proper drainage and support. Compact the sand evenly.",
        "image": "https://media.example.com/step2-sand-base.jpg",
        "url": "https://www.sewo.io/blog/how-to-install-stock-tank-pool#step2"
      },
      {
        "@type": "HowToStep",
        "name": "Position the Tank",
        "text": "Carefully position the stock tank on the prepared sand base. Ensure it's level in all directions.",
        "image": "https://media.example.com/step3-position-tank.jpg",
        "url": "https://www.sewo.io/blog/how-to-install-stock-tank-pool#step3"
      }
    ]
  },
  "user_name": "base44-api"
}
```

### Example 5: FAQ Article

```json
{
  "postId": "faq-stock-tank-pools-001",
  "title": "Stock Tank Pool FAQs: Common Questions Answered",
  "slug": "stock-tank-pool-faqs",
  "content": "<article><h1>Stock Tank Pool FAQs</h1><h2>Do stock tank pools get too hot?</h2><p>Yes, stock tank pools can get hot in direct sunlight...</p><h2>How much does a stock tank pool cost?</h2><p>A basic stock tank pool costs between $800-$2000 AUD...</p></article>",
  "status": "published",
  "category": "FAQs",
  "tags": ["faq", "pools", "questions"],
  "featured_image": "https://media.example.com/faq-pools.jpg",
  "author": "Support Team",
  "meta_title": "Stock Tank Pool FAQs: Your Questions Answered | SEWO",
  "meta_description": "Common questions about stock tank pools answered by experts. Learn about costs, installation, maintenance, and more.",
  "focus_keyword": "stock tank pool faq",
  "excerpt": "Get answers to the most common questions about stock tank pools including costs, installation, and maintenance.",
  "generated_llm_schema": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Do stock tank pools get too hot?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, stock tank pools can get hot in direct sunlight. The water temperature can reach 85-95°F (29-35°C) during summer. You can prevent overheating by adding a shade structure, using a pool cover at night, or circulating the water with a fountain feature."
        }
      },
      {
        "@type": "Question",
        "name": "How much does a stock tank pool cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A basic stock tank pool costs between $800-$2000 AUD for the tank itself, plus $500-$1000 for the pump, filter, and installation materials. Total cost typically ranges from $1500-$3000 AUD depending on size and features."
        }
      },
      {
        "@type": "Question",
        "name": "Do you need a fence for a stock tank pool?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "In Australia, most states require pool fencing for any pool that can hold more than 300mm of water. Stock tank pools typically exceed this depth, so you'll need compliant pool fencing with a self-closing gate."
        }
      }
    ]
  },
  "user_name": "base44-api"
}
```

---

## Response Format

### Success Response (Insert)

**Status Code:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "d97fb0cc-cf97-4c8d-90e6-11b4dabe3e4d",
    "title": "Complete Guide to Stock Tank Pools",
    "slug": "complete-guide-to-stock-tank-pools",
    "status": "published",
    "external_id": "base44-article-uuid-12345",
    "created_date": "2025-12-11T01:39:40.178322+00:00",
    "operation": "insert"
  }
}
```

### Success Response (Update)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "d97fb0cc-cf97-4c8d-90e6-11b4dabe3e4d",
    "title": "Complete Guide to Stock Tank Pools - Updated",
    "slug": "complete-guide-to-stock-tank-pools",
    "status": "published",
    "external_id": "base44-article-uuid-12345",
    "created_date": "2025-12-11T01:39:40.178322+00:00",
    "operation": "update"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful requests |
| `data.id` | string (UUID) | Database ID of the blog post |
| `data.title` | string | Post title as stored |
| `data.slug` | string | URL slug as stored |
| `data.status` | string | Publication status |
| `data.external_id` | string | Your `postId` for tracking |
| `data.created_date` | string (ISO 8601) | Creation timestamp |
| `data.operation` | string | Either `"insert"` (new) or `"update"` (existing) |

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "details": "Detailed error message"
}
```

### Common Errors

#### 400 Bad Request - Missing Required Fields

```json
{
  "success": false,
  "error": "Title and content are required"
}
```

**Solution:** Ensure `title` and `content` are both provided and non-empty.

#### 400 Bad Request - Content Too Short

```json
{
  "success": false,
  "error": "Content must be at least 50 characters"
}
```

**Solution:** Ensure `content` field has at least 50 characters.

#### 500 Internal Server Error - Database Error

```json
{
  "success": false,
  "error": "Failed to create post",
  "details": "Database connection error"
}
```

**Solution:** Retry the request. If error persists, contact support.

---

## Best Practices

### 1. Always Include `postId`

```json
{
  "postId": "your-unique-article-id",
  ...
}
```

**Why:** Prevents duplicate posts and enables proper updates.

### 2. Use Descriptive Slugs

```json
{
  "slug": "complete-guide-to-stock-tank-pools",
  ...
}
```

**Good:** `complete-guide-to-stock-tank-pools`  
**Bad:** `article-123`, `post1`, `untitled`

### 3. Include Complete JSON-LD Schema

Always include structured data for better SEO:

```json
{
  "generated_llm_schema": {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "...",
    "author": {...},
    "publisher": {...}
  }
}
```

### 4. Optimize Meta Fields

```json
{
  "meta_title": "Article Title | Brand Name",
  "meta_description": "Compelling 150-160 character description that encourages clicks",
  "focus_keyword": "primary keyword phrase"
}
```

### 5. Use Proper HTML Formatting

```json
{
  "content": "<article><h1>Title</h1><p>Content with proper HTML structure...</p></article>"
}
```

### 6. Include High-Quality Images

```json
{
  "featured_image": "https://your-cdn.com/high-res-image-1200x630.jpg"
}
```

**Recommended Image Specs:**
- **Dimensions:** 1200x630px (16:9 ratio)
- **Format:** JPG or PNG
- **Size:** Under 200KB
- **Quality:** High resolution

### 7. Set Appropriate Status

```json
{
  "status": "published"  // or "draft" for unpublished articles
}
```

### 8. Tag Appropriately

```json
{
  "tags": ["pools", "diy", "outdoor", "summer"]
}
```

**Best Practices:**
- Use 3-7 relevant tags
- Use lowercase
- Be specific
- Avoid duplicate tags

---

## Testing

### Test with cURL

#### Create New Post

```bash
curl -X POST https://www.sewo.io/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "test-article-001",
    "title": "Test Article",
    "slug": "test-article",
    "content": "<p>This is a test article with more than 50 characters of content.</p>",
    "status": "draft"
  }'
```

#### Update Existing Post

```bash
curl -X POST https://www.sewo.io/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "test-article-001",
    "title": "Test Article - Updated",
    "slug": "test-article",
    "content": "<p>This is the updated content of the test article.</p>",
    "status": "draft"
  }'
```

### Test with Python

```python
import requests
import json

url = "https://www.sewo.io/api/blog"

payload = {
    "postId": "test-article-001",
    "title": "Test Article from Python",
    "slug": "test-article-python",
    "content": "<p>This is a test article created with Python with sufficient content length.</p>",
    "status": "draft",
    "category": "Testing",
    "tags": ["test", "python", "api"]
}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print(f"Status Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
```

### Test with Node.js

```javascript
const axios = require('axios');

const url = 'https://www.sewo.io/api/blog';

const payload = {
  postId: 'test-article-001',
  title: 'Test Article from Node.js',
  slug: 'test-article-nodejs',
  content: '<p>This is a test article created with Node.js with sufficient content length.</p>',
  status: 'draft',
  category: 'Testing',
  tags: ['test', 'nodejs', 'api']
};

axios.post(url, payload, {
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Status Code:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.error('Error:', error.response ? error.response.data : error.message);
});
```

---

## API Behavior Summary

### How the API Decides to INSERT or UPDATE

1. **If `postId` is provided:**
   - Searches for existing post with matching `external_id`
   - If found → **UPDATE** that post
   - If not found → **INSERT** new post

2. **If `postId` is NOT provided:**
   - Searches for existing post with matching `slug`
   - If found → **UPDATE** that post
   - If not found → **INSERT** new post

### Duplicate Prevention

The API **NEVER creates duplicate posts**:
- Uses `postId` (external_id) as primary identifier
- Falls back to `slug` if no `postId`
- Automatically updates instead of creating duplicate if match found
- Database-level unique constraints prevent accidental duplicates

### Slug Handling

- **Uses EXACT slug you provide** (no auto-generation)
- If slug is empty/null → generates slug from title as fallback
- Slug is used in URL: `https://www.sewo.io/blog/{slug}`

---

## Quick Reference Card

### Minimum Required Request

```json
{
  "postId": "unique-id",
  "title": "Article Title",
  "slug": "article-slug",
  "content": "Content with at least 50 characters..."
}
```

### Recommended Request

```json
{
  "postId": "unique-id",
  "title": "Article Title",
  "slug": "article-slug",
  "content": "Full HTML content...",
  "meta_title": "SEO Title | Brand",
  "meta_description": "SEO description...",
  "featured_image": "https://...",
  "category": "Category Name",
  "tags": ["tag1", "tag2"],
  "generated_llm_schema": { "@type": "Article", ... }
}
```

---

## Support

For questions or issues with the API:

- **Email:** hello@sewo.io
- **Documentation:** This file
- **API Version:** 2.0
- **Last Updated:** December 11, 2025

---

## Changelog

### Version 2.0 (December 11, 2025)
- Complete API rebuild
- Simplified to 250 lines of code
- Removed complex duplicate prevention logic
- Added explicit `postId` tracking
- Improved slug handling (uses exact slug from request)
- Enhanced error messages
- Added operation type in response (`insert` or `update`)

### Version 1.0 (Previous)
- Initial implementation
- Complex duplicate prevention
- Advisory locks
- Multiple fallback checks

---

**END OF DOCUMENTATION**

