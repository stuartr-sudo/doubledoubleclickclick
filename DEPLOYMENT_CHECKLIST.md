# 🚀 Deployment Checklist

Quick checklist to deploy SEWO to production.

---

## Pre-Deployment (Do These First)

- [ ] Code is tested and working locally
- [ ] All environment variables documented
- [ ] Supabase project is set up
- [ ] GitHub account ready
- [ ] Vercel account created (free)
- [ ] Domain purchased (Namecheap)

---

## Step 1: GitHub (5 minutes)

- [ ] Create new GitHub repository
- [ ] Push local code to GitHub
- [ ] Verify all files are committed

**Commands:**
```bash
cd /Users/stuarta/Documents/GitHub/doubleclicker-1
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sewo-website.git
git push -u origin main
```

---

## Step 2: Vercel Deployment (10 minutes)

- [ ] Sign up at vercel.com with GitHub
- [ ] Import your GitHub repository
- [ ] Add environment variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Test Vercel URL works

**Your Vercel URL:** `https://your-project.vercel.app`

---

## Step 3: Supabase Setup (10 minutes)

- [ ] Run database migrations
- [ ] Create `images` storage bucket
- [ ] Make bucket public
- [ ] Apply storage policies
- [ ] Test database connection
- [ ] Add Vercel URL to Supabase allowed URLs

**Migration files:**
- `supabase/migrations/20251109_add_newsletter_and_cta.sql`
- `supabase/migrations/20251109_add_homepage_and_images.sql`

---

## Step 4: Domain Connection (15 minutes)

### In Vercel:
- [ ] Go to Settings → Domains
- [ ] Add your domain: `yourdomain.com`
- [ ] Add www: `www.yourdomain.com`
- [ ] Copy DNS records provided

### In Namecheap:
- [ ] Log into Namecheap
- [ ] Go to Advanced DNS
- [ ] Choose one option:

**Option A: Vercel Nameservers (Easier)**
- [ ] Change nameservers to Vercel's
- [ ] Add Gmail MX records in Vercel DNS

**Option B: A Records (If keeping Namecheap DNS)**
- [ ] Add A record: `@` → Vercel IP
- [ ] Add CNAME: `www` → `cname.vercel-dns.com`
- [ ] Keep existing Gmail MX records

---

## Step 5: Email DNS (If using Gmail) (5 minutes)

- [ ] Verify MX records exist for Gmail
- [ ] Add SPF record for email security
- [ ] Add DMARC record (optional but recommended)
- [ ] Test email sending/receiving

**Gmail MX Records:**
| Priority | Value |
|----------|-------|
| 1 | aspmx.l.google.com |
| 5 | alt1.aspmx.l.google.com |
| 5 | alt2.aspmx.l.google.com |
| 10 | alt3.aspmx.l.google.com |
| 10 | alt4.aspmx.l.google.com |

---

## Step 6: Final Configuration (5 minutes)

- [ ] Update `NEXT_PUBLIC_SITE_URL` in Vercel to your domain
- [ ] Redeploy from Vercel dashboard
- [ ] Wait for DNS propagation (10 mins - 48 hours)
- [ ] Clear browser cache

---

## Step 7: Testing (10 minutes)

### Test Website:
- [ ] Homepage loads: `https://yourdomain.com`
- [ ] Blog page works: `https://yourdomain.com/blog`
- [ ] Blog posts open correctly
- [ ] Images load properly
- [ ] Newsletter signup works

### Test Admin:
- [ ] Admin page loads: `https://yourdomain.com/admin`
- [ ] Can create new blog post
- [ ] Can upload image
- [ ] Homepage editor works: `https://yourdomain.com/admin/homepage`
- [ ] Changes save correctly

### Test Email:
- [ ] Send test email from Gmail
- [ ] Receive test email to Gmail
- [ ] Check spam score

---

## Post-Deployment (Optional but Recommended)

### Security:
- [ ] Add authentication to `/admin` routes
- [ ] Set up Supabase Row Level Security (RLS)
- [ ] Enable Vercel password protection (temporary)
- [ ] Add rate limiting to API routes

### Monitoring:
- [ ] Set up Google Analytics
- [ ] Configure PostHog (tracking already in code)
- [ ] Add uptime monitoring (UptimeRobot)
- [ ] Set up error tracking (Sentry)

### SEO:
- [ ] Submit to Google Search Console
- [ ] Create sitemap.xml
- [ ] Submit to Bing Webmaster Tools
- [ ] Add schema.org markup

### Performance:
- [ ] Test with PageSpeed Insights
- [ ] Check Core Web Vitals
- [ ] Optimize images
- [ ] Enable caching

---

## Ongoing Maintenance

### Daily:
- [ ] Check error logs in Vercel
- [ ] Monitor site uptime
- [ ] Respond to newsletter signups

### Weekly:
- [ ] Publish new blog post
- [ ] Check analytics
- [ ] Backup database

### Monthly:
- [ ] Review and update content
- [ ] Check for security updates
- [ ] Review costs/usage
- [ ] Update dependencies: `npm update`

---

## Emergency Rollback

If something goes wrong:

1. **In Vercel:**
   - Go to Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **In Supabase:**
   - Restore from backup
   - Or manually fix in SQL Editor

3. **DNS Issues:**
   - Revert DNS changes in Namecheap
   - Wait for propagation

---

## Common Issues Quick Fixes

**Site not loading:**
```bash
# Check deployment logs in Vercel
# Verify environment variables
# Clear browser cache
```

**Database errors:**
```bash
# Verify Supabase credentials
# Check RLS policies
# Run migrations again
```

**Domain not working:**
```bash
# Check DNS propagation: dnschecker.org
# Verify DNS records in Namecheap
# Wait 24-48 hours
# Try incognito mode
```

**Email not working:**
```bash
# Verify MX records
# Check Google Workspace status
# Wait for DNS propagation
# Test with mail-tester.com
```

---

## Resources

- **Full Guide:** `DEPLOYMENT_GUIDE.md`
- **Setup Guide:** `COMPLETE_SETUP_GUIDE.md`
- **API Docs:** `API_DOCUMENTATION.md`
- **Image Guide:** `IMAGE_UPLOAD_GUIDE.md`

---

## Support

- Vercel Support: https://vercel.com/help
- Supabase Support: https://supabase.com/support
- Namecheap Support: https://www.namecheap.com/support/

---

## Estimated Timeline

| Task | Time |
|------|------|
| GitHub setup | 5 minutes |
| Vercel deployment | 10 minutes |
| Supabase configuration | 10 minutes |
| Domain connection | 15 minutes |
| Email DNS | 5 minutes |
| Testing | 10 minutes |
| **Total** | **55 minutes** |

**DNS Propagation:** +10 minutes to 48 hours

---

## 🎉 When You're Done

Your website will be live at:
- **Main site:** https://yourdomain.com
- **Blog:** https://yourdomain.com/blog
- **Admin:** https://yourdomain.com/admin

You'll have:
✅ Professional hosting on Vercel  
✅ Custom domain connected  
✅ Email working via Gmail  
✅ Automatic deployments  
✅ SSL certificate (HTTPS)  
✅ Global CDN  
✅ Fast loading times  

**Start creating content and ranking in LLMs!** 🚀

