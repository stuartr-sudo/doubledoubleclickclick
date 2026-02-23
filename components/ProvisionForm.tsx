'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ───────── constants ───────── */
const REGIONS = [
  { value: 'syd', label: 'Sydney (syd)' },
  { value: 'lax', label: 'Los Angeles (lax)' },
  { value: 'lhr', label: 'London (lhr)' },
  { value: 'iad', label: 'Virginia (iad)' },
  { value: 'nrt', label: 'Tokyo (nrt)' },
  { value: 'sin', label: 'Singapore (sin)' },
  { value: 'ams', label: 'Amsterdam (ams)' },
  { value: 'fra', label: 'Frankfurt (fra)' },
]

const VISUAL_STYLES = ['Photorealistic', 'Digital Art', 'Watercolor', 'Oil Painting', 'Minimalist', 'Flat Design', 'Isometric', '3D Render']
const MOODS = ['Professional', 'Warm & Inviting', 'Bold & Energetic', 'Calm & Serene', 'Luxurious', 'Playful', 'Dark & Moody', 'Clean & Modern']
const COMPOSITIONS = ['Rule of Thirds', 'Centered', 'Symmetrical', 'Golden Ratio', 'Leading Lines', 'Negative Space', 'Full Bleed']
const LIGHTINGS = ['Natural Daylight', 'Golden Hour', 'Studio Lighting', 'Soft Diffused', 'Dramatic Chiaroscuro', 'Neon / Colorful', 'Backlit']
const IMAGE_TYPES = ['Photography', 'Illustration', 'Infographic', 'Abstract', 'Lifestyle', 'Product Shot', 'Conceptual']
const SUBJECTS = ['People', 'Technology', 'Nature', 'Architecture', 'Abstract Shapes', 'Data Visualization', 'Workspace']

/* ───────── sidebar nav ───────── */
const SECTIONS = [
  { key: 'brand', label: 'Brand Profile', icon: '🏷️' },
  { key: 'image', label: 'Image Style', icon: '🎨' },
  { key: 'product', label: 'Products & Discovery', icon: '📦' },
  { key: 'deploy', label: 'Deploy & Launch', icon: '🚀' },
]

/* ───────── types ───────── */
interface ImageStyle {
  style_name: string
  visual_style: string
  color_palette: string
  mood_and_atmosphere: string
  composition_style: string
  lighting_preferences: string
  image_type_preferences: string
  subject_guidelines: string
  preferred_elements: string
  prohibited_elements: string
  ai_prompt_instructions: string
}

interface PipelineStep {
  step: string
  label: string
  status: 'completed' | 'running' | 'failed' | 'pending'
  detail?: string
}

interface PipelineStatus {
  status: string
  current_step: string
  current_step_index: number
  total_steps: number
  steps_completed: PipelineStep[]
  errors: string[]
}

type Phase = 'form' | 'provisioning' | 'tracking' | 'done'

interface DomainSuggestion {
  domain: string
  available: boolean
  price: number
  currency: string
}

interface DiscoveredProduct {
  name: string
  url: string
  score: number
  selected: boolean
  description?: string
}

const emptyImageStyle: ImageStyle = {
  style_name: 'Default Style',
  visual_style: '',
  color_palette: '',
  mood_and_atmosphere: '',
  composition_style: '',
  lighting_preferences: '',
  image_type_preferences: '',
  subject_guidelines: '',
  preferred_elements: '',
  prohibited_elements: '',
  ai_prompt_instructions: '',
}

