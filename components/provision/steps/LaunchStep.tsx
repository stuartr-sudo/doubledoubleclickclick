'use client'

import { useState } from 'react'
import { useProvisionContext } from '../ProvisionContext'
import { useProvision, type ProvisionResult } from '../hooks/useProvision'
import { PipelineTracker } from '../PipelineTracker'

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

function deriveUsername(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/* ═══════════════════════════════════════════════════════════
   SUMMARY ROW (small helper for rendering read-only values)
   ═══════════════════════════════════════════════════════════ */

function SummaryRow({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13, padding: '3px 0' }}>
      <span style={{ color: '#888', minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#d0d0d0', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function LaunchStep() {
  const { state, dispatch } = useProvisionContext()
  const { handleProvision, startPolling } = useProvision()
  const [launching, setLaunching] = useState(false)

  const updateField = (field: keyof typeof state, value: typeof state[keyof typeof state]) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  const addLog = (msg: string) => {
    dispatch({
      type: 'ADD_LOG',
      log: { timestamp: new Date().toISOString(), message: msg },
    })
  }

  const resolvedUsername = state.username || deriveUsername(state.displayName)

  const canLaunch =
    state.mode === 'niche'
      ? !!(state.displayName && state.niche)
      : !!(state.displayName && state.websiteUrl)

  const launch = async () => {
    if (!resolvedUsername || !state.displayName) {
      dispatch({
        type: 'SET_FIELD',
        field: 'error',
        value: 'Brand name is required.',
      })
      return
    }

    setLaunching(true)
    dispatch({ type: 'SET_FIELD', field: 'error', value: null })
    dispatch({ type: 'SET_FIELD', field: 'phase', value: 'provisioning' })
    addLog('Starting provisioning...')

    try {
      const data: ProvisionResult = await handleProvision()

      dispatch({
        type: 'SET_FIELD',
        field: 'provisionResult',
        value: data as unknown as Record<string, unknown>,
      })
      addLog('Phase 1: DB seeded successfully')

      // Google services logs
      const n = (data as Record<string, unknown>).notifications as Record<string, Record<string, unknown>> | undefined
      if (n?.google_analytics?.status === 'created') {
        addLog(`Phase 2: GA4 created -- ${(data as Record<string, unknown>).google && ((data as Record<string, unknown>).google as Record<string, unknown>).ga_measurement_id}`)
      } else if (n?.google_analytics?.status === 'error') {
        addLog(`Phase 2: GA4 failed -- ${n.google_analytics.error}`)
      }
      if (n?.google_tag_manager?.status === 'created') {
        addLog(`Phase 2: GTM created -- ${(data as Record<string, unknown>).google && ((data as Record<string, unknown>).google as Record<string, unknown>).gtm_public_id}`)
      } else if (n?.google_tag_manager?.status === 'error') {
        addLog(`Phase 2: GTM failed -- ${n.google_tag_manager.error}`)
      }

      // Doubleclicker pipeline
      if (n?.doubleclicker?.status === 'triggered') {
        addLog('Phase 3: Doubleclicker auto-onboard triggered')
        const dcData = n.doubleclicker.data as Record<string, unknown> | undefined
        const trackingUrl = dcData?.tracking_url as string | undefined
        const onboardId = dcData?.onboard_id as string | undefined

        if (trackingUrl) {
          addLog(`Pipeline ID: ${onboardId}`)
          addLog('Tracking pipeline progress...')
          dispatch({ type: 'SET_FIELD', field: 'phase', value: 'tracking' })
          startPolling(trackingUrl, (pipeline, newSteps) => {
            dispatch({ type: 'SET_FIELD', field: 'pipelineStatus', value: pipeline })
            for (const s of newSteps) {
              addLog(`Step: ${s.label || s.step} -- ${s.status}${s.detail ? ': ' + s.detail : ''}`)
            }
            if (['completed', 'completed_with_errors', 'failed'].includes(pipeline.status)) {
              addLog(`Pipeline finished: ${pipeline.status}`)
              if (pipeline.errors?.length) {
                pipeline.errors.forEach((e) => addLog(`  Error: ${e}`))
              }
              dispatch({ type: 'SET_FIELD', field: 'phase', value: 'done' })
            }
          })
        } else {
          dispatch({ type: 'SET_FIELD', field: 'phase', value: 'done' })
        }
      } else {
        addLog('Phase 3: Doubleclicker -- ' + (n?.doubleclicker?.reason || 'skipped'))
        dispatch({ type: 'SET_FIELD', field: 'phase', value: 'done' })
      }

      // Domain purchase
      if (n?.domain_purchase?.status === 'registration_pending') {
        addLog(`Phase 4: Domain "${n.domain_purchase.domain}" purchase initiated`)
      } else if (n?.domain_purchase?.status === 'error') {
        addLog(`Phase 4: Domain purchase failed -- ${n.domain_purchase.error}`)
      }

      // Fly deploy
      if (data.fly?.app) {
        addLog(`Phase 5: Fly app "${data.fly.app}" deployed`)
        if (data.fly.ipv4) addLog(`  IPv4: ${data.fly.ipv4}`)
        if (data.fly.ipv6) addLog(`  IPv6: ${data.fly.ipv6}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Provisioning failed'
      dispatch({ type: 'SET_FIELD', field: 'error', value: msg })
      addLog(`ERROR: ${msg}`)
      dispatch({ type: 'SET_FIELD', field: 'phase', value: 'form' })
    } finally {
      setLaunching(false)
    }
  }

  const isRunning = state.phase !== 'form'

  return (
    <>
      {/* Brand Identity (editable) */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Brand Identity</h3>
        </div>
        <div className="dc-card-body">
          <div className="dc-field">
            <label>
              Company / Brand Name <span className="dc-required">*</span>
            </label>
            <input
              type="text"
              value={state.displayName}
              onChange={(e) => {
                updateField('displayName', e.target.value)
                if (
                  !state.username ||
                  state.username === deriveUsername(state.displayName)
                ) {
                  updateField('username', deriveUsername(e.target.value))
                }
              }}
              placeholder="e.g., Assureful Insurance"
            />
          </div>
          <div className="dc-field-row">
            <div className="dc-field">
              <label>Username</label>
              <input
                type="text"
                value={state.username || resolvedUsername}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="auto-derived"
              />
              <span className="dc-hint">
                Used for the Fly app name and DB filtering.
              </span>
            </div>
            <div className="dc-field">
              <label>Tagline</label>
              <input
                type="text"
                value={state.tagline}
                onChange={(e) => updateField('tagline', e.target.value)}
                placeholder="Optional tagline"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Provision Secret */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Auth</h3>
        </div>
        <div className="dc-card-body">
          <div className="dc-field">
            <label>Provision Secret</label>
            <input
              type="password"
              value={state.provisionSecret}
              onChange={(e) => updateField('provisionSecret', e.target.value)}
              placeholder="PROVISION_SECRET token"
            />
            <span className="dc-hint">
              Required to authenticate the provision API call.
            </span>
          </div>
        </div>
      </div>

      {/* Summary Panel */}
      <div className="dc-card">
        <div className="dc-card-header">
          <h3>Configuration Summary</h3>
        </div>
        <div className="dc-card-body" style={{ fontSize: 13 }}>
          <SummaryRow label="Username" value={resolvedUsername} />
          <SummaryRow label="Display Name" value={state.displayName} />
          <SummaryRow label="Niche" value={state.niche} />
          <SummaryRow label="Domain" value={state.domain} />
          <SummaryRow label="Website URL" value={state.websiteUrl} />
          <SummaryRow label="Contact Email" value={state.contactEmail} />
          <SummaryRow label="Brand Voice" value={state.brandVoice ? `${state.brandVoice.slice(0, 80)}...` : ''} />
          <SummaryRow label="Target Market" value={state.targetMarket ? `${state.targetMarket.slice(0, 80)}...` : ''} />
          <SummaryRow label="Theme" value={state.theme} />
          <SummaryRow label="Primary Color" value={state.primaryColor} />
          <SummaryRow label="Accent Color" value={state.accentColor} />
          <SummaryRow label="Fly Region" value={state.flyRegion} />
          <SummaryRow label="Author" value={state.authorName} />
          <SummaryRow label="Logo" value={state.logoUrl ? 'Set' : 'Not set'} />
          <SummaryRow label="Stitch" value={state.stitchEnabled ? 'Enabled' : 'Disabled'} />
          <SummaryRow label="Google GA4" value={state.setupGoogleAnalytics ? 'Yes' : 'No'} />
          <SummaryRow label="Google GTM" value={state.setupGoogleTagManager ? 'Yes' : 'No'} />
          <SummaryRow label="Google GSC" value={state.setupSearchConsole ? 'Yes' : 'No'} />
          <SummaryRow label="Articles/Day" value={String(state.articlesPerDay)} />
          {state.translationEnabled && state.selectedLanguages.length > 0 && (
            <SummaryRow label="Languages" value={state.selectedLanguages.join(', ')} />
          )}
          {state.selectedDomainData && (
            <SummaryRow
              label="Domain Purchase"
              value={state.manualDns ? 'Manual DNS' : `Auto-purchase $${state.selectedDomainData.price}/yr`}
            />
          )}
        </div>
      </div>

      {/* Launch Button */}
      {state.phase === 'form' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <button
            type="button"
            className="dc-btn dc-btn-launch"
            onClick={launch}
            disabled={!canLaunch || launching || !state.provisionSecret}
            style={{ fontSize: 16, padding: '14px 48px' }}
          >
            {launching ? (
              <><span className="dc-spinner" /> Provisioning...</>
            ) : (
              'Launch Provisioning'
            )}
          </button>
        </div>
      )}

      {/* Pipeline Tracker (shown during/after provisioning) */}
      {isRunning && (
        <PipelineTracker
          pipelineStatus={state.pipelineStatus}
          logs={state.logs}
          provisionResult={state.provisionResult}
        />
      )}

      {/* Done state */}
      {state.phase === 'done' && state.provisionResult && (
        <div className="dc-card dc-card-success">
          <div className="dc-card-header">
            <h3>Provisioning Complete</h3>
          </div>
          <div className="dc-card-body">
            {(() => {
              const result = state.provisionResult as Record<string, unknown> | null
              const fly = result?.fly as Record<string, unknown> | undefined
              if (!fly?.url) return null
              return (
                <div className="dc-result-row">
                  <span className="dc-result-label">Fly URL</span>
                  <a
                    href={String(fly.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {String(fly.url)}
                  </a>
                </div>
              )
            })()}
            <button
              type="button"
              className="dc-btn dc-btn-secondary"
              onClick={() => dispatch({ type: 'RESET' })}
            >
              Provision Another Brand
            </button>
          </div>
        </div>
      )}
    </>
  )
}
