# Step-by-step: Clone the template to a new site

Use this checklist when creating a new site from the doubleclicker template (e.g. modernlongevity) so nothing is missed. Work in order.

---

## What the template is (current state)

- **Homepage:** Basic blog layout only — **Hero → About (optional) → Blog Posts** (2 rows × 3 posts). No testimonials, no “AI Visibility System”, no FAQ, no apply form.
- **Header:** Logo (icon-sized, max 40px tall), nav (About, Contact, Blog), CTA button. Logo and CTA come from the homepage API.
- **About section:** Text left, image right. Uses `about_title`, `about_description`, `about_image` from the homepage API.
- **Blog listing (/blog):** Title and metadata come from env: `NEXT_PUBLIC_BLOG_TITLE`, `NEXT_PUBLIC_SITE_NAME` (no hardcoded “The AI Field Guide”).
- **Contact page:** Generic intro (“Get in touch. We’ll reply within 1–2 business days.”) and placeholder (“Your message...”).

---

## 1. Get the template code into the clone repo

You need the **clone repo** (e.g. modernlongevity) to contain the latest template files. Do one of the following.

### Recommended first pass (automated branding + defaults)

Inside the clone repo, run:

```bash
npm install
npm run setup
npm run clone:validate
```

This now handles core branding replacements and fails fast if legacy strings remain in user-facing files.

### One-command alternative (fully scripted clone creation)

From the template repo, run:

```bash
npm run clone:auto -- --profile docs/CLONE_PROFILE_TEMPLATE.json --output-base ~/Documents/GitHub
```

Use your own profile JSON (copy the template and fill brand/domain/email fields).

### Option A: Copy files from the template folder (recommended if histories differ)

From a terminal (replace paths if yours differ):

```bash
# Go to the folder that contains both repos
cd /Users/stuarta/Documents/GitHub

# Copy these files from template into clone (overwrite)
cp doubleclicker-1/components/SiteHeader.tsx     modernlongevity/components/SiteHeader.tsx
cp doubleclicker-1/app/HomePageClient.tsx        modernlongevity/app/HomePageClient.tsx
cp doubleclicker-1/app/globals.css              modernlongevity/app/globals.css
cp doubleclicker-1/app/contact/page.tsx         modernlongevity/app/contact/page.tsx
cp doubleclicker-1/app/blog/page.tsx            modernlongevity/app/blog/page.tsx
```

### Option B: Git pull from template remote (only if clone was created from template and you use the same remote)

In the **clone repo** folder:

```bash
git remote add upstream https://github.com/stuartr-sudo/doubleclicker.git
git fetch upstream
git merge upstream/main --no-rebase
# Resolve any conflicts, then:
git push origin master
```

If you get “refusing to merge unrelated histories”, use Option A instead.

---

## 2. Database: Homepage columns

The clone’s Supabase must have the columns used by the homepage and seed script.

1. Open the **clone’s Supabase** project (e.g. modernlongevity.io → Supabase Dashboard).
2. Go to **SQL Editor → New query**.
3. Paste and run the migration that adds homepage columns. For the same structure as the template, use the contents of **docs/MODERNLONGEVITY_ADD_HOMEPAGE_COLUMNS.sql** (it’s safe for any clone; the file name is just from the first use):

   - `about_title`
   - `about_description`
   - `blog_grid_title`
   - `hero_background_image`

4. If your template or migrations also add `blog_section_visible`, ensure that exists (default `true`) so the Blog Posts section can show.

---

## 3. Environment variables (clone project)

In the **clone** repo (e.g. modernlongevity), set these so the site and blog page use the right branding:

| Variable | Example (Modern Longevity) | Purpose |
|----------|----------------------------|--------|
| `NEXT_PUBLIC_BLOG_TITLE` | `Blog` | /blog page heading (no “The AI Field Guide”) |
| `NEXT_PUBLIC_SITE_NAME` | `Modern Longevity` | Used in blog metadata and titles |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `contact@modernlongevity.io` | Contact page email link/text |
| `NEXT_PUBLIC_CONTACT_PHONE` | `+1 555-123-4567` | Optional contact phone display |

Set them in:

- **Local:** `.env` and `.env.local` (if you use it).
- **Production:** Vercel (or your host) → Project → Settings → Environment Variables. Add for Production (and Preview if you want).

