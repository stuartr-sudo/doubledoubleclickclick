'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DraftRecord, SiteConcept, DomainSelection, AffiliateProduct, ICAProfile, StyleGuide } from '@/lib/draft-types'

/* ───────── helpers ───────── */

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatICA(ica: ICAProfile): string {
  const parts: string[] = []
  if (ica.persona_name) parts.push(ica.persona_name)
  if (ica.age_range) parts.push(`Age: ${ica.age_range}`)
  if (ica.pain_points?.length) parts.push(`Pain points: ${ica.pain_points.join(', ')}`)
  if (ica.goals?.length) parts.push(`Goals: ${ica.goals.join(', ')}`)
  return parts.join('. ')
}

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  pending: { background: '#fef3c7', color: '#92400e' },
  reviewed: { background: '#dbeafe', color: '#1e40af' },
  provisioning: { background: '#fed7aa', color: '#9a3412' },
  provisioned: { background: '#d1fae5', color: '#065f46' },
  rejected: { background: '#fee2e2', color: '#991b1b' },
}

/* ───────── sub-components ───────── */

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span style={{
      ...style,
      padding: '2px 10px',
      borderRadius: 9999,
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

function TypeBadge({ type }: { type: 'single' | 'network' }) {
  const isSingle = type === 'single'
  return (
    <span style={{
      background: isSingle ? '#f3f4f6' : '#ede9fe',
      color: isSingle ? '#374151' : '#5b21b6',
      padding: '2px 8px',
      borderRadius: 9999,
      fontSize: 12,
      fontWeight: 500,
    }}>
      {isSingle ? 'Single' : 'Network'}
    </span>
  )
}

function ColorSwatch({ hex, label }: { hex: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 16 }}>
      <span style={{
        display: 'inline-block', width: 24, height: 24, borderRadius: 4,
        backgroundColor: hex, border: '1px solid #d1d5db',
      }} />
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}: {hex}</span>
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 8px' }}>
      {children}
    </h4>
  )
}

/* ───────── site detail renderer ───────── */

