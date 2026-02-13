# Modern Longevity — Onboarding Handoff

**Brand:** Modern Longevity  
**Domain:** modernlongevity.io  
**Purpose:** Use this document to onboard the brand in your content/onboarding system. All fields are ready for import.

---

## 1. Target Market

**Primary audience:** Health-conscious adults 35–60 (Gen X and younger Boomers) who are proactive about aging, have disposable income, and prefer evidence-based information over hype. Secondary: millennials (30–40) interested in preventive longevity.

**Demographics:** US and UK primarily; urban/suburban; higher education; $75K+ household income. Skews male in supplement research but growing female segment.

**Pain points:** Information overload and conflicting advice on supplements; skepticism about “anti-aging” marketing; desire for science-backed, actionable guidance; confusion about NAD+, NMN, resveratrol, and other longevity compounds.

**Content opportunities:** Comparison and “best of” guides (supplements, protocols); explainers on mechanisms (e.g. NAD+, senolytics); lifestyle + nutrition + supplementation; product reviews with clear evidence levels; longevity tech and biomarkers.

**Market context:** US longevity & general wellness supplements ~$6.35B (2025), projected to ~$10.13B by 2033 (CAGR ~6%). Anti-aging/longevity audience is mainstreaming; 40–59 segment drives largest share. North America leads; affiliate and info-product monetization are strong.

---

## 2. Seed Keywords (15)

Use these for keyword expansion (e.g. 10–15 seeds → 250–350 keywords in your pipeline).

| # | Seed Keyword |
|---|--------------|
| 1 | best longevity supplements |
| 2 | NAD+ supplements |
| 3 | NMN vs NAD+ |
| 4 | resveratrol benefits |
| 5 | anti-aging supplements that work |
| 6 | longevity diet |
| 7 | how to increase NAD+ naturally |
| 8 | best NMN supplement |
| 9 | longevity vitamins |
| 10 | anti-aging supplements for women |
| 11 | longevity science |
| 12 | supplements for healthy aging |
| 13 | NAD+ supplement reviews |
| 14 | longevity lifestyle |
| 15 | best resveratrol supplement |

---

## 3. Brand Blurb

**Short (1–2 sentences):**  
Modern Longevity is a science-first guide to living longer and healthier. We translate longevity research and supplement evidence into clear, actionable advice so you can choose what’s worth your time and money.

**Extended (for onboarding/positioning):**  
Modern Longevity helps health-conscious adults navigate the longevity and anti-aging supplement space with evidence-based content. We focus on mechanisms (NAD+, NMN, resveratrol, etc.), honest product comparisons, and practical lifestyle and supplementation strategies—no hype, no pseudoscience. Our content is designed for readers who want to age well and make informed decisions about supplements and habits.

---

## 4. Imagineer / Brand Image Guidelines

Use this object to drive AI-generated featured images and in-article visuals (e.g. Flash, DALL·E, Midjourney). Keeps visuals on-brand across articles.

```json
{
  "brandImageStyle": {
    "visualStyle": "Clean, modern, editorial. Science and wellness, not medical or clinical. Avoid stock-photo cheese; prefer restrained, premium feel.",
    "colorPalette": "Warm neutrals (cream, soft beige, light wood), soft greens and teals (health, nature), occasional warm amber or gold (vitality, premium). Avoid harsh reds and neon. White space is welcome.",
    "mood": "Calm, trustworthy, aspirational but grounded. Optimistic about aging well, not fearful of aging.",
    "composition": "Uncluttered. Hero images: single subject or simple still life (e.g. supplement bottle, bowl of whole foods). Avoid busy collages. Centered or rule-of-thirds.",
    "lighting": "Natural, soft. Slight warmth. No harsh shadows or clinical fluorescents.",
    "subjects": "Lifestyle shots (healthy meals, movement, sleep), supplement/product shots (clean, minimal), abstract wellness (nature, cells, light). Prefer real-feel over obvious CGI.",
    "avoid": "Overly youthful or ‘ageless’ faces, fear-based imagery, pill piles, before/after body shots, heavy filters.",
    "typography": "If text overlay: sans-serif, clean, minimal. Not script or decorative."
  }
}
```

**Short prompt hint for image models:**  
“Editorial wellness style, clean and modern, soft natural lighting, warm neutrals and soft teal, science-backed longevity theme, no clinical or scary imagery.”

---

## 5. Publishing Credentials

Use these in your system to publish and manage content on modernlongevity.io.

