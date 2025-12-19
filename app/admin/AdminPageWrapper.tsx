'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  meta_description: string
  featured_image: string | null
  status: 'draft' | 'published'
  category: string
  tags: string[]
  author: string
  created_date: string
  updated_date: string
  is_popular: boolean
}

export default function AdminPageWrapper() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      // Fetch ALL posts (published + draft) with high limit
      const res = await fetch('/api/blog?status=all&limit=1000')
      const result = await res.json()
      setPosts(result.data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id))
        setSelectedPosts(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        alert('Post deleted successfully')
      } else {
        alert('Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Error deleting post')
    }
  }

  const togglePopular = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_popular: !currentStatus }),
      })
      if (res.ok) {
        setPosts(posts.map(p => p.id === id ? { ...p, is_popular: !currentStatus } : p))
      } else {
        alert('Failed to update popular status')
      }
    } catch (error) {
      console.error('Error updating popular status:', error)
      alert('Error updating popular status')
    }
  }

  const toggleSelectPost = (id: string) => {
    setSelectedPosts(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)))
    }
  }

  const bulkDelete = async () => {
    if (selectedPosts.size === 0) {
      alert('Please select posts to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedPosts.size} post(s)? This cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    let successCount = 0
    let failCount = 0

    for (const id of Array.from(selectedPosts)) {
      try {
        const res = await fetch(`/api/blog/${id}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        console.error(`Error deleting post ${id}:`, error)
        failCount++
      }
    }

    // Refresh posts list
    await fetchPosts()
    setSelectedPosts(new Set())
    setIsDeleting(false)
    
    alert(`Deleted ${successCount} post(s).${failCount > 0 ? ` Failed to delete ${failCount} post(s).` : ''}`)
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true
    return post.status === filter
  })

  if (loading) {
    return (
      <div className="admin-loading">
        <p>Loading blog posts...</p>
      </div>
    )
  }

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div className="admin-container">
          <div className="admin-header-content">
            <h1>Blog Admin</h1>
            <div className="admin-toolbar">
              <Link href="/admin/homepage" className="btn btn-secondary">
                Edit Homepage
              </Link>
              <Link href="/admin/leads" className="btn btn-secondary">
                Leads
              </Link>
              <Link href="/admin/new" className="btn btn-primary">
                New Post
              </Link>
              <Link href="/" className="btn btn-secondary">
                View Site
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Posts ({posts.length})
          </button>
          <button
            className={`filter-btn ${filter === 'published' ? 'active' : ''}`}
            onClick={() => setFilter('published')}
          >
            Published ({posts.filter(p => p.status === 'published').length})
          </button>
          <button
            className={`filter-btn ${filter === 'draft' ? 'active' : ''}`}
            onClick={() => setFilter('draft')}
          >
            Drafts ({posts.filter(p => p.status === 'draft').length})
          </button>
        </div>

        {filteredPosts.length > 0 && (
          <div className="bulk-actions">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedPosts.size === filteredPosts.length && filteredPosts.length > 0}
                onChange={toggleSelectAll}
              />
              <span>Select All ({filteredPosts.length})</span>
            </label>
            {selectedPosts.size > 0 && (
              <>
                <span className="selected-count">{selectedPosts.size} selected</span>
                <button
                  onClick={bulkDelete}
                  disabled={isDeleting}
                  className="btn btn-danger"
                  style={{ marginLeft: '1rem' }}
                >
                  {isDeleting ? 'Deleting...' : `Delete Selected (${selectedPosts.size})`}
                </button>
              </>
            )}
          </div>
        )}

        <div className="admin-posts-list">
        {filteredPosts.length === 0 ? (
          <div className="empty-state">
            <p>No posts found.</p>
            <Link href="/admin/new" className="btn btn-primary">
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="posts-grid">
            {filteredPosts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-card-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPosts.has(post.id)}
                    onChange={() => toggleSelectPost(post.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {post.featured_image && (
                  <div className="post-card-image">
                    <img src={post.featured_image} alt={post.title} />
                  </div>
                )}
                <div className="post-card-content">
                  <div className="post-card-header">
                    <h3>{post.title}</h3>
                    <span className={`post-status ${post.status}`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="post-meta">
                    {post.category} • {new Date(post.created_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric'
                    })}
                  </p>
                  {post.meta_description && (
                    <p className="post-excerpt">{post.meta_description}</p>
                  )}
                  <div className="post-actions">
                    <Link
                      href={`/admin/edit/${post.id}`}
                      className="btn btn-sm btn-secondary"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => togglePopular(post.id, post.is_popular)}
                      className={`btn btn-sm ${post.is_popular ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {post.is_popular ? '★ Popular' : 'Make Popular'}
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </main>
  )
}

