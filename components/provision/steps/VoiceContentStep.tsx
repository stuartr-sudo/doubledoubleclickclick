'use client'

import { useProvisionContext, type ImageStyleConfig } from '../ProvisionContext'

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

async function dcPost(
  endpoint: string,
  body: Record<string, unknown> = {},
  provisionSecret?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (provisionSecret) headers['x-provision-secret'] = provisionSecret
  const res = await fetch('/api/admin/dc-proxy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ endpoint, ...body }),
  })
  const data = await res.json()
  if (!res.ok && !data.success) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

function toggleChip(current: string, chip: string): string {
  if (current.toLowerCase().includes(chip.toLowerCase())) {
    const regex = new RegExp(`,?\\s*${chip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
    return current.replace(regex, '').replace(/^,\s*/, '').trim()
  }
  return current ? `${current}, ${chip}` : chip
}

function applyColorsFromPalette(colorPalette: unknown): { primary?: string; accent?: string } {
  if (!colorPalette) return {}
  const paletteStr = typeof colorPalette === 'string' ? colorPalette : JSON.stringify(colorPalette)
  const hexMatches = paletteStr.match(/#[0-9a-fA-F]{6}/g)
  if (hexMatches && hexMatches.length >= 2) return { primary: hexMatches[0], accent: hexMatches[1] }
  if (hexMatches && hexMatches.length === 1) return { primary: hexMatches[0] }
  return {}
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function VoiceContentStep() {
  const { state, dispatch } = useProvisionContext()

  const updateField = (field: keyof typeof state, value: typeof state[keyof typeof state]) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  const enhanceField = async (section: string, currentContent: string | ImageStyleConfig) => {
    dispatch({ type: 'SET_GENERATING', key: section, value: true })
    dispatch({ type: 'SET_FIELD', field: 'error', value: null })

    try {
      const contextParts: string[] = []
      if (state.niche) contextParts.push(`Niche: ${state.niche}`)
      if (state.displayName) contextParts.push(`Brand: ${state.displayName}`)
      if (state.username) contextParts.push(`Brand username: ${state.username}`)

      const data = await dcPost(
        '/api/strategy/enhance-brand',
        {
          section,
          current_content: currentContent,
          website_url: state.websiteUrl || undefined,
          niche: state.niche || undefined,
          additional_context: contextParts.length > 0 ? contextParts.join('. ') : undefined,
        },
        state.provisionSecret,
      )
      if (!data.success) throw new Error(data.error || 'Enhancement failed')

      const updates: Record<string, unknown> = {}
      if (section === 'brand_voice' && data.brand_voice) updates.brandVoice = data.brand_voice
      if (section === 'target_market' && data.target_market) updates.targetMarket = data.target_market
      if (section === 'brand_blurb' && data.brand_blurb) updates.brandBlurb = data.brand_blurb
      if (section === 'seed_keywords' && data.seed_keywords) updates.seedKeywords = data.seed_keywords
      if (section === 'image_style' && data.image_style) {
        updates.imageStyle = { ...state.imageStyle, ...data.image_style }
        const colors = applyColorsFromPalette(data.image_style.color_palette)
        if (colors.primary) updates.primaryColor = colors.primary
        if (colors.accent) updates.accentColor = colors.accent
      }

      if (Object.keys(updates).length > 0) dispatch({ type: 'SET_FIELDS', fields: updates })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Enhancement failed'
      dispatch({ type: 'SET_FIELD', field: 'error', value: msg })
    } finally {
      dispatch({ type: 'SET_GENERATING', key: section, value: false })
    }
  }

  return (
    <>
      {/* Brand Voice */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Brand Voice</h3>
          <button
            type="button"
            className="dc-btn dc-btn-enhance"
            onClick={() => enhanceField('brand_voice', state.brandVoice)}
            disabled={state.generating.brand_voice}
          >
            {state.generating.brand_voice ? (
              <><span className="dc-spinner" /> Enhancing...</>
            ) : (
              'Enhance with AI'
            )}
          </button>
        </div>
        <div className="dc-card-body">
          <div className="dc-guided-chips">
            {BRAND_VOICE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`dc-chip ${state.brandVoice.toLowerCase().includes(opt.toLowerCase()) ? 'dc-chip-selected' : ''}`}
                onClick={() => updateField('brandVoice', toggleChip(state.brandVoice, opt))}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="dc-field">
            <textarea
              value={state.brandVoice}
              onChange={(e) => updateField('brandVoice', e.target.value)}
              placeholder="Select chips above or describe your brand voice..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Target Market */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Target Market</h3>
          <button
            type="button"
            className="dc-btn dc-btn-enhance"
            onClick={() => enhanceField('target_market', state.targetMarket)}
            disabled={state.generating.target_market}
          >
            {state.generating.target_market ? (
              <><span className="dc-spinner" /> Enhancing...</>
            ) : (
              'Enhance with AI'
            )}
          </button>
        </div>
        <div className="dc-card-body">
          <div className="dc-guided-chips">
            {TARGET_MARKET_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`dc-chip ${state.targetMarket.toLowerCase().includes(opt.toLowerCase()) ? 'dc-chip-selected' : ''}`}
                onClick={() => updateField('targetMarket', toggleChip(state.targetMarket, opt))}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="dc-field">
            <textarea
              value={state.targetMarket}
              onChange={(e) => updateField('targetMarket', e.target.value)}
              placeholder="Select chips above or describe your target audience..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Brand Blurb */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Brand Blurb</h3>
          <button
            type="button"
            className="dc-btn dc-btn-enhance"
            onClick={() => enhanceField('brand_blurb', state.brandBlurb)}
            disabled={state.generating.brand_blurb}
          >
            {state.generating.brand_blurb ? (
              <><span className="dc-spinner" /> Enhancing...</>
            ) : (
              'Enhance with AI'
            )}
          </button>
        </div>
        <div className="dc-card-body">
          <div className="dc-field">
            <textarea
              value={state.brandBlurb}
              onChange={(e) => updateField('brandBlurb', e.target.value)}
              placeholder="2-4 sentences describing the brand. Injected into every article prompt."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Seed Keywords */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Seed Keywords</h3>
          <button
            type="button"
            className="dc-btn dc-btn-enhance"
            onClick={() => enhanceField('seed_keywords', state.seedKeywords)}
            disabled={state.generating.seed_keywords}
          >
            {state.generating.seed_keywords ? (
              <><span className="dc-spinner" /> Enhancing...</>
            ) : (
              'Enhance with AI'
            )}
          </button>
        </div>
        <div className="dc-card-body">
          <div className="dc-field">
            <textarea
              value={state.seedKeywords}
              onChange={(e) => updateField('seedKeywords', e.target.value)}
              placeholder="Comma-separated keyword phrases (2-4 words each)"
              rows={3}
            />
            <span className="dc-hint">
              AI expands these during keyword discovery &mdash; they set the
              topical direction.
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