/* ───────── helper: call Doubleclicker via proxy ───────── */
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
export default function ProvisionForm() {
  /* ── brand identity ── */
  const [niche, setNiche] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [domain, setDomain] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [blogApiUrl, setBlogApiUrl] = useState('')

  /* ── brand voice / content ── */
  const [brandVoice, setBrandVoice] = useState('')
  const [targetMarket, setTargetMarket] = useState('')
  const [brandBlurb, setBrandBlurb] = useState('')
  const [seedKeywords, setSeedKeywords] = useState('')

  /* ── author ── */
  const [authorName, setAuthorName] = useState('')
  const [authorBio, setAuthorBio] = useState('')
  const [authorImageUrl, setAuthorImageUrl] = useState('')
  const [authorPageUrl, setAuthorPageUrl] = useState('')
  const [authorSocials, setAuthorSocials] = useState<string[]>([''])

  /* ── image style ── */
  const [imageStyle, setImageStyle] = useState<ImageStyle>({ ...emptyImageStyle })

  /* ── product ── */
  const [productName, setProductName] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [isAffiliate, setIsAffiliate] = useState(false)
  const [affiliateLink, setAffiliateLink] = useState('')
  const [createProductPage, setCreateProductPage] = useState(false)
  const [additionalUrls, setAdditionalUrls] = useState<string[]>([''])
  const [signalUrls, setSignalUrls] = useState<string[]>([''])

  /* ── deploy ── */
  const [primaryColor, setPrimaryColor] = useState('#0F172A')
  const [accentColor, setAccentColor] = useState('#0066ff')
  const [flyRegion, setFlyRegion] = useState('syd')
  const [skipPipeline, setSkipPipeline] = useState(false)
  const [skipDeploy, setSkipDeploy] = useState(false)
  const [stitchEnabled, setStitchEnabled] = useState(false)

  /* ── UI state ── */
  const [activeSection, setActiveSection] = useState(0)
  const [phase, setPhase] = useState<Phase>('form')
  const [provisionResult, setProvisionResult] = useState<any>(null)
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  /* ── domain suggestions ── */
  const [domainSuggestions, setDomainSuggestions] = useState<DomainSuggestion[]>([])
  const [loadingDomains, setLoadingDomains] = useState(false)

  /* ── product discovery ── */
  const [discoveredProducts, setDiscoveredProducts] = useState<DiscoveredProduct[]>([])
  const [loadingDiscovery, setLoadingDiscovery] = useState(false)

  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const seenStepsRef = useRef<Set<string>>(new Set())

  /* ── derived mode ── */
  const hasWebsite = websiteUrl.trim().length > 0

  /* ── auto-fill from domain ── */
  useEffect(() => {
    if (domain && !websiteUrl) setWebsiteUrl(`https://www.${domain}`)
    if (domain && !contactEmail) setContactEmail(`hello@${domain}`)
  }, [domain]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (displayName && !authorName) setAuthorName(`${displayName} Editorial`)
    if (displayName && !authorBio) setAuthorBio(`The ${displayName} editorial team.`)
  }, [displayName]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${ts}] ${msg}`])
  }, [])

  const deriveUsername = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

  const markSaved = (key: string) => {
    setSaved((s) => ({ ...s, [key]: true }))
    setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000)
  }

  /* ═══════════════════════════════════════
     NICHE-AWARE HELPERS
     ═══════════════════════════════════════ */

  const suggestNicheColors = (nicheStr: string): { primary: string; accent: string } => {
    const lower = nicheStr.toLowerCase()
    if (/health|wellness|longevity|supplement|vitamin|organic|natural/.test(lower)) return { primary: '#1a5632', accent: '#c4a35a' }
    if (/tech|ai|software|digital|cyber|code|dev|saas/.test(lower)) return { primary: '#0f172a', accent: '#3b82f6' }
    if (/beauty|fashion|style|luxury|cosmetic|skincare/.test(lower)) return { primary: '#2d1b33', accent: '#d4a574' }
    if (/finance|invest|money|crypto|trading|wealth|banking/.test(lower)) return { primary: '#0c1f3f', accent: '#c4a35a' }
    if (/food|cook|recipe|nutrition|diet|restaurant/.test(lower)) return { primary: '#4a2511', accent: '#e67e22' }
    if (/fitness|gym|sport|athletic|workout|training/.test(lower)) return { primary: '#1a1a2e', accent: '#e94560' }
    if (/travel|adventure|explore|outdoor|tourism/.test(lower)) return { primary: '#1b3a4b', accent: '#4ecdc4' }
    if (/education|learn|study|course|tutor|academic/.test(lower)) return { primary: '#1a237e', accent: '#ff6f00' }
    if (/home|interior|garden|diy|furniture|decor/.test(lower)) return { primary: '#3e2723', accent: '#66bb6a' }
    if (/pet|animal|dog|cat|veterinar/.test(lower)) return { primary: '#33691e', accent: '#ff8f00' }
    if (/gaming|game|esport|stream/.test(lower)) return { primary: '#1a0a2e', accent: '#7c3aed' }
    if (/music|audio|podcast|sound/.test(lower)) return { primary: '#1c1c1c', accent: '#ff4081' }
    return { primary: '#0f172a', accent: '#0066ff' }
  }

  const suggestDomains = async () => {
    if (!niche && !displayName) return
    setLoadingDomains(true)
    setError('')
    try {
      const res = await fetch('/api/admin/domain-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche.trim(), brand_name: displayName.trim() || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setDomainSuggestions(data.suggestions || [])
        if (!data.suggestions?.length) setError('No domains found under $15/year. Try a different niche or brand name.')
      } else {
        setError(data.error || 'Failed to search domains')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingDomains(false)
    }
  }

  const selectDomain = (domainName: string) => {
    setDomain(domainName)
    setWebsiteUrl((prev) => prev || `https://www.${domainName}`)
    setContactEmail((prev) => prev || `hello@${domainName}`)
  }

  const generateFromNiche = async () => {
    if (!niche) return
    setGenerating((g) => ({ ...g, niche_all: true }))
    setError('')
    const brandCtx = `Brand in the "${niche}" niche${displayName ? `, called "${displayName}"` : ''}.`
    try {
      const [voice, market, blurb, keywords, style] = await Promise.allSettled([
        dcPost('/api/strategy/enhance-brand', { section: 'brand_voice', current_content: `${brandCtx} Generate an authoritative, engaging brand voice for this niche.`, niche }),
        dcPost('/api/strategy/enhance-brand', { section: 'target_market', current_content: `${brandCtx} Define the ideal target audience.`, niche }),
        dcPost('/api/strategy/enhance-brand', { section: 'brand_blurb', current_content: `${brandCtx} Write a compelling 2-3 sentence brand description.`, niche }),
        dcPost('/api/strategy/enhance-brand', { section: 'seed_keywords', current_content: `${brandCtx} Generate 10-15 seed keyword phrases for SEO.`, niche }),
        dcPost('/api/strategy/enhance-brand', { section: 'image_style', current_content: { ...emptyImageStyle, style_name: `${niche} Style` }, niche }),
      ])

      if (voice.status === 'fulfilled' && voice.value.brand_voice) setBrandVoice(voice.value.brand_voice)
      if (market.status === 'fulfilled' && market.value.target_market) setTargetMarket(market.value.target_market)
      if (blurb.status === 'fulfilled' && blurb.value.brand_blurb) setBrandBlurb(blurb.value.brand_blurb)
      if (keywords.status === 'fulfilled' && keywords.value.seed_keywords) setSeedKeywords(keywords.value.seed_keywords)
      if (style.status === 'fulfilled' && style.value.image_style) setImageStyle((prev) => ({ ...prev, ...style.value.image_style }))

      // Apply niche-derived colors
      const colors = suggestNicheColors(niche)
      setPrimaryColor(colors.primary)
      setAccentColor(colors.accent)
    } catch (err: any) {
      setError(err.message || 'Failed to generate from niche')
    } finally {
      setGenerating((g) => ({ ...g, niche_all: false }))
    }
  }

  const generateStyleFromNiche = async () => {
    if (!niche) return
    setGenerating((g) => ({ ...g, niche_style: true }))
    setError('')
    const brandCtx = `Brand in the "${niche}" niche${displayName ? `, called "${displayName}"` : ''}.`
    try {
      const data = await dcPost('/api/strategy/enhance-brand', {
        section: 'image_style',
        current_content: { ...emptyImageStyle, style_name: `${niche} Style` },
        niche,
        context: brandCtx,
      })
      if (data.image_style) setImageStyle((prev) => ({ ...prev, ...data.image_style }))
      else setError('No image style returned — DC may need niche support in enhance-brand.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating((g) => ({ ...g, niche_style: false }))
    }
  }

  const generateColorsFromNiche = () => {
    if (!niche) return
    const colors = suggestNicheColors(niche)
    setPrimaryColor(colors.primary)
    setAccentColor(colors.accent)
  }

  const discoverProducts = async () => {
    if (!niche && !username) return
    setLoadingDiscovery(true)
    setError('')
    try {
      const data = await dcPost('/api/strategy/auto-onboard', {
        username: username || 'preview',
        niche,
        discover_only: true,
      })
      if (data.products && Array.isArray(data.products)) {
        setDiscoveredProducts(data.products.map((p: any) => ({
          name: p.name || p.product_name || 'Unknown',
          url: p.url || p.product_url || '',
          score: p.score || p.content_potential || 0,
          description: p.description || p.summary || '',
          selected: true,
        })))
      } else if (data.success === false) {
        setError(data.error || 'Discovery failed — DC may not support discover_only mode yet.')
      } else {
        setError('No products returned. Discovery may take longer — products will be found during provisioning.')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingDiscovery(false)
    }
  }

  const toggleProduct = (idx: number) => {
    setDiscoveredProducts((prev) => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p))
  }

  /* ═══════════════════════════════════════
     AI GENERATION
     ═══════════════════════════════════════ */
  const generateAll = async () => {
    if (!websiteUrl) { setError('Website URL is required for AI generation'); return }
    setGenerating((g) => ({ ...g, all: true }))
    setError('')
    try {
      const data = await dcPost('/api/strategy/auto-brand', {
        product_url: websiteUrl,
        product_name: displayName || undefined,
      })
      if (!data.success) throw new Error(data.error || 'AI generation failed')

      if (data.brand_voice) setBrandVoice(data.brand_voice)
      if (data.target_market) setTargetMarket(data.target_market)
      if (data.brand_blurb) setBrandBlurb(data.brand_blurb)
      if (data.seed_keywords) setSeedKeywords(data.seed_keywords)
      if (data.product_name && !displayName) setDisplayName(data.product_name)
      if (data.image_style) {
        setImageStyle((prev) => ({ ...prev, ...data.image_style }))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating((g) => ({ ...g, all: false }))
    }
  }

  const enhanceField = async (section: string, currentContent: string | ImageStyle) => {
    setGenerating((g) => ({ ...g, [section]: true }))
    try {
      const data = await dcPost('/api/strategy/enhance-brand', {
        section,
        current_content: currentContent,
        website_url: websiteUrl || undefined,
        niche: niche || undefined,
      })
      if (!data.success) throw new Error(data.error || 'Enhancement failed')

      if (section === 'brand_voice' && data.brand_voice) setBrandVoice(data.brand_voice)
      if (section === 'target_market' && data.target_market) setTargetMarket(data.target_market)
      if (section === 'brand_blurb' && data.brand_blurb) setBrandBlurb(data.brand_blurb)
      if (section === 'seed_keywords' && data.seed_keywords) setSeedKeywords(data.seed_keywords)
      if (section === 'image_style' && data.image_style) {
        setImageStyle((prev) => ({ ...prev, ...data.image_style }))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating((g) => ({ ...g, [section]: false }))
    }
  }

  /* ═══════════════════════════════════════
     SAVE BRAND PROFILE
     ═══════════════════════════════════════ */
  const saveBrandProfile = async () => {
    if (!username) { setError('Username is required'); return }
    setGenerating((g) => ({ ...g, save: true }))
    setError('')
    try {
      const data = await dcPost('/api/strategy/brand-profile', {
        username,
        brand_profile: {
          name: displayName,
          company_name: displayName,
          voice_and_tone: brandVoice,
          target_market: targetMarket,
          brand_personality: brandBlurb,
          content_style_rules: seedKeywords,
          logo_url: logoUrl,
          website_url: websiteUrl,
          default_author: authorName,
          author_bio: authorBio,
          author_image_url: authorImageUrl,
          author_url: authorPageUrl,
          author_social_urls: authorSocials.filter(Boolean),
          stitch_enabled: stitchEnabled,
        },
        image_style: imageStyle,
      })
      if (!data.success) throw new Error(data.error || 'Save failed')
      markSaved('profile')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating((g) => ({ ...g, save: false }))
    }
  }

  /* ═══════════════════════════════════════
     PROVISIONING (deploy)
     ═══════════════════════════════════════ */
  const handleProvision = async () => {
    if (!username || !displayName || !contactEmail || (!niche && !websiteUrl)) {
      setError('Username, display name, contact email, and at least a niche or website URL are required.')
      return
    }

    setError('')
    setPhase('provisioning')
    seenStepsRef.current = new Set()
    addLog('Starting provisioning...')

    try {
      const secretRes = await fetch('/api/admin/provision-secret')
      const secretData = await secretRes.json()
      const secret = secretData.secret

      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          display_name: displayName.trim(),
          website_url: websiteUrl.trim() || undefined,
          contact_email: contactEmail.trim(),
          domain: domain.trim() || undefined,
          niche: niche.trim() || undefined,
          blurb: brandBlurb.trim() || undefined,
          target_market: targetMarket.trim() || undefined,
          brand_voice_tone: brandVoice.trim() || undefined,
          primary_color: primaryColor || undefined,
          accent_color: accentColor || undefined,
          author_name: authorName.trim() || undefined,
          author_bio: authorBio.trim() || undefined,
          fly_region: flyRegion,
          skip_pipeline: skipPipeline,
          skip_deploy: skipDeploy,
          approved_products: discoveredProducts.filter(p => p.selected).map(p => ({
            name: p.name,
            url: p.url,
            description: p.description,
          })),
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Provisioning failed')

      setProvisionResult(data)
      addLog('Phase 1: DB seeded successfully')

      if (data.notifications?.doubleclicker?.status === 'triggered') {
        addLog('Phase 2: Doubleclicker auto-onboard triggered')
        const trackingUrl = data.notifications.doubleclicker.data?.tracking_url
        const onboardId = data.notifications.doubleclicker.data?.onboard_id

        if (trackingUrl && !skipPipeline) {
          addLog(`Pipeline ID: ${onboardId}`)
          addLog('Tracking pipeline progress...')
          setPhase('tracking')
          startPolling(trackingUrl)
        } else {
          setPhase('done')
        }
      } else {
        addLog('Phase 2: Doubleclicker — ' + (data.notifications?.doubleclicker?.reason || 'skipped'))
        setPhase('done')
      }

      if (data.notifications?.fly?.status === 'skipped') {
        addLog(`Phase 3-5: Fly deploy skipped (${data.notifications.fly.reason})`)
      } else if (data.fly?.app) {
        addLog(`Phase 3: Fly app "${data.fly.app}" deployed`)
        if (data.fly.ipv4) addLog(`  IPv4: ${data.fly.ipv4}`)
        if (data.fly.ipv6) addLog(`  IPv6: ${data.fly.ipv6}`)
      }
    } catch (err: any) {
      setError(err.message)
      addLog(`ERROR: ${err.message}`)
      setPhase('form')
    }
  }

  const startPolling = useCallback((trackingPath: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/pipeline-status?path=${encodeURIComponent(trackingPath)}`)
        const data = await res.json()

        if (data.success && data.pipeline) {
          setPipelineStatus(data.pipeline)

          const completed = data.pipeline.steps_completed || []
          completed.forEach((s: PipelineStep) => {
            const key = `${s.step}-${s.status}`
            if (!seenStepsRef.current.has(key)) {
              seenStepsRef.current.add(key)
              addLog(`Step: ${s.label || s.step} — ${s.status}${s.detail ? ': ' + s.detail : ''}`)
            }
          })

          if (['completed', 'completed_with_errors', 'failed'].includes(data.pipeline.status)) {
            addLog(`Pipeline finished: ${data.pipeline.status}`)
            if (data.pipeline.errors?.length) {
              data.pipeline.errors.forEach((e: string) => addLog(`  Error: ${e}`))
            }
            setPhase('done')
            if (pollRef.current) clearInterval(pollRef.current)
          }
        }
      } catch {}
    }

    poll()
    pollRef.current = setInterval(poll, 5000)
  }, [addLog])

  const resetForm = () => {
    setPhase('form')
    setProvisionResult(null)
    setPipelineStatus(null)
    setLogs([])
    setNiche('')
    setUsername('')
    setDisplayName('')
    setDomain('')
    setWebsiteUrl('')
    setContactEmail('')
    setLogoUrl('')
    setBlogApiUrl('')
    setBrandVoice('')
    setTargetMarket('')
    setBrandBlurb('')
    setSeedKeywords('')
    setAuthorName('')
    setAuthorBio('')
    setAuthorImageUrl('')
    setAuthorPageUrl('')
    setAuthorSocials([''])
    setImageStyle({ ...emptyImageStyle })
    setProductName('')
    setProductUrl('')
    setIsAffiliate(false)
    setAffiliateLink('')
    setCreateProductPage(false)
    setAdditionalUrls([''])
    setSignalUrls([''])
    setPrimaryColor('#0F172A')
    setAccentColor('#0066ff')
    setDomainSuggestions([])
    setDiscoveredProducts([])
    setError('')
    setActiveSection(0)
  }

  /* ── helpers for dynamic URL lists ── */
  const updateListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, i: number, val: string) => {
    setter((prev) => prev.map((v, idx) => (idx === i ? val : v)))
  }
  const addListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ''])
  }

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div className="dc-layout">
      {/* ───── Sidebar ───── */}
      <aside className="dc-sidebar">
        <div className="dc-sidebar-header">
          <h1>Brand Provisioner</h1>
          <p>New brand onboarding</p>
        </div>
        <nav className="dc-sidebar-nav">
          {SECTIONS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`dc-nav-item ${activeSection === i ? 'dc-nav-active' : ''}`}
              onClick={() => phase === 'form' && setActiveSection(i)}
              disabled={phase !== 'form'}
            >
              <span className="dc-nav-icon">{s.icon}</span>
              <span className="dc-nav-label">{s.label}</span>
            </button>
          ))}
        </nav>

        {/* Pipeline progress */}
        {provisionResult && (
          <div className="dc-sidebar-progress">
            <h3>Pipeline</h3>
            <PipelinePhases
              phase={phase}
              pipelineStatus={pipelineStatus}
              provisionResult={provisionResult}
              skipDeploy={skipDeploy}
            />
          </div>
        )}
      </aside>

      {/* ───── Main ───── */}
      <main className="dc-main">
        {/* Top bar */}
        <div className="dc-topbar">
          <div>
            <h2>{SECTIONS[activeSection]?.label || 'Provision'}</h2>
            <p>{phase === 'form' ? `Step ${activeSection + 1} of ${SECTIONS.length}` : phase === 'done' ? 'Complete' : 'Running...'}</p>
          </div>
          <div className="dc-topbar-actions">
            {phase === 'form' && (
              <button type="button" className="dc-btn dc-btn-secondary" onClick={saveBrandProfile}
                disabled={!username || generating.save}>
                {generating.save ? 'Saving...' : saved.profile ? '✓ Saved' : 'Save Brand Profile'}
              </button>
            )}
            {phase === 'done' && (
              <button type="button" className="dc-btn dc-btn-secondary" onClick={resetForm}>
                + New Brand
              </button>
            )}
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

        {/* ══════════ FORM SECTIONS ══════════ */}
        {phase === 'form' && (
          <>
            {/* ── Section 0: Brand Profile ── */}
            {activeSection === 0 && (
              <div className="dc-section-wrap">
                {/* Mode-aware context banner */}
                {hasWebsite ? (
                  <div className="dc-ai-bar">
                    <div className="dc-ai-bar-info">
                      <h3>AI Brand Setup</h3>
                      <p>Scrapes your website and generates Brand Voice, Target Market, Brand Blurb, Seed Keywords, and Image Style. Refine each section individually below, or enhance with AI until it&apos;s right.</p>
                    </div>
                    <button
                      type="button"
                      className="dc-btn dc-btn-ai"
                      onClick={generateAll}
                      disabled={generating.all || !websiteUrl}
                    >
                      {generating.all ? (
                        <><span className="dc-spinner" /> Generating...</>
                      ) : (
                        'Generate All with AI'
                      )}
                    </button>
                  </div>
                ) : niche ? (
                  <div className="dc-mode-banner">
                    <div className="dc-mode-banner-icon">&#x1f50d;</div>
                    <div>
                      <h3>Niche Discovery Mode</h3>
                      <p>Doubleclicker will research the <strong>{niche}</strong> niche, discover relevant products across multiple sources (Exa, Google, Reddit, ProductHunt), score them for content potential, and launch content pipelines automatically.</p>
                    </div>
                    <button
                      type="button"
                      className="dc-btn dc-btn-ai"
                      onClick={generateFromNiche}
                      disabled={generating.niche_all}
                    >
                      {generating.niche_all ? (
                        <><span className="dc-spinner" /> Generating...</>
                      ) : (
                        'Generate Brand Profile from Niche'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="dc-mode-banner dc-mode-banner-neutral">
                    <div className="dc-mode-banner-icon">&#x2139;&#xfe0f;</div>
                    <div>
                      <h3>Getting Started</h3>
                      <p>Enter a <strong>niche</strong> for research-first discovery, or a <strong>website URL</strong> to scrape an existing brand. You can provide both.</p>
                    </div>
                  </div>
                )}

                {/* Basic fields */}
                <div className="dc-card">
                  <div className="dc-card-header"><h3>Brand Identity</h3></div>
                  <div className="dc-card-body">
                    <div className="dc-field">
                      <label>Niche <span className="dc-required">*</span></label>
                      <input type="text" value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        placeholder="e.g., Longevity Supplements, AI Productivity Tools, Sustainable Home Living" />
                      <span className="dc-hint">The topical niche Doubleclicker will research and build content around.</span>
                    </div>

                    <div className="dc-field-row">
                      <div className="dc-field">
                        <label>Company / Brand Name <span className="dc-required">*</span></label>
                        <input type="text" value={displayName}
                          onChange={(e) => {
                            setDisplayName(e.target.value)
                            if (!username || username === deriveUsername(displayName)) {
                              setUsername(deriveUsername(e.target.value))
                            }
                          }}
                          placeholder="Acme Corp" />
                      </div>
                      <div className="dc-field">
                        <label>Username <span className="dc-required">*</span></label>
                        <input type="text" value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="acmecorp" />
                      </div>
                    </div>

                    <div className="dc-field">
                      <label>Website URL</label>
                      <input type="url" value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourwebsite.com" />
                      <span className="dc-hint">Optional — provide if the brand already has a website. Enables AI brand scraping.</span>
                    </div>

                    <div className="dc-field-row">
                      <div className="dc-field">
                        <label>Domain</label>
                        <input type="text" value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                          placeholder="acmecorp.com" />
                      </div>
                      <div className="dc-field">
                        <label>Contact Email <span className="dc-required">*</span></label>
                        <input type="email" value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="hello@acmecorp.com" />
                      </div>
                    </div>

                    {/* Domain Suggestions */}
                    {(niche || displayName) && (
                      <div className="dc-domain-suggest-row">
                        <button
                          type="button"
                          className="dc-btn dc-btn-secondary dc-btn-sm"
                          onClick={suggestDomains}
                          disabled={loadingDomains}
                        >
                          {loadingDomains ? <><span className="dc-spinner" /> Searching...</> : 'Find Available Domains'}
                        </button>
                        {domainSuggestions.length > 0 && (
                          <div className="dc-domain-suggestions">
                            {domainSuggestions.map((s) => (
                              <button
                                key={s.domain}
                                type="button"
                                className={`dc-domain-chip ${domain === s.domain ? 'dc-domain-chip-selected' : ''}`}
                                onClick={() => selectDomain(s.domain)}
                              >
                                <span className="dc-domain-chip-name">{s.domain}</span>
                                <span className="dc-domain-chip-price">${s.price}/{s.currency === 'USD' ? 'yr' : s.currency}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="dc-field-row">
                      <div className="dc-field">
                        <label>Logo URL</label>
                        <SaveableInput value={logoUrl} onChange={setLogoUrl}
                          placeholder="https://yoursite.com/logo.png" onSave={() => markSaved('logo')} saved={saved.logo} />
                      </div>
                      <div className="dc-field">
                        <label>Blog API URL</label>
                        <SaveableInput value={blogApiUrl} onChange={setBlogApiUrl}
                          placeholder="https://yourblog.com/api" onSave={() => markSaved('blogApi')} saved={saved.blogApi} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Author */}
                <div className="dc-card">
                  <div className="dc-card-header"><h3>Author</h3></div>
                  <div className="dc-card-body">
                    <div className="dc-field-row">
                      <div className="dc-field">
                        <label>Author Name</label>
                        <input type="text" value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          placeholder="Stuart Asta" />
                      </div>
                      <div className="dc-field">
                        <label>Author Image URL</label>
                        <SaveableInput value={authorImageUrl} onChange={setAuthorImageUrl}
                          placeholder="https://…/author.jpg" onSave={() => markSaved('authorImg')} saved={saved.authorImg} />
                      </div>
                    </div>
                    <div className="dc-field">
                      <label>Author Page URL</label>
                      <input type="url" value={authorPageUrl}
                        onChange={(e) => setAuthorPageUrl(e.target.value)}
                        placeholder="https://yoursite.com/author/name" />
                    </div>
                    <div className="dc-field">
                      <label>Author Bio</label>
                      <textarea value={authorBio} onChange={(e) => setAuthorBio(e.target.value)}
                        placeholder="1-3 sentences about the author — used in the author widget and Person schema" rows={2} />
                    </div>
                    <div className="dc-field">
                      <label>Author Social Profile URLs</label>
                      {authorSocials.map((url, i) => (
                        <input key={i} type="url" value={url}
                          onChange={(e) => updateListItem(setAuthorSocials, i, e.target.value)}
                          placeholder="https://linkedin.com/in/yourname"
                          className="dc-list-input" />
                      ))}
                      <button type="button" className="dc-btn-link" onClick={() => addListItem(setAuthorSocials)}>
                        + Add another
                      </button>
                    </div>
                  </div>
                </div>

                {/* Brand Voice */}
                <div className="dc-card">
                  <div className="dc-card-header">
                    <h3>Brand Voice</h3>
                    {hasWebsite && <EnhanceButton loading={generating.brand_voice} onClick={() => enhanceField('brand_voice', brandVoice)} />}
                  </div>
                  <div className="dc-card-body">
                    <div className="dc-field">
                      <textarea value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)}
                        placeholder="First-person, conversational, technically sharp but accessible" rows={3} />
                      {!hasWebsite && <span className="dc-field-optional-hint">Optional — Doubleclicker will derive this from niche research if left blank.</span>}
                    </div>
                  </div>
                </div>

                {/* Target Market */}
                <div className="dc-card">
                  <div className="dc-card-header">
                    <h3>Target Market</h3>
                    {hasWebsite && <EnhanceButton loading={generating.target_market} onClick={() => enhanceField('target_market', targetMarket)} />}
                  </div>
                  <div className="dc-card-body">
                    <div className="dc-field">
                      <textarea value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)}
                        placeholder={'Describe your ideal customer in detail. Include:\n• Who they are (role, company size, industry)\n• Their core problem or goal\n• Their level of technical sophistication\n• What they care about when evaluating a solution'}
                        rows={5} />
                      {!hasWebsite && <span className="dc-field-optional-hint">Optional — Doubleclicker will derive this from niche research if left blank.</span>}
                    </div>
                  </div>
                </div>

                {/* Brand Blurb */}
                <div className="dc-card">
                  <div className="dc-card-header">
                    <h3>Brand Blurb / Guidelines</h3>
                    {hasWebsite && <EnhanceButton loading={generating.brand_blurb} onClick={() => enhanceField('brand_blurb', brandBlurb)} />}
                  </div>
                  <div className="dc-card-body">
                    <div className="dc-field">
                      <textarea value={brandBlurb} onChange={(e) => setBrandBlurb(e.target.value)}
                        placeholder="2–4 sentences describing the brand for AI context. This is injected into every article prompt so AI understands the brand position."
                        rows={4} />
                      {!hasWebsite && <span className="dc-field-optional-hint">Optional — Doubleclicker will derive this from niche research if left blank.</span>}
                    </div>
                  </div>
                </div>

                {/* Seed Keywords */}
                <div className="dc-card">
                  <div className="dc-card-header">
                    <h3>Seed Keywords</h3>
                    {hasWebsite && <EnhanceButton loading={generating.seed_keywords} onClick={() => enhanceField('seed_keywords', seedKeywords)} />}
                  </div>
                  <div className="dc-card-body">
                    <div className="dc-field">
                      <textarea value={seedKeywords} onChange={(e) => setSeedKeywords(e.target.value)}
                        placeholder="Enter comma-separated keyword phrases (2–4 words each) that represent your core topics. AI will expand these during discovery."
                        rows={3} />
                      {hasWebsite
                        ? <span className="dc-hint">Comma-separated phrases (not single words). AI adds more seeds during keyword discovery — these set the topical direction.</span>
                        : <span className="dc-field-optional-hint">Optional — Doubleclicker expands keywords automatically from niche research (250-350 keywords).</span>
                      }
                    </div>
                  </div>
                </div>

                <StepNav activeSection={activeSection} totalSections={SECTIONS.length}
                  onNavigate={setActiveSection} onLaunch={handleProvision}
                  canLaunch={!!(username && displayName && contactEmail && (niche || websiteUrl))} />
              </div>
            )}

            {/* ── Section 1: Image Style ── */}
            {activeSection === 1 && (
              <div className="dc-section-wrap">
                <div className="dc-card">
                  <div className="dc-card-header">
                    <h3>Imagineer Image Style Guidelines</h3>
                    <div className="dc-card-header-actions">
                      {niche && !hasWebsite && (
                        <button type="button" className="dc-btn dc-btn-secondary dc-btn-sm"
                          onClick={generateStyleFromNiche} disabled={generating.niche_style}>
                          {generating.niche_style ? <><span className="dc-spinner" /> Generating...</> : 'Generate from Niche'}
                        </button>
                      )}
                      <EnhanceButton loading={generating.image_style} onClick={() => enhanceField('image_style', imageStyle)} />
                    </div>
                  </div>
                  <div className="dc-card-body">
                    <div className="dc-field">
                      <label>Style Name</label>
                      <input type="text" value={imageStyle.style_name}
                        onChange={(e) => setImageStyle((s) => ({ ...s, style_name: e.target.value }))}
                        placeholder="Default Style" />
                    </div>

                    <ComboField label="Visual Style" value={imageStyle.visual_style}
                      options={VISUAL_STYLES}
                      onChange={(v) => setImageStyle((s) => ({ ...s, visual_style: v }))} />

                    <div className="dc-field">
                      <label>Color Palette</label>
                      <input type="text" value={imageStyle.color_palette}
                        onChange={(e) => setImageStyle((s) => ({ ...s, color_palette: e.target.value }))}
                        placeholder="Deep navy, white, electric blue accents" />
                    </div>

                    <ComboField label="Mood / Atmosphere" value={imageStyle.mood_and_atmosphere}
                      options={MOODS}
                      onChange={(v) => setImageStyle((s) => ({ ...s, mood_and_atmosphere: v }))} />

                    <ComboField label="Composition Style" value={imageStyle.composition_style}
                      options={COMPOSITIONS}
                      onChange={(v) => setImageStyle((s) => ({ ...s, composition_style: v }))} />

                    <ComboField label="Lighting Preferences" value={imageStyle.lighting_preferences}
                      options={LIGHTINGS}
                      onChange={(v) => setImageStyle((s) => ({ ...s, lighting_preferences: v }))} />

                    <ComboField label="Image Type Preferences" value={imageStyle.image_type_preferences}
                      options={IMAGE_TYPES}
                      onChange={(v) => setImageStyle((s) => ({ ...s, image_type_preferences: v }))} />

                    <ComboField label="Subject Guidelines" value={imageStyle.subject_guidelines}
                      options={SUBJECTS}
                      onChange={(v) => setImageStyle((s) => ({ ...s, subject_guidelines: v }))} />

                    <div className="dc-field">
                      <label>Preferred Elements</label>
                      <input type="text" value={imageStyle.preferred_elements}
                        onChange={(e) => setImageStyle((s) => ({ ...s, preferred_elements: e.target.value }))}
                        placeholder="Tech devices, focused professionals, clean workspaces" />
                    </div>

                    <div className="dc-field">
                      <label>Prohibited Elements</label>
                      <input type="text" value={imageStyle.prohibited_elements}
                        onChange={(e) => setImageStyle((s) => ({ ...s, prohibited_elements: e.target.value }))}
                        placeholder="Stock photo clichés, low quality, busy backgrounds" />
                    </div>

                    <div className="dc-field">
                      <label>AI Prompt Instructions</label>
                      <textarea value={imageStyle.ai_prompt_instructions}
                        onChange={(e) => setImageStyle((s) => ({ ...s, ai_prompt_instructions: e.target.value }))}
                        placeholder={'Write detailed instructions for AI image generation. These are appended to every image prompt for this brand.\n\nExample: "Shot on Sony A7 III, 85mm lens, f/1.8. Soft natural window light from the left."'}
                        rows={4} />
                    </div>
                  </div>
                </div>

                {/* Stitch toggle */}
                <div className="dc-card">
                  <div className="dc-card-header"><h3>Stitch Video Generation</h3></div>
                  <div className="dc-card-body">
                    <label className="dc-toggle">
                      <input type="checkbox" checked={stitchEnabled}
                        onChange={(e) => setStitchEnabled(e.target.checked)} />
                      <span>When enabled, completed articles automatically queue video generation via Stitch. Only enable for affiliate brands or paying clients.</span>
                    </label>
                  </div>
                </div>

                <StepNav activeSection={activeSection} totalSections={SECTIONS.length}
                  onNavigate={setActiveSection} onLaunch={handleProvision}
                  canLaunch={!!(username && displayName && contactEmail && (niche || websiteUrl))} />
              </div>
            )}

            {/* ── Section 2: Products & Discovery ── */}
            {activeSection === 2 && (
              <div className="dc-section-wrap">
                {/* Niche discovery info */}
                {!hasWebsite && niche && (
                  <div className="dc-card dc-card-info">
                    <div className="dc-card-header"><h3>Automatic Product Discovery</h3></div>
                    <div className="dc-card-body">
                      <div className="dc-info-box">
                        <strong>7-Phase Discovery Pipeline</strong>
                        <p>Doubleclicker will autonomously discover products in the <strong>{niche}</strong> niche:</p>
                        <ol className="dc-discovery-steps">
                          <li>Expand niche into 15-25 search queries</li>
                          <li>Search across Exa, Google, Reddit, and ProductHunt</li>
                          <li>Deduplicate and rank candidates</li>
                          <li>Scrape top product pages</li>
                          <li>AI-score each product (affiliate viability, market demand, content potential)</li>
                          <li>Auto-ingest qualifying products</li>
                          <li>Launch content pipelines per product</li>
                        </ol>
                        <p>You can optionally add a known product below, but it is not required.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Discovery & Approval */}
                {niche && (
                  <div className="dc-card">
                    <div className="dc-card-header">
                      <h3>Discover &amp; Approve Products</h3>
                      <button type="button" className="dc-btn dc-btn-secondary dc-btn-sm"
                        onClick={discoverProducts} disabled={loadingDiscovery || !niche}>
                        {loadingDiscovery ? <><span className="dc-spinner" /> Discovering...</> : 'Preview Product Discovery'}
                      </button>
                    </div>
                    <div className="dc-card-body">
                      {discoveredProducts.length === 0 && !loadingDiscovery && (
                        <div className="dc-info-box">
                          <p>Click <strong>Preview Product Discovery</strong> to search for products in the <strong>{niche}</strong> niche. You can approve or reject each product before launching content pipelines.</p>
                          <p className="dc-hint">Note: Full discovery runs 7 phases and may take a minute. Products not found here will still be discovered during provisioning.</p>
                        </div>
                      )}
                      {loadingDiscovery && (
                        <div className="dc-discovery-loading">
                          <span className="dc-spinner" /> Searching across Exa, Google, Reddit, ProductHunt...
                        </div>
                      )}
                      {discoveredProducts.length > 0 && (
                        <div className="dc-product-list">
                          <div className="dc-product-list-header">
                            <span>{discoveredProducts.filter(p => p.selected).length} of {discoveredProducts.length} products selected</span>
                            <button type="button" className="dc-btn-link"
                              onClick={() => setDiscoveredProducts(prev => prev.map(p => ({ ...p, selected: true })))}>
                              Select All
                            </button>
                            <button type="button" className="dc-btn-link"
                              onClick={() => setDiscoveredProducts(prev => prev.map(p => ({ ...p, selected: false })))}>
                              Deselect All
                            </button>
                          </div>
                          {discoveredProducts.map((product, idx) => (
                            <label key={idx} className={`dc-product-item ${product.selected ? 'dc-product-selected' : 'dc-product-deselected'}`}>
                              <input type="checkbox" checked={product.selected}
                                onChange={() => toggleProduct(idx)} />
                              <div className="dc-product-info">
                                <div className="dc-product-name">{product.name}</div>
                                {product.url && <div className="dc-product-url">{product.url}</div>}
                                {product.description && <div className="dc-product-desc">{product.description}</div>}
                              </div>
                              {product.score > 0 && (
                                <div className="dc-product-score" title="Content potential score">
                                  {Math.round(product.score * 100)}%
                                </div>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="dc-card">
                  <div className="dc-card-header">
                    <h3>{!hasWebsite && niche ? 'Add a Product (Optional)' : 'Product Details'}</h3>
                  </div>
                  <div className="dc-card-body">
                    <div className="dc-field-row">
                      <div className="dc-field">
                        <label>Product Name</label>
                        <input type="text" value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="e.g., Cursor" />
                      </div>
                      <div className="dc-field">
                        <label>Product URL</label>
                        <input type="url" value={productUrl}
                          onChange={(e) => setProductUrl(e.target.value)}
                          placeholder="https://cursor.com" />
                      </div>
                    </div>

                    <label className="dc-toggle">
                      <input type="checkbox" checked={isAffiliate}
                        onChange={(e) => setIsAffiliate(e.target.checked)} />
                      <span>This is an affiliate product</span>
                    </label>

                    {isAffiliate && (
                      <div className="dc-field">
                        <label>Affiliate Link</label>
                        <input type="url" value={affiliateLink}
                          onChange={(e) => setAffiliateLink(e.target.value)}
                          placeholder="https://cursor.com?ref=sewo" />
                      </div>
                    )}

                    <label className="dc-toggle">
                      <input type="checkbox" checked={createProductPage}
                        onChange={(e) => setCreateProductPage(e.target.checked)} />
                      <span>Create a dedicated product page (auto for affiliates)</span>
                    </label>

                    <div className="dc-field">
                      <label>Additional URLs (docs, pricing)</label>
                      {additionalUrls.map((url, i) => (
                        <input key={i} type="url" value={url}
                          onChange={(e) => updateListItem(setAdditionalUrls, i, e.target.value)}
                          placeholder="https://docs.cursor.com"
                          className="dc-list-input" />
                      ))}
                      <button type="button" className="dc-btn-link" onClick={() => addListItem(setAdditionalUrls)}>
                        + Add another
                      </button>
                    </div>

                    <div className="dc-field">
                      <label>Signal URLs (videos or blog posts)</label>
                      {signalUrls.map((url, i) => (
                        <input key={i} type="url" value={url}
                          onChange={(e) => updateListItem(setSignalUrls, i, e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="dc-list-input" />
                      ))}
                      <button type="button" className="dc-btn-link" onClick={() => addListItem(setSignalUrls)}>
                        + Add another
                      </button>
                    </div>
                  </div>
                </div>

                {/* Set & Forget info */}
                <div className="dc-card dc-card-info">
                  <div className="dc-card-header"><h3>Discovery &amp; Publishing</h3></div>
                  <div className="dc-card-body">
                    <div className="dc-info-box">
                      <strong>Set &amp; Forget</strong>
                      <p>The pipeline runs in the background. It discovers keywords, clusters them, builds RAG, generates a topical map, and schedules articles automatically. Check the Content Map and Schedule tabs in Doubleclicker to track progress.</p>
                    </div>
                  </div>
                </div>

                <StepNav activeSection={activeSection} totalSections={SECTIONS.length}
                  onNavigate={setActiveSection} onLaunch={handleProvision}
                  canLaunch={!!(username && displayName && contactEmail && (niche || websiteUrl))} />
              </div>
            )}

            {/* ── Section 3: Deploy & Launch ── */}
            {activeSection === 3 && (
              <div className="dc-section-wrap">
                <div className="dc-card">
                  <div className="dc-card-header">
                    <h3>Appearance</h3>
                    {niche && (
                      <button type="button" className="dc-btn dc-btn-secondary dc-btn-sm"
                        onClick={generateColorsFromNiche}>
                        Suggest from Niche
                      </button>
                    )}
                  </div>
                  <div className="dc-card-body">
                    <div className="dc-field-row">
                      <div className="dc-field">
                        <label>Primary Color</label>
                        <div className="dc-color-field">
                          <input type="color" value={primaryColor} title="Primary color picker"
                            onChange={(e) => setPrimaryColor(e.target.value)} />
                          <input type="text" value={primaryColor} placeholder="#0F172A"
                            onChange={(e) => setPrimaryColor(e.target.value)} />
                        </div>
                      </div>
                      <div className="dc-field">
                        <label>Accent Color</label>
                        <div className="dc-color-field">
                          <input type="color" value={accentColor} title="Accent color picker"
                            onChange={(e) => setAccentColor(e.target.value)} />
                          <input type="text" value={accentColor} placeholder="#0066ff"
                            onChange={(e) => setAccentColor(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dc-card">
                  <div className="dc-card-header"><h3>Deployment</h3></div>
                  <div className="dc-card-body">
                    <div className="dc-field">
                      <label>Fly.io Region</label>
                      <select value={flyRegion} title="Fly.io deployment region"
                        onChange={(e) => setFlyRegion(e.target.value)}>
                        {REGIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="dc-toggles">
                      <label className="dc-toggle">
                        <input type="checkbox" checked={skipPipeline}
                          onChange={(e) => setSkipPipeline(e.target.checked)} />
                        <span>Skip content pipeline</span>
                      </label>
                      <label className="dc-toggle">
                        <input type="checkbox" checked={skipDeploy}
                          onChange={(e) => setSkipDeploy(e.target.checked)} />
                        <span>Skip Fly.io deploy</span>
                      </label>
                    </div>
                  </div>
                </div>

                <StepNav activeSection={activeSection} totalSections={SECTIONS.length}
                  onNavigate={setActiveSection} onLaunch={handleProvision}
                  canLaunch={!!(username && displayName && contactEmail && (niche || websiteUrl))} />
              </div>
            )}
          </>
        )}

        {/* ══════════ RUNNING / DONE ══════════ */}
        {phase !== 'form' && (
          <div className="dc-section-wrap">
            {pipelineStatus && (
              <div className="dc-card">
                <div className="dc-card-header">
                  <h3>Doubleclicker Steps</h3>
                  <span className="dc-badge">{pipelineStatus.steps_completed?.length || 0}/{pipelineStatus.total_steps}</span>
                </div>
                <div className="dc-card-body">
                  <div className="dc-progress-bar">
                    <div
                      className={`dc-progress-fill ${pipelineStatus.status === 'failed' ? 'dc-progress-failed' : pipelineStatus.status === 'completed' ? 'dc-progress-completed' : 'dc-progress-running'}`}
                      style={{ width: `${((pipelineStatus.steps_completed?.length || 0) / pipelineStatus.total_steps) * 100}%` }}
                    />
                  </div>
                  <div className="dc-stages">
                    {pipelineStatus.steps_completed?.map((step, i) => (
                      <div key={i} className={`dc-stage dc-stage-${step.status}`}>
                        <span className="dc-stage-icon">
                          {step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : '○'}
                        </span>
                        <span>{step.label || step.step}</span>
                        {step.detail && <span className="dc-stage-detail">— {step.detail}</span>}
                      </div>
                    ))}
                    {pipelineStatus.status === 'running' && (
                      <div className="dc-stage dc-stage-active">
                        <span className="dc-spinner" />
                        <span>{pipelineStatus.current_step}...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Event log */}
            <div className="dc-card">
              <div className="dc-card-header">
                <h3>Event Log</h3>
                <span className="dc-badge">{logs.length}</span>
              </div>
              <div className="dc-card-body dc-card-body-flush">
                <div className="dc-log-scroll">
                  {logs.length === 0 && <p className="dc-log-empty">Waiting for provisioning to start...</p>}
                  {logs.map((log, i) => (
                    <div key={i} className={`dc-log-line ${log.includes('ERROR') ? 'dc-log-error' : ''}`}>{log}</div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>

            {/* Done */}
            {phase === 'done' && provisionResult && (
              <div className="dc-card dc-card-success">
                <div className="dc-card-header"><h3>Provisioning Complete</h3></div>
                <div className="dc-card-body">
                  {provisionResult.fly?.url && (
                    <div className="dc-result-row">
                      <span className="dc-result-label">Fly URL</span>
                      <a href={provisionResult.fly.url} target="_blank" rel="noopener noreferrer">{provisionResult.fly.url}</a>
                    </div>
                  )}
                  {domain && provisionResult.fly?.ipv4 && (
                    <div className="dc-dns">
                      <h4>DNS Records for {domain}</h4>
                      <table>
                        <thead><tr><th>Type</th><th>Host</th><th>Value</th></tr></thead>
                        <tbody>
                          <tr><td>A</td><td>@</td><td>{provisionResult.fly.ipv4}</td></tr>
                          {provisionResult.fly.ipv6 && <tr><td>AAAA</td><td>@</td><td>{provisionResult.fly.ipv6}</td></tr>}
                          <tr><td>CNAME</td><td>www</td><td>{username}-blog.fly.dev</td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  <button type="button" className="dc-btn dc-btn-secondary" onClick={resetForm}>
                    Provision Another Brand
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function StepNav({ activeSection, totalSections, onNavigate, onLaunch, canLaunch }: {
  activeSection: number; totalSections: number; onNavigate: (i: number) => void; onLaunch: () => void; canLaunch: boolean
}) {
  const isLast = activeSection === totalSections - 1
  return (
    <div className="dc-step-nav">
      {activeSection > 0 && (
        <button type="button" className="dc-btn dc-btn-secondary" onClick={() => onNavigate(activeSection - 1)}>
          Back
        </button>
      )}
      <div className="dc-step-nav-spacer" />
      {isLast ? (
        <button type="button" className="dc-btn dc-btn-launch" onClick={onLaunch} disabled={!canLaunch}>
          Launch Provisioning
        </button>
      ) : (
        <button type="button" className="dc-btn dc-btn-primary" onClick={() => onNavigate(activeSection + 1)}>
          Next
        </button>
      )}
    </div>
  )
}

function EnhanceButton({ loading, onClick }: { loading?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="dc-btn dc-btn-enhance" onClick={onClick} disabled={loading}>
      {loading ? <><span className="dc-spinner" /> Enhancing...</> : 'Enhance with AI'}
    </button>
  )
}

function SaveableInput({ value, onChange, placeholder, onSave, saved }: {
  value: string; onChange: (v: string) => void; placeholder: string; onSave: () => void; saved?: boolean
}) {
  return (
    <div className="dc-saveable">
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <button type="button" className={`dc-save-btn ${saved ? 'dc-save-done' : ''}`} onClick={onSave}>
        {saved ? '✓' : 'Save'}
      </button>
    </div>
  )
}

function ComboField({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  return (
    <div className="dc-field">
      <label>{label}</label>
      <div className="dc-combo">
        <select
          title={label}
          value={options.includes(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Pick {label.toLowerCase()}…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="dc-combo-or">or type freely…</span>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Custom ${label.toLowerCase()}`} />
      </div>
    </div>
  )
}

function PipelinePhases({ phase, pipelineStatus, provisionResult, skipDeploy }: {
  phase: Phase; pipelineStatus: PipelineStatus | null; provisionResult: any; skipDeploy: boolean
}) {
  const phases = [
    { label: 'Seed Database', status: provisionResult ? 'completed' : 'pending' },
    {
      label: 'Doubleclicker',
      status: phase === 'tracking' ? 'running'
        : pipelineStatus?.status === 'completed' ? 'completed'
        : pipelineStatus?.status === 'failed' ? 'failed'
        : provisionResult?.notifications?.doubleclicker?.status === 'skipped' ? 'skipped'
        : phase === 'done' ? 'completed' : 'pending',
    },
    {
      label: 'Fly.io Deploy',
      status: skipDeploy ? 'skipped'
        : provisionResult?.fly?.app ? 'completed'
        : provisionResult?.notifications?.fly?.status === 'skipped' ? 'skipped' : 'pending',
    },
    {
      label: 'Domain & Certs',
      status: provisionResult?.notifications?.domain?.status === 'skipped' ? 'skipped'
        : provisionResult?.notifications?.domain ? 'completed' : 'pending',
    },
  ]

  const icons: Record<string, string> = { completed: '✓', running: '●', failed: '✗', skipped: '—', pending: '○' }

  return (
    <div className="dc-phase-list">
      {phases.map((p, i) => (
        <div key={i} className={`dc-phase dc-phase-${p.status}`}>
          <span className="dc-phase-icon">{icons[p.status] || '○'}</span>
          <span>{p.label}</span>
        </div>
      ))}
    </div>
  )
}
