'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { THEMES, type ThemeName } from '@/lib/themes'
import ThemePreview from '@/components/ThemePreview'

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

const VISUAL_STYLES = ['Photorealistic', 'Digital Art', 'Watercolor', 'Oil Painting', 'Minimalist', 'Flat Design', 'Isometric', '3D Render', 'Line Art', 'Vintage / Retro', 'Collage', 'Pop Art']
const MOODS = ['Professional', 'Warm & Inviting', 'Bold & Energetic', 'Calm & Serene', 'Luxurious', 'Playful', 'Dark & Moody', 'Clean & Modern', 'Futuristic', 'Earthy & Organic', 'Whimsical', 'Cinematic']
const COMPOSITIONS = ['Rule of Thirds', 'Centered', 'Symmetrical', 'Golden Ratio', 'Leading Lines', 'Negative Space', 'Full Bleed', 'Diagonal', 'Frame within Frame']
const LIGHTINGS = ['Natural Daylight', 'Golden Hour', 'Studio Lighting', 'Soft Diffused', 'Dramatic Chiaroscuro', 'Neon / Colorful', 'Backlit', 'Overcast / Flat', 'Candlelight / Warm']
const IMAGE_TYPES = ['Photography', 'Illustration', 'Infographic', 'Abstract', 'Lifestyle', 'Product Shot', 'Conceptual', 'Macro / Close-up', 'Aerial / Drone']
const SUBJECTS = ['People', 'Technology', 'Nature', 'Architecture', 'Abstract Shapes', 'Data Visualization', 'Workspace', 'Animals', 'Food & Drink']

/* ── guided builder options ── */
const BRAND_VOICE_OPTIONS = [
  'Formal & Professional', 'Casual & Conversational', 'Witty & Humorous',
  'Authoritative & Expert', 'Friendly & Approachable', 'Bold & Provocative',
  'Empathetic & Supportive', 'Technical & Precise', 'Storytelling & Narrative',
  'Minimalist & Direct', 'Inspirational & Motivational', 'Educational & Informative',
  'Luxury & Refined', 'Youthful & Energetic', 'Trustworthy & Reassuring',
]

const TARGET_MARKET_OPTIONS = [
  'Tech Professionals', 'Small Business Owners', 'Health-Conscious Consumers',
  'Budget-Conscious Shoppers', 'Enterprise Decision Makers', 'Creative Professionals',
  'Parents & Families', 'Students & Learners', 'Senior Citizens',
  'Fitness Enthusiasts', 'DIY Hobbyists', 'Luxury Buyers',
  'Remote Workers', 'Gen Z / Young Adults', 'B2B SaaS Buyers',
]

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

/* ───────── sidebar nav (mode-dependent) ───────── */
type ProvisionMode = 'brand' | 'niche' | null

const BRAND_SECTIONS = [
  { key: 'brand_url', label: 'Website', icon: '🌐' },
  { key: 'brand_voice', label: 'Voice & Content', icon: '💬' },
  { key: 'brand_image', label: 'Image Style', icon: '🎨' },
  { key: 'product', label: 'Products', icon: '📦' },
  { key: 'brand_launch', label: 'Launch', icon: '🚀' },
]

