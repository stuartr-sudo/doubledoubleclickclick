# Terminal commands: Update Modern Longevity (text, images, remove SEWO)

Run these in order. Replace paths if yours differ.

---

## 1. Update homepage text + images (landscape hero, logo, all copy)

Run from the **template repo** (doubleclicker-1). This POSTs to modernlongevity’s API and updates the database.

**Text only (no new images):**
```bash
cd /Users/stuarta/Documents/GitHub/doubleclicker-1
USE_EXTENDED_PAYLOAD=1 node scripts/seed-modernlongevity-homepage.js
```

**Text + new images (landscape hero, logo) — requires Stitch running:**
```bash
cd /Users/stuarta/Documents/GitHub/doubleclicker-1
export STITCH_URL=http://localhost:4390
export STITCH_API_TOKEN=stitch_dev_token_2024
USE_EXTENDED_PAYLOAD=1 node scripts/seed-modernlongevity-homepage.js
```
*(Change `STITCH_URL` if Stitch runs on a different port.)*

---

## 2. Copy latest template files into modernlongevity

Run from a folder that contains **both** repos (e.g. `GitHub`).

```bash
cd /Users/stuarta/Documents/GitHub
cp doubleclicker-1/components/SiteHeader.tsx     modernlongevity/components/SiteHeader.tsx
cp doubleclicker-1/app/HomePageClient.tsx        modernlongevity/app/HomePageClient.tsx
cp doubleclicker-1/app/globals.css               modernlongevity/app/globals.css
cp doubleclicker-1/app/contact/page.tsx         modernlongevity/app/contact/page.tsx
cp doubleclicker-1/app/blog/page.tsx            modernlongevity/app/blog/page.tsx
```

---

## 3. Replace SEWO with Modern Longevity in the modernlongevity repo

Run from **inside the modernlongevity repo**. These replace branding in code (contact email, footer, defaults, etc.). Use a real contact email if you have one; otherwise `contact@modernlongevity.io` is the placeholder.

```bash
cd /Users/stuarta/Documents/GitHub/modernlongevity
```

Then run these **one at a time** (macOS `sed -i ''`; on Linux use `sed -i` without the empty string):

```bash
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/contact@sewo\.io/contact@modernlongevity.io/g' {} +
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/stuartr@sewo\.io/contact@modernlongevity.io/g' {} +
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/hi@sewo\.io/contact@modernlongevity.io/g' {} +
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/privacy@sewo\.io/privacy@modernlongevity.io/g' {} +
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|https://www\.sewo\.io|https://www.modernlongevity.io|g' {} +
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|https://sewo\.io|https://www.modernlongevity.io|g' {} +
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/www\.sewo\.io/www.modernlongevity.io/g' {} +
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/sewo\.io/modernlongevity.io/g' {} +
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/SEWO - Get Found Everywhere/Modern Longevity/g' {} +
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/SEWO Editorial Team/Modern Longevity Editorial Team/g' {} +
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/Your Friends at SEWO/Modern Longevity/g' {} +
find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/SEWO/Modern Longevity/g' {} +
```

**Footer and middleware/robots (root-level files):**
```bash
sed -i '' 's/contact@sewo\.io/contact@modernlongevity.io/g' components/Footer.tsx
sed -i '' 's/SEWO/Modern Longevity/g' components/Footer.tsx
sed -i '' 's/Get Found Everywhere/science-first longevity content/g' components/Footer.tsx
sed -i '' "s/sewo\.io/modernlongevity.io/g" middleware.ts
sed -i '' "s/sewo\.io/modernlongevity.io/g" app/robots.ts
```

---

## 4. Set env so /blog shows “Blog” (not “The AI Field Guide”)

In **modernlongevity**, add to `.env` or `.env.local` (and in Vercel → Settings → Environment Variables):

```
NEXT_PUBLIC_BLOG_TITLE=Blog
NEXT_PUBLIC_SITE_NAME=Modern Longevity
```

No terminal command for this; set in the file or in Vercel dashboard.

---

## 5. Commit, push, deploy

```bash
cd /Users/stuarta/Documents/GitHub/modernlongevity
git add -A
git status
git commit -m "Update from template: remove SEWO, Modern Longevity branding, env for blog title"
git push origin master
```

Then trigger or wait for deploy (e.g. Vercel).

---

## Summary

| Step | What it does |
|------|----------------|
| 1   | Updates **homepage content** (hero, about, CTA, blog title) and optionally **hero + logo images** (landscape hero via Stitch) via the API. |
| 2   | Copies **template code** (header logo size, About layout, contact/blog copy) into modernlongevity. |
| 3   | Replaces **SEWO** and **sewo.io** with **Modern Longevity** and **modernlongevity.io** in the codebase. |
| 4   | **Env vars** so blog page title is “Blog”. |
| 5   | **Commit, push, deploy** so the live site updates. |
