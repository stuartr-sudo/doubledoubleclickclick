'use client'

import { useState } from 'react'
import { useProvisionContext, emptyImageStyle } from '../ProvisionContext'

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

function suggestNicheColors(nicheStr: string): { primary: string; accent: string } {
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

export default function NicheStep() {
  const { state, dispatch } = useProvisionContext()
  const [loading, setLoading] = useState(false)

  const updateField = (field: keyof typeof state, value: typeof state[keyof typeof state]) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  const addLog = (msg: string) => {
    dispatch({
      type: 'ADD_LOG',
      log: { timestamp: new Date().toISOString(), message: msg },
    })
  }

  const generateFromNiche = async () => {
    if (!state.niche) return
    setLoading(true)
    dispatch({ type: 'SET_FIELD', field: 'error', value: null })

    const brandCtx = `Brand in the "${state.niche}" niche${state.displayName ? `, called "${state.displayName}"` : ''}.`

    try {
      addLog('Phase 1: Researching niche market...')
      const researchData = await dcPost(
        '/api/strategy/deep-niche-research',
        {
          niche: state.niche,
          brand_name: state.displayName || undefined,
          website_url: state.websiteUrl || undefined,
        },
        state.provisionSecret,
      )
      if (!researchData.success) throw new Error(researchData.error || 'Research failed')

      const rc = researchData.research
      addLog(
        `Research complete: ${rc.content_pillars?.length || 0} pillars, ${rc.keyword_themes?.length || 0} keyword themes`,
      )

      addLog('Phase 2: Generating brand profile from research...')
      const [voice, market, blurb, keywords, style] = await Promise.allSettled([
        dcPost('/api/strategy/enhance-brand', { section: 'brand_voice', current_content: `${brandCtx} Generate brand voice.`, niche: state.niche, research_context: rc }, state.provisionSecret),
        dcPost('/api/strategy/enhance-brand', { section: 'target_market', current_content: `${brandCtx} Define target audience.`, niche: state.niche, research_context: rc }, state.provisionSecret),
        dcPost('/api/strategy/enhance-brand', { section: 'brand_blurb', current_content: `${brandCtx} Write brand description.`, niche: state.niche, research_context: rc }, state.provisionSecret),
        dcPost('/api/strategy/enhance-brand', { section: 'seed_keywords', current_content: `${brandCtx} Generate seed keywords.`, niche: state.niche, research_context: rc }, state.provisionSecret),
        dcPost('/api/strategy/enhance-brand', { section: 'image_style', current_content: { ...emptyImageStyle, style_name: `${state.niche} Style` }, niche: state.niche, research_context: rc }, state.provisionSecret),
      ])

      const updates: Record<string, unknown> = { researchContext: rc }

      if (voice.status === 'fulfilled' && voice.value.brand_voice) updates.brandVoice = voice.value.brand_voice
      if (market.status === 'fulfilled' && market.value.target_market) updates.targetMarket = market.value.target_market
      if (blurb.status === 'fulfilled' && blurb.value.brand_blurb) updates.brandBlurb = blurb.value.brand_blurb
      if (keywords.status === 'fulfilled' && keywords.value.seed_keywords) updates.seedKeywords = keywords.value.seed_keywords

      if (style.status === 'fulfilled' && style.value.image_style) {
        updates.imageStyle = { ...state.imageStyle, ...style.value.image_style }
        const colors = applyColorsFromPalette(style.value.image_style.color_palette)
        if (colors.primary) updates.primaryColor = colors.primary
        if (colors.accent) updates.accentColor = colors.accent
        if (!colors.primary && !colors.accent) {
          const nicheColors = suggestNicheColors(state.niche)
          updates.primaryColor = nicheColors.primary
          updates.accentColor = nicheColors.accent
        }
      } else {
        const nicheColors = suggestNicheColors(state.niche)
        updates.primaryColor = nicheColors.primary
        updates.accentColor = nicheColors.accent
      }

      dispatch({ type: 'SET_FIELDS', fields: updates })
      addLog('Brand profile generated successfully')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate from niche'
      dispatch({ type: 'SET_FIELD', field: 'error', value: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dc-card">
      <div className="dc-card-header">
        <h3>What niche do you want to target?</h3>
      </div>
      <div className="dc-card-body">
        <div className="dc-field">
          <label>
            Niche <span className="dc-required">*</span>
          </label>
          <input
            type="text"
            value={state.niche}
            onChange={(e) => updateField('niche', e.target.value)}
            placeholder='e.g., Home Insurance, AI Productivity Tools, Longevity Supplements'
            className="dc-input-hero"
            autoFocus
          />
          <span className="dc-hint">
            Be specific &mdash; &ldquo;home insurance&rdquo; is better than
            &ldquo;insurance&rdquo;. AI will research this market and generate
            everything.
          </span>
        </div>

        {state.niche && (
          <div className="dc-ai-bar">
            <div className="dc-ai-bar-info">
              <h3>AI Niche Research</h3>
              <p>
                Deep-researches the market, then generates brand voice, target
                audience, keywords, and image style.
              </p>
            </div>
            <button
              type="button"
              className="dc-btn dc-btn-ai"
              onClick={generateFromNiche}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="dc-spinner" /> Researching &amp;
                  Generating...
                </>
              ) : (
                'Research Niche with AI'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