Redeploy after changing env vars.

---

## 4. Contact page (clone-specific copy)

The template uses generic contact text. Update the clone’s contact details if they’re still placeholder:

- **File:** `app/contact/page.tsx`
- **Update:** The email address and phone number in the contact info block (e.g. replace `contact@sewo.io` and the placeholder phone with the real contact for this brand).

---

## 5. Homepage content (hero, about, CTA, blog section title)

The homepage is driven by the **Homepage API** (one row in `homepage_content`). Populate it for the clone.

**Fields to set (at least):**

- `logo_text` — e.g. “Modern Longevity”
- `logo_image` — optional; if used, keep it small/icon-style (template constrains to 40px height)
- `hero_title`, `hero_description`
- `hero_image` — landscape 16:9 recommended (seed script can request this)
- `hero_cta_text`, `hero_cta_link` — e.g. “Explore the Science” → `/blog`
- `about_title`, `about_description`, `about_image` — optional About block
- `blog_grid_title` — e.g. “Blog Posts” or “Latest from Modern Longevity”

**Ways to do it:**

- **From the template repo:** Use the seed script for that brand (e.g. `scripts/seed-modernlongevity-homepage.js`). Run with `USE_EXTENDED_PAYLOAD=1` if the script sends `about_*` and `blog_grid_title`. If the clone’s API URL differs, change the script’s `HOMEPAGE_API_URL` or add a clone-specific script.
- **From the clone repo:** POST to the clone’s `/api/homepage` with a JSON body containing the fields above (see MODERNLONGEVITY_ONBOARD_HANDOFF.md and MODERNLONGEVITY_HANDOFF_GUIDE.md for examples).
- **Admin:** If the clone has the admin homepage editor, fill hero, about, CTA, and blog grid title there.

If you get “column does not exist”, run the migration from step 2 and try again.

---

## 6. Deploy and verify

1. **Commit and push** (if you used Option A or made any edits):

   ```bash
   cd /path/to/clone-repo
   git add -A
   git commit -m "Apply template updates: basic blog homepage, logo, about, contact, blog title"
   git push origin master
   ```

   (Use `main` if your default branch is `main`.)

2. **Deploy** the clone (e.g. Vercel auto-deploy on push, or trigger deploy from the host dashboard).

3. **Check on the live site:**
   - [ ] Homepage: Hero → About (if set) → Blog Posts (2×3 grid).
   - [ ] Header: Logo icon-sized; nav CTA matches hero CTA.
   - [ ] /blog: Title is the one from env (e.g. “Blog”), not “The AI Field Guide”.
   - [ ] /about: No old brand references; mission/copy matches the new site.
   - [ ] /contact: Intro and placeholder are generic (or your custom copy); contact email/phone correct.
   - [ ] `GET /api/homepage` returns the expected hero, about, and blog_grid_title.

4. **Fail-fast content check before deploy:**

   ```bash
   grep -RniE "SEWO|sewo\\.io|AI Visibility System|Apply to Work With Us|The AI Field Guide" app components
   ```

   This should return either no results or only intentional/admin/setup references.

---

## 7. Optional / later

- **Lead magnet per site:** See **docs/PLAN_LEAD_MAGNET_PER_SITE.md**.
- **Stitch/Imagineer images:** See **docs/STITCH_INTEGRATION.md** and brand image guidelines in the handoff doc for that clone (e.g. MODERNLONGEVITY_HANDOFF.md).
- **Blog posts:** Publish via the clone’s blog API so the Blog Posts section has content (see MODERNLONGEVITY_ONBOARD_HANDOFF.md or the clone’s API docs).

---

## Quick reference: files to copy from template to clone

| Template path | Purpose |
|---------------|--------|
| `components/SiteHeader.tsx` | Header with icon-sized logo, nav, CTA from API |
| `app/HomePageClient.tsx` | Basic blog homepage (Hero → About → Blog grid) |
| `app/globals.css` | Styles (about section, logo wrap, etc.) |
| `app/contact/page.tsx` | Contact page with generic intro and placeholder |
| `app/blog/page.tsx` | Blog listing with title from env |

---

**Document version:** 1.0  
**Template:** doubleclicker (doubleclicker-1); clone example: modernlongevity.
