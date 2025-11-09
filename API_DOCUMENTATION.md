# Blog API Documentation

Complete API documentation for the DoubleClicker blog system.

## Base URL

```
http://localhost:3000/api/blog
```

## Authentication

Currently, the API does not require authentication. For production, implement authentication middleware.

---

## Endpoints

### 1. Get All Blog Posts

**Endpoint:** `GET /api/blog`

**Description:** Retrieve all blog posts.

**Query Parameters:**
- `status` (optional): Filter by status (`published` or `draft`)
- `category` (optional): Filter by category
- `limit` (optional): Limit number of results

**Request Example:**
```bash
curl http://localhost:3000/api/blog
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "title": "My First Blog Post",
    "slug": "my-first-blog-post",
    "content": "Full markdown content here...",
    "meta_description": "A brief description",
    "featured_image": "https://example.com/image.jpg",
    "status": "published",
    "category": "Tech",
    "tags": ["javascript", "react"],
    "author": "John Doe",
    "created_date": "2025-11-09T00:00:00Z",
    "updated_date": "2025-11-09T00:00:00Z"
  }
]
```

---

### 2. Get Single Blog Post

**Endpoint:** `GET /api/blog/:id`

**Description:** Retrieve a specific blog post by ID.

**Path Parameters:**
- `id`: Blog post UUID

**Request Example:**
```bash
curl http://localhost:3000/api/blog/123e4567-e89b-12d3-a456-426614174000
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "My First Blog Post",
  "slug": "my-first-blog-post",
  "content": "Full markdown content here...",
  "meta_description": "A brief description",
  "featured_image": "https://example.com/image.jpg",
  "status": "published",
  "category": "Tech",
  "tags": ["javascript", "react"],
  "author": "John Doe",
  "created_date": "2025-11-09T00:00:00Z",
  "updated_date": "2025-11-09T00:00:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Post not found"
}
```

---

### 3. Create Blog Post

**Endpoint:** `POST /api/blog`

**Description:** Create a new blog post.

**Request Body:**
```json
{
  "title": "My New Blog Post",
  "slug": "my-new-blog-post",
  "content": "Full markdown content here...",
  "meta_description": "A brief description",
  "featured_image": "https://example.com/image.jpg",
  "status": "draft",
  "category": "Tech",
  "tags": ["javascript", "react"],
  "author": "John Doe"
}
```

**Required Fields:**
- `title` (string)
- `slug` (string, unique, URL-friendly)
- `content` (string)

**Optional Fields:**
- `meta_description` (string, max 160 chars recommended)
- `featured_image` (string, URL)
- `status` (string: `draft` or `published`, default: `draft`)
- `category` (string)
- `tags` (array of strings)
- `author` (string)

**Request Example:**
```bash
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Blog Post",
    "slug": "my-new-blog-post",
    "content": "This is the content of my new post.",
    "status": "published",
    "category": "Tech",
    "tags": ["javascript"],
    "author": "John Doe"
  }'
```

**Response (201 Created):**
```json
{
  "id": "new-uuid-here",
  "title": "My New Blog Post",
  "slug": "my-new-blog-post",
  "content": "This is the content of my new post.",
  "meta_description": null,
  "featured_image": null,
  "status": "published",
  "category": "Tech",
  "tags": ["javascript"],
  "author": "John Doe",
  "created_date": "2025-11-09T00:00:00Z",
  "updated_date": "2025-11-09T00:00:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Missing required fields: title, slug, content"
}
```

---

### 4. Update Blog Post

**Endpoint:** `PUT /api/blog/:id`

**Description:** Update an existing blog post.

**Path Parameters:**
- `id`: Blog post UUID

**Request Body:**
```json
{
  "title": "Updated Blog Post Title",
  "slug": "updated-blog-post-title",
  "content": "Updated content...",
  "meta_description": "Updated description",
  "featured_image": "https://example.com/new-image.jpg",
  "status": "published",
  "category": "Business",
  "tags": ["marketing", "sales"],
  "author": "Jane Smith"
}
```

**All Fields Are Optional** - Only include fields you want to update.

