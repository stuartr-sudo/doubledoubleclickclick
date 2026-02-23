'use client'

import { useState, useEffect, useRef } from 'react'

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

interface PipelineStep {
  step: string
  label: string
  status: 'completed' | 'running' | 'failed' | 'pending'
  detail?: string
  completed_at?: string
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

export default function ProvisionForm() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [domain, setDomain] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [niche, setNiche] = useState('')
  const [blurb, setBlurb] = useState('')
  const [targetMarket, setTargetMarket] = useState('')
  const [brandVoiceTone, setBrandVoiceTone] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#1a1a2e')
  const [accentColor, setAccentColor] = useState('#0066ff')
  const [authorName, setAuthorName] = useState('')
  const [authorBio, setAuthorBio] = useState('')
  const [flyRegion, setFlyRegion] = useState('syd')
  const [skipPipeline, setSkipPipeline] = useState(false)
  const [skipDeploy, setSkipDeploy] = useState(false)

  const [phase, setPhase] = useState<Phase>('form')
  const [provisionResult, setProvisionResult] = useState<any>(null)
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const seenStepsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (domain && !websiteUrl) setWebsiteUrl(`https://www.${domain}`)
    if (domain && !contactEmail) setContactEmail(`hello@${domain}`)
  }, [domain])

  useEffect(() => {
    if (displayName && !authorName) setAuthorName(`${displayName} Editorial`)
    if (displayName && !authorBio) setAuthorBio(`The ${displayName} editorial team.`)
  }, [displayName])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${ts}] ${msg}`])
  }

  const deriveUsername = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !displayName || !websiteUrl || !contactEmail) {
      setError('Username, display name, website URL, and contact email are required.')
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
          website_url: websiteUrl.trim(),
          contact_email: contactEmail.trim(),
          domain: domain.trim() || undefined,
          niche: niche.trim() || undefined,
          blurb: blurb.trim() || undefined,
          target_market: targetMarket.trim() || undefined,
          brand_voice_tone: brandVoiceTone.trim() || undefined,
          primary_color: primaryColor || undefined,
          accent_color: accentColor || undefined,
          author_name: authorName.trim() || undefined,
          author_bio: authorBio.trim() || undefined,
          fly_region: flyRegion,
          skip_pipeline: skipPipeline,
          skip_deploy: skipDeploy,
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

  const startPolling = (trackingPath: string) => {
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
  }

  const resetForm = () => {
    setPhase('form')
    setProvisionResult(null)
    setPipelineStatus(null)
    setLogs([])
    setUsername('')
    setDisplayName('')
    setDomain('')
    setWebsiteUrl('')
    setContactEmail('')
    setNiche('')
    setBlurb('')
    setTargetMarket('')
    setBrandVoiceTone('')
    setAuthorName('')
    setAuthorBio('')
    setPrimaryColor('#1a1a2e')
    setAccentColor('#0066ff')
    setError('')
  }

  return (
    <div className="admin-provision">
      <div className="admin-header">
        <h1>Provision New Brand</h1>
        <p>Seeds the database, triggers the content pipeline via Doubleclicker, and deploys a new Fly.io app.</p>
      </div>

      <div className="admin-grid">
        {/* Left: Form */}
        <div className="admin-panel">
          <form onSubmit={handleProvision}>
            <fieldset className="admin-fieldset" disabled={phase !== 'form'}>
              <legend>Brand Identity</legend>

              <div className="admin-field">
                <label>Display Name *</label>
                <input
                  type="text" value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value)
                    if (!username || username === deriveUsername(displayName)) {
                      setUsername(deriveUsername(e.target.value))
                    }
                  }}
                  placeholder="Modern Longevity" required
                />
              </div>

              <div className="admin-row">
                <div className="admin-field">
                  <label>Username *</label>
                  <input type="text" value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="modernlongevity" required />
                </div>
                <div className="admin-field">
                  <label>Domain</label>
                  <input type="text" value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="modernlongevity.io" />
                </div>
              </div>

              <div className="admin-row">
                <div className="admin-field">
                  <label>Website URL *</label>
                  <input type="url" value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://www.modernlongevity.io" required />
                </div>
                <div className="admin-field">
                  <label>Contact Email *</label>
                  <input type="email" value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="hello@modernlongevity.io" required />
                </div>
              </div>

              <div className="admin-field">
                <label>Niche</label>
                <input type="text" value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="longevity and anti-aging" />
              </div>

              <div className="admin-field">
                <label>Blurb</label>
                <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)}
                  placeholder="Brief description of the brand..." rows={2} />
              </div>
            </fieldset>

            <fieldset className="admin-fieldset" disabled={phase !== 'form'}>
              <legend>Brand Voice &amp; Market</legend>

              <div className="admin-field">
                <label>Target Market</label>
                <textarea value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="Health-conscious adults aged 30-65..." rows={2} />
              </div>

              <div className="admin-field">
                <label>Voice &amp; Tone</label>
                <textarea value={brandVoiceTone} onChange={(e) => setBrandVoiceTone(e.target.value)}
                  placeholder="Authoritative but warm..." rows={2} />
              </div>
            </fieldset>

            <fieldset className="admin-fieldset" disabled={phase !== 'form'}>
              <legend>Default Author</legend>
              <div className="admin-field">
                <label>Author Name</label>
                <input type="text" value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Modern Longevity Editorial" />
              </div>
              <div className="admin-field">
                <label>Author Bio</label>
                <textarea value={authorBio} onChange={(e) => setAuthorBio(e.target.value)}
                  placeholder="The editorial team..." rows={2} />
              </div>
            </fieldset>

            <fieldset className="admin-fieldset" disabled={phase !== 'form'}>
              <legend>Appearance &amp; Deployment</legend>

              <div className="admin-row">
                <div className="admin-field">
                  <label>Primary Color</label>
                  <div className="admin-color-input">
                    <input type="color" value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)} />
                    <input type="text" value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)} />
                  </div>
                </div>
                <div className="admin-field">
                  <label>Accent Color</label>
                  <div className="admin-color-input">
                    <input type="color" value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)} />
                    <input type="text" value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="admin-field">
                <label>Fly.io Region</label>
                <select value={flyRegion} onChange={(e) => setFlyRegion(e.target.value)}>
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="admin-toggles">
                <label className="admin-toggle">
                  <input type="checkbox" checked={skipPipeline}
                    onChange={(e) => setSkipPipeline(e.target.checked)} />
                  <span>Skip content pipeline</span>
                </label>
                <label className="admin-toggle">
                  <input type="checkbox" checked={skipDeploy}
                    onChange={(e) => setSkipDeploy(e.target.checked)} />
                  <span>Skip Fly.io deploy</span>
                </label>
              </div>
            </fieldset>

            {error && <div className="admin-error">{error}</div>}

            <button type="submit" className="admin-submit" disabled={phase !== 'form'}>
              {phase === 'form' ? 'Provision Brand' : 'Provisioning...'}
            </button>
          </form>
        </div>

        {/* Right: Progress & Logs */}
        <div className="admin-panel admin-panel-dark">
          <h2>Pipeline Progress</h2>

          {provisionResult && (
            <div className="admin-phases">
              <PhaseIndicator label="Seed Database" status="completed" />
              <PhaseIndicator
                label="Doubleclicker Pipeline"
                status={
                  phase === 'tracking' ? 'running'
                  : pipelineStatus?.status === 'completed' ? 'completed'
                  : pipelineStatus?.status === 'failed' ? 'failed'
                  : provisionResult?.notifications?.doubleclicker?.status === 'skipped' ? 'skipped'
                  : phase === 'done' ? 'completed'
                  : 'pending'
                }
              />
              <PhaseIndicator
                label="Fly.io Deploy"
                status={
                  skipDeploy ? 'skipped'
                  : provisionResult?.fly?.app ? 'completed'
                  : provisionResult?.notifications?.fly?.status === 'skipped' ? 'skipped'
                  : 'pending'
                }
              />
              <PhaseIndicator
                label="Domain &amp; Certs"
                status={
                  provisionResult?.notifications?.domain?.status === 'skipped' ? 'skipped'
                  : provisionResult?.notifications?.domain ? 'completed'
                  : 'pending'
                }
              />
            </div>
          )}

          {pipelineStatus && (
            <div className="admin-pipeline-steps">
              <h3>Doubleclicker Steps ({pipelineStatus.steps_completed?.length || 0}/{pipelineStatus.total_steps})</h3>
              {pipelineStatus.steps_completed?.map((step, i) => (
                <div key={i} className={`admin-step admin-step-${step.status}`}>
                  <span className="admin-step-icon">
                    {step.status === 'completed' ? '\u2713' : step.status === 'failed' ? '\u2717' : '\u25CB'}
                  </span>
                  <span className="admin-step-label">{step.label || step.step}</span>
                  {step.detail && <span className="admin-step-detail">{step.detail}</span>}
                </div>
              ))}
              {pipelineStatus.status === 'running' && (
                <div className="admin-step admin-step-running">
                  <span className="admin-step-icon admin-spinner" />
                  <span className="admin-step-label">{pipelineStatus.current_step}...</span>
                </div>
              )}
            </div>
          )}

          <div className="admin-logs">
            <h3>Event Log</h3>
            <div className="admin-logs-scroll">
              {logs.length === 0 && (
                <p className="admin-logs-empty">Waiting for provisioning to start...</p>
              )}
              {logs.map((log, i) => (
                <div key={i} className={`admin-log ${log.includes('ERROR') ? 'admin-log-error' : ''}`}>
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          {phase === 'done' && provisionResult && (
            <div className="admin-result">
              <h3>Provisioning Complete</h3>
              {provisionResult.fly?.url && (
                <p>Fly URL: <a href={provisionResult.fly.url} target="_blank" rel="noopener noreferrer">{provisionResult.fly.url}</a></p>
              )}
              {domain && provisionResult.fly?.ipv4 && (
                <div className="admin-dns">
                  <h4>DNS Records</h4>
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
              <button className="admin-reset" onClick={resetForm}>
                Provision Another Brand
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PhaseIndicator({ label, status }: { label: string; status: string }) {
  const icons: Record<string, string> = {
    completed: '\u2713', running: '\u25CF', failed: '\u2717', skipped: '\u2014', pending: '\u25CB',
  }
  return (
    <div className={`admin-phase admin-phase-${status}`}>
      <span className="admin-phase-icon">{icons[status] || icons.pending}</span>
      <span dangerouslySetInnerHTML={{ __html: label }} />
    </div>
  )
}
