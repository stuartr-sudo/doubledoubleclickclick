'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Author = {
  id: string
  slug: string
  name: string
  bio?: string | null
  linkedin_url?: string | null
  avatar_url?: string | null
  updated_at?: string | null
}

export default function AuthorsAdminClient() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newAuthor, setNewAuthor] = useState({
    slug: '',
    name: '',
    bio: '',
    linkedin_url: '',
    avatar_url: '',
  })

  const fetchAuthors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/authors')
      const json = await res.json()
      setAuthors(json.data || [])
    } catch (e) {
      console.error('Failed to load authors', e)
      setAuthors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthors()
  }, [])

  const createAuthor = async () => {
    if (!newAuthor.slug.trim() || !newAuthor.name.trim()) {
      alert('Slug and name are required')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newAuthor.slug.trim(),
          name: newAuthor.name.trim(),
          bio: newAuthor.bio || null,
          linkedin_url: newAuthor.linkedin_url || null,
          avatar_url: newAuthor.avatar_url || null,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        alert(json?.error || 'Failed to create author')
        return
      }
      setNewAuthor({ slug: '', name: '', bio: '', linkedin_url: '', avatar_url: '' })
      await fetchAuthors()
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div className="admin-container">
          <div className="admin-header-content">
            <h1>Authors</h1>
            <div className="admin-toolbar">
              <Link href="/admin" className="btn btn-secondary">← Back to Posts</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-section" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0 }}>Create Author</h2>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Slug (URL)</label>
              <input
                value={newAuthor.slug}
                onChange={(e) => setNewAuthor(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="stuart-asta"
              />
              <small>This becomes `/author/{newAuthor.slug || 'your-slug'}`</small>
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                value={newAuthor.name}
                onChange={(e) => setNewAuthor(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Stuart Asta"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Bio</label>
              <textarea
                value={newAuthor.bio}
                onChange={(e) => setNewAuthor(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                placeholder="Short bio shown on the author page."
              />
            </div>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                value={newAuthor.linkedin_url}
                onChange={(e) => setNewAuthor(prev => ({ ...prev, linkedin_url: e.target.value }))}
                placeholder="https://www.linkedin.com/in/..."
              />
            </div>
            <div className="form-group">
              <label>Avatar URL</label>
              <input
                value={newAuthor.avatar_url}
                onChange={(e) => setNewAuthor(prev => ({ ...prev, avatar_url: e.target.value }))}
                placeholder="https://.../avatar.jpg"
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={createAuthor} disabled={creating}>
            {creating ? 'Creating...' : 'Create Author'}
          </button>
        </div>

        <div className="admin-section">
          <h2 style={{ marginTop: 0 }}>All Authors</h2>
          {loading ? (
            <div className="admin-loading">Loading authors...</div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {authors.map(a => (
                <div key={a.id} className="post-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{a.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        /author/{a.slug}
                        {a.linkedin_url ? ` • LinkedIn set` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link className="btn btn-sm btn-secondary" href={`/author/${a.slug}`} target="_blank">
                        View
                      </Link>
                      <Link className="btn btn-sm btn-primary" href={`/admin/authors/${a.slug}`}>
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {authors.length === 0 && <div>No authors yet.</div>}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}


