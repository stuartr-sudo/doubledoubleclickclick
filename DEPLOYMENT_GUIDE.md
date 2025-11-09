# DoubleClicker Deployment Guide

Complete guide to deploying your DoubleClicker website to Vercel and connecting your Namecheap domain.

---

## 🚀 Quick Deployment Overview

1. **Push code to GitHub** (if not already done)
2. **Deploy to Vercel** (free hosting for Next.js)
3. **Configure Supabase** for production
4. **Connect your Namecheap domain**
5. **Set up email DNS records** (for Gmail)

**Estimated Time:** 15-20 minutes

---

## Step 1: Push Your Code to GitHub

### If you haven't already created a GitHub repository:

1. **Go to GitHub.com** and sign in
2. **Create a new repository:**
   - Click "+" → "New repository"
   - Name: `doubleclicker-website` (or your preferred name)
   - Description: "DoubleClicker - LLM Ranking Website"
   - Keep it **Private** (or Public if you prefer)
   - **Do NOT** initialize with README (we already have files)
   - Click **"Create repository"**

3. **Push your local code to GitHub:**

```bash
cd /Users/stuarta/Documents/GitHub/doubleclicker-1

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: DoubleClicker website with blog and admin"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/doubleclicker-website.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Important:** If you get errors about authentication, you may need to:
- Use a Personal Access Token instead of password
- Or use GitHub CLI: `gh auth login`

---

## Step 2: Deploy to Vercel

Vercel is the best hosting platform for Next.js (it's made by the same team). **It's free** for personal/small projects.

### Create Vercel Account & Deploy:

1. **Go to https://vercel.com**
2. **Sign up with GitHub** (easiest option)
3. **Import your repository:**
   - Click **"Add New"** → **"Project"**
   - Select **"Import Git Repository"**
   - Find `doubleclicker-website` (or your repo name)
   - Click **"Import"**

4. **Configure project settings:**
   - **Project Name:** `doubleclicker` (or your preference)
   - **Framework Preset:** Next.js (should auto-detect)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

5. **Add Environment Variables** (CRITICAL):

Click **"Environment Variables"** and add these:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

**Where to find Supabase credentials:**
- Go to your Supabase project dashboard
- Click **"Settings"** → **"API"**
- Copy **"Project URL"** → paste as `NEXT_PUBLIC_SUPABASE_URL`
- Copy **"anon public"** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

For `NEXT_PUBLIC_SITE_URL`, you can temporarily use the Vercel URL (e.g., `https://doubleclicker.vercel.app`), then update it after connecting your custom domain.

6. **Click "Deploy"**

Wait 2-3 minutes for deployment to complete. ✅

---

## Step 3: Configure Supabase for Production

### Update Supabase Settings:

1. **Go to your Supabase dashboard**
2. **Authentication → URL Configuration:**
   - Add your Vercel URL: `https://your-project.vercel.app`
   - Add your custom domain: `https://yourdomain.com` (once you have it)

