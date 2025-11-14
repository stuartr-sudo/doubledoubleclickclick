# Complete Setup Guide - SEWO Blog System

## 🎯 What You Have Now

### Admin Dashboard
- **Blog Admin**: `/admin` - Manage all blog posts
- **Homepage Editor**: `/admin/homepage` - Edit homepage content
- **Image Upload**: Built-in component for images

### Features
✅ Full blog CRUD operations  
✅ Homepage content editor  
✅ Image upload & URL import  
✅ Blog carousel on all pages (except homepage)  
✅ Draft/Published workflow  
✅ Categories & tags  
✅ SEO fields  
✅ Complete REST API  

---

## 📋 Setup Steps

### Step 1: Run Supabase Migration

Apply the latest migration to create required tables:

```bash
# If using Supabase CLI
supabase migration up

# Or apply manually in Supabase Dashboard → SQL Editor:
# Run the contents of: supabase/migrations/20251109_add_homepage_and_images.sql
```

This creates:
- `homepage_content` table
- `images` storage bucket
- All necessary policies

### Step 2: Create Storage Bucket (if not auto-created)

**In Supabase Dashboard:**
1. Go to **Storage**
2. Click **New Bucket**
3. Name: `images`
4. Make it **Public**
5. Save

### Step 3: Verify Environment Variables

Ensure these are in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 4: Install Dependencies (if needed)

```bash
npm install
```

### Step 5: Start the Dev Server

```bash
npm run dev
```

---

## 🚀 Quick Start

### Access the Admin

Navigate to: **http://localhost:3000/admin**

### Create Your First Blog Post

1. Click **"+ New Post"**
2. Fill in:
   - **Title**: Your post title
   - **Content**: Write your post (Markdown supported)
   - **Featured Image**: Paste an Unsplash URL or upload
   - **Category**: e.g., "Tech"
   - **Status**: Draft or Published
3. Click **"Create Post"**

### Edit Homepage Content

1. From admin dashboard, click **"Edit Homepage"**
2. Update sections:
   - **Hero Section**: Main headline and CTA
   - **About Section**: Your story
   - **Services**: Add/remove services
   - **Contact**: Email address
3. Click **"Save Homepage Content"**

---

## 📁 File Structure

```
app/
├── admin/                    # Admin interface
│   ├── page.tsx             # Blog posts list
│   ├── new/page.tsx         # Create new post
│   ├── edit/[id]/page.tsx   # Edit post
│   └── homepage/page.tsx    # Edit homepage
├── api/
│   ├── blog/                # Blog CRUD API
│   ├── homepage/            # Homepage content API
│   └── upload/              # Image upload API
├── blog/
│   ├── page.tsx             # Blog listing
│   └── [slug]/page.tsx      # Individual post
└── globals.css              # All styles

components/
├── BlogCarousel.tsx         # Blog carousel component
├── ImageUpload.tsx          # Image upload component
├── SubscribeHero.tsx        # Newsletter signup
├── MobileMenu.tsx           # Mobile navigation
└── Analytics.tsx            # PostHog analytics

supabase/
└── migrations/              # Database migrations
```

---

## 🎨 Image Management

### Option 1: Import from URL (Easiest)

```
1. Find image on Unsplash.com
2. Copy image URL
3. Paste in "Featured Image URL" field
4. Add parameters: ?w=1200&q=80&fm=webp
5. Done! ✅
```

### Option 2: Upload File

```
1. Click "Upload File" tab
2. Choose your image (max 5MB)
3. Wait for upload
4. Image URL automatically added
5. Done! ✅
```

**See `IMAGE_UPLOAD_GUIDE.md` for full details**

---

## 🔌 API Reference

Full API documentation: **`API_DOCUMENTATION.md`**

### Quick API Examples

**Get all posts:**
```bash
GET /api/blog
```

**Create post:**
```bash
POST /api/blog
Content-Type: application/json

{
  "title": "My Post",
  "slug": "my-post",
  "content": "Content here...",
  "status": "published"
}
```

**Update post:**
```bash
PUT /api/blog/{id}
Content-Type: application/json

{
  "status": "published"
}
```

**Delete post:**
```bash
DELETE /api/blog/{id}
```

**Upload image:**
```bash
POST /api/upload
Content-Type: multipart/form-data

file: [binary data]
```

---

## 📊 Database Schema

### `blog_posts` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Post title |
| slug | TEXT | URL slug (unique) |
| content | TEXT | Post content |
| meta_description | TEXT | SEO description |
| featured_image | TEXT | Image URL |
| status | TEXT | draft/published |
| category | TEXT | Post category |
| tags | JSONB | Array of tags |
| author | TEXT | Author name |
| created_date | TIMESTAMPTZ | Creation date |
| updated_date | TIMESTAMPTZ | Last update |

### `homepage_content` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| hero_title | TEXT | Hero headline |
| hero_description | TEXT | Hero text |
| hero_image | TEXT | Hero image URL |
| hero_cta_text | TEXT | Button text |
| hero_cta_link | TEXT | Button link |
| about_title | TEXT | About heading |
| about_description | TEXT | About text |
| services_title | TEXT | Services heading |
| services | JSONB | Services array |
| contact_email | TEXT | Contact email |
| created_at | TIMESTAMPTZ | Created |
| updated_at | TIMESTAMPTZ | Updated |

