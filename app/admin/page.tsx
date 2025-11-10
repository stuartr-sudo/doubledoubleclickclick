'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
}

export default function AdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blog')
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
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true
    return post.status === filter
  })

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <h1>Blog Admin</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/admin/homepage" className="btn btn-secondary">
                Edit Homepage
              </Link>
              <Link href="/" className="btn btn-secondary">
                View Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-container">
        <div className="admin-toolbar">
          <Link href="/admin/new" className="btn btn-primary">
            + New Post
          </Link>
          <div className="filter-tabs">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({posts.length})
            </button>
            <button
              className={filter === 'published' ? 'active' : ''}
              onClick={() => setFilter('published')}
            >
              Published ({posts.filter(p => p.status === 'published').length})
            </button>
            <button
              className={filter === 'draft' ? 'active' : ''}
              onClick={() => setFilter('draft')}
            >
              Drafts ({posts.filter(p => p.status === 'draft').length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading posts...</div>
        ) : (
          <div className="admin-posts-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No posts found
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <div className="post-title">
                          {post.title}
                          <span className="post-slug">/{post.slug}</span>
                        </div>
                      </td>
                      <td>{post.category || 'Uncategorized'}</td>
                      <td>
                        <span className={`status-badge status-${post.status}`}>
                          {post.status}
                        </span>
                      </td>
                      <td>{post.author || 'Anonymous'}</td>
                      <td>
                        {new Date(post.created_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="actions">
                        <Link
                          href={`/admin/edit/${post.id}`}
                          className="btn-action btn-edit"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="btn-action btn-delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