| Field | Value |
|-------|--------|
| **Blog API URL** | `https://www.modernlongevity.io/api/blog` |
| **Categories API URL** | `https://www.modernlongevity.io/api/blog/categories` |
| **Site URL** | `https://www.modernlongevity.io` |
| **Admin panel URL** | `https://www.modernlongevity.io/admin` |
| **Admin username** | `admin` |
| **Admin password** | *(set at deploy; default was `admin123` — change if not already)* |

**Auth:** No API key required for `POST /api/blog` or `GET /api/blog`. Use HTTPS and `Content-Type: application/json`.

**Create category (optional):**  
`POST https://www.modernlongevity.io/api/blog/categories`  
Body: `{"name": "Category Name"}`

---

## 6. JSON Structure to Send Blogs

**Endpoint:** `POST https://www.modernlongevity.io/api/blog`  
**Method:** POST  
**Content-Type:** `application/json`

**Required fields:** `postId`, `title`, `content`  
**Upsert behavior:** Same `postId` updates the existing post; new `postId` creates a new post.

### Minimal example

```json
{
  "postId": "unique-article-id-123",
  "title": "Best Longevity Supplements for 2025",
  "content": "<h2>Introduction</h2><p>Your HTML content here...</p>"
}
```

### Full example (all supported fields)

```json
{
  "postId": "unique-article-id-123",
  "title": "Best Longevity Supplements for 2025",
  "content": "<h2>Introduction</h2><p>Full HTML content of the article...</p>",
  "slug": "best-longevity-supplements-2025",
  "status": "published",
  "category": "Supplements",
  "tags": ["longevity", "supplements", "NAD", "NMN", "2025"],
  "author": "Modern Longevity Editorial Team",
  "featured_image": "https://example.com/images/featured.jpg",
  "excerpt": "We reviewed the top evidence-based longevity supplements so you can choose with confidence.",
  "meta_title": "Best Longevity Supplements for 2025 | Modern Longevity",
  "meta_description": "Evidence-based guide to the best longevity supplements: NAD+, NMN, resveratrol, and more. Science-backed picks for 2025.",
  "focus_keyword": "best longevity supplements"
}
```

### Field reference

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `postId` | string | Yes | Unique ID; used for upsert. Use once per article (e.g. slug or external CMS id). |
| `title` | string | Yes | Post title. |
| `content` | string | Yes | HTML body. |
| `slug` | string | No | URL slug. Auto-generated from title if omitted. |
| `status` | string | No | `"published"` (default) or `"draft"`. `"draft"` = unpublish (removes from site). |
| `category` | string | No | e.g. Supplements, Research, Lifestyle. |
| `tags` | string[] | No | Array of tag strings. |
| `author` | string | No | Byline. |
| `featured_image` | string | No | Full URL to image. |
| `excerpt` | string | No | Short summary for listings/social. |
| `meta_title` | string | No | SEO title. |
| `meta_description` | string | No | SEO description. |
| `focus_keyword` | string | No | Primary keyword. |
| `user_name` | string | No | Defaults to SEWO in template; can set to `Modern Longevity`. |

### Unpublish / remove a post

Send the same `postId` with `status: "draft"`:

```json
{
  "postId": "unique-article-id-123",
  "status": "draft"
}
```

### cURL example

```bash
curl -X POST https://www.modernlongevity.io/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "best-longevity-supplements-2025",
    "title": "Best Longevity Supplements for 2025",
    "content": "<h2>Introduction</h2><p>Content here...</p>",
    "slug": "best-longevity-supplements-2025",
    "status": "published",
    "category": "Supplements",
    "tags": ["longevity", "supplements"],
    "author": "Modern Longevity Editorial Team",
    "meta_title": "Best Longevity Supplements for 2025 | Modern Longevity",
    "meta_description": "Evidence-based guide to the best longevity supplements in 2025."
  }'
```

---

## 7. Clearing Existing Content (Optional)

If you want to start with a clean slate and remove existing posts on the site:

- **Via API:** For each post you want to remove, call `POST /api/blog` with that post’s `postId` and `"status": "draft"`.
- **List posts first:** `GET https://www.modernlongevity.io/api/blog?limit=100` returns all posts (each has `id` and `external_id`). Use `external_id` as `postId` when unpublishing.
- **Via admin:** Log in at `https://www.modernlongevity.io/admin` and delete or unpublish from the UI if available.

---

**Document version:** 1.0  
**Generated for:** Custom Onboarding pipeline  
**Brand:** Modern Longevity (modernlongevity.io)