### `newsletter_subscribers` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Subscriber email |
| subscribed_at | TIMESTAMPTZ | Signup date |

### Storage: `images` Bucket

Public bucket for uploaded images.

---

## 🎯 Admin Features Breakdown

### Blog Admin Dashboard (`/admin`)

**Features:**
- View all posts in table format
- Filter by status (All/Published/Drafts)
- Quick edit/delete actions
- Post counts for each filter
- Sortable columns

**Actions:**
- Create new post
- Edit existing post
- Delete post
- Navigate to homepage editor

### Create/Edit Post

**Fields:**
- **Title** (required) - Auto-generates slug
- **Slug** (required) - URL-friendly identifier
- **Content** (required) - Markdown editor
- **Meta Description** - SEO (160 chars)
- **Featured Image** - URL or upload
- **Status** - Draft or Published
- **Category** - Single category
- **Tags** - Comma-separated
- **Author** - Author name

**Features:**
- Live image preview
- Character counter
- Auto-slug generation
- Markdown support

### Homepage Editor (`/admin/homepage`)

**Sections:**
1. **Hero Section**
   - Title
   - Description
   - Image
   - CTA button (text + link)

2. **About Section**
   - Title
   - Description

3. **Services Section**
   - Section title
   - Multiple services (add/remove)
   - Each service: title, description, icon

4. **Contact**
   - Email address

**Features:**
- Live preview link
- Add/remove services dynamically
- Image upload/URL import
- One-click save

---

## 🎨 Customization

### Styling

All styles are in `app/globals.css`. Key sections:
- Lines 995-1263: Admin interface styles
- Lines 1265-1359: Blog carousel styles
- Lines 1361-1583: Homepage editor styles
- Lines 1452-1583: Image upload component styles

### Colors

Edit CSS variables (lines 10-30 in `globals.css`):
```css
:root {
  --color-primary: #000;        /* Primary brand color */
  --color-secondary: #fff;       /* Secondary color */
  --color-accent: #666;         /* Accent color */
  --color-bg: #ffffff;          /* Background */
  --color-text: #1a1a1a;        /* Text color */
}
```

### Typography

Change fonts in `app/layout.tsx`:
```typescript
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})
```

---

## 🔐 Security (Production)

### Current State
- No authentication required
- All endpoints are public

### Recommended for Production

1. **Add Authentication**
```typescript
// middleware.ts
export default function middleware(req: Request) {
  // Check auth for /admin routes
  if (req.url.includes('/admin')) {
    // Verify auth token
  }
}
```

2. **Protect API Routes**
```typescript
// In API routes
const session = await getSession(req)
if (!session) {
  return new Response('Unauthorized', { status: 401 })
}
```

3. **Add CSRF Protection**
4. **Rate Limiting**
5. **Input Validation**

---

## 📈 Performance Tips

### Images
- Use WebP format
- Add size parameters to Unsplash URLs
- Compress before uploading
- Use CDN (Cloudflare, etc.)

### Caching
- Enable Next.js ISR for blog pages
- Cache API responses
- Use Redis for session storage

### Database
- Index frequently queried columns
- Use database connection pooling
- Implement pagination for large datasets

---

## 🐛 Troubleshooting

### "Page Not Found" on Admin

**Problem**: `/admin` returns 404

**Solution**: Clear `.next` folder and restart:
```bash
rm -rf .next
npm run dev
```

### Images Not Uploading

**Problem**: Upload fails

**Solutions:**
1. Check Supabase Storage bucket exists
2. Verify bucket is public
3. Check file size (<5MB)
4. Test Supabase connection

### Homepage Content Not Saving

**Problem**: Changes don't persist

**Solutions:**
1. Run migration to create `homepage_content` table
2. Check Supabase connection
3. Check browser console for errors

### Blog Post Not Appearing

**Problem**: Published post not visible

**Solutions:**
1. Verify status is "Published"
2. Check slug is unique
3. Clear browser cache
4. Restart dev server

---

## 📚 Documentation Files

- **`API_DOCUMENTATION.md`** - Complete API reference
- **`ADMIN_SETUP.md`** - Admin interface guide
- **`IMAGE_UPLOAD_GUIDE.md`** - Image management
- **`COMPLETE_SETUP_GUIDE.md`** - This file

---

## ✅ Checklist

### Initial Setup
- [ ] Run Supabase migrations
- [ ] Create `images` storage bucket
- [ ] Verify environment variables
- [ ] Start dev server

### First Steps
- [ ] Access `/admin`
- [ ] Create first blog post
- [ ] Edit homepage content
- [ ] Test image upload
- [ ] Test blog carousel

### Production Ready
- [ ] Add authentication
- [ ] Secure API routes
- [ ] Set up custom domain
- [ ] Configure CDN
- [ ] Add analytics
- [ ] Test on mobile devices

---

## 🎉 You're Ready!

Your complete blog system is set up and ready to use:

1. **Admin Interface**: `/admin`
2. **Homepage Editor**: `/admin/homepage`
3. **Blog**: `/blog`
4. **API**: Full REST API documented

**Next Steps:**
1. Create your first blog post
2. Customize homepage content
3. Add your branding/colors
4. Deploy to Vercel

Happy blogging! 🚀

