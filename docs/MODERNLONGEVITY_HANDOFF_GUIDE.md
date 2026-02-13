# Modern Longevity — Handoff Guide

**Purpose:** This guide explains how to hand off the Modern Longevity site (modernlongevity.io) and how to update it with latest content and images. Use it when the site is live but homepage/content still need to be seeded or refreshed.

**Single source of truth for brand and API:** [MODERNLONGEVITY_HANDOFF.md](./MODERNLONGEVITY_HANDOFF.md) — target market, seed keywords, brand blurb, Imagineer image guidelines, publishing credentials, and blog API JSON.

---

## 1. What “Handoff” Means

- **Site:** modernlongevity.io is live (clone of the template; domain, Supabase, Vercel, blog API in place).
- **Handoff:** Passing the site to the next stage (content pipeline, editorial, or you) with everything needed to:
  - Seed or refresh **homepage** copy and images.
  - Publish **blog posts** via the blog API.
  - Manage content via **admin** or API.

---

## 2. What’s Already Done

- Domain and deployment (Vercel, Supabase).
- Blog API: `POST https://www.modernlongevity.io/api/blog` (see handoff doc for full JSON).
- Homepage API: `POST https://www.modernlongevity.io/api/homepage` — accepts a JSON body that updates the single `homepage_content` row (hero_title, hero_description, hero_image, logo_image, about_title, about_description, services, faq_items, etc.). No auth required on the route.
- Brand and image guidelines in MODERNLONGEVITY_HANDOFF.md (including `brandImageStyle` for Imagineer).

---

## 3. Steps to Finalize the Site (Content + Images)

### Step A: Seed or refresh the homepage

1. **Text:** Use the brand blurb and positioning from MODERNLONGEVITY_HANDOFF.md to set:
   - `hero_title`, `hero_description`
   - `about_title`, `about_description`
   - `logo_text` (e.g. "Modern Longevity")
   - Optional: services, FAQ, CTAs, blog_grid_title
2. **Images:** Use Stitch Imagineer (see [STITCH_INTEGRATION.md](./STITCH_INTEGRATION.md)) with the handoff’s `brandImageStyle` to generate:
   - `hero_image` (16:9), `hero_background_image` (16:9), `logo_image` (1:1), optional `about_image`
3. **Push:** Send the combined JSON to `POST https://www.modernlongevity.io/api/homepage`.

You can do this in one of two ways:

- **From this repo (doubleclicker-1):** Run the one-off script (see Section 4). It builds a homepage payload from the handoff, optionally calls Stitch for images if `STITCH_URL` and `STITCH_API_TOKEN` are set, then POSTs to modernlongevity.io.
- **From the modernlongevity repo:** Use the agent instructions in [MODERNLONGEVITY_AGENT_INSTRUCTIONS.md](./MODERNLONGEVITY_AGENT_INSTRUCTIONS.md) so the agent in that window can run seed-homepage (if implemented there) or call Stitch + POST /api/homepage.

### Step B: Optional — Publish first blog posts

- Use the blog API (MODERNLONGEVITY_HANDOFF.md §6) to `POST` articles with `postId`, `title`, `content`, `slug`, `category`, `tags`, `featured_image`, etc.
- Featured images can be generated with Stitch Imagineer using the same `brandImageStyle` and prompt hints from the handoff.

### Step C: Verify

- Open https://www.modernlongevity.io and confirm hero, about, and (if set) logo/background images.
- Check https://www.modernlongevity.io/admin and change default admin password if needed.
- Test `GET https://www.modernlongevity.io/api/blog` and one `POST` to the blog API if you publish posts.

---

## 4. Updating the Site from This Repo (doubleclicker-1)

You can update modernlongevity.io’s **homepage** from here without opening the modernlongevity repo:

1. **Script:** `scripts/seed-modernlongevity-homepage.js`
   - Builds a homepage payload from Modern Longevity copy (hero, about, logo_text, etc.).
   - If `STITCH_URL` and `STITCH_API_TOKEN` are set: calls Stitch Imagineer for `hero_image`, `logo_image`, `hero_background_image`, then merges URLs into the payload.
   - POSTs the payload to `https://www.modernlongevity.io/api/homepage`.

