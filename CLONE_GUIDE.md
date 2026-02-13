# Complete Guide: Create a New Blog Site

This guide walks you through creating a new blog from this template with its own database, domain, and branding.

**Time required:** ~45 minutes  
**What you'll get:** A fully independent blog with self-hosted Supabase on Elestio

---

## Important: Each Blog Needs Its Own Supabase

For each blog you clone, you need:
- A **separate Supabase instance** on Elestio (~$32/month each)
- Its own **environment variables** (API keys)
- Its own **Vercel project**

The blogs are completely independent - separate databases, separate deployments.

---

## Quick Start (One Command)

Open Terminal and run:

```
cd ~/Documents/GitHub/doubleclicker-1
./create-new-blog.sh
```

This single command will:
1. ✓ Ask for your new blog folder name
2. ✓ Create the folder and copy all files
3. ✓ Initialize git
4. ✓ Install dependencies
5. ✓ Start the dev server
6. ✓ Open the setup wizard in your browser

**That's it for the code!** The visual setup wizard will guide you through configuring your brand, colors, and contact info.

## Zero-Typing Automation (Profile-Driven)

If you want cloning with no manual typing, use the automated profile runner:

1. Copy `docs/CLONE_PROFILE_TEMPLATE.json` to a new file (e.g. `docs/profiles/modernlongevity.json`)
2. Fill the profile once (or have the agent generate it)
3. Run:

```bash
npm run clone:auto -- --profile docs/profiles/modernlongevity.json --output-base ~/Documents/GitHub
```

This will:
- create the clone folder
- install dependencies
- run non-interactive setup with your profile
- run legacy-content validation (`clone:validate`)
- create initial git commit

### Mandatory no-miss workflow (new)

After creating the clone, always run:

```bash
cd ~/Documents/GitHub/YOUR-BLOG-FOLDER
npm run setup
npm run clone:validate
```

- `npm run setup` now updates additional user-facing files (including homepage/blog/contact defaults) and generates env defaults for contact/blog branding.
- `npm run clone:validate` fails if legacy strings still exist in user-facing pages (e.g. `SEWO`, `sewo.io`, `The AI Field Guide`, `AI Visibility System`, `Apply to Work With Us`).

---

## After the Setup Wizard

Once you've configured your blog in the wizard, you still need to:

1. **Create a GitHub repo** and push your code
2. **Set up Supabase** on Elestio  
3. **Deploy to Vercel**

See the detailed steps below.

### Critical: Avoid legacy text/branding leaks

Before first production deploy, always run the hardening checklist in:

- `docs/CLONE_CHECKLIST.md`

This prevents the most common issues we hit during cloning:

- Legacy `SEWO` text still present in About/Contact/legal pages
- Old AI/agency copy still present in homepage database fields
- `/blog` title still showing old defaults (e.g. AI Field Guide)
- Header/logo and CTA not aligned with the new brand

---

## Table of Contents

