'use client'

import { useState, useRef } from 'react'
import { useProvisionContext, emptyImageStyle, type ImageStyleConfig } from '../ProvisionContext'

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const VISUAL_STYLES = ['Photorealistic', 'Digital Art', 'Watercolor', 'Oil Painting', 'Minimalist', 'Flat Design', 'Isometric', '3D Render', 'Line Art', 'Vintage / Retro', 'Collage', 'Pop Art']
const MOODS = ['Professional', 'Warm & Inviting', 'Bold & Energetic', 'Calm & Serene', 'Luxurious', 'Playful', 'Dark & Moody', 'Clean & Modern', 'Futuristic', 'Earthy & Organic', 'Whimsical', 'Cinematic']
const COMPOSITIONS = ['Rule of Thirds', 'Centered', 'Symmetrical', 'Golden Ratio', 'Leading Lines', 'Negative Space', 'Full Bleed', 'Diagonal', 'Frame within Frame']
const LIGHTINGS = ['Natural Daylight', 'Golden Hour', 'Studio Lighting', 'Soft Diffused', 'Dramatic Chiaroscuro', 'Neon / Colorful', 'Backlit', 'Overcast / Flat', 'Candlelight / Warm']
const IMAGE_TYPES = ['Photography', 'Illustration', 'Infographic', 'Abstract', 'Lifestyle', 'Product Shot', 'Conceptual', 'Macro / Close-up', 'Aerial / Drone']
const SUBJECTS = ['People', 'Technology', 'Nature', 'Architecture', 'Abstract Shapes', 'Data Visualization', 'Workspace', 'Animals', 'Food & Drink']

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
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

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
          <option value="">Pick {label.toLowerCase()}...</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span className="dc-combo-or">or type freely...</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Custom ${label.toLowerCase()}`}
        />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function ImageStyleStep() {
  const { state, dispatch } = useProvisionContext()
  const [generatingLogo, setGeneratingLogo] = useState(false)
  const logoAbortRef = useRef<AbortController | null>(null)

  const updateField = (field: keyof typeof state, value: typeof state[keyof typeof state]) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  const updateImageStyle = (key: keyof ImageStyleConfig, value: string) => {
    dispatch({
      type: 'SET_FIELD',
      field: 'imageStyle',
      value: { ...state.imageStyle, [key]: value },
    })
  }

  const enhanceImageStyle = async () => {
    dispatch({ type: 'SET_GENERATING', key: 'image_style', value: true })
    dispatch({ type: 'SET_FIELD', field: 'error', value: null })

    try {
      const contextParts: string[] = []
      if (state.niche) contextParts.push(`Niche: ${state.niche}`)
      if (state.displayName) contextParts.push(`Brand: ${state.displayName}`)

      const data = await dcPost(
        '/api/strategy/enhance-brand',
        {
          section: 'image_style',
          current_content: state.imageStyle,
          website_url: state.websiteUrl || undefined,
          niche: state.niche || undefined,
          additional_context: contextParts.length > 0 ? contextParts.join('. ') : undefined,
        },
        state.provisionSecret,
      )

      if (data.image_style) {
        const updates: Record<string, unknown> = {
          imageStyle: { ...state.imageStyle, ...data.image_style },
        }
        const colors = applyColorsFromPalette(data.image_style.color_palette)
        if (colors.primary) updates.primaryColor = colors.primary
        if (colors.accent) updates.accentColor = colors.accent
        dispatch({ type: 'SET_FIELDS', fields: updates })
      } else {
        dispatch({
          type: 'SET_FIELD',
          field: 'error',
          value: 'No image style returned from AI. Try adding a niche first.',
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Enhancement failed'
      dispatch({ type: 'SET_FIELD', field: 'error', value: msg })
    } finally {
      dispatch({ type: 'SET_GENERATING', key: 'image_style', value: false })
    }
  }

  const generateStyleFromNiche = async () => {
    if (!state.niche) return
    dispatch({ type: 'SET_GENERATING', key: 'niche_style', value: true })
    dispatch({ type: 'SET_FIELD', field: 'error', value: null })

    const brandCtx = `Brand in the "${state.niche}" niche${state.displayName ? `, called "${state.displayName}"` : ''}.`
    try {
      const data = await dcPost(
        '/api/strategy/enhance-brand',
        {
          section: 'image_style',
          current_content: { ...emptyImageStyle, style_name: `${state.niche} Style` },
          niche: state.niche,
          context: brandCtx,
        },
        state.provisionSecret,
      )
      if (data.image_style) {
        const updates: Record<string, unknown> = {
          imageStyle: { ...state.imageStyle, ...data.image_style },
        }
        const colors = applyColorsFromPalette(data.image_style.color_palette)
        if (colors.primary) updates.primaryColor = colors.primary
        if (colors.accent) updates.accentColor = colors.accent
        dispatch({ type: 'SET_FIELDS', fields: updates })
      } else {
        dispatch({
          type: 'SET_FIELD',
          field: 'error',
          value: 'No image style returned -- DC may need niche support in enhance-brand.',
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Style generation failed'
      dispatch({ type: 'SET_FIELD', field: 'error', value: msg })
    } finally {
      dispatch({ type: 'SET_GENERATING', key: 'niche_style', value: false })
    }
  }

  const generateLogo = async () => {
    const prompt =
      state.logoPrompt ||
      `Abstract, minimal logo mark for a ${state.niche || 'modern'} brand. Simple geometric shape or icon, flat design, white background, absolutely no text, no letters, no words, no typography. Clean vector-style, single color accent, suitable as a favicon or app icon.`

    if (logoAbortRef.current) logoAbortRef.current.abort()
    const controller = new AbortController()
    logoAbortRef.current = controller
    setGeneratingLogo(true)
    dispatch({ type: 'SET_FIELD', field: 'error', value: null })

    try {
      const res = await fetch('/api/admin/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, username: state.username || undefined }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Logo generation failed')
      updateField('logoUrl', data.url)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Logo generation failed'
      dispatch({ type: 'SET_FIELD', field: 'error', value: msg })
    } finally {
      if (logoAbortRef.current === controller) {
        setGeneratingLogo(false)
        logoAbortRef.current = null
      }
    }
  }

  return (
    <>
      {/* Image Style Card */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Image Style</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {state.niche && (
              <button
                type="button"
                className="dc-btn dc-btn-secondary dc-btn-sm"
                onClick={generateStyleFromNiche}
                disabled={state.generating.niche_style}
              >
                {state.generating.niche_style ? (
                  <><span className="dc-spinner" /> Generating...</>
                ) : (
                  'Generate from Niche'
                )}
              </button>
            )}
            <button
              type="button"
              className="dc-btn dc-btn-enhance"
              onClick={enhanceImageStyle}
              disabled={state.generating.image_style}
            >
              {state.generating.image_style ? (
                <><span className="dc-spinner" /> Enhancing...</>
              ) : (
                'Enhance with AI'
              )}
            </button>
          </div>
        </div>
        <div className="dc-card-body">
          <div className="dc-field">
            <label>Style Name</label>
            <input
              type="text"
              value={state.imageStyle.style_name}
              onChange={(e) => updateImageStyle('style_name', e.target.value)}
              placeholder="Default Style"
            />
          </div>
          <ComboField label="Visual Style" value={state.imageStyle.visual_style} options={VISUAL_STYLES} onChange={(v) => updateImageStyle('visual_style', v)} />
          <div className="dc-field">
            <label>Color Palette</label>
            <input
              type="text"
              value={state.imageStyle.color_palette}
              onChange={(e) => updateImageStyle('color_palette', e.target.value)}
              placeholder="Deep navy, white, electric blue accents"
            />
          </div>
          <ComboField label="Mood / Atmosphere" value={state.imageStyle.mood_and_atmosphere} options={MOODS} onChange={(v) => updateImageStyle('mood_and_atmosphere', v)} />
          <ComboField label="Composition" value={state.imageStyle.composition_style} options={COMPOSITIONS} onChange={(v) => updateImageStyle('composition_style', v)} />
          <ComboField label="Lighting" value={state.imageStyle.lighting_preferences} options={LIGHTINGS} onChange={(v) => updateImageStyle('lighting_preferences', v)} />
          <ComboField label="Image Type" value={state.imageStyle.image_type_preferences} options={IMAGE_TYPES} onChange={(v) => updateImageStyle('image_type_preferences', v)} />
          <ComboField label="Subject Guidelines" value={state.imageStyle.subject_guidelines} options={SUBJECTS} onChange={(v) => updateImageStyle('subject_guidelines', v)} />
          <div className="dc-field">
            <label>AI Prompt Instructions</label>
            <textarea
              value={state.imageStyle.ai_prompt_instructions}
              onChange={(e) => updateImageStyle('ai_prompt_instructions', e.target.value)}
              placeholder={'Detailed instructions for AI image generation appended to every prompt.\nExample: "Shot on Sony A7 III, 85mm lens, f/1.8."'}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Logo Card */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Logo</h3>
        </div>
        <div className="dc-card-body">
          <div className="dc-field">
            <label>Logo Prompt</label>
            <input
              type="text"
              value={state.logoPrompt}
              onChange={(e) => updateField('logoPrompt', e.target.value)}
              placeholder="Describe the logo you want AI to generate..."
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="dc-btn dc-btn-ai"
                onClick={generateLogo}
                disabled={generatingLogo || !state.logoPrompt}
              >
                {generatingLogo ? (
                  <><span className="dc-spinner" /> Generating...</>
                ) : (
                  'Generate Logo'
                )}
              </button>
              <span className="dc-hint">or paste a URL below</span>
            </div>
          </div>
          {state.logoUrl && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.logoUrl}
                alt="Logo preview"
                style={{
                  width: 48, height: 48, borderRadius: 8,
                  objectFit: 'contain', border: '1px solid #e2e8f0',
                }}
              />
              <input
                type="url"
                value={state.logoUrl}
                onChange={(e) => updateField('logoUrl', e.target.value)}
                placeholder="https://yoursite.com/logo.png"
                style={{ flex: 1 }}
              />
            </div>
          )}
          {!state.logoUrl && (
            <div className="dc-field" style={{ marginTop: 8 }}>
              <input
                type="url"
                value={state.logoUrl}
                onChange={(e) => updateField('logoUrl', e.target.value)}
                placeholder="https://yoursite.com/logo.png"
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
