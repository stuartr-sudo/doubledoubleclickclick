# Image Upload & Management Guide

Complete guide for uploading and managing images in your DoubleClicker blog.

## Setup Required

### 1. Run Supabase Migration

First, create the images storage bucket in Supabase:

```bash
# Apply the migration
supabase migration up
```

Or manually in Supabase Dashboard:
1. Go to **Storage** in your Supabase dashboard
2. Click **Create Bucket**
3. Name it: `images`
4. Make it **Public**
5. Click **Create**

### 2. Storage Policies

The migration automatically creates these policies, but if you need to add them manually:

**In Supabase Dashboard → Storage → images bucket → Policies:**

```sql
-- Allow public reads
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- Allow uploads
CREATE POLICY "Anyone can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');
```

---

## Using the Image Upload Component

The `ImageUpload` component provides two ways to add images:

### Method 1: Import from URL (Recommended)

**Best for:**
- Quick imports from Unsplash, Pexels, etc.
- Using existing CDN images
- No file size limits

**How to use:**
1. Click **"From URL"** tab
2. Paste the image URL
3. Click **"Use URL"**

**Popular Sources:**
- **Unsplash**: `https://images.unsplash.com/photo-...`
- **Pexels**: `https://images.pexels.com/photos/...`
- **Your CDN**: Any public image URL

### Method 2: Upload File

**Best for:**
- Custom images
- Branded graphics
- Original photography

**How to use:**
1. Click **"Upload File"** tab
2. Choose an image file
3. Wait for upload to complete

**Limits:**
- Max file size: 5MB
- Formats: JPG, PNG, GIF, WebP
- Automatically stored in Supabase Storage

---

## Image Recommendations

### Sizes

| Usage | Recommended Size | Aspect Ratio |
|-------|-----------------|--------------|
| Blog Featured Image | 1200 x 630px | 1.91:1 |
| Homepage Hero | 1920 x 1080px | 16:9 |
| Blog Carousel | 800 x 600px | 4:3 |
| Service Icons | 400 x 400px | 1:1 |

### Optimization

**Before uploading:**
1. Resize to recommended dimensions
2. Compress (use TinyPNG.com or similar)
3. Export at 80% quality
4. Convert to WebP for best performance

**Unsplash URL Parameters:**
```
https://images.unsplash.com/photo-123?w=1200&q=80&fm=webp
```
- `w=1200` - width
- `q=80` - quality (80%)
- `fm=webp` - format

---

## Using Images in Admin

### Blog Posts

1. Go to `/admin/new` or `/admin/edit/[id]`
2. Find **"Featured Image URL"** field
3. Use the ImageUpload component:
   - Paste URL from Unsplash/Pexels
   - OR upload your own file
4. Preview appears automatically
5. Save your post

### Homepage Content

1. Go to `/admin/homepage`
2. Each section has image fields:
   - Hero Image
   - Service Icons (optional)
3. Use URL import or file upload
4. Save changes

---

## API Upload Endpoint

### POST `/api/upload`

Upload an image via API.

**Request:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg"
```

**Response:**
```json
{
  "url": "https://your-project.supabase.co/storage/v1/object/public/images/blog-images/filename.jpg",
  "path": "blog-images/filename.jpg",
  "name": "filename.jpg"
}
```

**JavaScript Example:**
```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
})

const { url } = await response.json()
console.log('Image URL:', url)
```

---

## Supabase Storage Structure

### Folder Organization

```
images/
└── blog-images/
    ├── 1699564123-abc123.jpg
    ├── 1699564456-def456.png
    └── 1699564789-ghi789.webp
```

All uploaded images go to `blog-images/` folder with unique filenames.

### Accessing Uploaded Images

**Public URL Format:**
```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/images/blog-images/[FILENAME]
```

**Get from Supabase Dashboard:**
1. Storage → images bucket
2. Click on any image
3. Copy public URL

---

## Managing Images

### View All Images

**Via Supabase Dashboard:**
1. Go to **Storage**
2. Click **images** bucket
3. Browse **blog-images** folder

### Delete Images

**Via Supabase Dashboard:**
1. Storage → images
2. Select image(s)
3. Click **Delete**

**Via API (optional):**
```javascript
const { error } = await supabase.storage
  .from('images')
  .remove(['blog-images/filename.jpg'])
```

---

## Image URLs: Best Practices

### ✅ DO:
- Use **Unsplash** for high-quality free images
- Add query parameters: `?w=1200&q=80&fm=webp`
- Store uploaded images in **Supabase Storage**
- Use descriptive filenames
- Compress images before uploading

### ❌ DON'T:
- Use enormous file sizes (>5MB)
- Link to private/restricted URLs
- Use HTTP (non-secure) URLs
- Forget to test image loads

---

## Troubleshooting

### Image Not Loading

**Problem**: Broken image icon appears

**Solutions:**
1. Check URL is publicly accessible
2. Verify bucket is set to **public**
3. Test URL in browser directly
4. Check CORS settings in Supabase

### Upload Fails

**Problem**: "Failed to upload" error

**Solutions:**
1. Check file size (<5MB)
2. Verify file is an image
3. Confirm storage bucket exists
4. Check Supabase project status

### Slow Loading

**Problem**: Images load slowly

**Solutions:**
1. Use smaller file sizes
2. Add Unsplash parameters: `?w=800&q=80`
3. Convert to WebP format
4. Use CDN (Cloudflare, etc.)

---

## Free Image Sources

### Unsplash
- URL: unsplash.com
- License: Free for commercial use
- Quality: Excellent
- Direct URLs: Yes

### Pexels
- URL: pexels.com
- License: Free for commercial use
- Quality: Excellent
- Direct URLs: Yes

### Pixabay
- URL: pixabay.com
- License: Free
- Quality: Good
- Direct URLs: Yes

---

## Quick Tips

1. **Always preview** before saving
2. **Use Unsplash** for quick professional photos
3. **Compress** before uploading
4. **Test URLs** in incognito mode
5. **Keep originals** if you upload custom images
6. **Name files descriptively**: `hero-home-llm-ranking.jpg`

---

## Example Workflow

### Adding Featured Image to Blog Post

1. Find image on Unsplash
2. Click **Download** → Copy image URL
3. In admin, paste URL in Featured Image field
4. Add size parameters: `?w=1200&q=80&fm=webp`
5. Preview appears automatically
6. Save post ✅

### Uploading Custom Brand Logo

1. Prepare logo (PNG, <1MB)
2. Go to `/admin/homepage`
3. Find Hero Image field
4. Click **Upload File** tab
5. Select your logo file
6. Wait for upload (gets Supabase URL)
7. Save homepage content ✅

---

## Support

- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage
- **Image Optimization**: https://tinypng.com
- **Free Images**: https://unsplash.com

Your image upload system is ready to use! 🎨

