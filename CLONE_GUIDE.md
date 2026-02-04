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

---

## After the Setup Wizard

Once you've configured your blog in the wizard, you still need to:

1. **Create a GitHub repo** and push your code
2. **Set up Supabase** on Elestio  
3. **Deploy to Vercel**

See the detailed steps below.

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

**Example Request:**

```bash
curl -X POST https://www.yourdomain.com/api/blog \
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
