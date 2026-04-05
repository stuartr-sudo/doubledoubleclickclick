'use client'

import { useState } from 'react'
import { useProvisionContext } from '../ProvisionContext'

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

export default function BrandUrlStep() {
  const { state, dispatch } = useProvisionContext()
  const [loading, setLoading] = useState(false)

  const updateField = (field: keyof typeof state, value: typeof state[keyof typeof state]) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  const generateAll = async () => {
    if (!state.websiteUrl) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: 'Website URL is required for AI generation' })
      return
    }
    setLoading(true)
    dispatch({ type: 'SET_FIELD', field: 'error', value: null })

    try {
      const data = await dcPost(
        '/api/strategy/auto-brand',
        {
          product_url: state.websiteUrl,
          product_name: state.displayName || undefined,
        },
        state.provisionSecret,
      )
      if (!data.success) throw new Error(data.error || 'AI generation failed')

      const updates: Record<string, unknown> = {}
      if (data.brand_voice) updates.brandVoice = data.brand_voice
      if (data.target_market) updates.targetMarket = data.target_market
      if (data.brand_blurb) updates.brandBlurb = data.brand_blurb
      if (data.seed_keywords) updates.seedKeywords = data.seed_keywords
      if (data.product_name && !state.displayName) updates.displayName = data.product_name
      if (data.image_style) {
        updates.imageStyle = { ...state.imageStyle, ...data.image_style }
        const colors = applyColorsFromPalette(data.image_style.color_palette)
        if (colors.primary) updates.primaryColor = colors.primary
        if (colors.accent) updates.accentColor = colors.accent
      }

      dispatch({ type: 'SET_FIELDS', fields: updates })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI generation failed'
      dispatch({ type: 'SET_FIELD', field: 'error', value: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dc-card">
      <div className="dc-card-header">
        <h3>Step 1: Your Website</h3>
      </div>
      <div className="dc-card-body">
        <div className="dc-field">
          <label>
            Website URL <span className="dc-required">*</span>
          </label>
          <input
            type="url"
            value={state.websiteUrl}
            onChange={(e) => updateField('websiteUrl', e.target.value)}
            placeholder="https://yourwebsite.com"
            className="dc-input-hero"
            autoFocus
          />
          <span className="dc-hint">
            AI will scrape this to extract brand name, voice, target market,
            keywords, and image style.
          </span>
        </div>

        <div className="dc-ai-bar">
          <div className="dc-ai-bar-info">
            <h3>AI Brand Setup</h3>
            <p>
              One click generates everything from your URL. You can refine
              later.
            </p>
          </div>
          <button
            type="button"
            className="dc-btn dc-btn-ai"
            onClick={generateAll}
            disabled={loading || !state.websiteUrl}
          >
            {loading ? (
              <>
                <span className="dc-spinner" /> Generating...
              </>
            ) : (
              'Generate All with AI'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