2. **Run (text only):**
   ```bash
   node scripts/seed-modernlongevity-homepage.js
   ```

3. **Run (with images — requires Stitch running and env set):**
   ```bash
   export STITCH_URL=http://localhost:4390
   export STITCH_API_TOKEN=stitch_dev_token_2024
   node scripts/seed-modernlongevity-homepage.js
   ```

4. **If you get "column 'about_description' does not exist":** The site's Supabase is missing some columns. Run the migration in **docs/MODERNLONGEVITY_ADD_HOMEPAGE_COLUMNS.sql** on modernlongevity.io's Supabase (Dashboard → SQL Editor → paste → Run). Then re-run the script. To also send about section and blog grid title, run with `USE_EXTENDED_PAYLOAD=1`:
   ```bash
   USE_EXTENDED_PAYLOAD=1 node scripts/seed-modernlongevity-homepage.js
   ```

If Stitch is not running or env is not set, the script still POSTs the text content so the homepage copy is updated; image fields stay empty until you run with Stitch or update them via admin/API.

### If images updated but text (hero_title, hero_description, etc.) did not

The script sends **both** text and image fields in one POST (you’ll see “POSTing … with keys: logo_text, hero_title, hero_description, …” when you run it). If images appear on the site but hero/about/logo text do not:

1. **Check what the API returns:**  
   Open **`GET https://www.modernlongevity.io/api/homepage`** in a browser or with curl. If the JSON includes the new `hero_title`, `hero_description`, `logo_text`, etc., the database was updated and the issue is **cache or front-end**.
2. **Hard refresh:** Try a hard reload (e.g. Cmd+Shift+R) or an incognito/private window. If the template uses `force-dynamic`, the page should refetch from Supabase each time; if the site uses static/ISR, trigger a redeploy or revalidate the homepage route.
3. **If GET /api/homepage still shows old text:** The site’s `POST /api/homepage` may be ignoring or stripping text fields (e.g. different API code or RLS). In the modernlongevity repo, confirm the homepage API spreads the full request body into the Supabase update and that `homepage_content` has columns `hero_title`, `hero_description`, `logo_text`, etc. Re-run the migration **docs/MODERNLONGEVITY_ADD_HOMEPAGE_COLUMNS.sql** if needed, then run the script again.

---

## 5. Handing Off to the Modern Longevity Repo (Other Cursor Window)

If you prefer to do the update from the **modernlongevity** repo (e.g. that’s where you run Stitch or seed-homepage):

- Give the agent in that window the instructions in **[MODERNLONGEVITY_AGENT_INSTRUCTIONS.md](./MODERNLONGEVITY_AGENT_INSTRUCTIONS.md)**.
- That doc tells the agent exactly what to do: use MODERNLONGEVITY_HANDOFF.md and STITCH_INTEGRATION.md, build homepage payload (text + optional Stitch images), and POST to the site’s `/api/homepage`.

---

## 6. Quick Reference

| What | Where |
|------|--------|
| **Step-by-step clone checklist** (don’t miss anything when cloning or updating from template) | [CLONE_CHECKLIST.md](./CLONE_CHECKLIST.md) |
| **Onboard Modern Longevity into your system** (brand, keywords, APIs, image style — copy-paste ready) | [MODERNLONGEVITY_ONBOARD_HANDOFF.md](./MODERNLONGEVITY_ONBOARD_HANDOFF.md) |
| Brand, keywords, API, image style (full detail) | [MODERNLONGEVITY_HANDOFF.md](./MODERNLONGEVITY_HANDOFF.md) |
| Stitch Imagineer usage and slot mapping | [STITCH_INTEGRATION.md](./STITCH_INTEGRATION.md) |
| Instructions for agent in modernlongevity repo | [MODERNLONGEVITY_AGENT_INSTRUCTIONS.md](./MODERNLONGEVITY_AGENT_INSTRUCTIONS.md) |
| One-off script to seed homepage from this repo | `scripts/seed-modernlongevity-homepage.js` |

---

**Document version:** 1.0  
**Brand:** Modern Longevity (modernlongevity.io)
