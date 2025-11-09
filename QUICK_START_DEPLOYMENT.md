# 🚀 Quick Start: Deploy in 10 Minutes

The absolute fastest way to get your DoubleClicker website live.

---

## What You Need

- [x] Namecheap domain (you have this)
- [x] Gmail set up (you have this)
- [ ] GitHub account (free - takes 2 minutes)
- [ ] Vercel account (free - takes 2 minutes)

---

## Step-by-Step (10 Minutes)

### 1. Create GitHub Account (if needed) - 2 minutes

1. Go to https://github.com/signup
2. Enter your email
3. Create password
4. Choose username
5. Verify email

### 2. Push Code to GitHub - 3 minutes

Open Terminal and run:

```bash
cd /Users/stuarta/Documents/GitHub/doubleclicker-1

# Initialize and push
git init
git add .
git commit -m "Initial commit: DoubleClicker website"

# Create repo on GitHub.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/doubleclicker-website.git
git branch -M main
git push -u origin main
```

**Or use GitHub Desktop** (easier):
1. Download GitHub Desktop
2. Drag folder into GitHub Desktop
3. Click "Publish repository"
4. Done!

### 3. Deploy to Vercel - 5 minutes

1. **Go to https://vercel.com**
2. **Sign up with GitHub** (click "Continue with GitHub")
3. **Import your repository:**
   - Click "Add New" → "Project"
   - Select `doubleclicker-website`
   - Click "Import"
4. **Add Environment Variables:**
   
   Click "Environment Variables" and add:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL → (from your Supabase dashboard)
   NEXT_PUBLIC_SUPABASE_ANON_KEY → (from your Supabase dashboard)
   NEXT_PUBLIC_SITE_URL → https://your-project.vercel.app
   ```
   
   **Where to get Supabase values:**
   - Go to supabase.com → Your Project
   - Click Settings → API
   - Copy "Project URL" and "anon public" key

5. **Click "Deploy"**
6. **Wait 2-3 minutes** ☕
7. **Done!** Your site is live at `https://your-project.vercel.app`

---

## Connect Your Domain (Do This Later)

After your site is working on Vercel:

### 1. In Vercel (2 minutes):
- Go to Settings → Domains
- Add your domain: `yourdomain.com`
- Add: `www.yourdomain.com`
- Note the DNS records shown

### 2. In Namecheap (3 minutes):
- Log in to Namecheap.com
- Go to Domain List → Manage → Advanced DNS
- **Choose One:**

**Easy Way (Recommended):**
- Change Nameservers to Vercel's nameservers
- Vercel manages everything

**Keep Namecheap DNS:**
- Add A record: `@` → Vercel IP (shown in Vercel dashboard)
- Add CNAME: `www` → `cname.vercel-dns.com`

### 3. Wait (10-60 minutes):
- DNS takes time to propagate
- Check progress: https://dnschecker.org
- Once green, your domain works!

---

## That's It!

Your website is now live! 🎉

**What You Have:**
- ✅ Live website at `https://yourdomain.com`
- ✅ Blog system with admin interface
- ✅ Automatic deployments (push to GitHub = live in 3 minutes)
- ✅ Free hosting (Vercel free tier)
- ✅ SSL certificate (HTTPS automatic)
- ✅ Global CDN (fast worldwide)

**Admin URLs:**
- Blog Admin: `https://yourdomain.com/admin`
- Homepage Editor: `https://yourdomain.com/admin/homepage`

---

## Make Changes & Redeploy

Every time you make changes locally:

```bash
git add .
git commit -m "Updated homepage content"
git push
```

Vercel automatically deploys in 2-3 minutes. No manual deployment needed!

---

## Need More Details?

See `DEPLOYMENT_GUIDE.md` for complete instructions with:
- Email DNS setup
- Security configuration
- Performance optimization
- Troubleshooting
- Cost breakdown

---

## Common Questions

**Q: Do I need to pay for hosting?**  
A: No! Vercel free tier is perfect for starting. Only pay when you get lots of traffic.

**Q: Will my Gmail email keep working?**  
A: Yes! Your existing Gmail/Google Workspace keeps working. Just keep the MX records in Namecheap.

**Q: Can I update my website easily?**  
A: Yes! Use the admin interface at `/admin` to edit blog posts and homepage content.

**Q: What if something breaks?**  
A: Vercel keeps all previous versions. You can rollback instantly from the Vercel dashboard.

**Q: How long does deployment take?**  
A: First time: ~10 minutes. After that, changes deploy in 2-3 minutes automatically.

---

## Support

If you get stuck:
- Check `DEPLOYMENT_GUIDE.md` (detailed guide)
- Vercel Support: https://vercel.com/help
- GitHub Docs: https://docs.github.com

---

**Ready? Let's deploy! 🚀**

