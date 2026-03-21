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

const UPLOAD_SECTIONS = [
  { key: 'entry', label: 'Start', icon: '📄' },
  { key: 'domains', label: 'Domains & Names', icon: '🌐' },
  { key: 'launch', label: 'Launch', icon: '🚀' },
]

const SCRATCH_SECTIONS = [
  { key: 'niche', label: 'Network Setup', icon: '🌐' },
  { key: 'review', label: 'Review Sites', icon: '✏️' },
  { key: 'research', label: 'Brand Research', icon: '🔬' },
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

interface NicheBrand {
  brand_voice: string
  target_market: string
  brand_blurb: string
  seed_keywords: string
  image_style: Record<string, string> | null
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

  /* ── translation ── */
  const [translationEnabled, setTranslationEnabled] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [articlesPerDay, setArticlesPerDay] = useState(5)

  const LANGUAGE_OPTIONS = [
    { code: 'es', label: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', label: 'French', flag: '🇫🇷' },
    { code: 'de', label: 'German', flag: '🇩🇪' },
    { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
    { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', label: 'Korean', flag: '🇰🇷' },
    { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
    { code: 'it', label: 'Italian', flag: '🇮🇹' },
    { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
    { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
    { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  ]

  /* ── brand research state (per-niche, keyed by index) ── */
  const [nicheResearch, setNicheResearch] = useState<Record<number, any>>({})
  const [nicheBrands, setNicheBrands] = useState<Record<number, NicheBrand>>({})
  const [researchingAll, setResearchingAll] = useState(false)
  const [researchProgress, setResearchProgress] = useState('')

  /* ── UI state ── */
  const [activeSection, setActiveSection] = useState(0)
  const [phase, setPhase] = useState<Phase>('planning')
  const [expanding, setExpanding] = useState(false)
  const [error, setError] = useState('')
  const [, setNetworkId] = useState('')
  const [memberStatuses, setMemberStatuses] = useState<MemberStatus[]>([])
  const [launching, setLaunching] = useState(false)

  // Upload path state
  const [entryMode, setEntryMode] = useState<'choose' | 'upload' | 'scratch'>('choose')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadSiteCount, setUploadSiteCount] = useState(5)
  const [parseJobId, setParseJobId] = useState<string | null>(null)
  const [parseStatus, setParseStatus] = useState<string>('')
  const [parsedSites, setParsedSites] = useState<any[]>([])

  // Dynamic sections
  const activeSections = entryMode === 'upload' ? UPLOAD_SECTIONS
    : entryMode === 'scratch' ? SCRATCH_SECTIONS
    : UPLOAD_SECTIONS

  const pollRef = useRef<NodeJS.Timeout | null>(null)

  /* ── upload path: parse brand guide PDF ── */
  const handleUploadParse = async () => {
    if (!uploadFile) return
    setParseStatus('Uploading...')
    setError('')
    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('siteCount', String(uploadSiteCount))
    try {
      const res = await fetch('/api/admin/parse-brand-guide', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setParseJobId(data.jobId)
      pollParseJob(data.jobId)
    } catch (err: any) {
      setError(err.message)
      setParseStatus('')
    }
  }

  const pollParseJob = async (jobId: string) => {
    const maxPoll = 180_000
    const start = Date.now()
    let interval = 2000
    while (Date.now() - start < maxPoll) {
      await new Promise(r => setTimeout(r, interval))
      interval = Math.min(interval * 1.3, 5000)
      try {
        const res = await fetch(`/api/admin/parse-brand-guide?jobId=${jobId}`)
        const job = await res.json()
        if (job.status === 'parsing') setParseStatus('Parsing document...')
        else if (job.status === 'extracting') setParseStatus('Extracting brand data...')
        else if (job.status === 'synthesizing') setParseStatus('Synthesizing research context...')
        else if (job.status === 'done' && job.result) {
          setParseStatus('')
          populateFromParsed(job.result)
          return
        } else if (job.status === 'error') {
          throw new Error(job.error || 'Parse failed')
        }
      } catch (err: any) {
        setError(err.message)
        setParseStatus('')
        return
      }
    }
    setError('Parse timed out after 3 minutes. Try again or use Build from Scratch.')
    setParseStatus('')
  }

  const populateFromParsed = (sites: any[]) => {
    setParsedSites(sites)
    const mapped: NicheSuggestion[] = sites.map((s: any) => ({
      niche: s.niche,
      description: s.brand_personality || '',
      suggested_brand_name: s.placeholder_name,
      suggested_username: s.placeholder_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      enabled: true,
      domain: '',
      domainSuggestions: [],
      loadingDomains: false,
    }))
    setNiches(mapped)
    const brands: Record<number, any> = {}
    const research: Record<number, any> = {}
    sites.forEach((s: any, i: number) => {
      brands[i] = {
        brand_voice: s.brand_voice,
        target_market: s.ica_profile?.persona_name
          ? `${s.ica_profile.persona_name} (${s.ica_profile.age_range}, ${s.ica_profile.income})`
          : '',
        brand_blurb: s.tagline || '',
        seed_keywords: s.content_types?.join(', ') || '',
        image_style: {
          visual_style: s.style_guide?.visual_mood || '',
          color_palette: s.style_guide?.primary_color || '',
          mood: s.style_guide?.imagery_style || '',
        },
      }
      if (s.research_context) research[i] = s.research_context
    })
    setNicheBrands(brands)
    setNicheResearch(research)
    if (sites[0]?.pod_name) setNetworkName(sites[0].pod_name)
    if (sites[0]?.pod_theme) setSeedNiche(sites[0].pod_theme)
    setActiveSection(1)
  }

  /* ── expand network (AI niche expansion) ── */
  const expandNetwork = async () => {
    if (!seedNiche.trim()) return
    setExpanding(true)
    setError('')
    try {
      const data = await dcPost('/api/strategy/expand-network', {
        seed_niche: seedNiche.trim(),
        count: 6,
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

  /* ── research all niches (batched 3 at a time) ── */
  const researchAllNiches = async () => {
    const enabled = niches.map((n, i) => ({ ...n, _idx: i })).filter((n) => n.enabled)
    if (enabled.length === 0) return

    setResearchingAll(true)
    setError('')
    setResearchProgress(`Researching 0/${enabled.length} niches...`)

    let completed = 0

    // Process in batches of 3
    for (let batch = 0; batch < enabled.length; batch += 3) {
      const chunk = enabled.slice(batch, batch + 3)
      const results = await Promise.allSettled(
        chunk.map(async (n) => {
          // Phase 1: Deep niche research
          const resData = await dcPost('/api/strategy/deep-niche-research', {
            niche: n.niche,
            brand_name: n.suggested_brand_name,
          })
          if (!resData.success) throw new Error(resData.error || 'Research failed')

          setNicheResearch((prev) => ({ ...prev, [n._idx]: resData.research }))

          // Phase 2: Generate brand fields using research (parallel)
          const rc = resData.research
          const [voice, market, blurb, keywords, style] = await Promise.allSettled([
            dcPost('/api/strategy/enhance-brand', {
              section: 'brand_voice',
              current_content: 'Generate brand voice for this niche.',
              niche: n.niche,
              research_context: rc,
            }),
            dcPost('/api/strategy/enhance-brand', {
              section: 'target_market',
              current_content: 'Generate target market description for this niche.',
              niche: n.niche,
              research_context: rc,
            }),
            dcPost('/api/strategy/enhance-brand', {
              section: 'brand_blurb',
              current_content: 'Generate brand blurb for this niche.',
              niche: n.niche,
              research_context: rc,
            }),
            dcPost('/api/strategy/enhance-brand', {
              section: 'seed_keywords',
              current_content: 'Generate seed keywords for this niche.',
              niche: n.niche,
              research_context: rc,
            }),
            dcPost('/api/strategy/enhance-brand', {
              section: 'image_style',
              current_content: {
                visual_style: '', color_palette: '', mood_and_atmosphere: '',
                composition_style: '', lighting_preferences: '', image_type_preferences: '',
                subject_guidelines: '', preferred_elements: '', prohibited_elements: '',
                ai_prompt_instructions: '',
              },
              niche: n.niche,
              research_context: rc,
            }),
          ])

          const brand: NicheBrand = {
            brand_voice: voice.status === 'fulfilled' ? voice.value.brand_voice || '' : '',
            target_market: market.status === 'fulfilled' ? market.value.target_market || '' : '',
            brand_blurb: blurb.status === 'fulfilled' ? blurb.value.brand_blurb || '' : '',
            seed_keywords: keywords.status === 'fulfilled' ? keywords.value.seed_keywords || '' : '',
            image_style: style.status === 'fulfilled' ? style.value.image_style || null : null,
          }

          setNicheBrands((prev) => ({ ...prev, [n._idx]: brand }))
          completed++
          setResearchProgress(`Researching ${completed}/${enabled.length} niches...`)
          return { idx: n._idx, research: resData.research, brand }
        })
      )

      // Log any failures
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.warn(`Research failed for niche ${chunk[i].niche}:`, r.reason)
        }
      })
    }

    setResearchProgress('')
    setResearchingAll(false)
  }

  /* ── update a brand field for a specific niche ── */
  const updateNicheBrand = (idx: number, field: keyof NicheBrand, value: string) => {
    setNicheBrands((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], [field]: value },
    }))
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
      const members = enabled.map((n) => {
        // Find original index for brand data lookup
        const origIdx = niches.indexOf(n)
        const brand = nicheBrands[origIdx]
        const research = nicheResearch[origIdx]
        return {
          username: n.suggested_username,
          display_name: n.suggested_brand_name,
          niche: n.niche,
          domain: n.domain || undefined,
          role: origIdx === 0 ? ('seed' as const) : ('satellite' as const),
          contact_email: contactEmail.trim(),
          brand_voice: brand?.brand_voice || undefined,
          target_market: brand?.target_market || undefined,
          blurb: brand?.brand_blurb || undefined,
          seed_keywords: brand?.seed_keywords
            ? brand.seed_keywords.split(',').map((s: string) => s.trim()).filter(Boolean)
            : undefined,
          image_style: brand?.image_style || undefined,
          research_context: research || undefined,
          // Brand guide upload fields
          ...(parsedSites[origIdx]?.ica_profile && { ica_profile: parsedSites[origIdx].ica_profile }),
          ...(parsedSites[origIdx]?.style_guide && { style_guide: parsedSites[origIdx].style_guide }),
          ...(parsedSites[origIdx]?.affiliate_products?.length && {
            approved_products: parsedSites[origIdx].affiliate_products.map((p: any) => ({
              name: p.name,
              category: p.category,
              product_type: p.product_type || 'saas',
              has_affiliate_program: true,
              metadata: { commission: p.commission, recurring: p.recurring, cookie_duration: p.cookie_duration },
            }))
          }),
          ...(entryMode === 'upload' && { is_affiliate: true }),
        }
      })

      const res = await fetch('/api/admin/provision-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network_name: networkName.trim() || `${seedNiche} Network`,
          seed_niche: seedNiche.trim(),
          members,
          fly_region: flyRegion,
          setup_google_analytics: true,
          setup_google_tag_manager: true,
          setup_search_console: true,
          languages: translationEnabled && selectedLanguages.length > 0 ? selectedLanguages : undefined,
          articles_per_day: articlesPerDay,
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
          {activeSections.map((s, i) => (
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
            <h2>{activeSections[activeSection]?.label || 'Network'}</h2>
            <p>
              {phase === 'provisioning'
                ? 'Provisioning sites...'
                : phase === 'done'
                  ? 'Network provisioned!'
                  : 'Configure your site network'}
            </p>
          </div>
        </div>

        <div className="dc-scroll-area">
        <div className="dc-section-wrap">
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

        {/* ─── SECTION: Entry (upload or choose) ─── */}
        {activeSections[activeSection]?.key === 'entry' && phase === 'planning' && (
          <div className="space-y-6">
            {entryMode === 'choose' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <button onClick={() => setEntryMode('upload')} className="dc-card text-left" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s, border-color 0.2s', border: '2px solid transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(99,102,241,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                  <div className="dc-card-body" style={{ padding: '28px 24px' }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>📄</div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Upload Brand Guide</h3>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Parse a PDF from your AI tool to extract sites, brand data, and products automatically.</p>
                  </div>
                </button>
                <button onClick={() => { setEntryMode('scratch'); setActiveSection(0) }} className="dc-card text-left" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s, border-color 0.2s', border: '2px solid transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#22c55e'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(34,197,94,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                  <div className="dc-card-body" style={{ padding: '28px 24px' }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>🧠</div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Build from Scratch</h3>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Enter a seed niche and generate everything with AI.</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Number of sites</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">1 Hub +</span>
                    <select value={uploadSiteCount - 1} onChange={e => setUploadSiteCount(parseInt(e.target.value) + 1)} className="border rounded px-2 py-1">
                      {[1,2,3,4,5,6,7].map(n => (<option key={n} value={n}>{n} sub-sites</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brand Guide PDF</label>
                  <div className="dc-card" style={{ border: '2px dashed #cbd5e1', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1'}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') setUploadFile(f) }}
                    onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf'; input.onchange = () => { if (input.files?.[0]) setUploadFile(input.files[0]) }; input.click() }}>
                    <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                      {uploadFile ? (
                        <p style={{ fontSize: 13 }}>📄 {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)</p>
                      ) : (
                        <p style={{ color: '#94a3b8', fontSize: 13 }}>Drag & drop PDF or click to browse</p>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={handleUploadParse} disabled={!uploadFile || !!parseStatus} className="dc-btn dc-btn-ai" style={{ width: '100%', justifyContent: 'center' }}>
                  {parseStatus || 'Parse Brand Guide'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── SECTION 0: Seed Niche ONLY ─── */}
        {activeSections[activeSection]?.key === 'niche' && phase === 'planning' && (
          <>
            <div className="dc-card">
              <div className="dc-card-header">
                <div>
                  <h3>Seed Niche</h3>
                  <p>Enter your primary niche — AI will suggest related niches for your network</p>
                </div>
              </div>
              <div className="dc-card-body">
                <div className="dc-field">
                  <label>Seed Niche <span className="dc-required">*</span></label>
                  <input
                    type="text"
                    value={seedNiche}
                    onChange={(e) => setSeedNiche(e.target.value)}
                    placeholder="e.g. natural skincare, home fitness, personal finance"
                    className="dc-input-hero"
                    autoFocus
                  />
                  <span className="dc-hint">AI will expand this into 6 related niche sites, each with its own brand and content strategy.</span>
                </div>

                {seedNiche && (
                  <div className="dc-ai-bar">
                    <div className="dc-ai-bar-info">
                      <h3>AI Network Expansion</h3>
                      <p>Discovers related niches and generates brand names for each site.</p>
                    </div>
                    <button
                      className="dc-btn dc-btn-ai"
                      onClick={expandNetwork}
                      disabled={expanding || !seedNiche.trim()}
                    >
                      {expanding ? <><span className="dc-spinner" /> Expanding...</> : 'Expand Network'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ─── SECTION 1: Review Sites / Domains ─── */}
        {(activeSections[activeSection]?.key === 'review' || activeSections[activeSection]?.key === 'domains') && phase === 'planning' && (
          <>
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
                    {entryMode === 'upload' && (
                      <div className="flex items-center gap-4 mb-2" style={{ padding: '8px 16px 0' }}>
                        <label className="flex items-center gap-1 text-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                          <input type="radio" name="hub-site" checked={idx === 0}
                            onChange={() => { const reordered = [...niches]; const [sel] = reordered.splice(idx, 1); reordered.unshift(sel); setNiches(reordered) }} />
                          Hub
                        </label>
                        {parsedSites[idx]?.placeholder_name && (
                          <span className="text-xs text-gray-400" style={{ fontSize: 11, color: '#94a3b8' }}>(from PDF: {parsedSites[idx].placeholder_name})</span>
                        )}
                      </div>
                    )}
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
                              type="text"
                              value={n.suggested_brand_name}
                              onChange={(e) => updateNiche(idx, 'suggested_brand_name', e.target.value)}
                            />
                          </div>
                          <div className="dc-field">
                            <label>Username</label>
                            <input
                              type="text"
                              value={n.suggested_username}
                              onChange={(e) => updateNiche(idx, 'suggested_username', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="dc-field" style={{ marginTop: 12 }}>
                          <label>Niche</label>
                          <input
                            type="text"
                            value={n.niche}
                            onChange={(e) => updateNiche(idx, 'niche', e.target.value)}
                          />
                        </div>

                        {/* Domain */}
                        <div className="dc-field" style={{ marginTop: 12 }}>
                          <label>Domain</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              type="text"
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
          </>
        )}

        {/* ─── SECTION 2: Brand Research ─── */}
        {activeSections[activeSection]?.key === 'research' && phase === 'planning' && (
          <>
            {niches.length === 0 ? (
              <div className="dc-card">
                <div className="dc-card-body" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <p>No niches expanded yet. Go to Network Setup first.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="dc-ai-bar">
                  <div className="dc-ai-bar-info">
                    <h3>Brand Research</h3>
                    <p>
                      Deep market research + AI brand generation for each niche.
                      This produces rich brand guidelines, target market, and seed keywords.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="dc-btn dc-btn-ai"
                    onClick={researchAllNiches}
                    disabled={researchingAll || enabledNiches.length === 0}
                  >
                    {researchingAll
                      ? researchProgress || 'Researching...'
                      : Object.keys(nicheBrands).length > 0
                        ? 'Re-Research All Niches'
                        : `Research ${enabledNiches.length} Niches`}
                  </button>
                </div>

                {niches.map((n, idx) => {
                  if (!n.enabled) return null
                  const brand = nicheBrands[idx]
                  const research = nicheResearch[idx]
                  const hasData = !!brand

                  return (
                    <div key={idx} className="dc-card">
                      <div className="dc-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: '50%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                            background: hasData ? '#dcfce7' : '#f1f5f9',
                            color: hasData ? '#16a34a' : '#94a3b8',
                          }}>
                            {hasData ? '✓' : '○'}
                          </span>
                          <div>
                            <h3>{n.suggested_brand_name}</h3>
                            <p>{n.niche}</p>
                          </div>
                        </div>
                      </div>

                      {hasData && (
                        <div className="dc-card-body">
                          {/* Research summary */}
                          {research && (
                            <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
                              <div style={{ fontWeight: 600, marginBottom: 6, color: '#334155' }}>Research Summary</div>
                              <p style={{ color: '#475569', marginBottom: 6 }}>{research.market_overview?.slice(0, 200)}...</p>
                              {research.content_pillars && (
                                <div style={{ marginTop: 8 }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', marginBottom: 4 }}>Content Pillars</div>
                                  {research.content_pillars.slice(0, 7).map((p: any, pi: number) => (
                                    <div key={pi} style={{ marginBottom: 4, fontSize: 12, lineHeight: 1.4 }}>
                                      <span style={{
                                        display: 'inline-block', padding: '1px 6px', borderRadius: 3,
                                        background: p.target_stage === 'TOFU' ? '#dcfce7' : p.target_stage === 'MOFU' ? '#fef3c7' : '#fee2e2',
                                        color: p.target_stage === 'TOFU' ? '#166534' : p.target_stage === 'MOFU' ? '#92400e' : '#991b1b',
                                        fontSize: 10, fontWeight: 600, marginRight: 6,
                                      }}>
                                        {p.target_stage}
                                      </span>
                                      <strong style={{ color: '#1e293b' }}>{p.name || p}</strong>
                                      {p.description && (
                                        <span style={{ color: '#64748b' }}> — {p.description}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Editable brand fields */}
                          <div className="dc-field">
                            <label>Brand Blurb</label>
                            <textarea
                              value={brand.brand_blurb}
                              onChange={(e) => updateNicheBrand(idx, 'brand_blurb', e.target.value)}
                              placeholder="Brand blurb"
                              rows={3}
                              style={{ width: '100%', resize: 'vertical' }}
                            />
                          </div>

                          <div className="dc-field" style={{ marginTop: 12 }}>
                            <label>Target Market</label>
                            <textarea
                              value={brand.target_market}
                              onChange={(e) => updateNicheBrand(idx, 'target_market', e.target.value)}
                              placeholder="Target market description"
                              rows={3}
                              style={{ width: '100%', resize: 'vertical' }}
                            />
                          </div>

                          <div className="dc-field" style={{ marginTop: 12 }}>
                            <label>Brand Voice</label>
                            <textarea
                              value={brand.brand_voice}
                              onChange={(e) => updateNicheBrand(idx, 'brand_voice', e.target.value)}
                              placeholder="Brand voice description"
                              rows={3}
                              style={{ width: '100%', resize: 'vertical' }}
                            />
                          </div>

                          <div className="dc-field" style={{ marginTop: 12 }}>
                            <label>Seed Keywords ({brand.seed_keywords ? brand.seed_keywords.split(',').length : 0} phrases)</label>
                            <textarea
                              value={brand.seed_keywords}
                              onChange={(e) => updateNicheBrand(idx, 'seed_keywords', e.target.value)}
                              placeholder="Comma-separated keyword phrases"
                              rows={3}
                              style={{ width: '100%', resize: 'vertical', fontSize: 12 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}

        {/* ─── SECTION 3: Launch ─── */}
        {activeSections[activeSection]?.key === 'launch' && phase === 'planning' && (
          <>
            {/* Network Details (moved from step 0) */}
            <div className="dc-card">
              <div className="dc-card-header"><h3>Network Details</h3></div>
              <div className="dc-card-body">
                <div className="dc-field">
                  <label>Network Name <span className="dc-required">*</span></label>
                  <input type="text" value={networkName}
                    onChange={(e) => setNetworkName(e.target.value)}
                    placeholder="e.g. Wellness Circle" />
                </div>
                <div className="dc-field" style={{ marginTop: 12 }}>
                  <label>Contact Email <span className="dc-required">*</span></label>
                  <input type="email" value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="admin@example.com" />
                </div>
              </div>
            </div>

            {/* Deployment Settings */}
            <div className="dc-card">
              <div className="dc-card-header"><h3>Deployment Settings</h3></div>
              <div className="dc-card-body">
                <div className="dc-field">
                  <label>Fly.io Region</label>
                  <select value={flyRegion} onChange={(e) => setFlyRegion(e.target.value)}>
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Content Cadence */}
            <div className="dc-card">
              <div className="dc-card-header"><h3>Content Cadence</h3></div>
              <div className="dc-card-body">
                <div className="dc-field">
                  <label>Articles per Day (per site)</label>
                  <input type="number" min={1} max={20} value={articlesPerDay}
                    onChange={(e) => setArticlesPerDay(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} />
                  <span className="dc-hint">How many articles to schedule per day for each site (default: 5).</span>
                </div>
              </div>
            </div>

            {/* Translation */}
            <div className="dc-card">
              <div className="dc-card-header"><h3>Translation</h3></div>
              <div className="dc-card-body">
                <label className="dc-toggle">
                  <input type="checkbox" checked={translationEnabled}
                    onChange={(e) => setTranslationEnabled(e.target.checked)} />
                  <span>Enable multi-language translation for all sites</span>
                </label>
                {translationEnabled && (
                  <div className="dc-language-grid">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button key={lang.code} type="button"
                        className={`dc-chip ${selectedLanguages.includes(lang.code) ? 'dc-chip-selected' : ''}`}
                        onClick={() => {
                          setSelectedLanguages((prev) =>
                            prev.includes(lang.code)
                              ? prev.filter((c) => c !== lang.code)
                              : [...prev, lang.code]
                          )
                        }}>
                        {lang.flag} {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Launch Summary */}
            <div className="dc-card">
              <div className="dc-card-header"><h3>Launch Summary</h3></div>
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
                      ? 'Contact email is required'
                      : !networkName.trim()
                        ? 'Network name is required'
                        : enabledNiches.length === 0
                          ? 'Enable at least one niche'
                          : ''}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* ─── PROVISIONING / DONE ─── */}
        {(phase === 'provisioning' || phase === 'done') && (
          <>
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
                    setNicheResearch({})
                    setNicheBrands({})
                    setEntryMode('choose')
                    setUploadFile(null)
                    setParseJobId(null)
                    setParseStatus('')
                    setParsedSites([])
                  }}
                >
                  Create Another Network
                </button>
              </div>
            )}
          </>
        )}

        {/* Step navigation */}
        {phase === 'planning' && (
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
              {activeSection < activeSections.length - 1 && (
                <button
                  className="dc-btn dc-btn-primary"
                  onClick={() => setActiveSection(activeSection + 1)}
                  disabled={
                    (activeSections[activeSection]?.key === 'niche' && niches.length === 0) ||
                    (activeSections[activeSection]?.key === 'entry' && entryMode === 'choose')
                  }
                >
                  Next →
                </button>
              )}
            </div>
        )}
        </div>
        </div>{/* end dc-scroll-area */}
      </main>
    </div>
  )
}
