'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'write' | 'preview'>('write')
  const [categories, setCategories] = useState<string[]>([])
  const initialStatusRef = useRef<'draft' | 'published' | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    featured_image: '',
    status: 'draft',
    category: '',
    tags: '',
    author: '',
    is_popular: false,
    meta_title: '',
  })

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/blog/categories')
      const result = await res.json()
      if (result.success) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/blog/${params.id}`)
      const result = await res.json()
      if (!res.ok || result?.success === false) {
        throw new Error(result?.error || 'Failed to load post')
      }
      const post = result.data || result // Handle both wrapped and unwrapped responses
      const normalizedStatus: 'draft' | 'published' = post.status === 'published' ? 'published' : 'draft'
      initialStatusRef.current = normalizedStatus
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        content: post.content || '',
        meta_description: post.meta_description || '',
        featured_image: post.featured_image || '',
        status: normalizedStatus,
        category: post.category || '',
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
        author: post.author || '',
        is_popular: post.is_popular || false,
        meta_title: post.meta_title || '',
      })
    } catch (error) {
      console.error('Error fetching post:', error)
      setLoadError(error instanceof Error ? error.message : 'Error loading post')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchPost()
    fetchCategories()
  }, [fetchPost, fetchCategories])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loadError) return

    // Safety: confirm before unpublishing a previously published post
    if (initialStatusRef.current === 'published' && formData.status === 'draft') {
      const ok = confirm('This will unpublish this article (move it back to Draft). Continue?')
      if (!ok) return
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/blog/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      if (res.ok) {
        router.push('/admin')
      } else {
        alert('Failed to update post')
      }
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Error updating post')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-loading">Loading post...</div>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <h1>Edit Post</h1>
            <Link href="/admin" className="btn btn-secondary">
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <div className="admin-container">
        {loadError && (
          <div
            className="admin-section"
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '12px',
              color: '#9a3412',
            }}
          >
            <strong>Couldn&apos;t load this post.</strong> {loadError}
            <div style={{ marginTop: '0.5rem' }}>
              Please refresh. If this keeps happening, the API is failing—don&apos;t save this form.
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="post-form">
          <div className="form-grid">
            <div className="form-main">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter post title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="meta_title">Meta Title (SEO)</label>
                <input
                  type="text"
                  id="meta_title"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleChange}
                  placeholder="SEO title (defaults to post title)"
                />
                <small>Overrides the browser tab title</small>
              </div>

              <div className="form-group">
                <label htmlFor="slug">Slug *</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  placeholder="post-url-slug"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label htmlFor="content" style={{ marginBottom: 0 }}>Content *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${viewMode === 'write' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                      onClick={() => setViewMode('write')}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${viewMode === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                      onClick={() => setViewMode('preview')}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {viewMode === 'write' ? (
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    required
                    rows={20}
                    placeholder="Write your post content here (supports Markdown)"
                  />
                ) : (
                  <div className="blog-post">
                    <div 
                      className="blog-post-content"
                      style={{
                        border: '1px solid #ddd',
                        padding: '30px',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        minHeight: '400px',
                        maxHeight: '600px',
                        overflowY: 'auto'
                      }}
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="meta_description">Meta Description</label>
                <textarea
                  id="meta_description"
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description for SEO (160 characters max)"
                  maxLength={160}
                />
                <small>{formData.meta_description.length}/160 characters</small>
              </div>
            </div>

            <div className="form-sidebar">
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="featured_image">Featured Image URL</label>
                <input
                  type="url"
                  id="featured_image"
                  name="featured_image"
                  value={formData.featured_image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.featured_image && (
                  <div className="image-preview">
                    <img
                      src={formData.featured_image}
                      alt="Preview"
                      loading="lazy"
                      style={{ objectFit: 'cover', width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Tech, Business, Lifestyle"
                  list="category-list"
                />
                <datalist id="category-list">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <small>Select an existing category or type a new one to create it.</small>
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="tag1, tag2, tag3"
                />
                <small>Separate tags with commas</small>
              </div>

              <div className="form-group">
                <label htmlFor="author">Author</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Author name"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="is_popular"
                    name="is_popular"
                    checked={formData.is_popular}
                    onChange={handleChange}
                  />
                  <span>Mark as Popular Post</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={saving || !!loadError}
              >
                {saving ? 'Saving...' : 'Update Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}

