'use client'

import { useState } from 'react'
import type { ClientApiKey } from '@/lib/draft-types'

interface Props {
  initialKeys: ClientApiKey[]
}

export default function ApiKeyManager({ initialKeys }: Props) {
  const [keys, setKeys] = useState<ClientApiKey[]>(initialKeys)
  const [showForm, setShowForm] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [formData, setFormData] = useState({ clientName: '', contactEmail: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [provisionSecret, setProvisionSecret] = useState('')

  async function handleGenerate() {
    if (!formData.clientName.trim() || !formData.contactEmail.trim()) {
      setError('Client name and email are required')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provision-secret': provisionSecret,
        },
        body: JSON.stringify({
          client_name: formData.clientName.trim(),
          contact_email: formData.contactEmail.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate key')
        return
      }

      setNewKey(data.key)
      setShowForm(false)
      setFormData({ clientName: '', contactEmail: '' })

      // Refresh key list
      const newKeyRecord: ClientApiKey = {
        id: data.id,
        client_name: formData.clientName.trim(),
        contact_email: formData.contactEmail.trim(),
        key_prefix: data.key.substring(0, 12),
        created_at: new Date().toISOString(),
        revoked_at: null,
      }
      setKeys(prev => [newKeyRecord, ...prev])
    } catch {
      setError('Network error generating key')
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-provision-secret': provisionSecret,
        },
        body: JSON.stringify({ key_id: keyId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to revoke key')
        return
      }

      setKeys(prev =>
        prev.map(k => k.id === keyId ? { ...k, revoked_at: new Date().toISOString() } : k)
      )
    } catch {
      setError('Network error revoking key')
    }
  }

  return (
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: '40px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Provision Secret */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
          Provision Secret
        </label>
        <input
          type="password"
          value={provisionSecret}
          onChange={e => setProvisionSecret(e.target.value)}
          placeholder="Enter provision secret..."
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            boxSizing: 'border-box' as const,
          }}
        />
      </div>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>API Keys</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
            Manage API keys for client AI agents
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setNewKey(null); setError('') }}
          style={{
            padding: '8px 16px',
            background: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancel' : 'Generate Key'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 14px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 6,
          color: '#dc2626',
          fontSize: 14,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Generate Form */}
      {showForm && (
        <div style={{
          padding: 20,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          marginBottom: 20,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Generate New API Key</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                Client Name
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="e.g. Acme Agency"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="e.g. dev@acme.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: '8px 20px',
              background: loading ? '#94a3b8' : '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      )}

      {/* New Key Warning */}
      {newKey && (
        <div style={{
          padding: 16,
          background: '#fffbeb',
          border: '1px solid #fbbf24',
          borderRadius: 8,
          marginBottom: 20,
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 14, color: '#92400e' }}>
            Copy this key now — it cannot be shown again.
          </p>
          <code style={{
            display: 'block',
            padding: '10px 14px',
            background: '#1e293b',
            color: '#e2e8f0',
            borderRadius: 6,
            fontSize: 13,
            fontFamily: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
            wordBreak: 'break-all',
            marginBottom: 12,
            userSelect: 'all',
          }}>
            {newKey}
          </code>
          <button
            onClick={() => setNewKey(null)}
            style={{
              padding: '6px 14px',
              background: '#f59e0b',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            I&apos;ve copied this key
          </button>
        </div>
      )}

      {/* Keys Table */}
      <div style={{
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
        }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={thStyle}>Client Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Key Prefix</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                  No API keys yet. Generate one to get started.
                </td>
              </tr>
            )}
            {keys.map(key => (
              <tr key={key.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>{key.client_name}</td>
                <td style={tdStyle}>{key.contact_email}</td>
                <td style={tdStyle}>
                  <code style={{
                    padding: '2px 6px',
                    background: '#f1f5f9',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'monospace',
                  }}>
                    {key.key_prefix}...
                  </code>
                </td>
                <td style={tdStyle}>
                  {key.revoked_at ? (
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      Revoked
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: '#f0fdf4',
                      color: '#16a34a',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      Active
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  {new Date(key.created_at).toLocaleDateString()}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {!key.revoked_at && (
                    <button
                      onClick={() => handleRevoke(key.id)}
                      style={{
                        padding: '4px 10px',
                        background: 'transparent',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 13,
  color: '#64748b',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
}
