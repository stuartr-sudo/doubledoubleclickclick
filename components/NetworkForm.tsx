'use client'

import { useState, useRef, useCallback } from 'react'

/* ───────── constants ───────── */
const REGIONS = [
  { value: 'syd', label: 'Sydney (syd)' },
  { value: 'lax', label: 'Los Angeles (lax)' },
  { value: 'lhr', label: 'London (lhr)' },
  { value: 'iad', label: 'Virginia (iad)' },
  { value: 'nrt', label: 'Tokyo (nrt)' },
  { value: 'sin', label: 'Singapore (sin)' },
]

const SECTIONS = [
  { key: 'niche', label: 'Network Setup', icon: '🌐' },
  { key: 'review', label: 'Review Sites', icon: '✏️' },
  { key: 'launch', label: 'Launch', icon: '🚀' },
]

/* ───────── types ───────── */
interface NicheSuggestion {
  niche: string
  description: string
  suggested_brand_name: string
  suggested_username: string
  enabled: boolean
  domain: string
  domainSuggestions: DomainSuggestion[]
  loadingDomains: boolean
}

interface DomainSuggestion {
  domain: string
  available: boolean
  price: number
  currency: string
  yearlyPrice?: { currencyCode: string; units: string; nanos?: number }
  domainNotices?: string[]
}

interface MemberStatus {
  username: string
  success?: boolean
  status: string
  provisionResult?: any
}

type Phase = 'planning' | 'provisioning' | 'done'

