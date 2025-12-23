'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Author = {
  slug: string
  name: string
  bio?: string | null
  linkedin_url?: string | null
  avatar_url?: string | null
}

export default function AuthorEditClient({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [author, setAuthor] = useState<Author | null>(null)

  const fetchAuthor = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/authors/${slug}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load author')
      setAuthor(json.data)
    } catch (e) {
      console.error(e)
      setAuthor(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthor()
  }, [slug])

  const save = async () => {
    if (!author) return
    setSaving(true)
    try {
      const res = await fetch(`/api/authors/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(author),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        alert(json?.error || 'Failed to save')
        return
      }
      alert('Saved')
    } finally {
      setSaving(false)
    }
  }

  const deleteAuthor = async () => {
    if (!confirm('Delete this author profile?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/authors/${slug}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        alert(json?.error || 'Failed to delete')
        return
      }
      window.location.href = '/admin/authors'
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div className="admin-container">
          <div className="admin-header-content">
            <h1>Edit Author</h1>
            <div className="admin-toolbar">
              <Link href="/admin/authors" className="btn btn-secondary">← Back</Link>
              <Link href={`/author/${slug}`} className="btn btn-secondary" target="_blank">View Public Page</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-container">
        {loading ? (
          <div className="admin-loading">Loading author...</div>
        ) : !author ? (
          <div className="admin-section">Author not found.</div>
        ) : (
          <div className="admin-section">
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Slug</label>
                <input
                  value={author.slug}
                  onChange={(e) => setAuthor(prev => prev ? ({ ...prev, slug: e.target.value }) : prev)}
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={author.name}
                  onChange={(e) => setAuthor(prev => prev ? ({ ...prev, name: e.target.value }) : prev)}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Bio</label>
                <textarea
                  rows={4}
                  value={author.bio || ''}
                  onChange={(e) => setAuthor(prev => prev ? ({ ...prev, bio: e.target.value }) : prev)}
                />
              </div>
              <div className="form-group">
                <label>LinkedIn URL</label>
                <input
                  value={author.linkedin_url || ''}
                  onChange={(e) => setAuthor(prev => prev ? ({ ...prev, linkedin_url: e.target.value }) : prev)}
                  placeholder="https://www.linkedin.com/in/..."
                />
              </div>
              <div className="form-group">
                <label>Avatar URL</label>
                <input
                  value={author.avatar_url || ''}
                  onChange={(e) => setAuthor(prev => prev ? ({ ...prev, avatar_url: e.target.value }) : prev)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-danger" onClick={deleteAuthor} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}


