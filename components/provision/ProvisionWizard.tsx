'use client'

import { type ComponentType } from 'react'
import {
  ProvisionProvider,
  useProvisionContext,
  type ProvisionMode,
} from './ProvisionContext'

/* ── Step components ── */
import NicheStep from './steps/NicheStep'
import BrandUrlStep from './steps/BrandUrlStep'
import DomainStep from './steps/DomainStep'
import VoiceContentStep from './steps/VoiceContentStep'
import ImageStyleStep from './steps/ImageStyleStep'
import AuthorStep from './steps/AuthorStep'
import DeployConfigStep from './steps/DeployConfigStep'
import LaunchStep from './steps/LaunchStep'

/* ═══════════════════════════════════════════════════════════
   STEP DEFINITIONS
   ═══════════════════════════════════════════════════════════ */

const NICHE_STEPS = ['niche', 'domain', 'voice', 'imageStyle', 'author', 'deploy', 'launch'] as const
const BRAND_STEPS = ['brandUrl', 'domain', 'voice', 'imageStyle', 'author', 'deploy', 'launch'] as const

const STEP_LABELS: Record<string, string> = {
  niche: 'Niche',
  brandUrl: 'Website',
  domain: 'Domain',
  voice: 'Voice & Content',
  imageStyle: 'Image Style',
  author: 'Author',
  deploy: 'Deploy Config',
  launch: 'Launch',
}

const STEP_COMPONENTS: Record<string, ComponentType> = {
  niche: NicheStep,
  brandUrl: BrandUrlStep,
  domain: DomainStep,
  voice: VoiceContentStep,
  imageStyle: ImageStyleStep,
  author: AuthorStep,
  deploy: DeployConfigStep,
  launch: LaunchStep,
}

/* ═══════════════════════════════════════════════════════════
   INNER WIZARD (needs context)
   ═══════════════════════════════════════════════════════════ */