**Request Example:**
```bash
curl -X PUT http://localhost:3000/api/blog/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "status": "published"
  }'
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Updated Title",
  "slug": "my-first-blog-post",
  "content": "Full markdown content here...",
  "meta_description": "A brief description",
  "featured_image": "https://example.com/image.jpg",
  "status": "published",
  "category": "Tech",
  "tags": ["javascript", "react"],
  "author": "John Doe",
  "created_date": "2025-11-08T00:00:00Z",
  "updated_date": "2025-11-09T00:00:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Post not found"
}
```

---

### 5. Delete Blog Post

**Endpoint:** `DELETE /api/blog/:id`

**Description:** Delete a blog post permanently.

**Path Parameters:**
- `id`: Blog post UUID

**Request Example:**
```bash
curl -X DELETE http://localhost:3000/api/blog/123e4567-e89b-12d3-a456-426614174000
```

**Response (200 OK):**
```json
{
  "message": "Post deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Post not found"
}
```

---

## Field Specifications

### Blog Post Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto-generated | Unique identifier |
| `title` | String | Yes | Post title |
| `slug` | String | Yes | URL-friendly identifier (must be unique) |
| `content` | Text | Yes | Full post content (supports Markdown) |
| `meta_description` | String | No | SEO description (160 chars recommended) |
| `featured_image` | String (URL) | No | Main post image URL |
| `status` | Enum | No | `draft` or `published` (default: `draft`) |
| `category` | String | No | Post category |
| `tags` | Array[String] | No | Post tags |
| `author` | String | No | Author name |
| `created_date` | Timestamp | Auto-generated | Creation timestamp |
| `updated_date` | Timestamp | Auto-generated | Last update timestamp |

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Usage Examples

### JavaScript/TypeScript (fetch)

```typescript
// Create a post
async function createPost() {
  const response = await fetch('http://localhost:3000/api/blog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'My New Post',
      slug: 'my-new-post',
      content: 'Post content here',
      status: 'published',
      category: 'Tech',
      tags: ['javascript'],
    }),
  })
  
  const data = await response.json()
  console.log(data)
}

// Update a post
async function updatePost(id: string) {
  const response = await fetch(`http://localhost:3000/api/blog/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'published',
      featured_image: 'https://example.com/image.jpg',
    }),
  })
  
  const data = await response.json()
  console.log(data)
}

// Delete a post
async function deletePost(id: string) {
  const response = await fetch(`http://localhost:3000/api/blog/${id}`, {
    method: 'DELETE',
  })
  
  const data = await response.json()
  console.log(data)
}
```

### Python (requests)

```python
import requests

# Create a post
def create_post():
    url = 'http://localhost:3000/api/blog'
    data = {
        'title': 'My New Post',
        'slug': 'my-new-post',
        'content': 'Post content here',
        'status': 'published',
        'category': 'Tech',
        'tags': ['python']
    }
    response = requests.post(url, json=data)
    print(response.json())

# Get all posts
def get_posts():
    url = 'http://localhost:3000/api/blog'
    response = requests.get(url)
    print(response.json())

# Update a post
def update_post(post_id):
    url = f'http://localhost:3000/api/blog/{post_id}'
    data = {'status': 'published'}
    response = requests.put(url, json=data)
    print(response.json())
```

---

## Featured Image Setup

### Option 1: External URL
Provide a direct URL to an image hosted elsewhere (Unsplash, Cloudinary, etc.)

```json
{
  "featured_image": "https://images.unsplash.com/photo-123?w=1200"
}
```

### Option 2: Supabase Storage (Recommended)
Upload images to Supabase Storage and use the public URL:

```bash
# Upload to Supabase Storage bucket
# Then use the public URL
{
  "featured_image": "https://your-project.supabase.co/storage/v1/object/public/blog-images/image.jpg"
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Slugs must be unique across all posts
- Content field supports Markdown formatting
- Tags should be lowercase and hyphenated
- For production, implement proper authentication and rate limiting
- Consider adding image upload endpoint for featured images
- Implement pagination for GET /api/blog for better performance

---

## Admin Interface

Access the blog admin interface at:
```
http://localhost:3000/admin
```

Features:
- View all posts
- Create new posts
- Edit existing posts
- Delete posts
- Filter by status (all/published/draft)
- Live image preview
- Auto-slug generation

---

For questions or issues, refer to the codebase or contact support.