/* ───────── helper: call DC via proxy ───────── */
async function dcPost(endpoint: string, body: Record<string, any> = {}) {
  const res = await fetch('/api/admin/dc-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, ...body }),
  })
  return res.json()
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function NetworkForm() {
  /* ── network setup ── */
  const [seedNiche, setSeedNiche] = useState('')
  const [networkName, setNetworkName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [niches, setNiches] = useState<NicheSuggestion[]>([])

  /* ── global settings ── */
  const [flyRegion, setFlyRegion] = useState('syd')
  const [setupGA, setSetupGA] = useState(true)
  const [setupGTM, setSetupGTM] = useState(true)
  const [setupGSC, setSetupGSC] = useState(true)

  /* ── UI state ── */
  const [activeSection, setActiveSection] = useState(0)
  const [phase, setPhase] = useState<Phase>('planning')
  const [expanding, setExpanding] = useState(false)
  const [error, setError] = useState('')
  const [, setNetworkId] = useState('')
  const [memberStatuses, setMemberStatuses] = useState<MemberStatus[]>([])
  const [launching, setLaunching] = useState(false)

  const pollRef = useRef<NodeJS.Timeout | null>(null)

  /* ── expand network (AI niche expansion) ── */
  const expandNetwork = async () => {
    if (!seedNiche.trim()) return
    setExpanding(true)
    setError('')
    try {
      const data = await dcPost('/api/strategy/expand-network', {
        seed_niche: seedNiche.trim(),
        count: 5,
      })
      if (!data.success) throw new Error(data.error || 'Expansion failed')
      const expanded: NicheSuggestion[] = data.niches.map((n: any) => ({
        ...n,
        enabled: true,
        domain: '',
        domainSuggestions: [],
        loadingDomains: false,
      }))
      setNiches(expanded)
      if (!networkName) {
        setNetworkName(`${seedNiche.trim()} Network`)
      }
      setActiveSection(1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setExpanding(false)
    }
  }

  /* ── toggle niche on/off ── */
  const toggleNiche = (idx: number) => {
    setNiches((prev) => prev.map((n, i) => (i === idx ? { ...n, enabled: !n.enabled } : n)))
  }

  /* ── update niche field ── */
  const updateNiche = (idx: number, field: keyof NicheSuggestion, value: string) => {
    setNiches((prev) => prev.map((n, i) => (i === idx ? { ...n, [field]: value } : n)))
  }

  /* ── fetch domain suggestions for a niche ── */
  const fetchDomains = async (idx: number) => {
    const n = niches[idx]
    if (!n) return
    setNiches((prev) =>
      prev.map((x, i) => (i === idx ? { ...x, loadingDomains: true, domainSuggestions: [] } : x))
    )
    try {
      const res = await fetch('/api/admin/domain-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: n.niche, brand_name: n.suggested_brand_name }),
      })
      const data = await res.json()
      setNiches((prev) =>
        prev.map((x, i) =>
          i === idx
            ? { ...x, loadingDomains: false, domainSuggestions: data.suggestions || [] }
            : x
        )
      )
    } catch {
      setNiches((prev) => prev.map((x, i) => (i === idx ? { ...x, loadingDomains: false } : x)))
    }
  }

  /* ── select a domain for a niche ── */
  const selectDomain = (nicheIdx: number, domain: string) => {
    setNiches((prev) =>
      prev.map((n, i) => (i === nicheIdx ? { ...n, domain } : n))
    )
  }

  /* ── launch network ── */
  const launchNetwork = async () => {
    const enabled = niches.filter((n) => n.enabled)
    if (enabled.length === 0 || !contactEmail.trim()) return

    setLaunching(true)
    setError('')
    setPhase('provisioning')

    // Initialize statuses
    setMemberStatuses(
      enabled.map((n) => ({
        username: n.suggested_username,
        status: 'pending',
      }))
    )

    try {
      const members = enabled.map((n, i) => ({
        username: n.suggested_username,
        display_name: n.suggested_brand_name,
        niche: n.niche,
        domain: n.domain || undefined,
        role: i === 0 ? ('seed' as const) : ('satellite' as const),
        contact_email: contactEmail.trim(),
      }))

      const res = await fetch('/api/admin/provision-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network_name: networkName.trim() || `${seedNiche} Network`,
          seed_niche: seedNiche.trim(),
          members,
          fly_region: flyRegion,
          setup_google_analytics: setupGA,
          setup_google_tag_manager: setupGTM,
          setup_search_console: setupGSC,
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Network provisioning failed')

      setNetworkId(data.network_id)
      setMemberStatuses(
        data.members.map((m: any) => ({
          username: m.username,
          success: m.success,
          status: m.status || (m.success ? 'done' : 'failed'),
        }))
      )

      // Start polling for DC pipeline status
      startPolling(data.network_id)
    } catch (err: any) {
      setError(err.message)
      setPhase('planning')
    } finally {
      setLaunching(false)
    }
  }

  /* ── poll network status ── */
  const startPolling = useCallback((nid: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/provision-network?network_id=${nid}`)
        const data = await res.json()
        if (data.success && data.members) {
          setMemberStatuses(
            data.members.map((m: any) => ({
              username: m.username,
              success: m.provision_status === 'done',
              status: m.provision_status,
              provisionResult: m.provision_result,
            }))
          )
          // Stop polling when all done or failed
          const allDone = data.members.every(
            (m: any) => m.provision_status === 'done' || m.provision_status === 'failed'
          )
          if (allDone) {
            clearInterval(pollRef.current!)
            pollRef.current = null
            setPhase('done')
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 5000)
  }, [])

  /* ── derived state ── */
  const enabledNiches = niches.filter((n) => n.enabled)
  const canLaunch = enabledNiches.length > 0 && contactEmail.trim() && networkName.trim()
  const statusIcons: Record<string, string> = {
    done: '✓',
    completed: '✓',
    provisioning: '●',
    failed: '✗',
    pending: '○',
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="dc-layout">
      {/* ── Sidebar ── */}
      <aside className="dc-sidebar">
        <div className="dc-sidebar-header">
          <h1>Create Network</h1>
          <p>Multi-site provisioning</p>
        </div>
        <nav className="dc-sidebar-nav">
          {SECTIONS.map((s, i) => (
            <button
              key={s.key}
              className={`dc-nav-item ${activeSection === i ? 'dc-nav-active' : ''}`}
              onClick={() => setActiveSection(i)}
              disabled={phase !== 'planning'}
            >
              <span className="dc-nav-icon">{s.icon}</span>
              <span className="dc-nav-label">{s.label}</span>
            </button>
          ))}
        </nav>

        {/* Back to single site */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
          <a href="/admin/provision" className="dc-btn dc-btn-ghost" style={{ fontSize: 13, width: '100%', justifyContent: 'center' }}>
            ← Single Site Provision
          </a>
        </div>

        {/* Pipeline progress during provisioning */}
        {phase !== 'planning' && memberStatuses.length > 0 && (
          <div className="dc-sidebar-progress">
            <h3>Network Sites</h3>
            <div className="dc-phase-list">
              {memberStatuses.map((m) => (
                <div key={m.username} className={`dc-phase dc-phase-${m.status}`}>
                  <span className="dc-phase-icon">{statusIcons[m.status] || '○'}</span>
                  <span>{m.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <main className="dc-main">
        <div className="dc-topbar">
          <div>
            <h2>{SECTIONS[activeSection]?.label || 'Network'}</h2>
            <p>
              {phase === 'provisioning'
                ? 'Provisioning sites...'
                : phase === 'done'
                  ? 'Network provisioned!'
                  : 'Configure your site network'}
            </p>
          </div>
        </div>

        {error && (
          <div className="dc-alert dc-alert-error">
            <span className="dc-alert-icon">!</span>
            <div>
              <div className="dc-alert-title">Error</div>
              <div className="dc-alert-text">{error}</div>
            </div>
            <button type="button" className="dc-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* ─── SECTION 0: Network Setup ─── */}
        {activeSection === 0 && phase === 'planning' && (
          <div className="dc-section-wrap">
            <div className="dc-card">
              <div className="dc-card-header">
                <div>
                  <h3>Seed Niche</h3>
                  <p>Enter your primary niche — AI will suggest related niches</p>
                </div>
              </div>
              <div className="dc-card-body">
                <div className="dc-field">
                  <label>Seed Niche *</label>
                  <input
                    value={seedNiche}
                    onChange={(e) => setSeedNiche(e.target.value)}
                    placeholder="e.g. natural skincare, home fitness, personal finance"
                  />
                </div>

                <div className="dc-field" style={{ marginTop: 12 }}>
                  <label>Network Name</label>
                  <input
                    value={networkName}
                    onChange={(e) => setNetworkName(e.target.value)}
                    placeholder="e.g. Wellness Circle"
                  />
                </div>

                <div className="dc-field" style={{ marginTop: 12 }}>
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <button
                    className="dc-btn dc-btn-ai"
                    onClick={expandNetwork}
                    disabled={expanding || !seedNiche.trim()}
                  >
                    {expanding ? 'Expanding...' : 'Expand Network'}
                  </button>
                </div>
              </div>
            </div>

            {/* Global settings */}
            <div className="dc-card">
              <div className="dc-card-header">
                <h3>Global Settings</h3>
              </div>
              <div className="dc-card-body">
                <div className="dc-field">
                  <label>Fly Region</label>
                  <select
                    value={flyRegion}
                    onChange={(e) => setFlyRegion(e.target.value)}
                  >
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dc-toggles">
                  <label className="dc-toggle">
                    <input type="checkbox" checked={setupGA} onChange={() => setSetupGA(!setupGA)} />
                    <span>Google Analytics (GA4)</span>
                  </label>
                  <label className="dc-toggle">
                    <input type="checkbox" checked={setupGTM} onChange={() => setSetupGTM(!setupGTM)} />
                    <span>Google Tag Manager</span>
                  </label>
                  <label className="dc-toggle">
                    <input type="checkbox" checked={setupGSC} onChange={() => setSetupGSC(!setupGSC)} />
                    <span>Google Search Console</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SECTION 1: Review Sites ─── */}
        {activeSection === 1 && phase === 'planning' && (
          <div className="dc-section-wrap">
            {niches.length === 0 ? (
              <div className="dc-card">
                <div className="dc-card-body" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <p>No niches expanded yet. Go to Network Setup and click &ldquo;Expand Network&rdquo;.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="dc-ai-bar">
                  <div className="dc-ai-bar-info">
                    <h3>{niches.length} Niches Suggested</h3>
                    <p>
                      Toggle sites on/off, edit brand names, and search for domains.
                      {enabledNiches.length} site{enabledNiches.length !== 1 ? 's' : ''} will be provisioned.
                    </p>
                  </div>
                </div>

                {niches.map((n, idx) => (
                  <div
                    key={idx}
                    className={`dc-card ${!n.enabled ? '' : ''}`}
                    style={{ opacity: n.enabled ? 1 : 0.5 }}
                  >
                    <div className="dc-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                          type="checkbox"
                          checked={n.enabled}
                          onChange={() => toggleNiche(idx)}
                          style={{ width: 18, height: 18 }}
                        />
                        <div>
                          <h3>{n.suggested_brand_name}</h3>
                          <p>{n.niche}</p>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: idx === 0 ? '#eef2ff' : '#f1f5f9',
                          color: idx === 0 ? '#4f46e5' : '#64748b',
                        }}
                      >
                        {idx === 0 ? 'SEED' : 'SATELLITE'}
                      </span>
                    </div>

                    {n.enabled && (
                      <div className="dc-card-body">
                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                          {n.description}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="dc-field">
                            <label>Brand Name</label>
                            <input
                              value={n.suggested_brand_name}
                              onChange={(e) => updateNiche(idx, 'suggested_brand_name', e.target.value)}
                            />
                          </div>
                          <div className="dc-field">
                            <label>Username</label>
                            <input
                              value={n.suggested_username}
                              onChange={(e) => updateNiche(idx, 'suggested_username', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="dc-field" style={{ marginTop: 12 }}>
                          <label>Niche</label>
                          <input
                            value={n.niche}
                            onChange={(e) => updateNiche(idx, 'niche', e.target.value)}
                          />
                        </div>

                        {/* Domain */}
                        <div className="dc-field" style={{ marginTop: 12 }}>
                          <label>Domain</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={n.domain}
                              onChange={(e) => updateNiche(idx, 'domain', e.target.value)}
                              placeholder="example.com (optional)"
                              style={{ flex: 1 }}
                            />
                            <button
                              className="dc-btn dc-btn-secondary"
                              onClick={() => fetchDomains(idx)}
                              disabled={n.loadingDomains}
                            >
                              {n.loadingDomains ? '...' : 'Suggest'}
                            </button>
                          </div>
                        </div>

                        {/* Domain suggestions */}
                        {n.domainSuggestions.length > 0 && (
                          <div className="dc-domain-suggestions" style={{ marginTop: 8 }}>
                            {n.domainSuggestions.slice(0, 8).map((d) => (
                              <button
                                key={d.domain}
                                className={`dc-domain-chip ${n.domain === d.domain ? 'dc-domain-chip-selected' : ''}`}
                                onClick={() => selectDomain(idx, d.domain)}
                              >
                                <span>{d.domain}</span>
                                <span style={{ fontSize: 11, color: '#64748b' }}>
                                  ${d.price}/yr
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ─── SECTION 2: Launch ─── */}
        {activeSection === 2 && phase === 'planning' && (
          <div className="dc-section-wrap">
            <div className="dc-card">
              <div className="dc-card-header">
                <h3>Launch Network</h3>
              </div>
              <div className="dc-card-body">
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 14, color: '#334155', marginBottom: 8 }}>
                    <strong>{enabledNiches.length}</strong> site{enabledNiches.length !== 1 ? 's' : ''} will be provisioned in parallel:
                  </p>
                  <ul style={{ margin: '8px 0 0 20px', fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
                    {enabledNiches.map((n, i) => (
                      <li key={i}>
                        <strong>{n.suggested_brand_name}</strong> ({n.suggested_username}) — {n.niche}
                        {n.domain && <span style={{ color: '#94a3b8' }}> → {n.domain}</span>}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                  Each site will: seed DB → create Google services → auto-onboard DC → deploy Fly.io → configure domain
                </div>

                <button
                  className="dc-btn dc-btn-launch"
                  onClick={launchNetwork}
                  disabled={!canLaunch || launching}
                >
                  {launching ? 'Launching...' : `Launch ${enabledNiches.length} Sites`}
                </button>

                {!canLaunch && (
                  <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>
                    {!contactEmail.trim()
                      ? 'Contact email is required (set in Network Setup)'
                      : !networkName.trim()
                        ? 'Network name is required'
                        : enabledNiches.length === 0
                          ? 'Enable at least one niche'
                          : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── PROVISIONING / DONE ─── */}
        {(phase === 'provisioning' || phase === 'done') && (
          <div className="dc-section-wrap">
            {phase === 'done' && (
              <div className="dc-ai-bar" style={{ background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)', borderColor: '#86efac' }}>
                <div className="dc-ai-bar-info">
                  <h3 style={{ color: '#14532d' }}>Network Provisioned!</h3>
                  <p style={{ color: '#15803d' }}>
                    All sites have been processed. Check individual results below.
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: 16 }}>
              {memberStatuses.map((m) => {
                const nicheInfo = niches.find((n) => n.suggested_username === m.username)
                const flyApp = m.provisionResult?.fly?.app
                return (
                  <div
                    key={m.username}
                    className={`dc-card ${m.status === 'done' ? 'dc-card-success' : ''}`}
                  >
                    <div className="dc-card-header">
                      <div>
                        <h3>
                          {statusIcons[m.status] || '○'}{' '}
                          {nicheInfo?.suggested_brand_name || m.username}
                        </h3>
                        <p>
                          {m.username} — {nicheInfo?.niche || ''}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            m.status === 'done'
                              ? '#16a34a'
                              : m.status === 'failed'
                                ? '#dc2626'
                                : m.status === 'provisioning'
                                  ? '#2563eb'
                                  : '#94a3b8',
                        }}
                      >
                        {m.status.toUpperCase()}
                      </span>
                    </div>
                    {m.provisionResult && (
                      <div className="dc-card-body" style={{ fontSize: 13 }}>
                        {flyApp && (
                          <p>
                            Fly: <a href={`https://${flyApp}.fly.dev`} target="_blank" rel="noopener" style={{ color: '#4f46e5' }}>{flyApp}.fly.dev</a>
                          </p>
                        )}
                        {m.provisionResult?.notifications?.doubleclicker?.status && (
                          <p>DC: {m.provisionResult.notifications.doubleclicker.status}</p>
                        )}
                        {m.provisionResult?.google?.ga_measurement_id && (
                          <p>GA: {m.provisionResult.google.ga_measurement_id}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {phase === 'done' && (
              <div style={{ marginTop: 16 }}>
                <button
                  className="dc-btn dc-btn-secondary"
                  onClick={() => {
                    setPhase('planning')
                    setActiveSection(0)
                    setNiches([])
                    setSeedNiche('')
                    setNetworkName('')
                    setMemberStatuses([])
                    setNetworkId('')
                  }}
                >
                  Create Another Network
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step navigation */}
        {phase === 'planning' && (
          <div className="dc-section-wrap">
            <div className="dc-step-nav">
              {activeSection > 0 && (
                <button
                  className="dc-btn dc-btn-ghost"
                  onClick={() => setActiveSection(activeSection - 1)}
                >
                  ← Back
                </button>
              )}
              <div className="dc-step-nav-spacer" />
              {activeSection < SECTIONS.length - 1 && (
                <button
                  className="dc-btn dc-btn-primary"
                  onClick={() => setActiveSection(activeSection + 1)}
                  disabled={activeSection === 0 && niches.length === 0}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
