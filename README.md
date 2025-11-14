# SEWO - LLM Ranking Website

Professional website and blog system for SEWO, helping brands rank in AI LLMs.

## 🚀 Live Site

**Production:** `https://yourdomain.com` (once deployed)  
**Admin:** `https://yourdomain.com/admin`

---

## ✨ Features

### Public Website
- 📱 Responsive homepage with hero section
- 📝 Full-featured blog with categories and tags
- 🎨 Modern, minimalist black & white design
- 📧 Newsletter subscription system
- 🎪 Blog carousel on all pages
- ⚡ Optimized for speed and SEO

### Admin Dashboard
- ✏️ Blog post CRUD (Create, Read, Update, Delete)
- 🏠 Homepage content editor
- 🖼️ Image upload and URL import
- 📊 Draft/Published workflow
- 🏷️ Categories and tags management
- 👤 Author attribution
- 📈 Analytics integration (PostHog)

### Technical
- ⚛️ Built with Next.js 14 (App Router)
- 🗄️ Supabase backend (PostgreSQL + Storage)
- 🎨 Custom CSS (no framework bloat)
- 📱 Fully responsive design
- 🔒 Secure API routes
- 🚀 Deployed on Vercel
- 📊 Built-in analytics

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)** | Deploy in 10 minutes |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Complete deployment guide |
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | Step-by-step checklist |
| **[COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)** | Full system overview |
| **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** | REST API reference |
| **[IMAGE_UPLOAD_GUIDE.md](IMAGE_UPLOAD_GUIDE.md)** | Image management guide |
| **[ADMIN_SETUP.md](ADMIN_SETUP.md)** | Admin interface guide |

---

## 🏃 Quick Start

### 1. Clone & Install

```bash
cd /Users/stuarta/Documents/GitHub/doubleclicker-1
npm install
```

### 2. Set Up Environment Variables

Copy `.env.template` to `.env.local` and fill in your credentials:

```bash
cp .env.template .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Database Migrations

In Supabase Dashboard → SQL Editor, run:
- `supabase/migrations/20251109_add_newsletter_and_cta.sql`
- `supabase/migrations/20251109_add_homepage_and_images.sql`

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 🚀 Deploy to Production

### Quick Deploy (10 minutes)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Import your GitHub repo
   - Add environment variables
   - Click Deploy

3. **Connect Domain:**
   - Add domain in Vercel
   - Update DNS in Namecheap
   - Wait 10-60 minutes

**See [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md) for detailed steps.**

---

## 📁 Project Structure

```
doubleclicker-1/
├── app/
│   ├── admin/              # Admin dashboard
│   │   ├── page.tsx        # Blog posts list
│   │   ├── new/            # Create new post
│   │   ├── edit/[id]/      # Edit post
│   │   └── homepage/       # Homepage editor
│   ├── api/                # API routes
│   │   ├── blog/           # Blog CRUD
│   │   ├── homepage/       # Homepage content
│   │   ├── upload/         # Image upload
│   │   ├── subscribe/      # Newsletter
│   │   └── convert/        # Analytics
│   ├── blog/               # Public blog
│   │   ├── page.tsx        # Blog listing
│   │   └── [slug]/         # Individual posts
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage server component
│   ├── HomePageClient.tsx  # Homepage client component
│   └── globals.css         # Global styles
├── components/
│   ├── Analytics.tsx       # PostHog integration
│   ├── BlogCarousel.tsx    # Blog carousel
│   ├── ImageUpload.tsx     # Image uploader
│   ├── MobileMenu.tsx      # Mobile navigation
│   └── SubscribeHero.tsx   # Newsletter signup
├── lib/
│   └── supabase/           # Supabase clients
│       └── server.ts       # Server-side client
├── supabase/
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── [Documentation files]
```

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router, React 18)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Hosting:** Vercel
- **Analytics:** PostHog
- **Styling:** Custom CSS (no frameworks)
- **Fonts:** System fonts (Inter)

---

## 🎯 Admin Features

### Blog Management (`/admin`)
- View all posts in table format
- Filter by status (All/Published/Drafts)
- Quick edit and delete actions
- Post counts for each filter

### Create/Edit Blog Post
- Auto-slug generation from title
- Markdown content editor
- Featured image (upload or URL)
- SEO fields (meta title, description)
- Categories and tags
- Draft/Published status
- Author attribution
- Character counters
- Live image preview

### Homepage Editor (`/admin/homepage`)
- Edit hero section (title, description, image, CTA)
- Edit about section
- Manage services (add/remove dynamically)
- Update contact email
- Live preview
- One-click save

### Image Upload
- Upload files (max 5MB)
- Import from URL (Unsplash, etc.)
- Automatic Supabase Storage integration
- Live preview
- Image recommendations
- Format support: JPG, PNG, GIF, WebP

---

## 🔌 API Endpoints

### Blog Posts
- `GET /api/blog` - List all posts
- `POST /api/blog` - Create post
- `PUT /api/blog/[id]` - Update post
- `DELETE /api/blog/[id]` - Delete post

### Homepage
- `GET /api/homepage` - Get content
- `POST /api/homepage` - Update content

### Upload
- `POST /api/upload` - Upload image

### Newsletter
- `POST /api/subscribe` - Subscribe email

### Analytics
- `POST /api/convert` - Track conversion

**See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete reference.**

---

## 🎨 Design System

### Colors
- Primary: Black (#000000)
- Secondary: White (#FFFFFF)
- Accent: Gray (#666666)
- Background: Off-white (#fafafa)
- Border: Light gray (#e5e5e5)

### Typography
- Font: System fonts (Inter)
- Scale: 12px, 14px, 16px, 18px, 20px, 24px, 32px, 48px
- Line height: 1.5 (body), 1.2 (headings)
- Letter spacing: -0.02em (headings)

### Spacing
- Base: 8px
- Scale: xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px)

### Responsive Breakpoints
- Mobile: < 480px
- Tablet: 481px - 768px
- Desktop: 769px - 1024px
- Large: > 1024px

---

## 📊 Database Schema

### `blog_posts`
- id (UUID)
- title (TEXT)
- slug (TEXT, unique)
- content (TEXT)
- meta_description (TEXT)
- featured_image (TEXT)
- status (TEXT: draft/published)
- category (TEXT)
- tags (JSONB)
- author (TEXT)
- created_date (TIMESTAMPTZ)
- updated_date (TIMESTAMPTZ)

### `homepage_content`
- id (UUID)
- hero_title (TEXT)
- hero_description (TEXT)
- hero_image (TEXT)
- hero_cta_text (TEXT)
- hero_cta_link (TEXT)
- about_title (TEXT)
- about_description (TEXT)
- services_title (TEXT)
- services (JSONB)
- contact_email (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### `newsletter_subscribers`
- id (UUID)
- email (TEXT, unique)
- source (TEXT)
- subscribed_at (TIMESTAMPTZ)

### `cta_conversions`
- id (UUID)
- cta_name (TEXT)
- page_url (TEXT)
- user_id (TEXT)
- converted_at (TIMESTAMPTZ)

---

## 🔒 Security

### Current Implementation
- Input sanitization on all forms
- HTTPS enforced (Vercel)
- Environment variables for secrets
- Supabase Row Level Security ready
- Content Security headers

### Recommended for Production
- [ ] Add authentication to `/admin` routes
- [ ] Enable Supabase Auth
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Set up CORS properly
- [ ] Enable database RLS policies
- [ ] Add admin user roles

---

## 📈 Performance

### Current Optimizations
- Server-side rendering (SSR)
- Static generation where possible
- Image optimization ready
- Minimal JavaScript bundle
- No CSS framework overhead
- Edge caching on Vercel

### Recommendations
- Use Next.js `<Image />` component
- Enable ISR for blog posts
- Add service worker for offline
- Implement lazy loading
- Use WebP images
- Enable Vercel Analytics

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type check
npm run type-check

# Build for production
npm run build

# Test production build locally
npm run build && npm start
```

