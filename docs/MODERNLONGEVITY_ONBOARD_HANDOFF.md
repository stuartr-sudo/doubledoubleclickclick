# Modern Longevity — Onboard to System (Handoff)

Use this document to **onboard Modern Longevity into your content/onboarding pipeline**. Copy-paste or import these values into your system.

---

## Quick reference

| Field | Value |
|-------|--------|
| **Brand name** | Modern Longevity |
| **Domain** | modernlongevity.io |
| **Site URL** | https://www.modernlongevity.io |
| **Blog API** | https://www.modernlongevity.io/api/blog |
| **Categories API** | https://www.modernlongevity.io/api/blog/categories |
| **Homepage API** | https://www.modernlongevity.io/api/homepage |
| **Admin URL** | https://www.modernlongevity.io/admin |

---

## Homepage (basic blog template)

The doubleclicker template homepage is a **basic blog layout**: **Hero → About (optional) → Latest blog posts**. No testimonials, no “Introducing AI Visibility System”, no problem/solution blocks, FAQ, or apply form.

- **Hero:** Title, description, background image, and one CTA button.
- **Nav/menu CTA:** Same as hero CTA — uses `hero_cta_text` and `hero_cta_link` from the Homepage API (brand-specific).
- **About:** Optional block using `about_title`, `about_description`, `about_image` (when present).
- **Blog grid:** Title from `blog_grid_title`; shows latest 6 posts.

To change hero or CTA copy, PATCH/POST the homepage API with `hero_title`, `hero_description`, `hero_cta_text`, `hero_cta_link`, and (for extended payload) `about_*`, `blog_grid_title`. See **docs/MODERNLONGEVITY_ADD_HOMEPAGE_COLUMNS.sql** if the site needs extra columns. Lead magnet per site (opt-in CTA + asset) is planned later — see **docs/PLAN_LEAD_MAGNET_PER_SITE.md**.

**Blog page title:** The template no longer shows “The AI Field Guide”. Set in `.env` (or Vercel env): `NEXT_PUBLIC_BLOG_TITLE=Blog` and `NEXT_PUBLIC_SITE_NAME=Modern Longevity` so the /blog page heading and metadata use your brand.

**Full clone process:** For a step-by-step list so nothing is missed (copy files, DB, env, contact, homepage seed, deploy), see **[CLONE_CHECKLIST.md](./CLONE_CHECKLIST.md)**.

---

## 1. Brand registration (for your system)

| System field | Value |
|--------------|--------|
| **username** | modernlongevity |
| **display_name** | Modern Longevity |
| **domain** | modernlongevity.io |
| **target_market** | Health-conscious adults 35–60 (Gen X, younger Boomers); proactive about aging; evidence-based; US/UK; $75K+; supplement/longevity niche. |
| **brand_blurb (short)** | Modern Longevity is a science-first guide to living longer and healthier. We translate longevity research and supplement evidence into clear, actionable advice so you can choose what's worth your time and money. |
| **brand_blurb (extended)** | Modern Longevity helps health-conscious adults navigate the longevity and anti-aging supplement space with evidence-based content. We focus on mechanisms (NAD+, NMN, resveratrol, etc.), honest product comparisons, and practical lifestyle and supplementation strategies—no hype, no pseudoscience. Our content is designed for readers who want to age well and make informed decisions about supplements and habits. |

---

## 2. Seed keywords (15) — for keyword expansion

```
best longevity supplements
NAD+ supplements
NMN vs NAD+
resveratrol benefits
anti-aging supplements that work
longevity diet
how to increase NAD+ naturally
best NMN supplement
longevity vitamins
anti-aging supplements for women
longevity science
supplements for healthy aging
NAD+ supplement reviews
longevity lifestyle
best resveratrol supplement
```

---

## 3. Publishing credentials (for content pipeline)

| Field | Value |
|-------|--------|
| **blog_api_url** | https://www.modernlongevity.io/api/blog |
| **categories_api_url** | https://www.modernlongevity.io/api/blog/categories |
| **site_url** | https://www.modernlongevity.io |
| **admin_url** | https://www.modernlongevity.io/admin |
| **admin_username** | admin |
| **admin_password** | *(set at deploy; change from default if needed)* |

**Auth:** No API key for blog/homepage APIs. Use `Content-Type: application/json`.

---

## 4. Blog API — POST structure

**Endpoint:** `POST https://www.modernlongevity.io/api/blog`

**Required:** `postId`, `title`, `content`  
**Upsert:** Same `postId` updates existing post.

**Full example:**

```json
{
  "postId": "unique-article-id",
  "title": "Best Longevity Supplements for 2025",
  "content": "<h2>Introduction</h2><p>HTML content...</p>",
  "slug": "best-longevity-supplements-2025",
  "status": "published",
  "category": "Supplements",
  "tags": ["longevity", "supplements", "NAD", "NMN"],
  "author": "Modern Longevity Editorial Team",
  "featured_image": "https://...",
  "excerpt": "Evidence-based guide to the best longevity supplements.",
  "meta_title": "Best Longevity Supplements for 2025 | Modern Longevity",
  "meta_description": "Evidence-based guide to the best longevity supplements: NAD+, NMN, resveratrol, and more.",
  "focus_keyword": "best longevity supplements"
}
```

---

## 5. Image style (for Imagineer / featured images)

**Short prompt hint:**  
Editorial wellness style, clean and modern, soft natural lighting, warm neutrals and soft teal, science-backed longevity theme, no clinical or scary imagery.

**Stitch style:** `instagram-candid` or `ugc-testimonial`

**brandImageStyle (JSON):**

```json
{
  "visualStyle": "Clean, modern, editorial. Science and wellness, not medical or clinical.",
  "colorPalette": "Warm neutrals (cream, soft beige), soft greens and teals, warm amber or gold. Avoid harsh reds and neon.",
  "mood": "Calm, trustworthy, aspirational but grounded. Optimistic about aging well.",
  "composition": "Uncluttered. Hero: single subject or simple still life. Centered or rule-of-thirds.",
  "lighting": "Natural, soft. Slight warmth. No harsh shadows.",
  "subjects": "Lifestyle (healthy meals, movement, sleep), supplement shots (clean, minimal), abstract wellness.",
  "avoid": "Overly youthful faces, fear-based imagery, pill piles, before/after body shots, heavy filters."
}
```

---

## 6. Full handoff doc

For target market detail, pain points, content opportunities, and full blog API field reference, use **[MODERNLONGEVITY_HANDOFF.md](./MODERNLONGEVITY_HANDOFF.md)**.

---

**Document version:** 1.0  
**Brand:** Modern Longevity (modernlongevity.io)