function WizardInner() {
  const { state, dispatch } = useProvisionContext()
  const { mode, activeStep, phase, provisionSecret } = state

  const steps = mode === 'niche' ? NICHE_STEPS : mode === 'brand' ? BRAND_STEPS : []
  const currentStepKey = steps[activeStep] ?? null
  const StepComponent = currentStepKey ? STEP_COMPONENTS[currentStepKey] : null

  const setMode = (m: ProvisionMode) => {
    dispatch({ type: 'SET_FIELDS', fields: { mode: m, activeStep: 0 } })
  }

  const goNext = () => {
    if (activeStep < steps.length - 1) {
      dispatch({ type: 'SET_FIELD', field: 'activeStep', value: activeStep + 1 })
    }
  }

  const goBack = () => {
    if (activeStep > 0) {
      dispatch({ type: 'SET_FIELD', field: 'activeStep', value: activeStep - 1 })
    }
  }

  /* ── Render ── */
  return (
    <div className="dc-layout">
      {/* ───── Sidebar ───── */}
      <aside className="dc-sidebar">
        <div className="dc-sidebar-header">
          <h1>Brand Provisioner</h1>
          <p>
            {mode === 'brand'
              ? 'Product-First'
              : mode === 'niche'
                ? 'Niche-First'
                : 'New brand onboarding'}
          </p>
        </div>

        {/* Mode switcher (only when mode is selected and still in form phase) */}
        {mode && phase === 'form' && (
          <div className="dc-mode-selector-sidebar">
            <button
              type="button"
              className={`dc-mode-btn ${mode === 'brand' ? 'dc-mode-btn-active' : ''}`}
              onClick={() => setMode('brand')}
            >
              Product
            </button>
            <button
              type="button"
              className={`dc-mode-btn ${mode === 'niche' ? 'dc-mode-btn-active' : ''}`}
              onClick={() => setMode('niche')}
            >
              Niche
            </button>
          </div>
        )}

        {/* Step nav */}
        {mode && phase === 'form' && (
          <nav className="dc-sidebar-nav">
            {steps.map((key, i) => (
              <button
                key={key}
                type="button"
                className={`dc-nav-item ${activeStep === i ? 'dc-nav-active' : ''}`}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'activeStep', value: i })}
              >
                <span className="dc-nav-icon">{i + 1}</span>
                <span className="dc-nav-label">{STEP_LABELS[key]}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Network link */}
        <div style={{ padding: '8px 8px 0', borderTop: '1px solid #e2e8f0', marginTop: 8 }}>
          <a href="/admin/network" className="dc-nav-item" style={{ textDecoration: 'none' }}>
            <span className="dc-nav-icon">+</span>
            <span className="dc-nav-label">Create Network</span>
          </a>
        </div>
      </aside>

      {/* ───── Main ───── */}
      <main className="dc-main">
        {/* Top bar */}
        <div className="dc-topbar">
          <div>
            <h2>
              {!mode
                ? 'Choose Your Path'
                : currentStepKey
                  ? STEP_LABELS[currentStepKey]
                  : 'Provision'}
            </h2>
            <p>
              {!mode
                ? 'How would you like to get started?'
                : phase === 'form'
                  ? `Step ${activeStep + 1} of ${steps.length}`
                  : phase === 'done'
                    ? 'Complete'
                    : 'Running...'}
            </p>
          </div>
          <div className="dc-topbar-actions">
            {phase === 'done' && (
              <button
                type="button"
                className="dc-btn dc-btn-secondary"
                onClick={() => dispatch({ type: 'RESET' })}
              >
                + New Brand
              </button>
            )}
          </div>
        </div>

        <div className="dc-scroll-area">
          {/* Error banner */}
          {state.error && (
            <div className="dc-alert dc-alert-error" style={{ margin: '0 0 8px' }}>
              <span className="dc-alert-icon">!</span>
              <div>
                <div className="dc-alert-title">Error</div>
                <div className="dc-alert-text">{state.error}</div>
              </div>
              <button
                type="button"
                className="dc-alert-close"
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'error', value: null })}
              >
                x
              </button>
            </div>
          )}

          {/* Provision secret (always visible at top when in form phase) */}
          {phase === 'form' && (
            <div className="dc-card" style={{ marginBottom: 16 }}>
              <div className="dc-card-body" style={{ padding: '12px 16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Provision Secret
                  </span>
                  <input
                    type="password"
                    value={provisionSecret}
                    onChange={(e) =>
                      dispatch({ type: 'SET_FIELD', field: 'provisionSecret', value: e.target.value })
                    }
                    placeholder="PROVISION_SECRET token"
                    className="dc-input"
                    style={{ flex: 1 }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Mode chooser */}
          {phase === 'form' && !mode && (
            <div className="dc-mode-chooser">
              <div className="dc-mode-chooser-grid">
                <button
                  type="button"
                  className="dc-mode-card"
                  onClick={() => setMode('brand')}
                >
                  <span className="dc-mode-card-icon">&#127760;</span>
                  <span className="dc-mode-card-title">I have a website</span>
                  <span className="dc-mode-card-desc">
                    Import an existing brand. We will analyze it and set up your blog.
                  </span>
                </button>
                <button
                  type="button"
                  className="dc-mode-card"
                  onClick={() => setMode('niche')}
                >
                  <span className="dc-mode-card-icon">&#128269;</span>
                  <span className="dc-mode-card-title">I have a niche idea</span>
                  <span className="dc-mode-card-desc">
                    Start from a topic. We will research the niche and build the brand for you.
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Active step component */}
          {mode && StepComponent && <StepComponent />}

          {/* Bottom nav (only during form phase, after mode is selected) */}
          {mode && phase === 'form' && currentStepKey !== 'launch' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid #e2e8f0',
              }}
            >
              {activeStep > 0 ? (
                <button type="button" className="dc-btn dc-btn-secondary" onClick={goBack}>
                  Back
                </button>
              ) : (
                <div />
              )}
              <button type="button" className="dc-btn dc-btn-primary" onClick={goNext}>
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   EXPORTED WRAPPER (provides context)
   ═══════════════════════════════════════════════════════════ */

export default function ProvisionWizard() {
  return (
    <ProvisionProvider>
      <WizardInner />
    </ProvisionProvider>
  )
}