1. [Quick Start](#quick-start-one-command)
2. [Step 1: Complete the Setup Wizard](#step-1-complete-the-setup-wizard)
3. [Step 2: Create GitHub Repository](#step-2-create-github-repository)
4. [Step 3: Set Up Supabase on Elestio](#step-3-set-up-supabase-on-elestio)
5. [Step 4: Get Your Supabase API Keys](#step-4-get-your-supabase-api-keys)
6. [Step 5: Configure the Database](#step-5-configure-the-database)
7. [Step 6: Set Up Email (Resend)](#step-6-set-up-email-resend)
8. [Step 7: Deploy to Vercel](#step-7-deploy-to-vercel)
9. [Step 8: Connect Custom Domain](#step-8-connect-custom-domain)
10. [Step 9: Final Checklist](#step-9-final-checklist)
11. [API Reference](#api-reference)

---

## Prerequisites

Before starting, make sure you have:

- [ ] A Mac/Linux computer with Terminal access
- [ ] [Node.js](https://nodejs.org) installed (v18+)
- [ ] A [GitHub](https://github.com) account
- [ ] A credit card for Elestio (~$32/month for Supabase)
- [ ] A domain name (optional but recommended)

---

## Step 1: Complete the Setup Wizard

After running `./create-new-blog.sh`, the setup wizard opens automatically at:

**http://localhost:3003/setup**

### Walk through each step:

**Step 1: Brand Identity**
| Field | Example | Notes |
|-------|---------|-------|
| Brand name | `FitLife Blog` | Your site's name |
| Domain | `fitlifeblog.com` | Without www |
| Tagline | `Your Fitness Journey Starts Here` | Short catchphrase |
| Description | `Expert fitness tips...` | 1-2 sentences |

**Step 2: Contact Information**
| Field | Example | Notes |
|-------|---------|-------|
| Primary email | `john@fitlifeblog.com` | For notifications |
| Contact email | `contact@fitlifeblog.com` | Public contact |
| Phone | `+1 555-123-4567` | Optional |
| Address | Your business address | Optional |

**Step 3: Color Palette**

Choose from preset palettes or enter custom colors:

| Option | Name | Primary | Accent |
|--------|------|---------|--------|
| 1 | Classic Black & Blue | `#000000` | `#0066ff` |
| 2 | Navy & Orange | `#1e3a5f` | `#ff6b35` |
| 3 | Forest & Gold | `#2d5a27` | `#d4af37` |
| 4 | Purple & Pink | `#4a0e4e` | `#ff69b4` |
| 5 | Slate & Teal | `#334155` | `#14b8a6` |
| 6 | Burgundy & Gold | `#722f37` | `#c9a227` |
| 7 | Ocean Blue & Coral | `#0077b6` | `#ff7f50` |
| 8 | Charcoal & Lime | `#36454f` | `#32cd32` |
| custom | Your own colors | (you specify) | (you specify) |

**Step 4: Analytics (Optional)**
| Field | Example | Notes |
|-------|---------|-------|
| Google Analytics ID | `G-XXXXXXXXXX` | Optional |
| GTM ID | `GTM-XXXXXXX` | Optional |

**Step 5: Review** - Confirm your settings

**Step 6: Apply Changes** - Click to update all files automatically

**Step 7: External Setup** - Checklist for Supabase & Vercel

---

## Step 2: Create GitHub Repository

### 2.1 Create New Repository

1. Go to [github.com/new](https://github.com/new)
2. Enter a repository name (e.g., `fitness-blog`)
3. Keep it **empty** - don't add README, .gitignore, or license
4. Set to Private or Public (your choice)
5. Click **"Create repository"**

### 2.2 Connect Your Local Code to GitHub

In Terminal, navigate to your new blog folder and run:

```
cd ~/Documents/GitHub/YOUR-BLOG-FOLDER
git add .
git commit -m "Configure branding"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

### 2.3 Verify

Refresh your GitHub page - you should see all your files.

---

## Step 3: Set Up Supabase on Elestio

**Each blog needs its own Supabase instance.**

### 3.1 Create Elestio Account

1. Go to [elest.io](https://elest.io)
2. Sign up or log in

### 3.2 Deploy Supabase

1. Click **"Create a Service"**
2. Search for **"Supabase"**
3. Select **Supabase**
4. Choose your settings:
   - **Cloud Provider:** Hetzner or Netcup (cheapest)
   - **Region:** Closest to your users
   - **Plan:** Small/Medium (~$32/month) is fine for starting
5. Click **"Create Service"**
6. Wait ~5 minutes for deployment

### 3.3 Note Your Service URL

Once deployed, note the Admin UI URL from the Overview page. It looks like:
```
https://supabase-xxxxx-uxxxxx.vm.elestio.app
```

---

## Step 4: Get Your Supabase API Keys

The API keys are in Elestio's environment configuration.

### 4.1 Open Environment Config

1. On your Supabase service page in Elestio
2. Click **"Update config"** button
3. Look for these variables:

| Elestio Variable | What It Is |
|------------------|------------|
| `ANON_KEY` | Public API key (safe to expose) |
| `SERVICE_ROLE_KEY` | Secret admin key (keep private!) |
| `SITE_URL` or `PUBLIC_REST_URL` | Your Supabase URL |

### 4.2 Copy These Values

You'll need these three values for Vercel:

| What You Need | Where to Find It |
|---------------|------------------|
| **Supabase URL** | `SITE_URL` or `PUBLIC_REST_URL` in config, or your Admin UI URL without the port |
| **Anon Key** | `ANON_KEY` in config (starts with `eyJ...`) |
| **Service Role Key** | `SERVICE_ROLE_KEY` in config (starts with `eyJ...`) |

---

## Step 5: Configure the Database

### 5.1 Access Supabase Studio

1. Go to your Admin UI URL from Elestio
2. Log in with:
   - **User:** `root`
   - **Password:** Click "Show password" in Elestio dashboard

### 5.2 Run the Complete Setup (ONE FILE!)

We have a single SQL file that sets up everything:

1. In Supabase Studio, go to **SQL Editor**
2. Open the file `supabase/COMPLETE_SETUP.sql` in Cursor
3. Select all (`Cmd + A`) and copy (`Cmd + C`)
4. Paste into Supabase SQL Editor (`Cmd + V`)
5. Click **Run**

**Or use Terminal to copy to clipboard:**
```
cat supabase/COMPLETE_SETUP.sql | pbcopy
```
Then paste into Supabase SQL Editor.

This single file:
- ✓ Creates all tables
- ✓ Sets up security policies
- ✓ Creates storage bucket for images
- ✓ Creates default admin user (admin / admin123)

### 5.3 Change Admin Password (Recommended)

The default admin password is `admin123`. To change it:

```
node scripts/generate-admin-hash.js YourNewPassword
```

Copy the SQL output and run it in Supabase SQL Editor.

---

## Step 6: Set Up Email (Resend)

Resend handles sending emails from your contact forms.

### 6.1 Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for free
3. Verify your email

### 6.2 Get API Key

1. Go to **API Keys** in the Resend dashboard
2. Click **"Create API Key"**
3. Name it (e.g., `fitness-blog-production`)
4. Copy the key (starts with `re_`)

### 6.3 Add Your Domain (Optional but Recommended)

1. Go to **Domains** in Resend
2. Click **"Add Domain"**
3. Enter your domain (e.g., `fitlifeblog.com`)
4. Add the DNS records Resend provides
5. Wait for verification

Without a verified domain, emails will be sent from `onboarding@resend.dev`.

---

## Step 7: Deploy to Vercel

### 7.1 Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will detect it's a Next.js project

### 7.2 Add Environment Variables

**This is where you add your Supabase keys!**

Before clicking Deploy, expand **"Environment Variables"** and add:

| Variable Name | Value |
|---------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Elestio Supabase URL (e.g., `https://supabase-xxxxx.vm.elestio.app`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your `ANON_KEY` from Elestio config |
| `SUPABASE_SERVICE_ROLE_KEY` | Your `SERVICE_ROLE_KEY` from Elestio config |
| `NEXT_PUBLIC_SITE_URL` | `https://www.yourdomain.com` (or Vercel URL for now) |
| `RESEND_API_KEY` | Your Resend API key |

### 7.3 Deploy

Click **"Deploy"** and wait ~2 minutes.

You'll get a URL like `your-project.vercel.app`.

---

## Step 8: Connect Custom Domain

### 8.1 Add Domain in Vercel

1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Enter your domain (e.g., `www.fitlifeblog.com`)
4. Click **"Add"**

### 8.2 Update DNS Records

Vercel will show you DNS records to add. Go to your domain registrar and add:

**For root domain (fitlifeblog.com):**
- Type: `A`
- Value: `76.76.21.21`

**For www subdomain:**
- Type: `CNAME`
- Value: `cname.vercel-dns.com`

### 8.3 Wait for Propagation

DNS changes can take up to 48 hours, but usually work within 1 hour.

### 8.4 Update Environment Variable

Once your domain is connected, update `NEXT_PUBLIC_SITE_URL` in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_SITE_URL` to `https://www.yourdomain.com`
3. Redeploy for changes to take effect

---

## Step 9: Final Checklist

Test everything works:

### Core Functionality
- [ ] Homepage loads correctly
- [ ] Blog page shows (even if empty)
- [ ] Admin login works at `/admin`
- [ ] Can create a new blog post
- [ ] Can upload images in blog editor
- [ ] Blog post displays correctly

### Forms & Email
- [ ] Contact form submits successfully
- [ ] You receive email notifications
- [ ] "Apply to Work With Us" form works

### SEO & Technical
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Robots.txt accessible at `/robots.txt`
- [ ] SSL certificate active (https works)
- [ ] Mobile responsive

### Analytics (if configured)
- [ ] Google Analytics receiving data
- [ ] Google Tag Manager loading

---

## What the Setup Wizard Changes

When you run the setup wizard and click "Apply Changes", it automatically updates branding across **25+ files**. Here's the complete reference:

### Files Updated by the Clone Feature

#### Core Files
| File | What Gets Changed |
|------|-------------------|
| `package.json` | Package name |
| `middleware.ts` | Domain redirects |

#### App Pages
| File | What Gets Changed |
|------|-------------------|
| `app/layout.tsx` | Site title, meta description, Open Graph, Twitter cards, siteName |
| `app/page.tsx` | Page title, description, canonical URL, Open Graph, Twitter metadata |
| `app/HomePageClient.tsx` | Logo text, email addresses, baseUrl, JSON-LD structured data, serviceType |
| `app/robots.ts` | Base URL, hostname |
| `app/sitemap-pages.xml/route.ts` | Comment references |

#### Legal/Info Pages
| File | What Gets Changed |
|------|-------------------|
| `app/privacy/page.tsx` | Title, description, all SEWO references, URLs, email addresses |
| `app/terms/page.tsx` | Title, description, all SEWO references, URLs, email addresses |
| `app/shipping/page.tsx` | Title, description, all SEWO references, contact email |
| `app/about/page.tsx` | Page title, mission statement |

#### Contact Pages
| File | What Gets Changed |
|------|-------------------|
| `app/contact/page.tsx` | Heading, email link |
| `app/contact/layout.tsx` | Meta description, Open Graph title/description, Twitter title/description |

#### Blog Pages
| File | What Gets Changed |
|------|-------------------|
| `app/blog/page.tsx` | Title, description, canonical URL, Open Graph, Twitter metadata |
| `app/blog/[slug]/page.tsx` | Demo post authors, baseUrl fallbacks, JSON-LD author/publisher names |

#### Admin Pages
| File | What Gets Changed |
|------|-------------------|
| `app/admin/homepage/page.tsx` | Default logo_text, default email, placeholder text |

#### Components
| File | What Gets Changed |
|------|-------------------|
| `components/SiteHeader.tsx` | Brand references |
| `components/Footer.tsx` | Brand name, contact info, address |
| `components/Analytics.tsx` | Analytics IDs |
| `components/StructuredData.tsx` | Organization name, description, social links |
| `components/ContactForm.tsx` | Contact email link |

#### API Routes
| File | What Gets Changed |
|------|-------------------|
| `app/api/lead-capture/route.ts` | Email addresses, domain references, brand name in emails |
| `app/api/apply-to-work-with-us/route.ts` | Email addresses, domain references, brand name |
| `app/api/send-questions/route.ts` | URLs, "Your Friends at SEWO" text, from email |
| `app/api/homepage/route.ts` | Default logo_text |
| `app/api/blog/route.ts` | Comments, api_version, default user_name |
| `app/api/blog/[id]/route.ts` | Comment references |

---

### Replacement Patterns

The setup wizard performs these find/replace operations (in order):

#### Brand Name Replacements
| Find | Replace With |
|------|--------------|
| `SEWO Editorial Team` | `{Brand Name} Editorial Team` |
| `Your Friends at SEWO` | `{Brand Name}` |
| `SEWO-v3-FIXED` | `{BRAND-NAME}-v3-FIXED` |
| `SEWO` | `{Brand Name}` |

#### Domain Replacements
| Find | Replace With |
|------|--------------|
| `https://www.sewo.io` | `https://www.{domain}` |
| `https://sewo.io` | `https://{domain}` |
| `www.sewo.io` | `www.{domain}` |
| `sewo.io` | `{domain}` |

#### Social Link Replacements
| Find | Replace With |
|------|--------------|
| `twitter.com/sewo_io` | `twitter.com/{twitterHandle}` |
| `linkedin.com/company/sewo` | `linkedin.com/company/{linkedinCompany}` |

#### Email Replacements
| Find | Replace With |
|------|--------------|
| `stuartr@sewo.io` | `{email}` (primary contact) |
| `contact@sewo.io` | `{contactEmail}` or `contact@{domain}` |
| `privacy@sewo.io` | `{privacyEmail}` or `privacy@{domain}` |
| `hi@sewo.io` | `{contactEmail}` or `contact@{domain}` |

#### Other Replacements
| Find | Replace With |
|------|--------------|
| `"sewo-website"` | `"{brand-name}-website"` (package name) |
| `Get Found Everywhere` | `{tagline}` |
| `+1 342223434` | `{phone}` |
| `G-TT58X7D8RV` | `{gaId}` (if provided) |
| `GTM-M4RMX5TG` | `{gtmId}` (if provided) |

---

### Configuration Options

When calling the setup API, you can provide these fields:

#### Required Fields
| Field | Description | Example |
|-------|-------------|---------|
| `brandName` | Your brand/company name | `Modern Longevity` |
| `domain` | Your domain (without www) | `modernlongevity.io` |
| `email` | Primary contact email | `contact@modernlongevity.io` |

#### Optional Fields
| Field | Description | Default |
|-------|-------------|---------|
| `tagline` | Short catchphrase | — |
| `description` | Site description (1-2 sentences) | — |
| `footerTagline` | Footer description text | — |
| `contactEmail` | Public contact email | `contact@{domain}` |
| `privacyEmail` | Privacy-related email | `privacy@{domain}` |
| `phone` | Contact phone number | — |
| `addressLine1` | Address line 1 | — |
| `addressLine2` | Address line 2 | — |
| `addressLine3` | Address line 3 | — |
| `primaryColor` | Primary brand color (hex) | `#000000` |
| `accentColor` | Accent color (hex) | `#0066ff` |
| `gaId` | Google Analytics ID | — |
| `gtmId` | Google Tag Manager ID | — |
| `twitterHandle` | Twitter handle (without @) | Auto-generated from brand |
| `linkedinCompany` | LinkedIn company slug | Auto-generated from brand |

---

### Manual Verification After Setup

After running the setup, verify these key areas:

1. **Browser Tab** - Check page titles show your brand name
2. **Footer** - Verify brand name and contact info
3. **Contact Forms** - Check email addresses in "Have a Question?" section
4. **Legal Pages** - Review Privacy Policy, Terms, and Shipping pages
5. **Structured Data** - Use Google's Rich Results Test to verify JSON-LD
6. **API Routes** - Test form submissions to confirm emails are correct

---

## API Reference

Once your site is deployed, you can create blog posts via API.

### API Base URL

```
https://www.yourdomain.com/api/blog
```

### Create / Update a Post

**Endpoint:** `POST /api/blog`

**Required Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `postId` | string | Unique identifier for the post (used for updates) |
| `title` | string | Post title |
| `content` | string | HTML content of the post |

**Optional Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | URL slug (auto-generated from title if not provided) |
| `status` | string | `published` (default) or `draft` (removes post) |
| `category` | string | Post category |
| `tags` | array | Array of tag strings |
| `author` | string | Author name |
| `featured_image` | string | URL to featured image |
| `meta_title` | string | SEO title |
| `meta_description` | string | SEO description |
| `focus_keyword` | string | Primary SEO keyword |
| `excerpt` | string | Short summary |

**Complete JSON Structure:**

```json
{
  "postId": "unique-post-123",
  "title": "My First Blog Post",
  "content": "<h2>Introduction</h2><p>Your HTML content here...</p>",
  "slug": "my-first-blog-post",
  "status": "published",
  "category": "Health",
  "tags": ["wellness", "longevity", "research"],
  "author": "Dr. Jane Smith",
  "featured_image": "https://example.com/images/featured.jpg",
  "excerpt": "A short summary of the post for listings and social sharing.",
  "meta_title": "My First Blog Post | Modern Longevity",
  "meta_description": "Learn about the latest research in longevity science.",
  "focus_keyword": "longevity research"
}
```

**Example cURL Request:**

```bash
curl -X POST https://www.modernlongevity.co/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "unique-post-123",
    "title": "My First Blog Post",
    "content": "<p>This is the blog post content in HTML...</p>",
    "slug": "my-first-blog-post",
    "status": "published",
    "category": "News",
    "tags": ["announcement", "news"],
    "author": "John Doe",
    "meta_title": "My First Blog Post | My Site",
    "meta_description": "A brief description for search engines.",
    "featured_image": "https://example.com/image.jpg"
  }'
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "id": "uuid-here",
    "slug": "my-first-blog-post",
    "title": "My First Blog Post"
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Missing required field: title"
}
```

### Unpublish / Delete a Post

Send a POST request with `status: "draft"`:

```bash
curl -X POST https://www.yourdomain.com/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "unique-post-123",
    "status": "draft"
  }'
```

### List All Posts

**Endpoint:** `GET /api/blog`

```bash
curl "https://www.yourdomain.com/api/blog?limit=10&category=News"
```

### Get Single Post

**Endpoint:** `GET /api/blog/[id]`

```bash
curl "https://www.yourdomain.com/api/blog/your-post-uuid"
```

---

## Troubleshooting

### "Database error" on form submission
- Check Supabase URL and keys in Vercel environment variables
- Verify all migrations were run in order

### Images not uploading
- Verify `images` storage bucket exists and is public
- Check CORS settings in Supabase Storage

### Emails not sending
- Verify Resend API key is correct
- Check if domain is verified in Resend
- Look at Resend dashboard for failed sends

### Admin login not working
- Verify admin user was created in database
- Check password hash was copied correctly
- Try regenerating the password hash

### Site not loading on custom domain
- Wait for DNS propagation (up to 48 hours)
- Verify DNS records are correct
- Check Vercel domain settings

### Can't find Supabase API keys
- In Elestio dashboard, click **"Update config"** on your Supabase service
- Look for `ANON_KEY` and `SERVICE_ROLE_KEY` in the environment variables

---

## Quick Reference

### Important URLs

| What | URL |
|------|-----|
| Your site | `https://www.yourdomain.com` |
| Admin panel | `https://www.yourdomain.com/admin` |
| Supabase Studio | Your Elestio Admin UI URL |
| Vercel dashboard | `https://vercel.com/your-project` |
| Resend dashboard | `https://resend.com/emails` |
| Elestio dashboard | `https://dash.elest.io` |

### Monthly Costs (Per Blog)

| Service | Cost |
|---------|------|
| Elestio (Supabase) | ~$32/month |
| Vercel | Free (hobby) or $20/month (pro) |
| Resend | Free up to 3,000 emails/month |
| Domain | ~$12/year |

---

## Summary: What Each Blog Needs

For each new blog you create:

| Item | One-Time or Per Blog |
|------|---------------------|
| Code copy (this repo) | Per blog |
| GitHub repository | Per blog |
| Supabase on Elestio | Per blog (~$32/month) |
| Vercel project | Per blog |
| Resend account | Can share one account |
| Domain | Per blog |

---

## Manual Setup (Alternative)

If the script doesn't work, you can do it manually:

```
cd ~/Documents/GitHub
mkdir my-blog-name
cp -r ~/Documents/GitHub/doubleclicker-1/* my-blog-name/
cp ~/Documents/GitHub/doubleclicker-1/.gitignore my-blog-name/
cp ~/Documents/GitHub/doubleclicker-1/.eslintrc.json my-blog-name/
cd my-blog-name
git init
git add .
git commit -m "Initial commit"
npm install
npm run dev
```

Then open `http://localhost:3003/setup` in your browser.

---

## Next Steps

After your site is live:

1. **Create content** - Add blog posts through `/admin` or via API
2. **Customize homepage** - Edit homepage sections in admin
3. **Set up analytics** - Create Google Analytics property
4. **Update legal pages** - Edit privacy policy and terms
5. **Add your logo** - Replace `public/favicon.svg`

---
---

# AUTONOMOUS AGENT (OpenClaw / BlogCloner) - Complete Orchestration Guide

This section is written for an autonomous AI agent that needs to set up a full blog clone **without human intervention**. Every API call, terminal command, wait time, verification step, and error-handling path is documented.

---

## Agent Overview

**Agent Name:** BlogCloner  
**Purpose:** Clone the template repo, brand it, provision infrastructure, deploy, and verify  
**Runtime:** ~15-25 minutes end-to-end (mostly waiting for Elestio provisioning)  
**Template Source Repo:** `doubleclicker-1` (the GitHub repo containing this file)

---

## Input Data the Agent Receives

The agent needs these values to start. They come from the user or from an upstream orchestrator agent.

### Required Inputs

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `brandName` | string | `Modern Longevity` | The brand/company name |
| `domain` | string | `modernlongevity.io` | Domain without www |
| `email` | string | `contact@modernlongevity.io` | Primary contact email (receives form notifications) |
| `nicheDescription` | string | `Science-backed longevity research` | Brief niche description for tagline/description |

### Optional Inputs (Agent can derive defaults)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tagline` | string | Derived from nicheDescription | Short catchphrase |
| `description` | string | Derived from nicheDescription | 1-2 sentence site description |
| `contactEmail` | string | `contact@{domain}` | Public contact email |
| `privacyEmail` | string | `privacy@{domain}` | Privacy page email |
| `primaryColor` | string | `#000000` | Hex color |
| `accentColor` | string | `#0066ff` | Hex color |
| `githubOrg` | string | User's GitHub account | Where to create the repo |
| `elestioRegion` | string | `fsn1` (Hetzner Falkenstein) | Elestio datacenter region |
| `vercelTeam` | string | User's default team | Vercel team/account |

### Credentials the Agent Needs Access To

| Credential | Where Stored | Format |
|------------|-------------|--------|
| GitHub Personal Access Token | Agent secrets / env | `ghp_xxxxxxxxxxxx` |
| Elestio API Key | Agent secrets / env | Bearer token |
| Vercel API Token | Agent secrets / env | `Bearer xxxxx` |
| Resend API Key | Agent secrets / env | `re_xxxxxxxxxxxx` |

---

## Complete Orchestration Workflow

### High-Level Step Sequence

```
PHASE 1: CODE SETUP (Steps 1-3)       ~2 min
  1. Create GitHub repo
  2. Clone template & push files
  3. Run branding find/replace

PHASE 2: INFRASTRUCTURE (Steps 4-7)   ~10-15 min
  4. Create Elestio Supabase instance
  5. Poll until Elestio is ready
  6. Extract Supabase credentials
  7. Run database migrations via SQL

PHASE 3: DEPLOYMENT (Steps 8-11)      ~3-5 min
  8. Create Vercel project from GitHub repo
  9. Set environment variables on Vercel
  10. Trigger deployment
  11. Add custom domain to Vercel

PHASE 4: VERIFICATION (Step 12)       ~1 min
  12. Verify site is live and functional
```

---

### Step 1: Create GitHub Repository

**API:** GitHub REST API  
**Endpoint:** `POST https://api.github.com/user/repos`

```bash
curl -X POST https://api.github.com/user/repos \
  -H "Authorization: token {GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{
    "name": "{repo-name}",
    "description": "{brandName} - {nicheDescription}",
    "private": true,
    "auto_init": false
  }'
```

**Derive `repo-name`:** Kebab-case the brand name: `Modern Longevity` -> `modern-longevity`

**Success Response:** HTTP 201

```json
{
  "full_name": "username/modern-longevity",
  "clone_url": "https://github.com/username/modern-longevity.git",
  "html_url": "https://github.com/username/modern-longevity"
}
```

**Extract & Store:**
- `repoFullName` = response `full_name`
- `repoCloneUrl` = response `clone_url`

**Error Handling:**
- HTTP 422: Repo name already exists. Append a number (e.g., `modern-longevity-2`) and retry.
- HTTP 401: Token invalid. Abort and report credential error.

---

### Step 2: Clone Template & Push Files

**Method:** Terminal commands  
**Working Directory:** A temp directory

```bash
# Clone the template
cd /tmp
git clone https://github.com/{TEMPLATE_OWNER}/doubleclicker-1.git {repo-name}
cd {repo-name}

# Remove template-only files
rm -f create-new-blog.sh
rm -f .template-marker

# Re-initialize git pointing to the NEW repo
rm -rf .git
git init
git remote add origin https://{GITHUB_TOKEN}@github.com/{repoFullName}.git
git add .
git commit -m "Initial commit from template"
git branch -M main
git push -u origin main
```

**Verification:** Check that `git push` exits with code 0.

**Error Handling:**
- If push fails, check that repo was created correctly in Step 1.
- If template clone fails, verify template repo URL and access.

---

### Step 3: Run Branding Find/Replace

**Method:** Terminal commands (direct find/replace on files using `sed` or `node`)  
**Alternative:** Start dev server and call the setup API (slower, but uses the same logic as the wizard)

#### Option A: Direct File Replacement (Recommended for Agent - Faster)

The agent should perform the same replacements that `app/api/setup/apply/route.ts` does. Run these `sed` commands from the repo root:

**IMPORTANT: Order matters. More-specific patterns must be replaced before less-specific ones.**

```bash
cd /tmp/{repo-name}

# --- Brand Name Replacements (specific first) ---
# 1. "SEWO Editorial Team" -> "{brandName} Editorial Team"
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.json" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's/SEWO Editorial Team/{brandName} Editorial Team/g' {} +

# 2. "Your Friends at SEWO" -> "{brandName}"
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's/Your Friends at SEWO/{brandName}/g' {} +

# 3. "SEWO" -> "{brandName}" (catch-all)
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.json" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's/SEWO/{brandName}/g' {} +

# --- Domain Replacements (specific first) ---
# 4. "https://www.sewo.io" -> "https://www.{domain}"
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's|https://www\.sewo\.io|https://www.{domain}|g' {} +

# 5. "https://sewo.io" -> "https://{domain}"
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's|https://sewo\.io|https://{domain}|g' {} +

# 6. "www.sewo.io" -> "www.{domain}"
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's/www\.sewo\.io/www.{domain}/g' {} +

# 7. "sewo.io" -> "{domain}"
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's/sewo\.io/{domain}/g' {} +

# --- Email Replacements ---
# 8. stuartr@sewo.io -> {email}
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's/stuartr@sewo\.io/{email}/g' {} +

# 9. contact@sewo.io -> {contactEmail}
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's/contact@sewo\.io/{contactEmail}/g' {} +

# 10. privacy@sewo.io -> {privacyEmail}
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's/privacy@sewo\.io/{privacyEmail}/g' {} +

# 11. hi@sewo.io -> {contactEmail}
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's/hi@sewo\.io/{contactEmail}/g' {} +

# --- Package Name ---
# 12. "sewo-website" -> "{kebab-brand-name}-website"
sed -i '' 's/"sewo-website"/"{kebab-brand-name}-website"/g' package.json

# --- Tagline (if provided) ---
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" -not -path "./.git/*" \
  -exec sed -i '' 's/Get Found Everywhere/{tagline}/g' {} +
```

**Note for Linux agents:** Remove the `''` after `-i` in `sed` commands (macOS requires it, Linux does not).

#### Option B: Call the Setup API (Alternative)

```bash
cd /tmp/{repo-name}
npm install
npm run dev &
sleep 10  # Wait for dev server to start

curl -X POST http://localhost:3003/api/setup/apply \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "{brandName}",
    "domain": "{domain}",
    "tagline": "{tagline}",
    "description": "{description}",
    "footerTagline": "{footerTagline}",
    "email": "{email}",
    "contactEmail": "{contactEmail}",
    "privacyEmail": "{privacyEmail}",
    "primaryColor": "{primaryColor}",
    "accentColor": "{accentColor}"
  }'

# Kill the dev server
kill %1
```

**Success Response:**
```json
{
  "success": true,
  "message": "Successfully updated 22 files with 147 replacements.",
  "filesUpdated": 22,
  "totalReplacements": 147,
  "updatedFiles": ["package.json (1 changes)", "middleware.ts (2 changes)", ...]
}
```

#### After Branding: Commit & Push

```bash
cd /tmp/{repo-name}
git add .
git commit -m "Configure branding for {brandName}"
git push origin main
```

---

### Step 4: Create Elestio Supabase Instance

**API:** Elestio REST API  
**Docs:** https://docs.elest.io/books/elestio-api  
**Endpoint:** `POST https://api.elest.io/api/v1/services`

```bash
curl -X POST https://api.elest.io/api/v1/services \
  -H "Authorization: Bearer {ELESTIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "{elestio_project_id}",
    "serverName": "{kebab-brand-name}-supabase",
    "serverType": "SMALL-1C-2G",
    "templateId": 68,
    "provider": "hetzner",
    "datacenter": "fsn1",
    "support_level": "level1",
    "admin_email": "{email}",
    "app_password": "{generate-random-password}"
  }'
```

**Notes:**
- `templateId: 68` is Supabase on Elestio (verify this in Elestio docs - may change)
- `serverType: "SMALL-1C-2G"` is the cheapest option (~$32/month)
- `provider: "hetzner"` and `datacenter: "fsn1"` are cheapest. Alternatives: `"netcup"`, `"aws"`, `"gce"`
- Store the `app_password` - you'll need it to access Supabase Studio

**Success Response:** HTTP 200/201

```json
{
  "id": "service-uuid-here",
  "serverName": "modern-longevity-supabase",
  "status": "creating",
  "cname": "supabase-xxxxx-uxxxxx.vm.elestio.app"
}
```

**Extract & Store:**
- `elestioServiceId` = response `id`
- `supabaseCname` = response `cname`

**Error Handling:**
- HTTP 402: Payment required. Abort and notify user.
- HTTP 400: Invalid parameters. Check templateId and serverType.

---

### Step 5: Poll Until Elestio Is Ready

**Endpoint:** `GET https://api.elest.io/api/v1/services/{elestioServiceId}`

```bash
curl -X GET "https://api.elest.io/api/v1/services/{elestioServiceId}" \
  -H "Authorization: Bearer {ELESTIO_API_KEY}"
```

**Poll Strategy:**
- Check every 30 seconds
- Maximum wait: 15 minutes (30 polls)
- Look for `status` field

| Status | Meaning | Action |
|--------|---------|--------|
| `creating` | Still provisioning | Keep polling |
| `running` | Ready to use | Proceed to Step 6 |
| `error` | Provisioning failed | Abort, report error |

**After status = `running`**, wait an additional 60 seconds for all Supabase internal services to stabilize.

---

### Step 6: Extract Supabase Credentials from Elestio

**Endpoint:** `GET https://api.elest.io/api/v1/services/{elestioServiceId}`

The service details response includes environment variables. Look for:

```json
{
  "env": {
    "ANON_KEY": "eyJhbGciOiJIUzI1NiI...",
    "SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiI...",
    "SITE_URL": "https://supabase-xxxxx-uxxxxx.vm.elestio.app",
    "POSTGRES_PASSWORD": "xxxxx"
  }
}
```

**Alternative:** If env vars are not in the main response, try:  
`GET https://api.elest.io/api/v1/services/{elestioServiceId}/config`

**Extract & Store:**

| Variable | Source | Store As |
|----------|--------|----------|
| `ANON_KEY` | Elestio env | `supabaseAnonKey` |
| `SERVICE_ROLE_KEY` | Elestio env | `supabaseServiceRoleKey` |
| `SITE_URL` or `cname` | Elestio env/response | `supabaseUrl` (format: `https://{cname}`) |

**The Supabase REST API URL is:**  
`https://{supabaseCname}/rest/v1/`

**The Supabase Studio URL is:**  
`https://{supabaseCname}` (login: `root` / `{app_password}` from Step 4)

---

### Step 7: Run Database Migrations

**Method:** Execute SQL via Supabase REST API (using the service role key)

The complete SQL is in `supabase/COMPLETE_SETUP.sql`. The agent should read this file and execute it.

**Endpoint:** `POST https://{supabaseCname}/rest/v1/rpc/` won't work for DDL. Instead, use the Supabase Management API or the SQL Editor API.

**Recommended: Use the Supabase SQL endpoint directly:**

```bash
curl -X POST "https://{supabaseCname}/pg/query" \
  -H "Authorization: Bearer {supabaseServiceRoleKey}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{CONTENTS_OF_COMPLETE_SETUP_SQL}"
  }'
```

**Alternative: If the above endpoint isn't available, use psql via terminal:**

The Elestio service provides PostgreSQL connection details:
- Host: `{supabaseCname}` (or a dedicated postgres hostname)
- Port: `5432` (or `6543` for connection pooler)
- Database: `postgres`
- User: `postgres`
- Password: `{POSTGRES_PASSWORD}` from Elestio env

```bash
PGPASSWORD="{POSTGRES_PASSWORD}" psql \
  -h {supabaseCname} \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f /tmp/{repo-name}/supabase/COMPLETE_SETUP.sql
```

**What the SQL creates:**

| Table | Purpose |
|-------|---------|
| `homepage_content` | CMS content for homepage |
| `site_posts` | Blog posts (main table) |
| `blog_posts` | Legacy compatibility |
| `newsletter_subscribers` | Email subscribers |
| `lead_captures` | Contact form submissions |
| `cta_conversions` | CTA tracking |
| `authors` | Blog authors |
| `landing_pages` | Custom landing pages |
| `apply_to_work_with_us` | Application form submissions |
| `admin_users` | Admin login accounts |
| `admin_sessions` | Admin session tokens |

It also:
- Enables Row Level Security on all tables
- Creates RLS policies (public read for posts, service role for writes)
- Creates `images` storage bucket (public read)
- Creates default admin user: `admin` / `admin123`

**Verification:** Query to confirm tables exist:

```bash
curl "https://{supabaseCname}/rest/v1/admin_users?select=username&limit=1" \
  -H "apikey: {supabaseServiceRoleKey}" \
  -H "Authorization: Bearer {supabaseServiceRoleKey}"
```

Expected response: `[{"username":"admin"}]`

---

### Step 8: Create Vercel Project

**API:** Vercel REST API  
**Endpoint:** `POST https://api.vercel.com/v10/projects`

```bash
curl -X POST "https://api.vercel.com/v10/projects" \
  -H "Authorization: Bearer {VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{kebab-brand-name}",
    "framework": "nextjs",
    "gitRepository": {
      "type": "github",
      "repo": "{repoFullName}"
    },
    "buildCommand": "next build",
    "outputDirectory": ".next",
    "installCommand": "npm install"
  }'
```

**Success Response:** HTTP 200

```json
{
  "id": "prj_xxxxxxxxxxxx",
  "name": "modern-longevity",
  "link": {
    "type": "github",
    "repo": "username/modern-longevity"
  }
}
```

**Extract & Store:**
- `vercelProjectId` = response `id`
- `vercelProjectName` = response `name`

**Error Handling:**
- HTTP 409: Project name already exists. Append number and retry.
- HTTP 403: No access to GitHub repo. Check GitHub integration in Vercel.

---

### Step 9: Set Environment Variables on Vercel

**Endpoint:** `POST https://api.vercel.com/v10/projects/{vercelProjectId}/env`

Set each variable individually:

```bash
# 1. Supabase URL
curl -X POST "https://api.vercel.com/v10/projects/{vercelProjectId}/env" \
  -H "Authorization: Bearer {VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "NEXT_PUBLIC_SUPABASE_URL",
    "value": "{supabaseUrl}",
    "type": "plain",
    "target": ["production", "preview", "development"]
  }'

# 2. Supabase Anon Key
curl -X POST "https://api.vercel.com/v10/projects/{vercelProjectId}/env" \
  -H "Authorization: Bearer {VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "value": "{supabaseAnonKey}",
    "type": "plain",
    "target": ["production", "preview", "development"]
  }'

# 3. Supabase Service Role Key (secret!)
curl -X POST "https://api.vercel.com/v10/projects/{vercelProjectId}/env" \
  -H "Authorization: Bearer {VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "SUPABASE_SERVICE_ROLE_KEY",
    "value": "{supabaseServiceRoleKey}",
    "type": "encrypted",
    "target": ["production", "preview", "development"]
  }'

# 4. Site URL
curl -X POST "https://api.vercel.com/v10/projects/{vercelProjectId}/env" \
  -H "Authorization: Bearer {VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "NEXT_PUBLIC_SITE_URL",
    "value": "https://www.{domain}",
    "type": "plain",
    "target": ["production", "preview", "development"]
  }'

# 5. Resend API Key
curl -X POST "https://api.vercel.com/v10/projects/{vercelProjectId}/env" \
  -H "Authorization: Bearer {VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "RESEND_API_KEY",
    "value": "{RESEND_API_KEY}",
    "type": "encrypted",
    "target": ["production", "preview", "development"]
  }'
```

**All 5 Environment Variables Required:**

| Key | Value | Type |
|-----|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://{supabaseCname}` | `plain` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | `plain` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | `encrypted` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.{domain}` | `plain` |
| `RESEND_API_KEY` | `re_...` | `encrypted` |

---

### Step 10: Trigger Deployment

**Endpoint:** `POST https://api.vercel.com/v13/deployments`

```bash
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer {VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{kebab-brand-name}",
    "project": "{vercelProjectId}",
    "gitSource": {
      "type": "github",
      "ref": "main",
      "repoId": "{github-repo-id}"
    },
    "target": "production"
  }'
```

**Alternative: Just push a commit to trigger auto-deploy** (if Vercel is connected to GitHub, any push to `main` triggers a deployment automatically).

```bash
cd /tmp/{repo-name}
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

**Poll Deployment Status:**

```bash
curl "https://api.vercel.com/v13/deployments?projectId={vercelProjectId}&limit=1" \
  -H "Authorization: Bearer {VERCEL_TOKEN}"
```

**Poll Strategy:**
- Check every 15 seconds
- Maximum wait: 5 minutes (20 polls)
- Look for `readyState` field

| readyState | Meaning | Action |
|------------|---------|--------|
| `QUEUED` | Waiting to build | Keep polling |
| `BUILDING` | Building | Keep polling |
| `READY` | Deployed successfully | Proceed to Step 11 |
| `ERROR` | Build failed | Check build logs, abort |
| `CANCELED` | Deployment canceled | Retry |

**Extract & Store:**
- `vercelDeploymentUrl` = response `url` (e.g., `modern-longevity-xxxxx.vercel.app`)

---

### Step 11: Add Custom Domain to Vercel

**Endpoint:** `POST https://api.vercel.com/v10/projects/{vercelProjectId}/domains`

```bash
# Add www subdomain (primary)
curl -X POST "https://api.vercel.com/v10/projects/{vercelProjectId}/domains" \
  -H "Authorization: Bearer {VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "www.{domain}"
  }'

# Add root domain (redirect to www)
curl -X POST "https://api.vercel.com/v10/projects/{vercelProjectId}/domains" \
  -H "Authorization: Bearer {VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{domain}",
    "redirect": "www.{domain}",
    "redirectStatusCode": 308
  }'
```

**DNS Records Required (output to user/upstream agent):**

The user (or DNS management agent) must add these DNS records:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| `A` | `@` | `76.76.21.21` | Root domain to Vercel |
| `CNAME` | `www` | `cname.vercel-dns.com` | www subdomain to Vercel |

**Note:** DNS propagation takes 1-60 minutes typically, up to 48 hours in rare cases.

---

### Step 12: Verification

After deployment, verify the site is functional.

#### 12.1 Check Site Is Live

```bash
# Check homepage returns 200
curl -s -o /dev/null -w "%{http_code}" "https://{vercelDeploymentUrl}"
# Expected: 200

# Check blog page
curl -s -o /dev/null -w "%{http_code}" "https://{vercelDeploymentUrl}/blog"
# Expected: 200

# Check admin page
curl -s -o /dev/null -w "%{http_code}" "https://{vercelDeploymentUrl}/admin"
# Expected: 200

# Check API endpoint
curl -s -o /dev/null -w "%{http_code}" "https://{vercelDeploymentUrl}/api/blog"
# Expected: 200

# Check robots.txt
curl -s "https://{vercelDeploymentUrl}/robots.txt"
# Should contain sitemap URLs with the correct domain
```

#### 12.2 Check Database Connection

```bash
# Try fetching homepage content (should return empty object or default content)
curl -s "https://{vercelDeploymentUrl}/api/homepage"
# Expected: JSON object (even if empty)
```

#### 12.3 Check Branding Was Applied

```bash
# Fetch homepage and check title
curl -s "https://{vercelDeploymentUrl}" | grep -o '<title>[^<]*</title>'
# Should contain {brandName}, NOT "SEWO"

# Check for old branding (should return nothing)
curl -s "https://{vercelDeploymentUrl}" | grep -i "sewo"
# Should return empty (no matches)
```

---

## Output Data (What the Agent Returns)

When BlogCloner completes, it should return this data to the orchestrator or store it:

```json
{
  "status": "success",
  "brandName": "Modern Longevity",
  "domain": "modernlongevity.io",
  
  "github": {
    "repoFullName": "username/modern-longevity",
    "repoUrl": "https://github.com/username/modern-longevity",
    "branch": "main"
  },
  
  "supabase": {
    "elestioServiceId": "service-uuid",
    "studioUrl": "https://supabase-xxxxx-uxxxxx.vm.elestio.app",
    "apiUrl": "https://supabase-xxxxx-uxxxxx.vm.elestio.app",
    "anonKey": "eyJ...",
    "serviceRoleKey": "eyJ...",
    "adminCredentials": {
      "username": "admin",
      "password": "admin123"
    }
  },
  
  "vercel": {
    "projectId": "prj_xxxxxxxxxxxx",
    "projectName": "modern-longevity",
    "deploymentUrl": "modern-longevity-xxxxx.vercel.app",
    "productionUrl": "https://www.modernlongevity.io"
  },
  
  "endpoints": {
    "site": "https://www.modernlongevity.io",
    "admin": "https://www.modernlongevity.io/admin",
    "blogApi": "https://www.modernlongevity.io/api/blog",
    "leadCapture": "https://www.modernlongevity.io/api/lead-capture"
  },
  
  "dnsRecordsNeeded": [
    {"type": "A", "name": "@", "value": "76.76.21.21"},
    {"type": "CNAME", "name": "www", "value": "cname.vercel-dns.com"}
  ],
  
  "resendDomainVerification": "Pending - domain needs to be added in Resend dashboard"
}
```

---

## Error Recovery Playbook

| Error | Detection | Recovery |
|-------|-----------|----------|
| GitHub repo name taken | HTTP 422 on create | Append `-2`, `-3`, etc. and retry |
| Elestio provisioning stuck | Status still `creating` after 15 min | Check Elestio dashboard, may need manual intervention |
| Elestio provisioning failed | Status = `error` | Delete service, recreate with different region |
| Database migration fails | SQL error response | Check SQL syntax, verify Supabase is fully running, retry after 60s |
| Vercel build fails | `readyState: ERROR` | Fetch build logs: `GET /v13/deployments/{id}/events`. Common fix: missing env vars |
| Domain already on Vercel | HTTP 409 on domain add | Remove from old project first, or use different domain |
| DNS not propagated | Site returns Vercel 404 | Wait longer (up to 48h). Check DNS with `dig www.{domain}` |
| Branding not replaced | `grep -r "SEWO"` finds matches | Re-run branding step, check file permissions |

---

## Resend Domain Setup (Post-Deployment)

This step is typically manual or handled by a separate DNS/email agent:

1. **Add domain in Resend:**
   ```
   POST https://api.resend.com/domains
   Authorization: Bearer {RESEND_API_KEY}
   {"name": "{domain}"}
   ```

2. **Get DNS records from Resend:**
   ```
   GET https://api.resend.com/domains/{domain_id}
   ```

3. **Add the provided DNS records** (SPF, DKIM, DMARC)

4. **Verify domain in Resend:**
   ```
   POST https://api.resend.com/domains/{domain_id}/verify
   ```

Until Resend domain is verified, emails send from `onboarding@resend.dev` (functional but not branded).

---

## Blog API Reference (For Content Agents)

Once the site is live, content agents can publish posts:

### Create/Update Post

```bash
POST https://www.{domain}/api/blog
Content-Type: application/json

{
  "postId": "unique-external-id",
  "title": "Post Title",
  "content": "<h2>HTML content</h2><p>Goes here</p>",
  "slug": "post-title-slug",
  "status": "published",
  "category": "Category Name",
  "tags": ["tag1", "tag2"],
  "author": "Author Name",
  "featured_image": "https://example.com/image.jpg",
  "meta_title": "SEO Title | {brandName}",
  "meta_description": "SEO description under 160 chars",
  "focus_keyword": "primary keyword"
}
```

### Delete/Unpublish Post

```bash
POST https://www.{domain}/api/blog
Content-Type: application/json

{
  "postId": "unique-external-id",
  "status": "draft"
}
```

### List Posts

```bash
GET https://www.{domain}/api/blog?limit=50
```

---

## Architecture Notes for Agent Developers

- **Framework:** Next.js 14 (App Router)
- **Dev server port:** 3003 (configured in `package.json`: `"dev": "next dev -p 3003"`)
- **Database:** PostgreSQL via Supabase (self-hosted on Elestio)
- **ORM:** None - uses Supabase JS client directly
- **Email:** Resend (API-based, no SMTP)
- **Hosting:** Vercel (serverless)
- **Image hosting:** Supabase Storage (bucket: `images`, public read)
- **Auth:** Custom bcrypt-based admin auth (not Supabase Auth)
- **Admin credentials:** `admin` / `admin123` (bcrypt hash in DB)
- **No API authentication on blog endpoints** - POST to `/api/blog` is open (secured by obscurity + rate limiting only)
