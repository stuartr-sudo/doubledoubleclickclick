# Instructions for Agent in Modern Longevity Repo

**Context:** You are in the **modernlongevity** (or modernlongevity.io) repo. The site is live at https://www.modernlongevity.io. Your job is to update the site with **latest content and images** using the handoff data and (optionally) Stitch image generation.

**Source of truth (in doubleclicker-1 repo):**  
- `docs/MODERNLONGEVITY_HANDOFF.md` — brand, keywords, brand blurb, Imagineer image guidelines, publishing credentials, blog API JSON.  
- `docs/STITCH_INTEGRATION.md` — Stitch Imagineer API and slot mapping for homepage images.

If those files are not in this repo, copy the relevant sections from the doubleclicker-1 repo or ask the user to paste them.

---

## What to Do

### 1. Update the homepage with content and images

**Goal:** Replace default/template homepage copy and (optionally) add AI-generated images so the site shows Modern Longevity branding and visuals.

**Text (required):**  
Use the brand blurb and positioning from MODERNLONGEVITY_HANDOFF.md to build a JSON payload for the homepage. At minimum set:

- `logo_text`: `"Modern Longevity"`
- `hero_title`: e.g. headline from brand positioning (science-first guide to living longer and healthier)
- `hero_description`: 1–2 sentences from brand blurb
- `about_title`: e.g. "About Modern Longevity"
- `about_description`: Extended brand blurb or short about text
- Optional: `blog_grid_title`, `hero_cta_text`, `hero_cta_link`, `faq_items`, `services`, etc.

**Images (optional but recommended):**  
Use **Stitch Imagineer** (see STITCH_INTEGRATION.md):

- **Endpoint:** `POST {STITCH_URL}/api/imagineer/generate`  
- **Auth:** `Authorization: Bearer {STITCH_API_TOKEN}`  
- **Body per image:** `{ "prompt": "...", "style": "instagram-candid", "dimensions": "16:9" }` (or `1:1` for logo)

**Slot mapping:**

| homepage_content field | Dimensions | Prompt hint (from handoff brandImageStyle) |
|------------------------|------------|--------------------------------------------|
| `hero_image` | 16:9 | Editorial wellness, clean and modern, soft natural lighting, warm neutrals and soft teal, longevity theme |
| `hero_background_image` | 16:9 | Same style, more abstract or background |
| `logo_image` | 1:1 | Logo or wordmark for Modern Longevity; clean, minimal |

**Prompt:** Use the short prompt from MODERNLONGEVITY_HANDOFF §4:  
"Editorial wellness style, clean and modern, soft natural lighting, warm neutrals and soft teal, science-backed longevity theme, no clinical or scary imagery."

**Style:** `instagram-candid` or `ugc-testimonial` from STITCH_INTEGRATION.md.

**Flow:**

1. Build the text payload (from handoff).
2. For each image slot (hero_image, hero_background_image, logo_image): call Stitch Imagineer with prompt + style + dimensions; read the image URL from the response (e.g. `imageUrl` or `url`); add to payload.
3. Merge text + image URLs.
4. **POST** the full JSON to `https://www.modernlongevity.io/api/homepage` (or, if you are in the modernlongevity repo and running locally, `POST http://localhost:3000/api/homepage` or the site’s base URL).  
   - **Content-Type:** `application/json`  
   - No auth required for the homepage API.

### 2. Verify

- Open https://www.modernlongevity.io and confirm hero, about, and (if set) logo/background images.
- If something failed, check: Stitch URL/token, response shape from Imagineer (imageUrl vs url), and that the payload matches the `homepage_content` fields used by the app (see HomePageClient or admin homepage form).

### 3. Optional — Publish first blog posts

- Use MODERNLONGEVITY_HANDOFF §6 for the exact JSON structure.
- **Endpoint:** `POST https://www.modernlongevity.io/api/blog`
- Include `postId`, `title`, `content`, `slug`, `status`, `category`, `tags`, `featured_image` (optional; can generate with Stitch for each post).

---

## If Stitch Is Not Available

- Still POST the **text-only** payload to `/api/homepage` so the homepage copy is updated.
- Image fields can be left empty or filled later via the admin panel or a second run when Stitch is available.

---

## Env Vars (if you run Stitch from this repo)

- `STITCH_URL` — e.g. `http://localhost:4390`
- `STITCH_API_TOKEN` — e.g. `stitch_dev_token_2024`

---

**Summary:** Use MODERNLONGEVITY_HANDOFF.md for copy and image style; use STITCH_INTEGRATION.md for Imagineer; build homepage JSON (text + optional Stitch image URLs); POST to the site’s `/api/homepage`.