---

## 📝 Content Management

### Creating Blog Posts
1. Go to `/admin`
2. Click "+ New Post"
3. Fill in title (slug auto-generates)
4. Write content (Markdown supported)
5. Add featured image
6. Set category and tags
7. Choose Draft or Published
8. Click "Create Post"

### Editing Homepage
1. Go to `/admin/homepage`
2. Edit any section
3. Add/remove services
4. Upload images
5. Click "Save Homepage Content"

### Managing Images
- **Upload:** Click "Upload File" tab, select image
- **URL:** Paste Unsplash/Pexels URL
- **Storage:** Images stored in Supabase
- **Format:** JPG, PNG, GIF, WebP (max 5MB)

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Database Errors
- Check Supabase credentials in `.env.local`
- Verify migrations are applied
- Check RLS policies

### Image Upload Fails
- Verify `images` bucket exists in Supabase
- Check bucket is set to Public
- Verify storage policies are applied

### Deployment Issues
- Check Vercel logs
- Verify environment variables
- Ensure all dependencies are in `package.json`

---

## 🚦 Roadmap

### Phase 1 (Current) ✅
- [x] Blog system with CRUD
- [x] Homepage content editor
- [x] Image upload system
- [x] Newsletter subscriptions
- [x] Analytics integration

### Phase 2 (Next)
- [ ] User authentication (Supabase Auth)
- [ ] Comment system
- [ ] Search functionality
- [ ] RSS feed
- [ ] Sitemap generation

### Phase 3 (Future)
- [ ] Email campaigns
- [ ] A/B testing
- [ ] Advanced analytics
- [ ] SEO automation
- [ ] Multi-language support

---

## 📞 Support

- **Issues:** Create a GitHub issue
- **Email:** hello@sewo.io
- **Docs:** See documentation files above

---

## 📄 License

Proprietary - © 2025 SEWO. All rights reserved.

---

## 🙏 Acknowledgments

- Built with Next.js by Vercel
- Database by Supabase
- Analytics by PostHog
- Images by Unsplash
- Hosted on Vercel

---

**Made with ❤️ by SEWO**

Ready to rank in LLMs? Let's go! 🚀