const NICHE_SECTIONS = [
  { key: 'niche_input', label: 'Niche', icon: '🔍' },
  { key: 'niche_domain', label: 'Domain', icon: '🌐' },
  { key: 'niche_voice', label: 'Brand Voice', icon: '💬' },
  { key: 'niche_image', label: 'Image Style', icon: '🎨' },
  { key: 'product', label: 'Products', icon: '📦' },
  { key: 'niche_launch', label: 'Launch', icon: '🚀' },
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
  yearlyPrice?: { currencyCode: string; units: string; nanos?: number }
  domainNotices?: string[]
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
  const data = await res.json()
  if (!res.ok && !data.success) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
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
  const [logoPrompt, setLogoPrompt] = useState('')

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
  const [theme, setTheme] = useState<ThemeName>('editorial')
  const [flyRegion, setFlyRegion] = useState('syd')
  const [stitchEnabled, setStitchEnabled] = useState(false)

  /* ── translation ── */
  const [translationEnabled, setTranslationEnabled] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [articlesPerDay, setArticlesPerDay] = useState(5)

  /* ── domain purchase ── */
  const [purchaseDomain, setPurchaseDomain] = useState(false)
  const [selectedDomainData, setSelectedDomainData] = useState<DomainSuggestion | null>(null)
  const [manualDns, setManualDns] = useState(false)

  /* ── UI state ── */
  const [mode, setMode] = useState<ProvisionMode>(null)
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

  /* ── deep niche research ── */
  const [researchContext, setResearchContext] = useState<any>(null)

  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const seenStepsRef = useRef<Set<string>>(new Set())

  /* ── derived ── */
  const activeSections = mode === 'niche' ? NICHE_SECTIONS : BRAND_SECTIONS

  /* ── auto-fill from domain ── */
  useEffect(() => {
    if (domain && !websiteUrl) setWebsiteUrl(`https://www.${domain}`)
    if (domain && !contactEmail) setContactEmail(`contact@${domain}`)
    if (domain && !authorPageUrl) setAuthorPageUrl(`https://www.${domain}/about`)
    // Derive username from domain (strip TLD)
    if (domain) {
      const uname = domain.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
      if (uname && (!username || username === deriveUsername(displayName))) {
        setUsername(uname)
      }
    }
  }, [domain]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (displayName && !authorName) setAuthorName(`${displayName} Editorial`)
    if (displayName && !authorBio) setAuthorBio(`The ${displayName} editorial team.`)
  }, [displayName]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── auto-fill author URL from website (Product-First) ── */
  useEffect(() => {
    if (websiteUrl && !authorPageUrl && !domain) {
      const base = websiteUrl.replace(/\/+$/, '')
      setAuthorPageUrl(`${base}/about`)
    }
  }, [websiteUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  /* ── auto-fill logo prompt ── */
  useEffect(() => {
    if ((displayName || niche) && !logoPrompt) {
      setLogoPrompt(`Abstract, minimal logo mark for a ${niche || 'modern'} brand. Simple geometric shape or icon, flat design, white background, absolutely no text, no letters, no words, no typography. Clean vector-style, single color accent, suitable as a favicon or app icon.`)
    }
  }, [displayName, niche]) // eslint-disable-line react-hooks/exhaustive-deps

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
    if (/insurance|legal|compliance/.test(lower)) return { primary: '#1a365d', accent: '#2b6cb0' }
    return { primary: '#0f172a', accent: '#0066ff' }
  }

  const applyColorsFromPalette = (colorPalette: unknown) => {
    if (!colorPalette) return
    const paletteStr = typeof colorPalette === 'string' ? colorPalette : JSON.stringify(colorPalette)
    const hexMatches = paletteStr.match(/#[0-9a-fA-F]{6}/g)
    if (hexMatches && hexMatches.length >= 2) {
      setPrimaryColor(hexMatches[0])
      setAccentColor(hexMatches[1])
    } else if (hexMatches && hexMatches.length === 1) {
      setPrimaryColor(hexMatches[0])
    }
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

  const selectDomain = (domainName: string, suggestion?: DomainSuggestion) => {
    setDomain(domainName)
    setWebsiteUrl((prev) => prev || `https://www.${domainName}`)
    setContactEmail((prev) => prev || `contact@${domainName}`)
    if (suggestion) {
      setSelectedDomainData(suggestion)
      setPurchaseDomain(true)
    }
  }

  const generateFromNiche = async () => {
    if (!niche) return
    setGenerating((g) => ({ ...g, niche_all: true }))
    setError('')
    setResearchContext(null)
    const brandCtx = `Brand in the "${niche}" niche${displayName ? `, called "${displayName}"` : ''}.`
    try {
      addLog('Phase 1: Researching niche market...')
      const researchData = await dcPost('/api/strategy/deep-niche-research', {
        niche,
        brand_name: displayName || undefined,
        website_url: websiteUrl || undefined,
      })
      if (!researchData.success) throw new Error(researchData.error || 'Research failed')
      setResearchContext(researchData.research)
      const rc = researchData.research
      addLog(`Research complete: ${rc.content_pillars?.length || 0} pillars, ${rc.keyword_themes?.length || 0} keyword themes`)

      addLog('Phase 2: Generating brand profile from research...')
      const [voice, market, blurb, keywords, style] = await Promise.allSettled([
        dcPost('/api/strategy/enhance-brand', { section: 'brand_voice', current_content: `${brandCtx} Generate brand voice.`, niche, research_context: rc }),
        dcPost('/api/strategy/enhance-brand', { section: 'target_market', current_content: `${brandCtx} Define target audience.`, niche, research_context: rc }),
        dcPost('/api/strategy/enhance-brand', { section: 'brand_blurb', current_content: `${brandCtx} Write brand description.`, niche, research_context: rc }),
        dcPost('/api/strategy/enhance-brand', { section: 'seed_keywords', current_content: `${brandCtx} Generate seed keywords.`, niche, research_context: rc }),
        dcPost('/api/strategy/enhance-brand', { section: 'image_style', current_content: { ...emptyImageStyle, style_name: `${niche} Style` }, niche, research_context: rc }),
      ])

      if (voice.status === 'fulfilled' && voice.value.brand_voice) setBrandVoice(voice.value.brand_voice)
      if (market.status === 'fulfilled' && market.value.target_market) setTargetMarket(market.value.target_market)
      if (blurb.status === 'fulfilled' && blurb.value.brand_blurb) setBrandBlurb(blurb.value.brand_blurb)
      if (keywords.status === 'fulfilled' && keywords.value.seed_keywords) setSeedKeywords(keywords.value.seed_keywords)
      if (style.status === 'fulfilled' && style.value.image_style) {
        setImageStyle((prev) => ({ ...prev, ...style.value.image_style }))
        if (style.value.image_style.color_palette) {
          applyColorsFromPalette(style.value.image_style.color_palette)
        } else {
          const colors = suggestNicheColors(niche)
          setPrimaryColor(colors.primary)
          setAccentColor(colors.accent)
        }
      } else {
        const colors = suggestNicheColors(niche)
        setPrimaryColor(colors.primary)
        setAccentColor(colors.accent)
      }
      addLog('Brand profile generated successfully')
      // Auto-advance to domain step
      if (mode === 'niche') setActiveSection(1)
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
      if (data.image_style) {
        setImageStyle((prev) => ({ ...prev, ...data.image_style }))
        if (data.image_style.color_palette) applyColorsFromPalette(data.image_style.color_palette)
      } else setError('No image style returned — DC may need niche support in enhance-brand.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating((g) => ({ ...g, niche_style: false }))
    }
  }

  const logoAbortRef = useRef<AbortController | null>(null)
  const generateLogo = async () => {
    const prompt = logoPrompt || `Abstract, minimal logo mark for a ${niche || 'modern'} brand. Simple geometric shape or icon, flat design, white background, absolutely no text, no letters, no words, no typography. Clean vector-style, single color accent, suitable as a favicon or app icon.`
    // Abort any in-flight request
    if (logoAbortRef.current) logoAbortRef.current.abort()
    const controller = new AbortController()
    logoAbortRef.current = controller
    setGenerating((g) => ({ ...g, logo: true }))
    setError('')
    try {
      const res = await fetch('/api/admin/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, username: username || undefined }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Logo generation failed')
      setLogoUrl(data.url)
    } catch (err: any) {
      if (err.name === 'AbortError') return // superseded by a newer request
      setError(err.message)
    } finally {
      if (logoAbortRef.current === controller) {
        setGenerating((g) => ({ ...g, logo: false }))
        logoAbortRef.current = null
      }
    }
  }

  const generateColorsFromNiche = () => {
    if (!niche) return
    const colors = suggestNicheColors(niche)
    setPrimaryColor(colors.primary)
    setAccentColor(colors.accent)
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
        if (data.image_style.color_palette) applyColorsFromPalette(data.image_style.color_palette)
      }
      // Auto-advance to voice step
      if (mode === 'brand') setActiveSection(1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating((g) => ({ ...g, all: false }))
    }
  }

  const enhanceField = async (section: string, currentContent: string | ImageStyle) => {
    setGenerating((g) => ({ ...g, [section]: true }))
    setError('')
    try {
      const contextParts: string[] = []
      if (niche) contextParts.push(`Niche: ${niche}`)
      if (displayName) contextParts.push(`Brand: ${displayName}`)
      if (username) contextParts.push(`Brand username: ${username}`)
      const additional_context = contextParts.length > 0 ? contextParts.join('. ') : undefined

      const data = await dcPost('/api/strategy/enhance-brand', {
        section,
        current_content: currentContent,
        website_url: websiteUrl || undefined,
        niche: niche || undefined,
        additional_context,
      })
      if (!data.success) throw new Error(data.error || 'Enhancement failed')

      if (section === 'brand_voice' && data.brand_voice) setBrandVoice(data.brand_voice)
      if (section === 'target_market' && data.target_market) setTargetMarket(data.target_market)
      if (section === 'brand_blurb' && data.brand_blurb) setBrandBlurb(data.brand_blurb)
      if (section === 'seed_keywords' && data.seed_keywords) setSeedKeywords(data.seed_keywords)
      if (section === 'image_style' && data.image_style) {
        setImageStyle((prev) => ({ ...prev, ...data.image_style }))
        if (data.image_style.color_palette) applyColorsFromPalette(data.image_style.color_palette)
      } else if (section === 'image_style') {
        setError('No image style returned from AI. Try adding a niche first.')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating((g) => ({ ...g, [section]: false }))
    }
  }

  /* ═══════════════════════════════════════
     PROVISIONING (deploy)
     ═══════════════════════════════════════ */
  const handleProvision = async () => {
    const resolvedUsername = username || deriveUsername(displayName)
    if (!resolvedUsername || !displayName || (!niche && !websiteUrl)) {
      setError('Brand name and at least a niche or website URL are required.')
      return
    }

    setError('')
    setPhase('provisioning')
    seenStepsRef.current = new Set()
    addLog('Starting provisioning...')

    try {
      const secret = ''

      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          username: resolvedUsername.trim().toLowerCase(),
          display_name: displayName.trim(),
          website_url: websiteUrl.trim() || undefined,
          contact_email: contactEmail.trim() || (domain ? `contact@${domain.trim()}` : `contact@${resolvedUsername.trim().toLowerCase()}.com`),
          domain: domain.trim() || undefined,
          niche: niche.trim() || undefined,
          blurb: brandBlurb.trim() || undefined,
          target_market: targetMarket.trim() || undefined,
          brand_voice_tone: brandVoice.trim() || undefined,
          seed_keywords: seedKeywords ? seedKeywords.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
          research_context: researchContext || undefined,
          primary_color: primaryColor || undefined,
          accent_color: accentColor || undefined,
          theme: theme || undefined,
          logo_url: logoUrl.trim() || undefined,
          author_name: authorName.trim() || undefined,
          author_bio: authorBio.trim() || undefined,
          author_image_url: authorImageUrl.trim() || undefined,
          author_url: authorPageUrl.trim() || undefined,
          author_social_urls: authorSocials.filter(Boolean).length > 0
            ? authorSocials.filter(Boolean).reduce<Record<string, string>>((acc, url, i) => {
                const platform = url.includes('twitter.com') || url.includes('x.com') ? 'twitter'
                  : url.includes('linkedin.com') ? 'linkedin'
                  : url.includes('instagram.com') ? 'instagram'
                  : url.includes('youtube.com') ? 'youtube'
                  : url.includes('facebook.com') ? 'facebook'
                  : url.includes('tiktok.com') ? 'tiktok'
                  : `social_${i}`
                return { ...acc, [platform]: url }
              }, {})
            : undefined,
          // Forced defaults for new sites
          stitch_enabled: stitchEnabled,
          publishing_provider: 'supabase_blog',
          image_style: imageStyle,
          fly_region: flyRegion,
          skip_pipeline: false,
          skip_deploy: false,
          setup_google_analytics: true,
          setup_google_tag_manager: true,
          setup_search_console: true,
          purchase_domain: !!selectedDomainData && !manualDns,
          manual_dns: manualDns,
          domain_yearly_price: selectedDomainData?.yearlyPrice || undefined,
          domain_notices: selectedDomainData?.domainNotices || undefined,
          is_affiliate: isAffiliate,
          affiliate_link: isAffiliate ? (affiliateLink.trim() || productUrl.trim() || undefined) : undefined,
          product_url: productUrl.trim() || undefined,
          product_name: productName.trim() || undefined,
          approved_products: [
            ...(productName.trim() || productUrl.trim()
              ? [{ name: productName.trim(), url: productUrl.trim(), description: '' }]
              : []),
          ].filter(p => p.name || p.url),
          languages: translationEnabled && selectedLanguages.length > 0 ? selectedLanguages : undefined,
          articles_per_day: articlesPerDay,
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Provisioning failed')

      setProvisionResult(data)
      addLog('Phase 1: DB seeded successfully')

      if (data.notifications?.google_analytics?.status === 'created') {
        addLog(`Phase 2: GA4 created — ${data.google?.ga_measurement_id}`)
      } else if (data.notifications?.google_analytics?.status === 'error') {
        addLog(`Phase 2: GA4 failed — ${data.notifications.google_analytics.error}`)
      }
      if (data.notifications?.google_tag_manager?.status === 'created') {
        addLog(`Phase 2: GTM created — ${data.google?.gtm_public_id}`)
      } else if (data.notifications?.google_tag_manager?.status === 'error') {
        addLog(`Phase 2: GTM failed — ${data.notifications.google_tag_manager.error}`)
      }

      if (data.notifications?.doubleclicker?.status === 'triggered') {
        addLog('Phase 3: Doubleclicker auto-onboard triggered')
        const trackingUrl = data.notifications.doubleclicker.data?.tracking_url
        const onboardId = data.notifications.doubleclicker.data?.onboard_id

        if (trackingUrl) {
          addLog(`Pipeline ID: ${onboardId}`)
          addLog('Tracking pipeline progress...')
          setPhase('tracking')
          startPolling(trackingUrl)
        } else {
          setPhase('done')
        }
      } else {
        addLog('Phase 3: Doubleclicker — ' + (data.notifications?.doubleclicker?.reason || 'skipped'))
        setPhase('done')
      }

      if (data.notifications?.domain_purchase?.status === 'registration_pending') {
        addLog(`Phase 4: Domain "${data.notifications.domain_purchase.domain}" purchase initiated`)
      } else if (data.notifications?.domain_purchase?.status === 'error') {
        addLog(`Phase 4: Domain purchase failed — ${data.notifications.domain_purchase.error}`)
      }

      if (data.fly?.app) {
        addLog(`Phase 5: Fly app "${data.fly.app}" deployed`)
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
    setMode(null)
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
    setPurchaseDomain(false)
    setSelectedDomainData(null)
    setStitchEnabled(false)
    setTranslationEnabled(false)
    setSelectedLanguages([])
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

  /* ── canLaunch check ── */
  const canLaunch = mode === 'niche'
    ? !!(displayName && niche)
    : !!(displayName && websiteUrl)

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div className="dc-layout">
      {/* ───── Sidebar ───── */}
      <aside className="dc-sidebar">
        <div className="dc-sidebar-header">
          <h1>Brand Provisioner</h1>
          <p>{mode === 'brand' ? 'Product-First' : mode === 'niche' ? 'Niche-First' : 'New brand onboarding'}</p>
        </div>

        {mode && phase === 'form' && (
          <div className="dc-mode-selector-sidebar">
            <button type="button" className={`dc-mode-btn ${mode === 'brand' ? 'dc-mode-btn-active' : ''}`}
              onClick={() => { setMode('brand'); setActiveSection(0) }}>Product</button>
            <button type="button" className={`dc-mode-btn ${mode === 'niche' ? 'dc-mode-btn-active' : ''}`}
              onClick={() => { setMode('niche'); setActiveSection(0) }}>Niche</button>
          </div>
        )}

        <nav className="dc-sidebar-nav">
          {activeSections.map((s, i) => (
            <button key={s.key} type="button"
              className={`dc-nav-item ${activeSection === i ? 'dc-nav-active' : ''}`}
              onClick={() => phase === 'form' && mode && setActiveSection(i)}
              disabled={phase !== 'form' || !mode}>
              <span className="dc-nav-icon">{s.icon}</span>
              <span className="dc-nav-label">{s.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '8px 8px 0', borderTop: '1px solid #e2e8f0', marginTop: 8 }}>
          <a href="/admin/network" className="dc-nav-item" style={{ textDecoration: 'none' }}>
            <span className="dc-nav-icon">🌐</span>
            <span className="dc-nav-label">Create Network</span>
          </a>
        </div>

        {provisionResult && (
          <div className="dc-sidebar-progress">
            <h3>Pipeline</h3>
            <PipelinePhases phase={phase} pipelineStatus={pipelineStatus} provisionResult={provisionResult}
              purchaseDomain={!!selectedDomainData} />
          </div>
        )}
      </aside>

      {/* ───── Main ───── */}
      <main className="dc-main">
        <div className="dc-topbar">
          <div>
            <h2>{mode ? (activeSections[activeSection]?.label || 'Provision') : 'Choose Your Path'}</h2>
            <p>{!mode ? 'How would you like to get started?' : phase === 'form' ? `Step ${activeSection + 1} of ${activeSections.length}` : phase === 'done' ? 'Complete' : 'Running...'}</p>
          </div>
          <div className="dc-topbar-actions">
            {phase === 'done' && (
              <button type="button" className="dc-btn dc-btn-secondary" onClick={resetForm}>+ New Brand</button>
            )}
          </div>
        </div>

        <div className="dc-scroll-area">

        {error && (
          <div className="dc-alert dc-alert-error" style={{ margin: '0 0 8px' }}>
            <span className="dc-alert-icon">!</span>
            <div>
              <div className="dc-alert-title">Error</div>
              <div className="dc-alert-text">{error}</div>
            </div>
            <button type="button" className="dc-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* ══════════ MODE CHOOSER ══════════ */}
        {phase === 'form' && !mode && (
          <div className="dc-mode-chooser-with-preview">
          <div className="dc-mode-chooser">
            {/* Theme Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                Choose a style
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      setTheme(t.name)
                      setPrimaryColor(t.variables['--color-accent'] || '')
                      setAccentColor(t.variables['--color-bg-warm'] || '')
                    }}
                    style={{
                      padding: '16px',
                      border: theme === t.name ? '2px solid #6366f1' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: theme === t.name ? '#f0f0ff' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>{t.label}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4, display: 'block' }}>{t.description}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="dc-mode-chooser-subtitle">What do you already have?</p>
            <div className="dc-mode-chooser-grid">
              <button type="button" className="dc-mode-card" onClick={() => setMode('brand')}>
                <div className="dc-mode-card-icon">🏷️</div>
                <h3>I have a product or website</h3>
                <p>Paste your URL and AI will extract brand identity, voice, content strategy, and image style automatically.</p>
                <ul className="dc-mode-card-list">
                  <li>Provide your website URL</li>
                  <li>AI scrapes and generates everything</li>
                  <li>Review and refine before launch</li>
                  <li>Best for: existing brands, SaaS, e-commerce</li>
                </ul>
                <span className="dc-mode-card-cta">Start with Product &rarr;</span>
              </button>

              <button type="button" className="dc-mode-card" onClick={() => setMode('niche')}>
                <div className="dc-mode-card-icon">🔍</div>
                <h3>I have a niche idea</h3>
                <p>Enter a topic like &ldquo;home insurance&rdquo; and AI will research the market and build a brand from scratch.</p>
                <ul className="dc-mode-card-list">
                  <li>Describe your niche in a few words</li>
                  <li>AI researches market and generates brand</li>
                  <li>Choose a domain, refine voice &amp; style</li>
                  <li>Best for: affiliate sites, new brands, content plays</li>
                </ul>
                <span className="dc-mode-card-cta">Start with Niche &rarr;</span>
              </button>

              <a href="/admin/network" className="dc-mode-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="dc-mode-card-icon">🌐</div>
                <h3>I want a network of sites</h3>
                <p>Enter a seed niche and AI will expand it into multiple related sites, each with its own brand, domain, and content strategy.</p>
                <ul className="dc-mode-card-list">
                  <li>Provide a seed niche</li>
                  <li>AI generates 6 related niche sites</li>
                  <li>Deep market research for each site</li>
                  <li>Best for: content networks, niche portfolios</li>
                </ul>
                <span className="dc-mode-card-cta">Create Network &rarr;</span>
              </a>
            </div>
          </div>
          <ThemePreview key={theme} theme={theme} />
          </div>
        )}

        {/* ══════════ FORM SECTIONS ══════════ */}
        {phase === 'form' && mode && (
          <div key={`${mode}-${activeSection}`} className="dc-drawer">

            {/* ═══════════════════════════════════
                BRAND-FIRST FLOW (5 steps)
                ═══════════════════════════════════ */}
            {mode === 'brand' && (<>

              {/* ── Step 0: Website URL ── */}
              {activeSection === 0 && (
                <div className="dc-section-wrap">
                  <div className="dc-card">
                    <div className="dc-card-header"><h3>Step 1: Your Website</h3></div>
                    <div className="dc-card-body">
                      <div className="dc-field">
                        <label>Website URL <span className="dc-required">*</span></label>
                        <input type="url" value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://yourwebsite.com"
                          className="dc-input-hero" autoFocus />
                        <span className="dc-hint">AI will scrape this to extract brand name, voice, target market, keywords, and image style.</span>
                      </div>

                      <div className="dc-ai-bar">
                        <div className="dc-ai-bar-info">
                          <h3>AI Brand Setup</h3>
                          <p>One click generates everything from your URL. You can refine later.</p>
                        </div>
                        <button type="button" className="dc-btn dc-btn-ai" onClick={generateAll}
                          disabled={generating.all || !websiteUrl}>
                          {generating.all ? <><span className="dc-spinner" /> Generating...</> : 'Generate All with AI'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <StepNav activeSection={activeSection} totalSections={activeSections.length}
                    onNavigate={setActiveSection} onLaunch={handleProvision} canLaunch={canLaunch} />
                </div>
              )}

              {/* ── Step 1: Voice & Content (guided builder) ── */}
              {activeSection === 1 && (
                <div className="dc-section-wrap">
                  <VoiceContentSection
                    brandVoice={brandVoice} setBrandVoice={setBrandVoice}
                    targetMarket={targetMarket} setTargetMarket={setTargetMarket}
                    brandBlurb={brandBlurb} setBrandBlurb={setBrandBlurb}
                    seedKeywords={seedKeywords} setSeedKeywords={setSeedKeywords}
                    generating={generating} enhanceField={enhanceField}
                  />
                  <StepNav activeSection={activeSection} totalSections={activeSections.length}
                    onNavigate={setActiveSection} onLaunch={handleProvision} canLaunch={canLaunch} />
                </div>
              )}

              {/* ── Step 2: Image Style ── */}
              {activeSection === 2 && (
                <div className="dc-section-wrap">
                  <ImageStyleSection imageStyle={imageStyle} setImageStyle={setImageStyle}
                    generating={generating} enhanceField={enhanceField}
                    niche={niche} generateStyleFromNiche={generateStyleFromNiche} />
                  <StepNav activeSection={activeSection} totalSections={activeSections.length}
                    onNavigate={setActiveSection} onLaunch={handleProvision} canLaunch={canLaunch} />
                </div>
              )}

              {/* ── Step 3: Products ── */}
              {activeSection === 3 && (
                <div className="dc-section-wrap">
                  <ProductSection
                    productName={productName} setProductName={setProductName}
                    productUrl={productUrl} setProductUrl={setProductUrl}
                    isAffiliate={isAffiliate} setIsAffiliate={setIsAffiliate}
                    affiliateLink={affiliateLink} setAffiliateLink={setAffiliateLink}
                    createProductPage={createProductPage} setCreateProductPage={setCreateProductPage}
                    additionalUrls={additionalUrls} signalUrls={signalUrls}
                    updateListItem={updateListItem} addListItem={addListItem}
                    setAdditionalUrls={setAdditionalUrls} setSignalUrls={setSignalUrls}
                    showExtras={true}
                  />
                  <StepNav activeSection={activeSection} totalSections={activeSections.length}
                    onNavigate={setActiveSection} onLaunch={handleProvision} canLaunch={canLaunch} />
                </div>
              )}

              {/* ── Step 4: Launch ── */}
              {activeSection === 4 && (
                <div className="dc-section-wrap">
                  <LaunchSection
                    displayName={displayName} setDisplayName={setDisplayName}
                    username={username} setUsername={setUsername}
                    domain={domain} setDomain={setDomain}
                    contactEmail={contactEmail}
                    websiteUrl={websiteUrl}
                    niche={niche} setNiche={setNiche}
                    logoUrl={logoUrl} setLogoUrl={setLogoUrl}
                    logoPrompt={logoPrompt} setLogoPrompt={setLogoPrompt}
                    generateLogo={generateLogo} generatingLogo={!!generating.logo}
                    authorName={authorName} setAuthorName={setAuthorName}
                    authorBio={authorBio} setAuthorBio={setAuthorBio}
                    authorImageUrl={authorImageUrl} setAuthorImageUrl={setAuthorImageUrl}
                    authorPageUrl={authorPageUrl} setAuthorPageUrl={setAuthorPageUrl}
                    authorSocials={authorSocials} setAuthorSocials={setAuthorSocials}
                    updateListItem={updateListItem} addListItem={addListItem}
                    stitchEnabled={stitchEnabled} setStitchEnabled={setStitchEnabled}
                    translationEnabled={translationEnabled} setTranslationEnabled={setTranslationEnabled}
                    selectedLanguages={selectedLanguages} setSelectedLanguages={setSelectedLanguages}
                    articlesPerDay={articlesPerDay} setArticlesPerDay={setArticlesPerDay}
                    primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
                    accentColor={accentColor} setAccentColor={setAccentColor}
                    flyRegion={flyRegion} setFlyRegion={setFlyRegion}
                    generateColorsFromNiche={generateColorsFromNiche}
                    suggestDomains={suggestDomains} loadingDomains={loadingDomains}
                    domainSuggestions={domainSuggestions} selectDomain={selectDomain}
                    selectedDomainData={selectedDomainData}
                    deriveUsername={deriveUsername}
                    manualDns={manualDns} setManualDns={setManualDns}
                    showDomainSearch={true} showNiche={true} showColors={true}
                  />
                  <StepNav activeSection={activeSection} totalSections={activeSections.length}
                    onNavigate={setActiveSection} onLaunch={handleProvision} canLaunch={canLaunch} />
                </div>
              )}

            </>)}

            {/* ═══════════════════════════════════
                NICHE-FIRST FLOW (6 steps)
                ═══════════════════════════════════ */}
            {mode === 'niche' && (<>

              {/* ── Step 0: Niche Input ONLY ── */}
              {activeSection === 0 && (
                <div className="dc-section-wrap">
                  <div className="dc-card">
                    <div className="dc-card-header"><h3>What niche do you want to target?</h3></div>
                    <div className="dc-card-body">
                      <div className="dc-field">
                        <label>Niche <span className="dc-required">*</span></label>
                        <input type="text" value={niche}
                          onChange={(e) => setNiche(e.target.value)}
                          placeholder="e.g., Home Insurance, AI Productivity Tools, Longevity Supplements"
                          className="dc-input-hero" autoFocus />
                        <span className="dc-hint">Be specific — &ldquo;home insurance&rdquo; is better than &ldquo;insurance&rdquo;. AI will research this market and generate everything.</span>
                      </div>

                      {niche && (
                        <div className="dc-ai-bar">
                          <div className="dc-ai-bar-info">
                            <h3>AI Niche Research</h3>
                            <p>Deep-researches the market, then generates brand voice, target audience, keywords, and image style.</p>
                          </div>
                          <button type="button" className="dc-btn dc-btn-ai"
                            onClick={generateFromNiche} disabled={generating.niche_all}>
                            {generating.niche_all ? <><span className="dc-spinner" /> Researching &amp; Generating...</> : 'Research Niche with AI'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <StepNav activeSection={activeSection} totalSections={activeSections.length}
                    onNavigate={setActiveSection} onLaunch={handleProvision} canLaunch={canLaunch} />
                </div>
              )}

              {/* ── Step 1: Domain Selection ── */}
              {activeSection === 1 && (
                <div className="dc-section-wrap">
                  <div className="dc-card">
                    <div className="dc-card-header"><h3>Choose a Domain</h3></div>
                    <div className="dc-card-body">
                      {domain && (
                        <div className="dc-selected-domain-banner">
                          <span className="dc-selected-domain-label">Selected:</span>
                          <span className="dc-selected-domain-name">{domain}</span>
                          {selectedDomainData && (
                            <span className="dc-selected-domain-price">${selectedDomainData.price}/{selectedDomainData.currency === 'USD' ? 'yr' : selectedDomainData.currency}</span>
                          )}
                        </div>
                      )}
                      {selectedDomainData && (
                        <label className="dc-toggle" style={{ marginTop: 8 }}>
                          <input type="checkbox" checked={manualDns}
                            onChange={(e) => setManualDns(e.target.checked)} />
                          <span>I&apos;ll register this domain and configure DNS myself</span>
                        </label>
                      )}

                      <div className="dc-domain-suggest-row">
                        <button type="button" className="dc-btn dc-btn-ai"
                          onClick={suggestDomains} disabled={loadingDomains || (!niche && !displayName)}>
                          {loadingDomains ? <><span className="dc-spinner" /> Searching...</> : 'Find Available Domains'}
                        </button>
                        <span className="dc-hint">Searches Google Cloud Domains for available domains under $15/year.</span>
                      </div>

                      {domainSuggestions.length > 0 && (
                        <div className="dc-domain-suggestions">
                          {domainSuggestions.map((s) => (
                            <button key={s.domain} type="button"
                              className={`dc-domain-chip ${domain === s.domain ? 'dc-domain-chip-selected' : ''}`}
                              onClick={() => selectDomain(s.domain, s)}>
                              <span className="dc-domain-chip-name">{s.domain}</span>
                              <span className="dc-domain-chip-price">${s.price}/{s.currency === 'USD' ? 'yr' : s.currency}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {!domainSuggestions.length && !loadingDomains && (
                        <div className="dc-field" style={{ marginTop: 16 }}>
                          <label>Or enter a domain manually</label>
                          <input type="text" value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="yourbrand.com" />
                        </div>
                      )}
                    </div>
                  </div>

                  <StepNav activeSection={activeSection} totalSections={activeSections.length}
                    onNavigate={setActiveSection} onLaunch={handleProvision} canLaunch={canLaunch} />
                </div>
              )}

              {/* ── Step 2: Brand Voice (guided builder) ── */}
              {activeSection === 2 && (
                <div className="dc-section-wrap">
                  <div className="dc-mode-banner dc-mode-banner-neutral">
                    <div className="dc-mode-banner-icon">&#x2139;&#xfe0f;</div>
                    <div>
                      <h3>Refine AI-Generated Profile</h3>
                      <p>Use the chips to guide the style, or edit the text directly. AI generated these from your niche research.</p>
                    </div>
                  </div>

                  <VoiceContentSection
                    brandVoice={brandVoice} setBrandVoice={setBrandVoice}
                    targetMarket={targetMarket} setTargetMarket={setTargetMarket}
                    brandBlurb={brandBlurb} setBrandBlurb={setBrandBlurb}
                    seedKeywords={seedKeywords} setSeedKeywords={setSeedKeywords}
                    generating={generating} enhanceField={enhanceField}
                  />

                  <StepNav activeSection={activeSection} totalSections={activeSections.length}
                    onNavigate={setActiveSection} onLaunch={handleProvision} canLaunch={canLaunch} />
                </div>
              )}

              {/* ── Step 3: Image Style ── */}
              {activeSection === 3 && (
                <div className="dc-section-wrap">
                  <ImageStyleSection imageStyle={imageStyle} setImageStyle={setImageStyle}
                    generating={generating} enhanceField={enhanceField}
                    niche={niche} generateStyleFromNiche={generateStyleFromNiche} />
                  <StepNav activeSection={activeSection} totalSections={activeSections.length}
                    onNavigate={setActiveSection} onLaunch={handleProvision} canLaunch={canLaunch} />
                </div>
              )}

              {/* ── Step 4: Products (manual only) ── */}
              {activeSection === 4 && (
                <div className="dc-section-wrap">
                  <div className="dc-mode-banner dc-mode-banner-neutral">
                    <div className="dc-mode-banner-icon">&#x1f4e6;</div>
                    <div>
                      <h3>Products (Optional)</h3>
                      <p>Add a known product below, or skip this step. Product discovery will happen in the Doubleclicker app after provisioning.</p>
                    </div>
                  </div>

                  <ProductSection
                    productName={productName} setProductName={setProductName}
                    productUrl={productUrl} setProductUrl={setProductUrl}
                    isAffiliate={isAffiliate} setIsAffiliate={setIsAffiliate}
                    affiliateLink={affiliateLink} setAffiliateLink={setAffiliateLink}
                    createProductPage={createProductPage} setCreateProductPage={setCreateProductPage}
                    additionalUrls={additionalUrls} signalUrls={signalUrls}
                    updateListItem={updateListItem} addListItem={addListItem}
                    setAdditionalUrls={setAdditionalUrls} setSignalUrls={setSignalUrls}
                    showExtras={false}
                  />

                  <StepNav activeSection={activeSection} totalSections={activeSections.length}
                    onNavigate={setActiveSection} onLaunch={handleProvision} canLaunch={canLaunch} />
                </div>
              )}

              {/* ── Step 5: Launch ── */}
              {activeSection === 5 && (
                <div className="dc-section-wrap">
                  <LaunchSection
                    displayName={displayName} setDisplayName={setDisplayName}
                    username={username} setUsername={setUsername}
                    domain={domain} setDomain={setDomain}
                    contactEmail={contactEmail}
                    websiteUrl={websiteUrl}
                    niche={niche} setNiche={setNiche}
                    logoUrl={logoUrl} setLogoUrl={setLogoUrl}
                    logoPrompt={logoPrompt} setLogoPrompt={setLogoPrompt}
                    generateLogo={generateLogo} generatingLogo={!!generating.logo}
                    authorName={authorName} setAuthorName={setAuthorName}
                    authorBio={authorBio} setAuthorBio={setAuthorBio}
                    authorImageUrl={authorImageUrl} setAuthorImageUrl={setAuthorImageUrl}
                    authorPageUrl={authorPageUrl} setAuthorPageUrl={setAuthorPageUrl}
                    authorSocials={authorSocials} setAuthorSocials={setAuthorSocials}
                    updateListItem={updateListItem} addListItem={addListItem}
                    stitchEnabled={stitchEnabled} setStitchEnabled={setStitchEnabled}
                    translationEnabled={translationEnabled} setTranslationEnabled={setTranslationEnabled}
                    selectedLanguages={selectedLanguages} setSelectedLanguages={setSelectedLanguages}
                    articlesPerDay={articlesPerDay} setArticlesPerDay={setArticlesPerDay}
                    primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
                    accentColor={accentColor} setAccentColor={setAccentColor}
                    flyRegion={flyRegion} setFlyRegion={setFlyRegion}
                    generateColorsFromNiche={generateColorsFromNiche}
                    suggestDomains={suggestDomains} loadingDomains={loadingDomains}
                    domainSuggestions={domainSuggestions} selectDomain={selectDomain}
                    selectedDomainData={selectedDomainData}
                    deriveUsername={deriveUsername}
                    manualDns={manualDns} setManualDns={setManualDns}
                    showDomainSearch={false} showNiche={false} showColors={true}
                  />
                  <StepNav activeSection={activeSection} totalSections={activeSections.length}
                    onNavigate={setActiveSection} onLaunch={handleProvision} canLaunch={canLaunch} />
                </div>
              )}

            </>)}

          </div>
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
        </div>{/* end dc-scroll-area */}
      </main>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

/* ── Guided Multi-Select Chips ── */
function GuidedChips({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void
}) {
  const toggleChip = (chip: string) => {
    const current = value.trim()
    if (current.toLowerCase().includes(chip.toLowerCase())) {
      // Remove it
      const regex = new RegExp(`,?\\s*${chip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
      onChange(current.replace(regex, '').replace(/^,\s*/, '').trim())
    } else {
      // Append it
      onChange(current ? `${current}, ${chip}` : chip)
    }
  }

  return (
    <div className="dc-guided-chips">
      {options.map((opt) => (
        <button key={opt} type="button"
          className={`dc-chip ${value.toLowerCase().includes(opt.toLowerCase()) ? 'dc-chip-selected' : ''}`}
          onClick={() => toggleChip(opt)}>
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ── Voice & Content Section (shared between brand/niche flows) ── */
function VoiceContentSection({ brandVoice, setBrandVoice, targetMarket, setTargetMarket,
  brandBlurb, setBrandBlurb, seedKeywords, setSeedKeywords, generating, enhanceField }: {
  brandVoice: string; setBrandVoice: (v: string) => void
  targetMarket: string; setTargetMarket: (v: string) => void
  brandBlurb: string; setBrandBlurb: (v: string) => void
  seedKeywords: string; setSeedKeywords: (v: string) => void
  generating: Record<string, boolean>; enhanceField: (section: string, content: string) => void
}) {
  return (
    <>
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Brand Voice</h3>
          <EnhanceButton loading={generating.brand_voice} onClick={() => enhanceField('brand_voice', brandVoice)} />
        </div>
        <div className="dc-card-body">
          <GuidedChips options={BRAND_VOICE_OPTIONS} value={brandVoice} onChange={setBrandVoice} />
          <div className="dc-field">
            <textarea value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)}
              placeholder="Select chips above or describe your brand voice..." rows={3} />
          </div>
        </div>
      </div>

      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Target Market</h3>
          <EnhanceButton loading={generating.target_market} onClick={() => enhanceField('target_market', targetMarket)} />
        </div>
        <div className="dc-card-body">
          <GuidedChips options={TARGET_MARKET_OPTIONS} value={targetMarket} onChange={setTargetMarket} />
          <div className="dc-field">
            <textarea value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)}
              placeholder="Select chips above or describe your target audience..." rows={3} />
          </div>
        </div>
      </div>

      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Brand Blurb</h3>
          <EnhanceButton loading={generating.brand_blurb} onClick={() => enhanceField('brand_blurb', brandBlurb)} />
        </div>
        <div className="dc-card-body">
          <div className="dc-field">
            <textarea value={brandBlurb} onChange={(e) => setBrandBlurb(e.target.value)}
              placeholder="2-4 sentences describing the brand. Injected into every article prompt." rows={3} />
          </div>
        </div>
      </div>

      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Seed Keywords</h3>
          <EnhanceButton loading={generating.seed_keywords} onClick={() => enhanceField('seed_keywords', seedKeywords)} />
        </div>
        <div className="dc-card-body">
          <div className="dc-field">
            <textarea value={seedKeywords} onChange={(e) => setSeedKeywords(e.target.value)}
              placeholder="Comma-separated keyword phrases (2-4 words each)" rows={3} />
            <span className="dc-hint">AI expands these during keyword discovery — they set the topical direction.</span>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Image Style Section ── */
function ImageStyleSection({ imageStyle, setImageStyle, generating, enhanceField, niche, generateStyleFromNiche }: {
  imageStyle: ImageStyle; setImageStyle: React.Dispatch<React.SetStateAction<ImageStyle>>
  generating: Record<string, boolean>; enhanceField: (section: string, content: string | ImageStyle) => void
  niche: string; generateStyleFromNiche: () => void
}) {
  return (
    <div className="dc-card">
      <div className="dc-card-header">
        <h3>Image Style</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {niche && (
            <button type="button" className="dc-btn dc-btn-secondary dc-btn-sm" onClick={generateStyleFromNiche}
              disabled={generating.niche_style}>
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
        <ComboField label="Composition" value={imageStyle.composition_style}
          options={COMPOSITIONS}
          onChange={(v) => setImageStyle((s) => ({ ...s, composition_style: v }))} />
        <ComboField label="Lighting" value={imageStyle.lighting_preferences}
          options={LIGHTINGS}
          onChange={(v) => setImageStyle((s) => ({ ...s, lighting_preferences: v }))} />
        <ComboField label="Image Type" value={imageStyle.image_type_preferences}
          options={IMAGE_TYPES}
          onChange={(v) => setImageStyle((s) => ({ ...s, image_type_preferences: v }))} />
        <ComboField label="Subject Guidelines" value={imageStyle.subject_guidelines}
          options={SUBJECTS}
          onChange={(v) => setImageStyle((s) => ({ ...s, subject_guidelines: v }))} />
        <div className="dc-field">
          <label>AI Prompt Instructions</label>
          <textarea value={imageStyle.ai_prompt_instructions}
            onChange={(e) => setImageStyle((s) => ({ ...s, ai_prompt_instructions: e.target.value }))}
            placeholder={'Detailed instructions for AI image generation appended to every prompt.\nExample: "Shot on Sony A7 III, 85mm lens, f/1.8."'}
            rows={3} />
        </div>
      </div>
    </div>
  )
}

/* ── Product Section ── */
function ProductSection({ productName, setProductName, productUrl, setProductUrl,
  isAffiliate, setIsAffiliate, affiliateLink, setAffiliateLink,
  createProductPage, setCreateProductPage,
  additionalUrls, signalUrls, updateListItem, addListItem,
  setAdditionalUrls, setSignalUrls, showExtras }: {
  productName: string; setProductName: (v: string) => void
  productUrl: string; setProductUrl: (v: string) => void
  isAffiliate: boolean; setIsAffiliate: (v: boolean) => void
  affiliateLink: string; setAffiliateLink: (v: string) => void
  createProductPage: boolean; setCreateProductPage: (v: boolean) => void
  additionalUrls: string[]; signalUrls: string[]
  updateListItem: (setter: React.Dispatch<React.SetStateAction<string[]>>, i: number, val: string) => void
  addListItem: (setter: React.Dispatch<React.SetStateAction<string[]>>) => void
  setAdditionalUrls: React.Dispatch<React.SetStateAction<string[]>>
  setSignalUrls: React.Dispatch<React.SetStateAction<string[]>>
  showExtras: boolean
}) {
  return (
    <div className="dc-card">
      <div className="dc-card-header"><h3>Add a Product (Optional)</h3></div>
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

        {showExtras && (
          <>
            <label className="dc-toggle">
              <input type="checkbox" checked={createProductPage}
                onChange={(e) => setCreateProductPage(e.target.checked)} />
              <span>Create a dedicated product page</span>
            </label>

            <div className="dc-field">
              <label>Additional URLs (docs, pricing)</label>
              {additionalUrls.map((url, i) => (
                <input key={i} type="url" value={url}
                  onChange={(e) => updateListItem(setAdditionalUrls, i, e.target.value)}
                  placeholder="https://docs.cursor.com" className="dc-list-input" />
              ))}
              <button type="button" className="dc-btn-link" onClick={() => addListItem(setAdditionalUrls)}>+ Add another</button>
            </div>
            <div className="dc-field">
              <label>Signal URLs (videos or blog posts)</label>
              {signalUrls.map((url, i) => (
                <input key={i} type="url" value={url}
                  onChange={(e) => updateListItem(setSignalUrls, i, e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..." className="dc-list-input" />
              ))}
              <button type="button" className="dc-btn-link" onClick={() => addListItem(setSignalUrls)}>+ Add another</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Launch Section (shared between brand/niche flows) ── */
function LaunchSection({ displayName, setDisplayName, username, setUsername,
  domain, setDomain, contactEmail, websiteUrl, niche, setNiche,
  logoUrl, setLogoUrl, logoPrompt, setLogoPrompt, generateLogo, generatingLogo,
  authorName, setAuthorName, authorBio, setAuthorBio,
  authorImageUrl, setAuthorImageUrl, authorPageUrl, setAuthorPageUrl,
  authorSocials, setAuthorSocials, updateListItem, addListItem,
  stitchEnabled, setStitchEnabled,
  translationEnabled, setTranslationEnabled,
  selectedLanguages, setSelectedLanguages,
  articlesPerDay, setArticlesPerDay,
  primaryColor, setPrimaryColor, accentColor, setAccentColor,
  flyRegion, setFlyRegion, generateColorsFromNiche,
  suggestDomains, loadingDomains, domainSuggestions, selectDomain,
  selectedDomainData, deriveUsername,
  manualDns, setManualDns,
  showDomainSearch, showNiche, showColors }: {
  displayName: string; setDisplayName: (v: string) => void
  username: string; setUsername: (v: string) => void
  domain: string; setDomain: (v: string) => void
  contactEmail: string; websiteUrl: string
  niche: string; setNiche: (v: string) => void
  logoUrl: string; setLogoUrl: (v: string) => void
  logoPrompt: string; setLogoPrompt: (v: string) => void
  generateLogo: () => void; generatingLogo: boolean
  authorName: string; setAuthorName: (v: string) => void
  authorBio: string; setAuthorBio: (v: string) => void
  authorImageUrl: string; setAuthorImageUrl: (v: string) => void
  authorPageUrl: string; setAuthorPageUrl: (v: string) => void
  authorSocials: string[]; setAuthorSocials: React.Dispatch<React.SetStateAction<string[]>>
  updateListItem: (setter: React.Dispatch<React.SetStateAction<string[]>>, i: number, val: string) => void
  addListItem: (setter: React.Dispatch<React.SetStateAction<string[]>>) => void
  stitchEnabled: boolean; setStitchEnabled: (v: boolean) => void
  translationEnabled: boolean; setTranslationEnabled: (v: boolean) => void
  selectedLanguages: string[]; setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>
  articlesPerDay: number; setArticlesPerDay: (v: number) => void
  primaryColor: string; setPrimaryColor: (v: string) => void
  accentColor: string; setAccentColor: (v: string) => void
  flyRegion: string; setFlyRegion: (v: string) => void
  generateColorsFromNiche: () => void
  suggestDomains: () => void; loadingDomains: boolean
  domainSuggestions: DomainSuggestion[]; selectDomain: (d: string, s?: DomainSuggestion) => void
  selectedDomainData: DomainSuggestion | null
  deriveUsername: (name: string) => string
  manualDns: boolean; setManualDns: (v: boolean) => void
  showDomainSearch: boolean; showNiche: boolean; showColors: boolean
}) {
  return (
    <>
      {/* Brand Identity */}
      <div className="dc-card">
        <div className="dc-card-header"><h3>Brand Identity</h3></div>
        <div className="dc-card-body">
          <div className="dc-field">
            <label>Company / Brand Name <span className="dc-required">*</span></label>
            <input type="text" value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                if (!username || username === deriveUsername(displayName)) {
                  setUsername(deriveUsername(e.target.value))
                }
              }}
              placeholder="e.g., Assureful Insurance" />
          </div>

          {showNiche && (
            <div className="dc-field">
              <label>Niche</label>
              <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., AI Productivity Tools" />
              <span className="dc-hint">Optional — helps focus keyword research around a topic.</span>
            </div>
          )}

          {/* Domain & email - read-only if already selected, otherwise editable with search */}
          {domain && !showDomainSearch ? (
            <div className="dc-readonly-group">
              <div className="dc-field">
                <label>Domain</label>
                <div className="dc-readonly-field">{domain}</div>
              </div>
              <div className="dc-field">
                <label>Contact Email</label>
                <div className="dc-readonly-field">{contactEmail || `contact@${domain}`}</div>
              </div>
              <div className="dc-field">
                <label>Website URL</label>
                <div className="dc-readonly-field">{websiteUrl || `https://www.${domain}`}</div>
              </div>
            </div>
          ) : showDomainSearch ? (
            <>
              <div className="dc-field-row">
                <div className="dc-field">
                  <label>Domain</label>
                  <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)}
                    placeholder="acmecorp.com" />
                </div>
                <div className="dc-field">
                  <label>Contact Email</label>
                  <input type="email" value={contactEmail} readOnly
                    placeholder="Auto-filled from domain" />
                  <span className="dc-hint">Auto-filled from domain.</span>
                </div>
              </div>

              <div className="dc-domain-suggest-row">
                <button type="button" className="dc-btn dc-btn-secondary dc-btn-sm"
                  onClick={suggestDomains} disabled={loadingDomains}>
                  {loadingDomains ? <><span className="dc-spinner" /> Searching...</> : 'Find Available Domains'}
                </button>
                {domainSuggestions.length > 0 && (
                  <div className="dc-domain-suggestions">
                    {domainSuggestions.map((s) => (
                      <button key={s.domain} type="button"
                        className={`dc-domain-chip ${domain === s.domain ? 'dc-domain-chip-selected' : ''}`}
                        onClick={() => selectDomain(s.domain, s)}>
                        <span className="dc-domain-chip-name">{s.domain}</span>
                        <span className="dc-domain-chip-price">${s.price}/{s.currency === 'USD' ? 'yr' : s.currency}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}

          <div className="dc-field">
            <label>Logo</label>
            <input type="text" value={logoPrompt} onChange={(e) => setLogoPrompt(e.target.value)}
              placeholder="Describe the logo you want AI to generate..." />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <button type="button" className="dc-btn dc-btn-ai" onClick={generateLogo}
                disabled={generatingLogo || !logoPrompt}>
                {generatingLogo ? <><span className="dc-spinner" /> Generating...</> : 'Generate Logo'}
              </button>
              <span className="dc-hint">or paste a URL below</span>
            </div>
            {logoUrl && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo preview" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', border: '1px solid #e2e8f0' }} />
                <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://yoursite.com/logo.png" style={{ flex: 1 }} />
              </div>
            )}
            {!logoUrl && (
              <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://yoursite.com/logo.png" style={{ marginTop: 8 }} />
            )}
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
                placeholder={displayName ? `${displayName} Editorial` : 'Author name'} />
            </div>
            <div className="dc-field">
              <label>Author Image URL</label>
              <input type="url" value={authorImageUrl}
                onChange={(e) => setAuthorImageUrl(e.target.value)}
                placeholder="https://…/author.jpg" />
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
              placeholder="1-3 sentences about the author" rows={2} />
          </div>
          <div className="dc-field">
            <label>Author Social Profile URLs</label>
            {authorSocials.map((url, i) => (
              <input key={i} type="url" value={url}
                onChange={(e) => updateListItem(setAuthorSocials, i, e.target.value)}
                placeholder="https://linkedin.com/in/yourname" className="dc-list-input" />
            ))}
            <button type="button" className="dc-btn-link" onClick={() => addListItem(setAuthorSocials)}>+ Add another</button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      {showColors && (
        <div className="dc-card">
          <div className="dc-card-header">
            <h3>Appearance</h3>
            {niche && (
              <button type="button" className="dc-btn dc-btn-secondary dc-btn-sm" onClick={generateColorsFromNiche}>
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
      )}

      {/* Deployment Settings */}
      <div className="dc-card">
        <div className="dc-card-header"><h3>Deployment Settings</h3></div>
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
              <input type="checkbox" checked={stitchEnabled}
                onChange={(e) => setStitchEnabled(e.target.checked)} />
              <span>Auto-generate videos via Stitch for published articles</span>
            </label>
          </div>

          {selectedDomainData && (
            <div className="dc-domain-purchase-info" style={{ marginTop: 12 }}>
              <div className="dc-domain-purchase-name">{selectedDomainData.domain}</div>
              <div className="dc-domain-purchase-price">
                ${selectedDomainData.price}/{selectedDomainData.currency === 'USD' ? 'yr' : selectedDomainData.currency}
                {manualDns ? ' — DNS records will be provided after provisioning' : ' — will be purchased automatically'}
              </div>
              <label className="dc-toggle" style={{ marginTop: 8 }}>
                <input type="checkbox" checked={manualDns}
                  onChange={(e) => setManualDns(e.target.checked)} />
                <span>I&apos;ll register this domain and configure DNS myself</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Content Cadence */}
      <div className="dc-card">
        <div className="dc-card-header"><h3>Content Cadence</h3></div>
        <div className="dc-card-body">
          <div className="dc-field">
            <label>Articles per Day</label>
            <input type="number" min={1} max={20} value={articlesPerDay}
              onChange={(e) => setArticlesPerDay(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} />
            <span className="dc-hint">How many articles to schedule per day (default: 5).</span>
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
            <span>Enable multi-language translation</span>
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
    </>
  )
}

/* ── Step Navigation ── */
function StepNav({ activeSection, totalSections, onNavigate, onLaunch, canLaunch }: {
  activeSection: number; totalSections: number; onNavigate: (i: number) => void; onLaunch: () => void; canLaunch: boolean
}) {
  const isLast = activeSection === totalSections - 1
  return (
    <div className="dc-step-nav">
      {activeSection > 0 && (
        <button type="button" className="dc-btn dc-btn-secondary" onClick={() => onNavigate(activeSection - 1)}>Back</button>
      )}
      <div className="dc-step-nav-spacer" />
      {isLast ? (
        <button type="button" className="dc-btn dc-btn-launch" onClick={onLaunch} disabled={!canLaunch}>
          Launch Provisioning
        </button>
      ) : (
        <button type="button" className="dc-btn dc-btn-primary" onClick={() => onNavigate(activeSection + 1)}>Next</button>
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

function ComboField({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  return (
    <div className="dc-field">
      <label>{label}</label>
      <div className="dc-combo">
        <select title={label} value={options.includes(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}>
          <option value="">Pick {label.toLowerCase()}…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="dc-combo-or">or type freely…</span>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Custom ${label.toLowerCase()}`} />
      </div>
    </div>
  )
}

function PipelinePhases({ phase, pipelineStatus, provisionResult, purchaseDomain }: {
  phase: Phase; pipelineStatus: PipelineStatus | null; provisionResult: any; purchaseDomain: boolean
}) {
  const n = provisionResult?.notifications
  const phases = [
    { label: 'Seed Database', status: provisionResult ? 'completed' : 'pending' },
    {
      label: 'Google Services',
      status: n?.google_analytics?.status === 'error' || n?.google_tag_manager?.status === 'error' ? 'failed'
        : n?.google_analytics || n?.google_tag_manager ? 'completed'
        : provisionResult ? 'pending' : 'pending',
    },
    {
      label: 'Doubleclicker',
      status: phase === 'tracking' ? 'running'
        : pipelineStatus?.status === 'completed' ? 'completed'
        : pipelineStatus?.status === 'failed' ? 'failed'
        : n?.doubleclicker?.status === 'skipped' ? 'skipped'
        : phase === 'done' ? 'completed' : 'pending',
    },
    {
      label: 'Domain Purchase',
      status: !purchaseDomain ? 'skipped'
        : n?.domain_purchase?.status === 'error' ? 'failed'
        : n?.domain_purchase ? 'completed'
        : n?.domain_purchase?.status === 'skipped' ? 'skipped' : 'pending',
    },
    {
      label: 'Fly.io Deploy',
      status: provisionResult?.fly?.app ? 'completed'
        : n?.fly?.status === 'skipped' ? 'skipped' : 'pending',
    },
    {
      label: 'Search Console',
      status: n?.search_console?.status === 'error' ? 'failed'
        : n?.search_console ? 'completed'
        : n?.search_console?.status === 'skipped' ? 'skipped' : 'pending',
    },
    {
      label: 'Domain & Certs',
      status: n?.domain?.status === 'skipped' ? 'skipped'
        : n?.domain ? 'completed' : 'pending',
    },
    {
      label: 'Auto DNS',
      status: !purchaseDomain ? 'skipped'
        : n?.dns_auto_config?.status === 'configured' ? 'completed'
        : n?.dns_auto_config?.status === 'deferred' ? 'failed'
        : 'pending',
    },
    {
      label: 'Email DNS',
      status: n?.email?.status === 'sent' ? 'completed'
        : n?.email?.status === 'failed' || n?.email?.status === 'error' ? 'failed'
        : provisionResult?.dns_records?.length > 0 ? 'completed' : 'pending',
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
