# Blog Admin Setup Guide

## Admin Interface Overview

Your complete blog admin system is now ready! Here's everything you need to know.

## Accessing the Admin

Navigate to: **http://localhost:3000/admin**

## Features

### 1. **Admin Dashboard** (`/admin`)
- View all blog posts in a table
- Filter by status (All, Published, Drafts)
- See post counts for each filter
- Quick access to Edit and Delete actions
- View post metadata (title, category, author, date)

### 2. **Create New Post** (`/admin/new`)
- Full-featured post editor
- Auto-slug generation from title
- Real-time character counter for meta description
- Image preview for featured images
- All fields available:
  - Title (required)
  - Slug (required, auto-generated)
  - Content (required, supports Markdown)
  - Meta Description (160 char recommended)
  - Featured Image URL
  - Status (Draft/Published)
  - Category
  - Tags (comma-separated)
  - Author

### 3. **Edit Post** (`/admin/edit/[id]`)
- Same interface as create, but pre-populated
- Update any field
- Changes saved to database immediately

## Using the Admin

### Creating a Post

1. Click **+ New Post** from the admin dashboard
2. Fill in the required fields:
   - **Title**: Your post title
   - **Slug**: Auto-generated, or customize it
   - **Content**: Write your post (Markdown supported)
3. Add optional metadata:
   - **Featured Image**: Paste an image URL
   - **Meta Description**: SEO description (160 chars max)
   - **Category**: e.g., "Tech", "Business"
   - **Tags**: e.g., "javascript, react, nextjs"
   - **Author**: Your name
4. Choose status:
   - **Draft**: Not visible on the site
   - **Published**: Live on your blog
5. Click **Create Post**

### Featured Image URLs

You can use images from:
- **Unsplash**: `https://images.unsplash.com/photo-...`
- **Your own CDN**: `https://yourcdn.com/image.jpg`
- **Supabase Storage**: Upload to Supabase Storage bucket

### Editing a Post

1. From the admin dashboard, click **Edit** on any post
2. Update any fields you want to change
3. Click **Update Post** to save

### Deleting a Post

1. From the admin dashboard, click **Delete** on a post
2. Confirm the deletion
3. Post is permanently removed

## Blog Carousel

The blog carousel automatically appears on:
- All blog listing pages (`/blog`)
- Individual blog post pages (`/blog/[slug]`)

**It does NOT appear on the homepage** as requested.

The carousel shows the latest 4 published posts with:
- Featured images
- Titles
- Dates
- Short descriptions

## API Integration

Full API documentation is available in `API_DOCUMENTATION.md`.

### Quick API Examples

**Get all posts:**
```bash
curl http://localhost:3000/api/blog
```

**Create a post via API:**
```bash
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Post",
    "slug": "api-test-post",
    "content": "Content here",
    "status": "published"
  }'
```

**Update a post:**
```bash
curl -X PUT http://localhost:3000/api/blog/[POST_ID] \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'
```

**Delete a post:**
```bash
curl -X DELETE http://localhost:3000/api/blog/[POST_ID]
```

## Database Structure

Your Supabase database has a `blog_posts` table with these fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | Text | Post title |
| `slug` | Text | URL slug (unique) |
| `content` | Text | Post content |
| `meta_description` | Text | SEO description |
| `featured_image` | Text | Image URL |
| `status` | Text | draft/published |
| `category` | Text | Post category |
| `tags` | JSONB | Array of tags |
| `author` | Text | Author name |
| `created_date` | Timestamp | Creation date |
| `updated_date` | Timestamp | Last update |

## Category & Tag Management

### Categories
- Single category per post
- Enter any category name
- Used for filtering on blog page

### Tags
- Multiple tags per post
- Enter as comma-separated values: `react, javascript, web`
- Automatically converted to array

## Content Formatting

The content field supports **Markdown** formatting:

```markdown
# Heading 1
## Heading 2

**Bold text**
*Italic text*

- Bullet point
- Another point

[Link text](https://example.com)

![Image alt](https://example.com/image.jpg)
```

## Tips & Best Practices

### SEO Optimization
1. **Meta Description**: Keep under 160 characters
2. **Title**: Front-load important keywords
3. **Slug**: Keep short and descriptive
4. **Featured Image**: Always include for social sharing

### Image Recommendations
- **Size**: 1200x630px (optimal for social sharing)
- **Format**: JPG or PNG
- **Quality**: Medium (80%) to balance quality/speed
- **CDN**: Use Unsplash or Supabase Storage for reliability

### Content Organization
- **Use Categories** for broad topics (Tech, Business, Lifestyle)
- **Use Tags** for specific subjects (react, marketing, productivity)
- **Draft First** to review before publishing

### Workflow
1. Create post in **Draft** status
2. Write and format content
3. Add featured image and metadata
4. Preview (view live at `/blog/[slug]`)
5. Change status to **Published**
6. Post goes live immediately!

## Keyboard Shortcuts

- **Save Form**: Cmd/Ctrl + Enter (in textarea)
- **Tab Between Fields**: Tab key
- **Quick Navigation**: Use browser back button to return to admin

## Troubleshooting

### Post Not Appearing
- Check status is **Published**
- Verify slug is unique
- Check Supabase connection

### Image Not Loading
- Verify URL is publicly accessible
- Check URL format (https://...)
- Try a different image source

### Slug Already Exists
- Each slug must be unique
- Modify the slug slightly (add -2, change wording)
- Admin will show error if slug exists

## Next Steps

1. **Create your first post** at `/admin/new`
2. **Customize categories** to match your content
3. **Add featured images** from Unsplash or your CDN
4. **Test the API** using the documentation
5. **Check the blog carousel** on your blog pages

## Support

- **API Docs**: See `API_DOCUMENTATION.md`
- **Supabase**: Check your project dashboard
- **Frontend**: All pages are in `/app/` directory

---

Your blog admin is fully functional and ready to use! 🎉