function SiteDetail({ site, index }: { site: SiteConcept; index: number }) {
  const ica = site.ica_profile
  const sg = site.style_guide
  const products = site.affiliate_products

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fafafa' }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
        {site.role === 'hub' ? 'Hub' : site.role === 'sub' ? 'Sub' : 'Main'} Site: {site.niche}
      </h3>

      {site.placeholder_name && (
        <p style={{ fontSize: 13, marginBottom: 8 }}><strong>Name:</strong> {site.placeholder_name}</p>
      )}

      {(site.brand_voice || site.tone) && (
        <p style={{ fontSize: 13, marginBottom: 8 }}>
          <strong>Voice:</strong> {site.brand_voice}{site.tone ? ` / Tone: ${site.tone}` : ''}
        </p>
      )}

      {ica && (
        <>
          <SectionLabel>ICA Profile</SectionLabel>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            {ica.persona_name && <p><strong>Persona:</strong> {ica.persona_name}</p>}
            {ica.age_range && <p><strong>Age Range:</strong> {ica.age_range}</p>}
            {ica.income && <p><strong>Income:</strong> {ica.income}</p>}
            {ica.pain_points && ica.pain_points.length > 0 && (
              <div><strong>Pain Points:</strong>
                <ul style={{ margin: '4px 0 4px 20px', padding: 0 }}>
                  {ica.pain_points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            {ica.goals && ica.goals.length > 0 && (
              <div><strong>Goals:</strong>
                <ul style={{ margin: '4px 0 4px 20px', padding: 0 }}>
                  {ica.goals.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}
            {ica.motivations && ica.motivations.length > 0 && (
              <p><strong>Motivations:</strong> {ica.motivations.join(', ')}</p>
            )}
            {ica.buying_behavior && <p><strong>Buying Behavior:</strong> {ica.buying_behavior}</p>}
          </div>
        </>
      )}

      {sg && (
        <>
          <SectionLabel>Style Guide</SectionLabel>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            {(sg.primary_color || sg.accent_color) && (
              <div style={{ marginBottom: 8 }}>
                {sg.primary_color && <ColorSwatch hex={sg.primary_color} label="Primary" />}
                {sg.accent_color && <ColorSwatch hex={sg.accent_color} label="Accent" />}
              </div>
            )}
            {sg.heading_font && <p><strong>Heading Font:</strong> {sg.heading_font}</p>}
            {sg.body_font && <p><strong>Body Font:</strong> {sg.body_font}</p>}
            {sg.visual_mood && <p><strong>Visual Mood:</strong> {sg.visual_mood}</p>}
            {sg.dark_light && <p><strong>Theme:</strong> {sg.dark_light}</p>}
          </div>
        </>
      )}

      {products && products.length > 0 && (
        <>
          <SectionLabel>Affiliate Products</SectionLabel>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '4px 8px' }}>Name</th>
                <th style={{ padding: '4px 8px' }}>Category</th>
                <th style={{ padding: '4px 8px' }}>Type</th>
                <th style={{ padding: '4px 8px' }}>Commission</th>
                <th style={{ padding: '4px 8px' }}>URL</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '4px 8px' }}>{p.name}</td>
                  <td style={{ padding: '4px 8px' }}>{p.category || '-'}</td>
                  <td style={{ padding: '4px 8px' }}>{p.product_type || '-'}</td>
                  <td style={{ padding: '4px 8px' }}>{p.commission || '-'}</td>
                  <td style={{ padding: '4px 8px' }}>
                    {p.url ? <a href={p.url} target="_blank" rel="noopener" style={{ color: '#2563eb' }}>{p.url}</a> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <SectionLabel>Content</SectionLabel>
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        {site.content_types && site.content_types.length > 0 && (
          <p><strong>Types:</strong> {site.content_types.join(', ')}</p>
        )}
        {site.seed_keywords && site.seed_keywords.length > 0 && (
          <p><strong>Seed Keywords:</strong> {site.seed_keywords.join(', ')}</p>
        )}
        {site.articles_per_day && <p><strong>Articles/Day:</strong> {site.articles_per_day}</p>}
        {site.languages && site.languages.length > 0 && (
          <p><strong>Languages:</strong> {site.languages.join(', ')}</p>
        )}
      </div>

      {(site.author_name || site.author_bio) && (
        <>
          <SectionLabel>Author</SectionLabel>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            {site.author_name && <p><strong>Name:</strong> {site.author_name}</p>}
            {site.author_bio && <p><strong>Bio:</strong> {site.author_bio}</p>}
          </div>
        </>
      )}
    </div>
  )
}

/* ───────── main component ───────── */

interface DomainInputs {
  [siteIndex: number]: { username: string; domain: string; purchase: boolean }
}

export default function DraftReview({ initialDrafts }: { initialDrafts: DraftRecord[] }) {
  const [drafts, setDrafts] = useState<DraftRecord[]>(initialDrafts)
  const [selectedDraft, setSelectedDraft] = useState<DraftRecord | null>(null)
  const [domainInputs, setDomainInputs] = useState<DomainInputs>({})
  const [adminNotes, setAdminNotes] = useState('')
  const [provisioning, setProvisioning] = useState(false)
  const [provisionSecret, setProvisionSecret] = useState('')
  const [provisionLogs, setProvisionLogs] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/provision-secret')
      .then(r => r.json())
      .then(d => setProvisionSecret(d.secret || ''))
      .catch(() => {})
  }, [])

  const selectDraft = useCallback((draft: DraftRecord) => {
    if (selectedDraft?.id === draft.id) {
      setSelectedDraft(null)
      return
    }
    setSelectedDraft(draft)
    setAdminNotes(draft.admin_notes || '')
    setProvisionLogs([])
    setError('')

    // Initialize domain inputs from existing selections or defaults
    const inputs: DomainInputs = {}
    draft.sites.forEach((site, i) => {
      const existing = draft.domain_selections?.find(d => d.site_index === i)
      inputs[i] = {
        username: existing?.username || slugify(site.niche),
        domain: existing?.domain || '',
        purchase: existing?.purchase_domain || false,
      }
    })
    setDomainInputs(inputs)
  }, [selectedDraft])

  const addLog = (msg: string) => setProvisionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  /* ───── PATCH helper ───── */
  const patchDraft = async (draftId: string, body: Record<string, unknown>): Promise<DraftRecord | null> => {
    const res = await fetch('/api/admin/drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-provision-secret': provisionSecret },
      body: JSON.stringify({ draft_id: draftId, ...body }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update draft')
    }
    const updated = await res.json() as DraftRecord
    setDrafts(prev => prev.map(d => d.id === updated.id ? updated : d))
    setSelectedDraft(updated)
    return updated
  }

  /* ───── build domain selections array ───── */
  const buildDomainSelections = (): DomainSelection[] => {
    return Object.entries(domainInputs).map(([idx, val]) => ({
      site_index: Number(idx),
      username: val.username,
      domain: val.domain,
      purchase_domain: val.purchase,
    }))
  }

  /* ───── Save & Mark Reviewed ───── */
  const handleSaveReviewed = async () => {
    if (!selectedDraft) return
    setError('')
    try {
      await patchDraft(selectedDraft.id, {
        domain_selections: buildDomainSelections(),
        status: 'reviewed',
        admin_notes: adminNotes,
      })
      addLog('Draft saved and marked as reviewed.')
    } catch (e: any) {
      setError(e.message)
    }
  }

  /* ───── Reject ───── */
  const handleReject = async () => {
    if (!selectedDraft) return
    setError('')
    try {
      await patchDraft(selectedDraft.id, {
        status: 'rejected',
        admin_notes: adminNotes,
      })
      addLog('Draft rejected.')
    } catch (e: any) {
      setError(e.message)
    }
  }

  /* ───── build provision payload for a single site ───── */
  const buildSinglePayload = (site: SiteConcept, domainSel: DomainInputs[number], contactEmail: string) => {
    return {
      username: domainSel.username || slugify(site.niche),
      display_name: site.placeholder_name || site.niche,
      niche: site.niche,
      brand_voice_tone: site.brand_voice,
      target_market: site.ica_profile ? formatICA(site.ica_profile) : '',
      primary_color: site.style_guide?.primary_color || '#1a1a1a',
      accent_color: site.style_guide?.accent_color || '#8b7355',
      heading_font: site.style_guide?.heading_font,
      body_font: site.style_guide?.body_font,
      author_name: site.author_name || 'Editorial Team',
      author_bio: site.author_bio || '',
      contact_email: contactEmail || '',
      domain: domainSel.domain || undefined,
      purchase_domain: domainSel.purchase || false,
      seed_keywords: site.seed_keywords || [],
      approved_products: (site.affiliate_products || []).map(p => ({
        name: p.name,
        category: p.category,
        product_url: p.url,
        product_type: p.product_type,
      })),
      content_types: site.content_types,
      articles_per_day: site.articles_per_day || 3,
      languages: site.languages || [],
      setup_google_analytics: true,
      setup_google_tag_manager: true,
      setup_search_console: true,
      skip_deploy: false,
      skip_pipeline: false,
    }
  }

  /* ───── Provision ───── */
  const handleProvision = async () => {
    if (!selectedDraft || !provisionSecret) return
    setError('')
    setProvisioning(true)
    setProvisionLogs([])

    try {
      // First save domain selections
      addLog('Saving domain selections...')
      await patchDraft(selectedDraft.id, {
        domain_selections: buildDomainSelections(),
        status: 'provisioning',
        admin_notes: adminNotes,
      })

      if (selectedDraft.type === 'single') {
        // Single site provision
        const site = selectedDraft.sites[0]
        const domainSel = domainInputs[0] || { username: slugify(site.niche), domain: '', purchase: false }
        const payload = buildSinglePayload(site, domainSel, selectedDraft.contact_email)

        addLog(`Provisioning single site: ${payload.username}...`)
        const res = await fetch('/api/provision', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provisionSecret}`,
          },
          body: JSON.stringify(payload),
        })

        const result = await res.json()
        if (result.success) {
          addLog('Provisioning completed successfully!')
          await patchDraft(selectedDraft.id, {
            status: 'provisioned',
            provision_results: result,
          })
        } else {
          throw new Error(result.error || 'Provisioning failed')
        }
      } else {
        // Network provision
        const members = selectedDraft.sites.map((site, i) => {
          const domainSel = domainInputs[i] || { username: slugify(site.niche), domain: '', purchase: false }
          return {
            ...buildSinglePayload(site, domainSel, selectedDraft.contact_email),
            role: site.role === 'hub' ? 'seed' as const : 'satellite' as const,
          }
        })

        const hubSite = selectedDraft.sites.find(s => s.role === 'hub')
        const networkPayload = {
          network_name: selectedDraft.network_name || 'Site Network',
          seed_niche: hubSite?.niche || selectedDraft.sites[0]?.niche || '',
          members,
        }

        addLog(`Provisioning network "${networkPayload.network_name}" with ${members.length} sites...`)
        const res = await fetch('/api/admin/provision-network', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provisionSecret}`,
          },
          body: JSON.stringify(networkPayload),
        })

        const result = await res.json()
        if (result.success) {
          addLog('Network provisioning completed!')
          result.members?.forEach((m: { username: string; success: boolean; status: string }) => {
            addLog(`  ${m.username}: ${m.success ? 'done' : 'failed'}`)
          })
          await patchDraft(selectedDraft.id, {
            status: 'provisioned',
            provision_results: result,
          })
        } else {
          throw new Error(result.error || 'Network provisioning failed')
        }
      }
    } catch (e: any) {
      addLog(`ERROR: ${e.message}`)
      setError(e.message)
      // Revert to reviewed on failure
      try {
        await patchDraft(selectedDraft.id, { status: 'reviewed' })
      } catch { /* ignore revert errors */ }
    } finally {
      setProvisioning(false)
    }
  }

  /* ───── domain input updater ───── */
  const updateDomainInput = (siteIndex: number, field: 'username' | 'domain' | 'purchase', value: string | boolean) => {
    setDomainInputs(prev => ({
      ...prev,
      [siteIndex]: { ...prev[siteIndex], [field]: value },
    }))
  }

  /* ───── render ───── */

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6,
    fontSize: 13, width: '100%', background: '#fff',
  }

  const btnBase: React.CSSProperties = {
    padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
    border: 'none', cursor: 'pointer', transition: 'opacity 0.15s',
  }

  return (
    <div>
      {/* ───── Draft list table ───── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px' }}>Client</th>
            <th style={{ padding: '8px 12px' }}>Type</th>
            <th style={{ padding: '8px 12px' }}>Sites</th>
            <th style={{ padding: '8px 12px' }}>Niche(s)</th>
            <th style={{ padding: '8px 12px' }}>Status</th>
            <th style={{ padding: '8px 12px' }}>Submitted</th>
            <th style={{ padding: '8px 12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drafts.length === 0 && (
            <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No drafts yet.</td></tr>
          )}
          {drafts.map(draft => (
            <tr
              key={draft.id}
              onClick={() => selectDraft(draft)}
              style={{
                borderBottom: '1px solid #f3f4f6',
                cursor: 'pointer',
                background: selectedDraft?.id === draft.id ? '#f0f9ff' : undefined,
              }}
            >
              <td style={{ padding: '8px 12px', fontWeight: 500 }}>{draft.client_name}</td>
              <td style={{ padding: '8px 12px' }}><TypeBadge type={draft.type} /></td>
              <td style={{ padding: '8px 12px' }}>{draft.sites.length}</td>
              <td style={{ padding: '8px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {draft.sites.map(s => s.niche).join(', ')}
              </td>
              <td style={{ padding: '8px 12px' }}><StatusBadge status={draft.status} /></td>
              <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{formatDate(draft.created_at)}</td>
              <td style={{ padding: '8px 12px' }}>
                <button
                  style={{ ...btnBase, background: '#f3f4f6', color: '#374151', padding: '4px 10px' }}
                  onClick={(e) => { e.stopPropagation(); selectDraft(draft) }}
                >
                  {selectedDraft?.id === draft.id ? 'Collapse' : 'Review'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ───── Expanded detail view ───── */}
      {selectedDraft && (
        <div style={{ marginTop: 24, border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              {selectedDraft.client_name}
              {selectedDraft.network_name && ` - ${selectedDraft.network_name}`}
            </h2>
            <StatusBadge status={selectedDraft.status} />
          </div>

          {selectedDraft.contact_email && (
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
              <strong>Contact:</strong> {selectedDraft.contact_name ? `${selectedDraft.contact_name} - ` : ''}{selectedDraft.contact_email}
            </p>
          )}
          {selectedDraft.notes && (
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              <strong>Notes:</strong> {selectedDraft.notes}
            </p>
          )}

          {/* Site details */}
          <SectionLabel>Site Details</SectionLabel>
          {selectedDraft.sites.map((site, i) => (
            <SiteDetail key={i} site={site} index={i} />
          ))}

          {/* Domain selection */}
          <SectionLabel>Domain Selection</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {selectedDraft.sites.map((site, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '140px 1fr 1fr auto', gap: 12,
                alignItems: 'center', padding: 12, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Site {i + 1}: {site.niche}
                </span>
                <input
                  style={inputStyle}
                  placeholder="username"
                  value={domainInputs[i]?.username || ''}
                  onChange={e => updateDomainInput(i, 'username', e.target.value)}
                />
                <input
                  style={inputStyle}
                  placeholder="domain (e.g. example.com)"
                  value={domainInputs[i]?.domain || ''}
                  onChange={e => updateDomainInput(i, 'domain', e.target.value)}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={domainInputs[i]?.purchase || false}
                    onChange={e => updateDomainInput(i, 'purchase', e.target.checked)}
                  />
                  Purchase
                </label>
              </div>
            ))}
          </div>

          {/* Admin notes */}
          <SectionLabel>Admin Notes</SectionLabel>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginBottom: 16 }}
            placeholder="Add notes about this draft..."
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
          />

          {/* Provision logs */}
          {provisionLogs.length > 0 && (
            <div style={{
              background: '#1e1e1e', color: '#d4d4d4', borderRadius: 6, padding: 12,
              fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, marginBottom: 16,
              maxHeight: 200, overflowY: 'auto',
            }}>
              {provisionLogs.map((log, i) => (
                <div key={i} style={{ color: log.includes('ERROR') ? '#f87171' : log.includes('completed') || log.includes('done') ? '#4ade80' : '#d4d4d4' }}>
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              style={{ ...btnBase, background: '#2563eb', color: '#fff' }}
              onClick={handleSaveReviewed}
              disabled={provisioning}
            >
              Save &amp; Mark Reviewed
            </button>
            <button
              style={{ ...btnBase, background: '#059669', color: '#fff', opacity: provisioning ? 0.6 : 1 }}
              onClick={handleProvision}
              disabled={provisioning || selectedDraft.status === 'provisioned'}
            >
              {provisioning ? 'Provisioning...' : 'Provision'}
            </button>
            <button
              style={{ ...btnBase, background: '#dc2626', color: '#fff' }}
              onClick={handleReject}
              disabled={provisioning}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