3. **Run migrations** (if you haven't already):

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (you'll need your project ref)
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

**Or apply migrations manually:**
- Go to Supabase Dashboard → SQL Editor
- Copy contents of `supabase/migrations/20251109_add_newsletter_and_cta.sql`
- Run it
- Copy contents of `supabase/migrations/20251109_add_homepage_and_images.sql`
- Run it

4. **Create Storage Bucket:**
   - Go to **Storage** in Supabase
   - Create bucket named: `images`
   - Make it **Public**
   - Apply the storage policies from the migration

---

## Step 4: Connect Your Namecheap Domain

### In Vercel:

1. **Go to your Vercel project**
2. **Click "Settings"** → **"Domains"**
3. **Add your domain:**
   - Enter: `yourdomain.com`
   - Click **"Add"**
4. **Also add www subdomain:**
   - Enter: `www.yourdomain.com`
   - Click **"Add"**

Vercel will show you DNS records that need to be added.

### In Namecheap:

1. **Go to https://namecheap.com** and sign in
2. **Navigate to Domain List**
3. **Click "Manage"** next to your domain
4. **Go to "Advanced DNS"** tab

5. **Add Vercel DNS Records:**

**Option A: Using Vercel Nameservers (Recommended - Easiest)**

Vercel will provide nameservers like:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

In Namecheap:
- **Nameservers:** Select "Custom DNS"
- Add: `ns1.vercel-dns.com`
- Add: `ns2.vercel-dns.com`
- **Save**

**Option B: Using A Records (Alternative)**

If you want to keep Namecheap DNS (for email), add these records:

| Type  | Host | Value                    | TTL       |
|-------|------|--------------------------|-----------|
| A     | @    | 76.76.21.21             | Automatic |
| CNAME | www  | cname.vercel-dns.com    | Automatic |

**Important:** Values above are examples. Use the exact values Vercel provides in your dashboard.

6. **Save all changes**

**DNS propagation takes 10 minutes to 48 hours.** Usually it's fast (10-30 minutes).

---

## Step 5: Configure Email DNS (Gmail)

If you're using Google Workspace/Gmail with your domain, you need MX records.

### In Namecheap Advanced DNS:

**Keep these MX records** (if using Gmail/Google Workspace):

| Type | Host | Value                     | Priority | TTL       |
|------|------|---------------------------|----------|-----------|
| MX   | @    | aspmx.l.google.com        | 1        | Automatic |
| MX   | @    | alt1.aspmx.l.google.com   | 5        | Automatic |
| MX   | @    | alt2.aspmx.l.google.com   | 5        | Automatic |
| MX   | @    | alt3.aspmx.l.google.com   | 10       | Automatic |
| MX   | @    | alt4.aspmx.l.google.com   | 10       | Automatic |

**Add SPF Record** (prevents spam):

| Type | Host | Value                                  | TTL       |
|------|------|----------------------------------------|-----------|
| TXT  | @    | v=spf1 include:_spf.google.com ~all   | Automatic |

**Add DMARC Record** (email security):

| Type | Host         | Value                                        | TTL       |
|------|--------------|----------------------------------------------|-----------|
| TXT  | _dmarc       | v=DMARC1; p=none; rua=mailto:your@email.com | Automatic |

---

## Step 6: Update Production Environment Variables

After your domain is connected:

1. **Go to Vercel Project** → **Settings** → **Environment Variables**
2. **Update `NEXT_PUBLIC_SITE_URL`:**
   - Change from: `https://your-project.vercel.app`
   - Change to: `https://yourdomain.com`
3. **Click "Save"**
4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

---

## Step 7: Verify Everything Works

### Test Your Website:

1. **Visit your domain:** `https://yourdomain.com`
2. **Check these pages:**
   - ✅ Homepage loads correctly
   - ✅ Blog page: `https://yourdomain.com/blog`
   - ✅ Individual blog posts load
   - ✅ Admin page: `https://yourdomain.com/admin`
   - ✅ Homepage editor: `https://yourdomain.com/admin/homepage`

3. **Test functionality:**
   - ✅ Create a blog post in admin
   - ✅ Upload an image
   - ✅ Edit homepage content
   - ✅ Newsletter signup works

### Test Your Email:

1. Send a test email from Gmail
2. Check it arrives properly
3. Reply and verify sending works

---

## 🎉 You're Live!

Your website is now deployed at `https://yourdomain.com`

**Admin Access:**
- Blog Admin: `https://yourdomain.com/admin`
- Homepage Editor: `https://yourdomain.com/admin/homepage`

---

## Continuous Deployment

Vercel automatically redeploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Update homepage content"
git push

# Vercel automatically deploys the changes (takes 2-3 minutes)
```

---

## Common Issues & Solutions

### Issue: Site shows 404 or doesn't load

**Solution:**
- Check Vercel deployment logs for errors
- Verify environment variables are set correctly
- Ensure Supabase credentials are correct

### Issue: DNS not working

**Solution:**
- Wait 24-48 hours for full propagation
- Use https://dnschecker.org to check status
- Try clearing browser cache / incognito mode
- Verify DNS records in Namecheap are correct

### Issue: Images not uploading

**Solution:**
- Verify Supabase storage bucket exists
- Check bucket is set to **Public**
- Verify storage policies are applied
- Check environment variables

### Issue: Blog posts not saving

**Solution:**
- Check Supabase connection
- Verify `blog_posts` table exists
- Run migrations if needed
- Check browser console for errors

### Issue: Email not working

**Solution:**
- Verify MX records are correct
- Check Google Workspace is active
- Wait for DNS propagation (24-48 hours)
- Use Google's MX record checker tool

---

## Security Checklist for Production

Before going fully live:

- [ ] Add authentication to `/admin` routes (use Supabase Auth)
- [ ] Set up Row Level Security (RLS) policies in Supabase
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Add rate limiting to API routes
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure CSP headers
- [ ] Add backup system for database
- [ ] Set up automated backups for Supabase
- [ ] Add monitoring/uptime checks (UptimeRobot)
- [ ] Create 404 and 500 error pages

---

## Performance Optimization

After deployment:

1. **Enable Image Optimization:**
   - Use Next.js `<Image />` component everywhere
   - Serve images from Supabase CDN

2. **Add Caching:**
   - Enable ISR (Incremental Static Regeneration) for blog pages
   - Cache API responses

3. **Use CDN:**
   - Vercel automatically uses CDN
   - Images are cached at edge locations

4. **Monitor Performance:**
   - Use Vercel Analytics
   - Check Google PageSpeed Insights
   - Monitor Core Web Vitals

---

## Costs Breakdown

### Free Tier (Good for starting):

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| **Vercel** | 100GB bandwidth/month | $20/month Pro |
| **Supabase** | 500MB database, 1GB storage | $25/month Pro |
| **Namecheap Domain** | ~$10-15/year | N/A |
| **Google Workspace** (optional) | N/A | $6/user/month |

**Total monthly cost (free tier):** $0
**Total monthly cost (with domain):** ~$1.25/month ($15/year ÷ 12)

You can run on free tier until you get significant traffic!

---

## Next Steps After Deployment

1. **Add Google Analytics:**
   - Create GA4 property
   - Add tracking code to `app/layout.tsx`

2. **Set up PostHog** (already integrated):
   - Create PostHog account
   - Add `NEXT_PUBLIC_POSTHOG_KEY` to Vercel env vars

3. **Add Authentication:**
   - Use Supabase Auth
   - Protect `/admin` routes
   - Add user roles

4. **Create Content:**
   - Write your first real blog posts
   - Update homepage content
   - Add your branding

5. **SEO Optimization:**
   - Submit sitemap to Google Search Console
   - Add meta descriptions
   - Optimize images
   - Add structured data

6. **Marketing:**
   - Share on social media
   - Build email list via newsletter
   - Create lead magnets (guides, courses)

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Namecheap Support:** https://www.namecheap.com/support/

---

## Quick Reference Commands

```bash
# Push changes to GitHub (triggers deployment)
git add .
git commit -m "Your commit message"
git push

# Check Vercel deployment status
vercel --prod

# Run migrations locally
supabase db push

# Start local development
npm run dev

# Build for production (test locally)
npm run build
npm start
```

---

## Backup & Recovery

### Backup Supabase Database:

```bash
# Install Supabase CLI
npm install -g supabase

# Backup database
supabase db dump -f backup.sql

# Restore database
supabase db restore backup.sql
```

### Backup Vercel Deployment:

- All deployments are stored in Vercel
- You can rollback to any previous deployment
- GitHub has your source code

---

## 🎊 Congratulations!

Your DoubleClicker website is now live and accessible to the world!

**Your Live URLs:**
- Website: `https://yourdomain.com`
- Blog: `https://yourdomain.com/blog`
- Admin: `https://yourdomain.com/admin` (keep this private!)

You now have a professional, fast, and scalable website with:
✅ Blog with CRUD admin interface  
✅ Homepage content editor  
✅ Image upload system  
✅ Newsletter subscriptions  
✅ Analytics tracking  
✅ Automatic deployments  
✅ Professional hosting  

Now go create amazing content and rank in those LLMs! 🚀

