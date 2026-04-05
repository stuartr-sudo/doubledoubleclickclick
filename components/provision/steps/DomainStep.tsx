'use client'

import { useState } from 'react'
import { useProvisionContext, type DomainData } from '../ProvisionContext'

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function DomainStep() {
  const { state, dispatch } = useProvisionContext()
  const [loading, setLoading] = useState(false)

  const updateField = (field: keyof typeof state, value: typeof state[keyof typeof state]) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  const selectDomain = (domainName: string, suggestion?: DomainData) => {
    const updates: Record<string, unknown> = { domain: domainName }
    if (!state.websiteUrl) updates.websiteUrl = `https://www.${domainName}`
    if (!state.contactEmail) updates.contactEmail = `contact@${domainName}`
    if (suggestion) {
      updates.selectedDomainData = suggestion
      updates.purchaseDomain = true
    }
    dispatch({ type: 'SET_FIELDS', fields: updates })
  }

  const suggestDomains = async () => {
    if (!state.niche && !state.displayName) return
    setLoading(true)
    dispatch({ type: 'SET_FIELD', field: 'error', value: null })

    try {
      const res = await fetch('/api/admin/domain-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: state.niche.trim(),
          brand_name: state.displayName.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        dispatch({
          type: 'SET_FIELD',
          field: 'domainSuggestions',
          value: data.suggestions || [],
        })
        if (!data.suggestions?.length) {
          dispatch({
            type: 'SET_FIELD',
            field: 'error',
            value: 'No domains found under $15/year. Try a different niche or brand name.',
          })
        }
      } else {
        dispatch({
          type: 'SET_FIELD',
          field: 'error',
          value: data.error || 'Failed to search domains',
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Domain search failed'
      dispatch({ type: 'SET_FIELD', field: 'error', value: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dc-card">
      <div className="dc-card-header">
        <h3>Choose a Domain</h3>
      </div>
      <div className="dc-card-body">
        {/* Selected domain banner */}
        {state.domain && (
          <div className="dc-selected-domain-banner">
            <span className="dc-selected-domain-label">Selected:</span>
            <span className="dc-selected-domain-name">{state.domain}</span>
            {state.selectedDomainData && (
              <span className="dc-selected-domain-price">
                ${state.selectedDomainData.price}/
                {state.selectedDomainData.currency === 'USD'
                  ? 'yr'
                  : state.selectedDomainData.currency}
              </span>
            )}
          </div>
        )}

        {/* Manual DNS toggle */}
        {state.selectedDomainData && (
          <label className="dc-toggle" style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              checked={state.manualDns}
              onChange={(e) => updateField('manualDns', e.target.checked)}
            />
            <span>
              I&apos;ll register this domain and configure DNS myself
            </span>
          </label>
        )}

        {/* Search button */}
        <div className="dc-domain-suggest-row">
          <button
            type="button"
            className="dc-btn dc-btn-ai"
            onClick={suggestDomains}
            disabled={loading || (!state.niche && !state.displayName)}
          >
            {loading ? (
              <>
                <span className="dc-spinner" /> Searching...
              </>
            ) : (
              'Find Available Domains'
            )}
          </button>
          <span className="dc-hint">
            Searches Google Cloud Domains for available domains under $15/year.
          </span>
        </div>

        {/* Domain suggestions */}
        {state.domainSuggestions.length > 0 && (
          <div className="dc-domain-suggestions">
            {state.domainSuggestions.map((s) => (
              <button
                key={s.domain}
                type="button"
                className={`dc-domain-chip ${state.domain === s.domain ? 'dc-domain-chip-selected' : ''}`}
                onClick={() => selectDomain(s.domain, s)}
              >
                <span className="dc-domain-chip-name">{s.domain}</span>
                <span className="dc-domain-chip-price">
                  ${s.price}/
                  {s.currency === 'USD' ? 'yr' : s.currency}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Manual domain input */}
        {!state.domainSuggestions.length && !loading && (
          <div className="dc-field" style={{ marginTop: 16 }}>
            <label>Or enter a domain manually</label>
            <input
              type="text"
              value={state.domain}
              onChange={(e) => updateField('domain', e.target.value)}
              placeholder="yourbrand.com"
            />
          </div>
        )}
      </div>
    </div>
  )
}
