'use client'

import { useProvisionContext } from '../ProvisionContext'
import { THEMES, type ThemeName } from '@/lib/themes'

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

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

const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Spanish', flag: '\uD83C\uDDEA\uD83C\uDDF8' },
  { code: 'fr', label: 'French', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { code: 'de', label: 'German', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  { code: 'pt', label: 'Portuguese', flag: '\uD83C\uDDE7\uD83C\uDDF7' },
  { code: 'ja', label: 'Japanese', flag: '\uD83C\uDDEF\uD83C\uDDF5' },
  { code: 'ko', label: 'Korean', flag: '\uD83C\uDDF0\uD83C\uDDF7' },
  { code: 'zh', label: 'Chinese', flag: '\uD83C\uDDE8\uD83C\uDDF3' },
  { code: 'it', label: 'Italian', flag: '\uD83C\uDDEE\uD83C\uDDF9' },
  { code: 'nl', label: 'Dutch', flag: '\uD83C\uDDF3\uD83C\uDDF1' },
  { code: 'ar', label: 'Arabic', flag: '\uD83C\uDDF8\uD83C\uDDE6' },
  { code: 'hi', label: 'Hindi', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'ru', label: 'Russian', flag: '\uD83C\uDDF7\uD83C\uDDFA' },
]

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function DeployConfigStep() {
  const { state, dispatch } = useProvisionContext()

  const updateField = (field: keyof typeof state, value: typeof state[keyof typeof state]) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  const toggleLanguage = (code: string) => {
    const prev = state.selectedLanguages
    const next = prev.includes(code)
      ? prev.filter((c) => c !== code)
      : [...prev, code]
    updateField('selectedLanguages', next)
  }

  const generateColorsFromNiche = () => {
    if (!state.niche) return
    const colors = suggestNicheColors(state.niche)
    dispatch({
      type: 'SET_FIELDS',
      fields: { primaryColor: colors.primary, accentColor: colors.accent },
    })
  }

  return (
    <>
      {/* Theme Selector */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Theme</h3>
        </div>
        <div className="dc-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {Object.values(THEMES).map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => updateField('theme', t.name as ThemeName)}
                style={{
                  padding: '16px',
                  border: state.theme === t.name ? '2px solid #6366f1' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: state.theme === t.name ? '#f0f0ff' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                  {t.label}
                </strong>
                <span style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4, display: 'block' }}>
                  {t.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Appearance</h3>
          {state.niche && (
            <button
              type="button"
              className="dc-btn dc-btn-secondary dc-btn-sm"
              onClick={generateColorsFromNiche}
            >
              Suggest from Niche
            </button>
          )}
        </div>
        <div className="dc-card-body">
          <div className="dc-field-row">
            <div className="dc-field">
              <label>Primary Color</label>
              <div className="dc-color-field">
                <input
                  type="color"
                  value={state.primaryColor}
                  title="Primary color picker"
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                />
                <input
                  type="text"
                  value={state.primaryColor}
                  placeholder="#0F172A"
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                />
              </div>
            </div>
            <div className="dc-field">
              <label>Secondary Color</label>
              <div className="dc-color-field">
                <input
                  type="color"
                  value={state.secondaryColor || '#ffffff'}
                  title="Secondary color picker"
                  onChange={(e) => updateField('secondaryColor', e.target.value)}
                />
                <input
                  type="text"
                  value={state.secondaryColor}
                  placeholder="#ffffff"
                  onChange={(e) => updateField('secondaryColor', e.target.value)}
                />
              </div>
            </div>
            <div className="dc-field">
              <label>Accent Color</label>
              <div className="dc-color-field">
                <input
                  type="color"
                  value={state.accentColor}
                  title="Accent color picker"
                  onChange={(e) => updateField('accentColor', e.target.value)}
                />
                <input
                  type="text"
                  value={state.accentColor}
                  placeholder="#0066ff"
                  onChange={(e) => updateField('accentColor', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="dc-field-row">
            <div className="dc-field">
              <label>Heading Font</label>
              <input
                type="text"
                value={state.headingFont}
                onChange={(e) => updateField('headingFont', e.target.value)}
                placeholder="Georgia, serif"
              />
            </div>
            <div className="dc-field">
              <label>Body Font</label>
              <input
                type="text"
                value={state.bodyFont}
                onChange={(e) => updateField('bodyFont', e.target.value)}
                placeholder="system-ui, sans-serif"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Settings */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Deployment Settings</h3>
        </div>
        <div className="dc-card-body">
          <div className="dc-field">
            <label>Fly.io Region</label>
            <select
              value={state.flyRegion}
              title="Fly.io deployment region"
              onChange={(e) => updateField('flyRegion', e.target.value)}
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
              <input
                type="checkbox"
                checked={state.stitchEnabled}
                onChange={(e) => updateField('stitchEnabled', e.target.checked)}
              />
              <span>Auto-generate videos via Stitch for published articles</span>
            </label>
          </div>

          <div className="dc-toggles" style={{ marginTop: 8 }}>
            <label className="dc-toggle">
              <input
                type="checkbox"
                checked={state.setupGoogleAnalytics}
                onChange={(e) => updateField('setupGoogleAnalytics', e.target.checked)}
              />
              <span>Setup Google Analytics (GA4)</span>
            </label>
            <label className="dc-toggle">
              <input
                type="checkbox"
                checked={state.setupGoogleTagManager}
                onChange={(e) => updateField('setupGoogleTagManager', e.target.checked)}
              />
              <span>Setup Google Tag Manager (GTM)</span>
            </label>
            <label className="dc-toggle">
              <input
                type="checkbox"
                checked={state.setupSearchConsole}
                onChange={(e) => updateField('setupSearchConsole', e.target.checked)}
              />
              <span>Setup Google Search Console (GSC)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Content Cadence */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Content Cadence</h3>
        </div>
        <div className="dc-card-body">
          <div className="dc-field">
            <label>Articles per Day</label>
            <input
              type="number"
              min={1}
              max={20}
              value={state.articlesPerDay}
              onChange={(e) =>
                updateField(
                  'articlesPerDay',
                  Math.max(1, Math.min(20, parseInt(e.target.value) || 1)),
                )
              }
            />
            <span className="dc-hint">
              How many articles to schedule per day (default: 5).
            </span>
          </div>
        </div>
      </div>

      {/* Translation */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Translation</h3>
        </div>
        <div className="dc-card-body">
          <label className="dc-toggle">
            <input
              type="checkbox"
              checked={state.translationEnabled}
              onChange={(e) => updateField('translationEnabled', e.target.checked)}
            />
            <span>Enable multi-language translation</span>
          </label>

          {state.translationEnabled && (
            <div className="dc-language-grid">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`dc-chip ${state.selectedLanguages.includes(lang.code) ? 'dc-chip-selected' : ''}`}
                  onClick={() => toggleLanguage(lang.code)}
                >
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
