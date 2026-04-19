'use client'

import { useState } from 'react'

/* ─── Section Data ─── */

interface Section {
  id: string
  icon: string
  label: string
  content: () => React.ReactNode
}

const sections: Section[] = [
  { id: 'overview',       icon: '🏠', label: 'System Overview',         content: OverviewSection },
  { id: 'quickstart',     icon: '🚀', label: 'Quick-Start Guide',       content: QuickStartSection },
  { id: 'provision',      icon: '⚙️', label: 'Provisioning Pipeline',   content: ProvisionSection },
  { id: 'phases',         icon: '📋', label: 'Pipeline Phases',          content: PhasesSection },
  { id: 'admin-api',      icon: '🔌', label: 'Admin API Reference',     content: AdminApiSection },
  { id: 'public-api',     icon: '🌐', label: 'Public API Reference',    content: PublicApiSection },
  { id: 'google',         icon: '🔍', label: 'Google Services',         content: GoogleSection },
  { id: 'fly',            icon: '✈️', label: 'Fly.io Deployment',       content: FlySection },
  { id: 'database',       icon: '🗄️', label: 'Database & Supabase',     content: DatabaseSection },
  { id: 'themes',         icon: '🎨', label: 'Theme System',            content: ThemesSection },
  { id: 'network',        icon: '🕸️', label: 'Network Provisioning',    content: NetworkSection },
  { id: 'domains',        icon: '🌍', label: 'Domains & DNS',           content: DomainsSection },
  { id: 'email',          icon: '📧', label: 'Email (Resend)',          content: EmailSection },
  { id: 'images',         icon: '🖼️', label: 'Image Generation',        content: ImagesSection },
  { id: 'env',            icon: '🔐', label: 'Environment Variables',   content: EnvSection },
  { id: 'tenant',         icon: '👤', label: 'Tenant System',           content: TenantSection },
  { id: 'middleware',      icon: '🔀', label: 'Middleware & Routing',    content: MiddlewareSection },
  { id: 'troubleshoot',   icon: '🔧', label: 'Troubleshooting',        content: TroubleshootSection },
  { id: 'architecture',   icon: '🏗️', label: 'Architecture Map',       content: ArchitectureSection },
  { id: 'checklist',      icon: '✅', label: 'Pre-Launch Checklist',    content: ChecklistSection },
]

/* ─── Main Component ─── */

export default function EducateProvisioner() {
  const [activeSection, setActiveSection] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSections = searchQuery
    ? sections.filter(s =>
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections

  const currentSection = sections[activeSection]

  return (
    <div className="dc-layout">
      {/* Sidebar */}
      <aside className="dc-sidebar" style={{ width: 260 }}>
        <div className="dc-sidebar-header">
          <h1 style={{ fontSize: 18, margin: 0 }}>Provisioner Guide</h1>
          <p style={{ fontSize: 12, margin: '4px 0 0', opacity: 0.7 }}>
            Interactive reference — admin only
          </p>
        </div>

        <div style={{ padding: '0 12px 8px' }}>
          <input
            type="text"
            placeholder="Search sections..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              background: '#f8fafc',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <nav className="dc-sidebar-nav">
          {filteredSections.map(s => {
            const idx = sections.indexOf(s)
            return (
              <button
                key={s.id}
                className={`dc-nav-item ${activeSection === idx ? 'dc-nav-active' : ''}`}
                onClick={() => { setActiveSection(idx); setSearchQuery('') }}
              >
                <span className="dc-nav-icon">{s.icon}</span>
                <span className="dc-nav-label">{s.label}</span>
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '16px 16px 12px', borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            This page is not indexed.<br />
            Admin access only.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="dc-main">
        <div className="dc-topbar">
          <div>
            <h2 style={{ margin: 0 }}>{currentSection.icon} {currentSection.label}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Section {activeSection + 1} of {sections.length}
            </p>
          </div>
          <div className="dc-topbar-actions">
            <button
              className="dc-btn dc-btn-ghost"
              disabled={activeSection === 0}
              onClick={() => setActiveSection(prev => prev - 1)}
            >
              ← Previous
            </button>
            <button
              className="dc-btn dc-btn-primary"
              disabled={activeSection === sections.length - 1}
              onClick={() => setActiveSection(prev => prev + 1)}
            >
              Next →
            </button>
          </div>
        </div>

        <div className="dc-scroll-area" style={{ padding: '24px 32px 60px' }}>
          <div style={{ maxWidth: 860 }}>
            {currentSection.content()}
          </div>
        </div>
      </main>
    </div>
  )
}

/* ─── Shared UI helpers ─── */

function Card({ title, children, variant }: { title?: string; children: React.ReactNode; variant?: 'info' | 'success' | 'warning' | 'danger' }) {
  const borderColor = variant === 'warning' ? '#f59e0b' : variant === 'danger' ? '#ef4444' : variant === 'success' ? '#22c55e' : '#e2e8f0'
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      marginBottom: 16,
      borderLeftWidth: variant ? 4 : 1,
    }}>
      {title && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
        </div>
      )}
      <div style={{ padding: '12px 16px', fontSize: 14, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre style={{
      background: '#1e293b',
      color: '#e2e8f0',
      padding: '14px 16px',
      borderRadius: 6,
      fontSize: 13,
      lineHeight: 1.6,
      overflowX: 'auto',
      margin: '8px 0 12px',
      fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace',
    }}>
      {children}
    </pre>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', margin: '8px 0 12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left',
                padding: '8px 12px',
                background: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #f1f5f9',
                  verticalAlign: 'top',
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Tag({ children, color = '#3b82f6' }: { children: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-block',
      background: color + '18',
      color,
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 500,
      margin: '0 4px 4px 0',
    }}>{children}</span>
  )
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 16, fontWeight: 600, margin: '24px 0 8px', color: '#0f172a' }}>{children}</h3>
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h4 style={{ fontSize: 14, fontWeight: 600, margin: '16px 0 6px', color: '#334155' }}>{children}</h4>
}

function Callout({ type, children }: { type: 'tip' | 'warning' | 'danger' | 'info'; children: React.ReactNode }) {
  const config = {
    tip:     { bg: '#f0fdf4', border: '#22c55e', icon: '💡', label: 'Tip' },
    warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠️', label: 'Warning' },
    danger:  { bg: '#fef2f2', border: '#ef4444', icon: '🚨', label: 'Critical' },
    info:    { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ️', label: 'Note' },
  }[type]
  return (
    <div style={{
      background: config.bg,
      borderLeft: `4px solid ${config.border}`,
      padding: '12px 16px',
      borderRadius: '0 6px 6px 0',
      margin: '12px 0',
      fontSize: 14,
      lineHeight: 1.6,
    }}>
      <strong>{config.icon} {config.label}:</strong> {children}
    </div>
  )
}

/* ─── Section Content ─── */

function OverviewSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Doubleclicker is a <strong>multi-tenant blog provisioning platform</strong>. One Next.js codebase deploys as
        many independent Fly.io apps. Each site is differentiated by a single environment variable:
        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>NEXT_PUBLIC_BRAND_USERNAME</code>.
        All sites share one Supabase database, filtered by username columns.
      </p>

      <Heading>The Actors</Heading>
      <Table
        headers={['Actor', 'Role', 'Communication']}
        rows={[
          ['Blog Cloner', 'External service that initiates provisioning', 'POST /api/provision with bearer token'],
          ['Doubleclicker (this app)', 'Seeds DB, deploys Fly apps, serves blog frontend', 'HTTP APIs + Supabase'],
          ['Auto-Onboard', 'Content pipeline — keywords, outlines, drafts', 'Fire-and-forget POST from provision'],
          ['MCP Client (doubleclicker-onboard)', 'External brand submission via AI consultation', 'POST /api/drafts with API key auth'],
          ['Stitch', 'Background worker, processes content queue', 'Polls stitch_queue table every 15s — no HTTP API'],
          ['Supabase', 'Shared Postgres database for all tenants', 'Service role client (bypasses RLS)'],
          ['Fly.io', 'Hosting — each tenant gets its own app', 'REST + GraphQL APIs'],
          ['Google Cloud', 'GA4, GTM, Search Console, Domains, DNS', 'Service account auth'],
          ['Resend', 'Transactional email (DNS records, confirmations)', 'REST API'],
          ['fal.ai', 'AI image generation (hero banners, logos)', 'REST API'],
        ]}
      />

      <Heading>System Flow</Heading>
      <Code>{`Blog Cloner
  → POST /api/provision (this app)
    → db_seed:          Seed shared Supabase DB (8 tables)
    → auto_onboard:     Call Doubleclicker auto-onboard (fire-and-forget)
    → hero_image:       Generate hero image via fal.ai
    → google_services:  Create GA4 property + GTM container
    → fly_deploy:       Deploy new Fly.io app
    → domain_purchase:  Purchase domain via Cloud Domains (optional)
    → certs:            Request TLS certificates
    → search_console:   Add to Google Search Console
    → dns_auto_config:  Auto-configure DNS via Cloud DNS
    → email:            Email user with DNS records
    → analytics:        Log analytics event

After auto-onboard:
  Doubleclicker → queues work in stitch_queue
  Stitch → polls every 15s → processes content generation`}</Code>

      <Heading>Key Design Principles</Heading>
      <Card>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li><strong>Self-healing:</strong> Phase failures are warnings, not blockers. Returns 200 with accumulated warnings.</li>
          <li><strong>Fire-and-forget:</strong> Auto-onboard, hero images, and Stitch are all async/decoupled.</li>
          <li><strong>Parallel operations:</strong> Network provisioning runs all members concurrently.</li>
          <li><strong>Env-var driven:</strong> Same Docker image, different env vars = different site.</li>
          <li><strong>No unique constraints:</strong> DB uses select-then-insert/update, not upsert.</li>
          <li><strong>Idempotency:</strong> Auto-onboard is skipped if brand already provisioned (<code>force_reprovision</code> overrides).</li>
          <li><strong>Structured results:</strong> Every phase returns a PhaseResult with status, severity, duration.</li>
        </ul>
      </Card>
    </>
  )
}

function QuickStartSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Step-by-step instructions to provision your first site from scratch.
      </p>

      <Heading>Step 1: Verify Environment</Heading>
      <p>Ensure all required env vars are set. At minimum you need:</p>
      <Code>{`# Core (always required)
PROVISION_SECRET=your-shared-secret
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DOUBLECLICKER_API_URL=https://doubleclicker.fly.dev

# Fly.io (required for deployment)
FLY_API_TOKEN=fo1_...
FLY_ORG_SLUG=personal
FLY_BASE_APP=doubledoubleclickclick

# Email (required for DNS emails)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
NOTIFICATION_EMAIL=admin@yourdomain.com`}</Code>

      <Heading>Step 2: Test Google Services (Optional)</Heading>
      <p>If you want GA4/GTM/Search Console/Domains, verify the service account works:</p>
      <Code>{`# Test GTM access (replace YOUR_TOKEN with PROVISION_SECRET value)
curl -H "Authorization: Bearer YOUR_TOKEN" \\
  "https://your-app.fly.dev/api/admin/google-test?action=gtm-accounts"

# Expected: JSON array of GTM accounts visible to service account`}</Code>

      <Callout type="warning">
        The GTM service account needs <strong>Admin-level</strong> access at the account level. User or Edit permissions will fail silently.
      </Callout>

      <Heading>Step 3: Provision via Admin UI</Heading>
      <p>Navigate to <code>/admin/provision</code>. Enter your provision secret in the password field at the top. There are 2 modes: <strong>&quot;I have a website&quot;</strong> (product-first) and <strong>&quot;I have a niche idea&quot;</strong> (niche-first). The minimum fields are:</p>
      <Table
        headers={['Field', 'Example', 'Required']}
        rows={[
          ['Username', 'modernlongevity', 'Yes'],
          ['Display Name', 'Modern Longevity', 'Yes'],
          ['Niche', 'longevity and anti-aging science', 'Yes (if no website_url)'],
          ['Contact Email', 'hello@modernlongevity.com', 'Recommended'],
          ['Theme', 'editorial', 'No (defaults to editorial)'],
        ]}
      />

      <Heading>Step 4: Provision via API (Alternative)</Heading>
      <Code>{`curl -X POST https://your-app.fly.dev/api/provision \\
  -H "Authorization: Bearer YOUR_PROVISION_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "modernlongevity",
    "display_name": "Modern Longevity",
    "niche": "longevity and anti-aging science",
    "tagline": "Science-backed insights for a longer life",
    "contact_email": "hello@modernlongevity.com",
    "theme": "editorial",
    "setup_google_analytics": true,
    "setup_google_tag_manager": true,
    "setup_search_console": true,
    "stitch_enabled": true,
    "fly_region": "syd",
    "force_reprovision": false
  }'`}</Code>

      <Heading>Step 5: Verify Deployment</Heading>
      <p>After provisioning completes, check:</p>
      <ol style={{ lineHeight: 2 }}>
        <li>Response <code>notifications.fly.status</code> is <code>&quot;ok&quot;</code></li>
        <li>Visit <code>https://modernlongevity-blog.fly.dev</code> — should load the blog</li>
        <li>Check <code>notifications.doubleclicker.status</code> — auto-onboard triggered</li>
        <li>Wait 2-5 minutes for Stitch to process the queue — blog posts will appear</li>
      </ol>

      <Heading>Step 6: Custom Domain (Optional)</Heading>
      <p>If you purchased a domain during provisioning, DNS is auto-configured. Click the verification link in the email to confirm TLS is active. If manual DNS, configure records from the email and then visit <code>/api/provision/verify-domain?username=X&amp;domain=Y</code>.</p>

      <Callout type="tip">
        Domain registration takes 1-2 minutes to activate. DNS propagation can take up to 48 hours, but typically completes within 15-30 minutes.
      </Callout>
    </>
  )
}

function ProvisionSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        The main provisioning endpoint orchestrates the entire site creation pipeline.
      </p>

      <Heading>Endpoint</Heading>
      <Code>{`POST /api/provision
Authorization: Bearer {PROVISION_SECRET}
Content-Type: application/json`}</Code>

      <Heading>Authentication</Heading>
      <p>Bearer token matching the <code>PROVISION_SECRET</code> environment variable. Returns 401 if missing or incorrect.</p>
      <Card variant="info" title="Why do I need to paste the secret?">
        <p>The admin pages (<code>/admin/provision</code>, <code>/admin/drafts</code>, <code>/admin/api-keys</code>) each have a password field at the top where you paste the provision secret. This is the authorization token that proves you&apos;re allowed to create and manage sites.</p>
        <p>The secret lives in the <code>PROVISION_SECRET</code> environment variable (check your <code>.env.local</code> file or Fly.io secrets). You paste it once per session — it&apos;s stored in browser memory only (not cookies or localStorage) and is never exposed via API.</p>
        <p>Find your secret: <code>grep PROVISION_SECRET .env.local</code></p>
      </Card>

      <Card title="Generating &amp; Rotating the Provision Secret">
        <SubHeading>Generate a new secret</SubHeading>
        <Code>{`# Run this in your terminal to generate a new random secret
openssl rand -hex 24 | sed 's/^/provision-/'
# Example output: provision-a1b2c3d4e5f6...`}</Code>

        <SubHeading>Update locally (.env.local)</SubHeading>
        <Code>{`# Open .env.local and replace the old value
PROVISION_SECRET=provision-your-new-secret-here`}</Code>

        <SubHeading>Update on Fly.io (base app)</SubHeading>
        <Code>{`# Set the secret on the base provisioner app
fly secrets set PROVISION_SECRET=provision-your-new-secret-here -a doubledoubleclickclick`}</Code>

        <SubHeading>Update on Doubleclicker</SubHeading>
        <Code>{`# The Doubleclicker app validates x-provision-secret header — it must match
fly secrets set PROVISION_SECRET=provision-your-new-secret-here -a doubleclicker`}</Code>

        <Callout type="danger">
          The secret must be identical in 3 places: your <code>.env.local</code>, the Fly.io base app (<code>doubledoubleclickclick</code>), and the Doubleclicker app (<code>doubleclicker</code>). If they don&apos;t match, provisioning will fail with 401 Unauthorized.
        </Callout>

        <SubHeading>Verify it works</SubHeading>
        <Code>{`# Test from your terminal
curl -s -o /dev/null -w "%{http_code}" \\
  -X POST https://doubledoubleclickclick.fly.dev/api/provision \\
  -H "Authorization: Bearer provision-your-new-secret-here" \\
  -H "Content-Type: application/json" \\
  -d '{"username":"test","display_name":"Test"}'
# Expected: 400 (missing niche/website_url) — NOT 401
# If you get 401, the secret doesn't match`}</Code>
      </Card>

      <Heading>Response Behavior</Heading>
      <Card variant="info" title="Self-Healing Design">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Returns <strong>200</strong> even when individual phases fail</li>
          <li>Phase failures are accumulated as <code>warnings[]</code></li>
          <li>Only returns <strong>500</strong> for auth failures or missing configuration</li>
          <li>Phases are sequential but independent — one failure doesn&apos;t block the next</li>
          <li>Each phase is executed via the <code>runPhase()</code> helper with categorized retries:</li>
        </ul>
        <Table
          headers={['Severity', 'Phases', 'Retries', 'On Failure']}
          rows={[
            ['Critical', 'db_seed, fly_deploy', '2 retries', 'Warning added'],
            ['Important', 'auto_onboard, google_services', 'No retry (1 attempt)', 'Warning added'],
            ['Optional', 'domain_purchase, tls_certs, dns_config, email_notify', 'No retry', 'Warning added'],
            ['Silent', 'hero_image, analytics_log', 'No retry', 'No warning on failure'],
          ]}
        />
      </Card>

      <Heading>Full Input Parameters</Heading>
      <Table
        headers={['Parameter', 'Type', 'Required', 'Default', 'Description']}
        rows={[
          ['username', 'string', 'Yes', '—', 'Tenant identifier (used in DB + Fly app name)'],
          ['display_name', 'string', 'Yes', '—', 'Brand display name'],
          ['tagline', 'string', 'No', '—', 'Brand tagline shown in header'],
          ['niche', 'string', 'Conditional', '—', 'Industry/topic (required if no website_url)'],
          ['website_url', 'string', 'No', '—', 'Existing website URL'],
          ['contact_email', 'string', 'No', 'derived from domain', 'Lead contact email'],
          ['blurb', 'string', 'No', '—', 'Brand description'],
          ['brand_voice_tone', 'string', 'No', '—', 'Voice and tone description'],
          ['target_market', 'string', 'No', '—', 'Target audience description'],
          ['primary_color', 'string', 'No', '—', 'Hex color (e.g. #2563eb)'],
          ['secondary_color', 'string', 'No', '—', 'Hex color'],
          ['accent_color', 'string', 'No', '—', 'Hex color'],
          ['logo_url', 'string', 'No', '—', 'URL to logo image'],
          ['heading_font', 'string', 'No', 'theme default', 'Google Font name'],
          ['body_font', 'string', 'No', 'theme default', 'Google Font name'],
          ['theme', 'string', 'No', 'editorial', 'editorial | boutique | modern'],
          ['author_name', 'string', 'No', '—', 'Default author name'],
          ['author_bio', 'string', 'No', '—', 'Author biography'],
          ['author_image_url', 'string', 'No', '—', 'Author avatar URL'],
          ['author_url', 'string', 'No', '—', 'Author website'],
          ['author_social_urls', 'object', 'No', '—', 'Social media links'],
          ['seed_keywords', 'string[]', 'No', '—', 'Initial keyword seeds'],
          ['languages', 'string[]', 'No', '["en"]', 'Publishing languages'],
          ['articles_per_day', 'number', 'No', '5', 'Publishing frequency'],
          ['setup_google_analytics', 'boolean', 'No', 'false', 'Create GA4 property'],
          ['setup_google_tag_manager', 'boolean', 'No', 'false', 'Create GTM container'],
          ['setup_search_console', 'boolean', 'No', 'false', 'Add to Search Console'],
          ['domain', 'string', 'No', '—', 'Custom domain to register'],
          ['purchase_domain', 'boolean', 'No', 'false', 'Register via Cloud Domains'],
          ['manual_dns', 'boolean', 'No', 'false', 'Manual DNS setup mode'],
          ['domain_yearly_price', 'object', 'No', '—', '{ currencyCode, units, nanos }'],
          ['domain_notices', 'string[]', 'No', '—', 'Domain registration notices'],
          ['fly_region', 'string', 'No', 'syd', 'Fly.io deployment region'],
          ['force_reprovision', 'boolean', 'No', 'false', 'Force re-provisioning even if brand exists'],
          ['skip_pipeline', 'boolean', 'No', 'false', 'Skip auto-onboard call'],
          ['skip_deploy', 'boolean', 'No', 'false', 'Skip Fly deployment'],
          ['stitch_enabled', 'boolean', 'No', 'true', 'Enable Stitch worker'],
          ['network_partners', 'object[]', 'No', '—', 'Partner sites for cross-linking'],
          ['ica_profile', 'object', 'No', '—', 'Ideal Customer Avatar'],
          ['style_guide', 'object', 'No', '—', 'Writing style rules'],
          ['research_context', 'object', 'No', '—', 'Industry research context'],
          ['preferred_elements', 'string[]', 'No', '—', 'Content elements to include'],
          ['prohibited_elements', 'string[]', 'No', '—', 'Content elements to avoid'],
          ['ai_instructions_override', 'string', 'No', '—', 'Custom AI instructions'],
          ['publishing_provider', 'string', 'No', "'supabase_blog'", 'Publishing destination'],
          ['discover_products', 'boolean', 'No', 'false', 'Enable product discovery'],
        ]}
      />

      <Heading>Response Structure</Heading>
      <Code>{`{
  "success": true,
  "message": "Site provisioned for {username}",
  "data": {
    "brand_guidelines": [...],
    "brand_specifications": [...],
    "company_information": [...],
    "author": [...],
    "integration_credentials": [...]
  },
  "phase_results": [
    { "phase": "db_seed", "status": "success", "severity": "critical", "duration_ms": 1234 },
    { "phase": "auto_onboard", "status": "skipped", "severity": "important", "message": "..." },
    { "phase": "hero_image", "status": "success", "severity": "silent", "duration_ms": 5678 },
    ...
  ],
  "notifications": {
    "doubleclicker":      { status, statusCode, data, error },
    "hero_image":         { status, url, reason },
    "google_analytics":   { status, measurement_id, property_id, error },
    "google_tag_manager": { status, public_id, container_id, error },
    "fly":                { status, app, url, ipv4, ipv6, error },
    "domain_purchase":    { status, domain, operation, price, error },
    "domain":             { status, domain, www_cert, apex_cert, dns_records },
    "search_console":     { status, site_url, verification_token, error },
    "dns_auto_config":    { status, records, reason },
    "email":              { status, to, error }
  },
  "warnings": ["..."],
  "fly":    { app, url, ipv4, ipv6 },
  "dns_records": [{ type: "A", name: "@", value: "..." }],
  "google": { ga_measurement_id, gtm_public_id }
}`}</Code>
    </>
  )
}

function PhasesSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Each phase runs sequentially. A failure in one phase does not block subsequent phases.
      </p>

      <Card title="Phase 1 — Seed Shared Database">
        <p>Seeds 8 tables in the shared Supabase database. Each upsert retries once on failure.</p>
        <SubHeading>Structured Voice Extraction (GPT-4.1)</SubHeading>
        <p>Before building the brand_guidelines payload, the provisioner calls GPT-4.1 to extract structured voice characteristics from the brand data. This populates 6 dedicated columns:</p>
        <Table
          headers={['Column', 'Type', 'Example']}
          rows={[
            ['voice_formality', 'text', '"casual-professional"'],
            ['voice_perspective', 'text', '"second_person" (brand) or "third_person" (affiliate)'],
            ['voice_personality_traits', 'text[]', '["authoritative", "warm", "direct"]'],
            ['voice_sentence_style', 'jsonb', '{ "avg_length": "medium", "fragments_ok": true, "rhetorical_questions": false }'],
            ['voice_vocabulary_preferences', 'jsonb', '{ "prefer": ["straightforward"], "avoid": ["leverage", "synergy"] }'],
            ['voice_example_sentences', 'text[]', '3-5 niche-specific example sentences'],
          ]}
        />
        <Callout type="info">
          Non-fatal: if <code>OPENAI_API_KEY</code> is not set or the call fails, these fields default to null/empty. The writer checks structured fields first, falls back to <code>voice_and_tone</code>.
        </Callout>
        <SubHeading>Tables Seeded</SubHeading>
        <Table
          headers={['Table', 'Filter Column', 'Key Data']}
          rows={[
            ['brand_guidelines', 'user_name', 'Brand name, voice/tone, tagline, structured voice fields, niche, keywords, author defaults, logo, company_name, content_style_rules, stitch_enabled, preferred_elements, prohibited_elements, ai_instructions_override'],
            ['brand_specifications', 'user_name', 'Colors, fonts, logo URL, theme, hero image'],
            ['company_information', 'username', 'Brand name, website, email, blurb'],
            ['authors', 'user_name + slug', 'Name, bio, avatar, social URLs'],
            ['integration_credentials', 'user_name', 'Provider config, translation, blog username'],
            ['target_market', 'username', 'ICA profile (INSERT only — allows multiple)'],
            ['brand_image_styles', 'user_name + name', 'Visual mood/composition for image generation'],
            ['app_settings', 'setting_name', 'Publishing settings, onboard config, network partners, V3 pipeline flags (username embedded in setting_name, e.g. publishing_settings:{username})'],
          ]}
        />
        <Callout type="danger">
          Note <code>company_information</code> and <code>target_market</code> use <code>username</code> (no underscore), while most other tables use <code>user_name</code>.
        </Callout>
        <Heading>V3 Pipeline Flags (always seeded)</Heading>
        <p>
          Three <code>app_settings</code> rows are always written so doubleclicker&apos;s auto-onboard runs the v3 pipeline (DeBono × Schwartz hat research + fichtean writer). Without these, auto-onboard falls back to v2 (no hat research, generic outline + writer).
        </p>
        <Table
          headers={['setting_name', 'setting_value', 'Effect']}
          rows={[
            ['topical_map_version:{username}', '"v3"', 'Theme extraction triggers per-theme hat research (60 Exa queries × 6 hats per theme)'],
            ['outline_version:{username}', '"v3"', 'Outline writer uses fichtean beats (hook/context/rising/climax/kicker)'],
            ['writer_version:{username}', '"v3"', 'Writer uses per-beat model tiering (Opus on hook/climax/kicker, Sonnet on context/rising)'],
          ]}
        />
        <Callout type="info">
          v3 is the only supported pipeline. There is no <code>pipeline_version</code> param to override — every new tenant gets v3.
        </Callout>
      </Card>

      <Card title="Phase 2 — Notify Doubleclicker (Auto-Onboard)">
        <p>Calls <code>POST &#123;DOUBLECLICKER_API_URL&#125;/api/strategy/auto-onboard</code> with:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Body: <code>&#123; &quot;username&quot;: &quot;...&quot; &#125;</code></li>
          <li>Header: <code>x-provision-secret: &#123;PROVISION_SECRET&#125;</code></li>
          <li>Timeout: 30s, no retry (1 attempt)</li>
        </ul>
        <Callout type="info">
          <strong>Idempotency guard:</strong> If <code>integration_credentials</code> already exists for this username and <code>force_reprovision</code> is not set, auto-onboard is skipped to prevent duplicate pipelines.
        </Callout>
        <Callout type="warning">
          This is fire-and-forget. All brand data must be in the DB (Phase 1) before this call. Doubleclicker reads everything from the shared DB.
        </Callout>
        <p>After onboard, the content pipeline runs: keyword research → product discovery → outline generation → draft writing → Stitch queue.</p>
      </Card>

      <Card title="Phase 2.5 — Generate Hero Banner Image">
        <p>Generates a hero banner via fal.ai. Non-blocking — continues silently if <code>FAL_API_KEY</code> is not set.</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Builds prompt from niche, brand name, and image style</li>
          <li>Updates <code>brand_specifications.hero_image_url</code> on success</li>
        </ul>
      </Card>

      <Card title="Phase 3 — Create Google Services">
        <p>Only runs if <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> is configured.</p>
        <SubHeading>GA4 (if setup_google_analytics=true)</SubHeading>
        <ul style={{ paddingLeft: 20 }}>
          <li>Creates property under <code>GOOGLE_ANALYTICS_ACCOUNT_ID</code></li>
          <li>Creates web data stream with site URL</li>
          <li>Returns <code>measurementId</code> (G-XXXXXXX format)</li>
        </ul>
        <SubHeading>GTM (if setup_google_tag_manager=true)</SubHeading>
        <ul style={{ paddingLeft: 20 }}>
          <li>Creates web container on <code>GOOGLE_TAG_MANAGER_ACCOUNT_ID</code></li>
          <li>Returns <code>publicId</code> (GTM-XXXXXXX format)</li>
        </ul>
        <p>GA/GTM IDs are stored as env vars on the Fly machine in Phase 4.</p>
      </Card>

      <Card title="Phase 4 — Deploy to Fly.io">
        <p>Skipped if <code>skip_deploy=true</code> or no <code>FLY_API_TOKEN</code>.</p>
        <ol style={{ paddingLeft: 20 }}>
          <li>Get Docker image from base app (<code>FLY_BASE_APP</code>)</li>
          <li>Create app <code>&#123;username&#125;-blog</code> in org <code>FLY_ORG_SLUG</code></li>
          <li>Set secrets (Supabase URL, keys, Resend key)</li>
          <li>Allocate IPv4 and IPv6 (independently, retry once each)</li>
          <li>Create machine with tenant-specific env vars</li>
        </ol>
        <p><strong>Machine spec:</strong> shared CPU, 1 core, 512 MB RAM, port 3000, autostop/autostart, min 0 machines.</p>
      </Card>

      <Card title="Phase 5 — Purchase Domain">
        <p>Optional. Only runs if <code>purchase_domain=true</code> and domain price provided.</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Registers domain via Google Cloud Domains</li>
          <li>Privacy: <code>REDACTED_CONTACT_DATA</code></li>
          <li>Returns long-running operation (domain activates in 1-2 minutes)</li>
          <li>Charges the GCP project&apos;s billing account</li>
        </ul>
      </Card>

      <Card title="Phase 6 — Request TLS Certificates">
        <p>Requests HTTPS certificates from Fly&apos;s ACME integration for both <code>www.&#123;domain&#125;</code> and the apex domain. Each request is independent.</p>
      </Card>

      <Card title="Phase 7 — Add to Google Search Console">
        <p>Only runs if <code>setup_search_console=true</code> and Google is configured.</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Adds domain property with <code>sc-domain:</code> prefix</li>
          <li>Requests DNS TXT verification token</li>
          <li>Token included in DNS records for Phase 8</li>
        </ul>
        <Callout type="danger">
          Must use <code>INET_DOMAIN</code> type with <code>sc-domain:</code> prefix. The <code>SITE</code> type fails with DNS_TXT verification.
        </Callout>
      </Card>

      <Card title="Phase 8 — Auto-Configure DNS (Cloud DNS)">
        <p>Only runs if domain was purchased via Cloud Domains AND Fly deployed successfully.</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Finds managed zone auto-created by Cloud Domains</li>
          <li>Deletes existing A/AAAA/TXT records (preserves NS and SOA)</li>
          <li>Creates: A (IPv4), AAAA (IPv6), CNAME (www), TXT (Search Console verification)</li>
          <li>TTL: 300 seconds</li>
        </ul>
      </Card>

      <Card title="Phase 9 — Email User with DNS Records">
        <p>Sends HTML email via Resend to <code>contact_email</code> containing:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>DNS records table (type, name, value)</li>
          <li>CTA: link to live Fly.dev URL</li>
          <li>CTA: domain verification link</li>
          <li>Format varies based on <code>manual_dns</code> flag</li>
        </ul>
      </Card>

      <Card title="Phase 10 — Log Analytics Event">
        <p>Inserts <code>site_provisioned</code> event into <code>analytics_events</code> table with full context: username, domain, all notification statuses, and warnings.</p>
      </Card>
    </>
  )
}

function AdminApiSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        All admin endpoints live under <code>/api/admin/</code>. Most require <code>PROVISION_SECRET</code> as bearer token.
      </p>

      <Card title="POST /api/admin/provision-network">
        <p>Orchestrates parallel provisioning of an entire site network. See the <strong>Network Provisioning</strong> section for full details.</p>
      </Card>

      <Card title="GET /api/admin/provision-network?network_id=X">
        <p>Returns network and member status for a previously created network.</p>
      </Card>

      <Card title="POST /api/admin/api-keys">
        <p>Creates API key for external clients.</p>
        <p><strong>Auth:</strong> <code>PROVISION_SECRET</code> header</p>
        <p><strong>Input:</strong> <code>&#123; client_name, contact_email &#125;</code></p>
        <p><strong>Output:</strong> <code>&#123; id, key &#125;</code> — full key shown only once.</p>
      </Card>

      <Card title="DELETE /api/admin/api-keys">
        <p>Revokes an API key by ID.</p>
      </Card>

      <Card title="GET /api/admin/pipeline-status">
        <p>Proxies to Doubleclicker&apos;s pipeline status endpoint.</p>
        <Code>{`GET /api/admin/pipeline-status?path=/api/strategy/pipeline-status?username=X&run_id=Y`}</Code>
      </Card>

      <Card title="PATCH /api/admin/drafts">
        <p>Updates site draft status, domain selections, and admin notes.</p>
        <p><strong>Input:</strong> <code>&#123; draft_id, domain_selections, status, admin_notes &#125;</code></p>
      </Card>

      <Card title="POST /api/admin/generate-logo">
        <p>Generates a logo image via fal.ai.</p>
        <p><strong>Input:</strong> <code>&#123; prompt, username &#125;</code></p>
        <p><strong>Output:</strong> <code>&#123; success, url &#125;</code></p>
      </Card>

      <Card title="GET /api/admin/google-test">
        <p>Diagnostic endpoint for testing Google API access.</p>
        <Table
          headers={['Query', 'Description']}
          rows={[
            ['?action=gtm-accounts', 'Lists GTM accounts visible to service account'],
            ['?action=gtm-containers', 'Lists containers on configured account'],
            ['?action=gtm-create', 'Creates a test container (optional ?name=)'],
          ]}
        />
      </Card>

      <Card title="POST /api/admin/domain-suggestions">
        <p>Searches available domains via Google Cloud Domains.</p>
        <p><strong>Input:</strong> <code>&#123; niche, brand_name &#125;</code></p>
        <p><strong>Output:</strong> Suggestions filtered to domains under $15/year, sorted by price.</p>
      </Card>

      <Card title="POST|GET /api/admin/dc-proxy">
        <p>Proxies requests to Doubleclicker backend with 120-second timeout.</p>
        <p><strong>Auth:</strong> <code>PROVISION_SECRET</code> header.</p>
      </Card>

      <Callout type="info">
        External draft creation is handled by <code>POST /api/drafts</code> (see <strong>Public API Reference</strong> section). It uses API key auth, not PROVISION_SECRET.
      </Callout>
    </>
  )
}

function PublicApiSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Public-facing API endpoints used by the blog frontend and external integrations.
      </p>

      <Card title="POST /api/blog">
        <p>Upserts/publishes/unpublishes blog posts.</p>
        <p><strong>Input:</strong> <code>&#123; postId, title, content, slug, status, tags, featured_image, author, ... &#125;</code></p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Upserts on <code>external_id</code> to <code>blog_posts</code></li>
          <li>If <code>status=&apos;draft&apos;</code> or <code>&apos;unpublish&apos;</code>, deletes the post</li>
        </ul>
      </Card>

      <Card title="GET /api/blog">
        <p>Returns published posts for the current tenant.</p>
        <p><strong>Query:</strong> <code>?limit=100&amp;category=X</code></p>
      </Card>

      <Card title="GET /api/blog/categories">
        <p>Returns categories with post counts for the current tenant.</p>
      </Card>

      <Card title="POST /api/leads">
        <p>Captures homepage lead magnet submissions.</p>
        <p><strong>Input:</strong> <code>&#123; name, email, topic, username &#125;</code></p>
      </Card>

      <Card title="POST /api/lead-capture">
        <p>Contact form submissions with rate limiting and email notification.</p>
        <p><strong>Input:</strong> <code>&#123; name, email, company, website, message, source, topic &#125;</code></p>
        <ul style={{ paddingLeft: 20 }}>
          <li>IP-based rate limiting (in-memory cache)</li>
          <li>Spam protection via <code>lib/spam-protection.ts</code></li>
          <li>HTML email notification to admin via Resend</li>
        </ul>
      </Card>

      <Card title="POST /api/quiz-submit">
        <p>Scores quiz submissions.</p>
        <p><strong>Input:</strong> <code>&#123; quizId, brandId, name, email, answers, timeTakenSeconds &#125;</code></p>
        <p>Returns score, percentage, pass/fail.</p>
      </Card>

      <Card title="POST /api/drafts">
        <p>Creates site concept draft from external API client.</p>
        <p><strong>Auth:</strong> Bearer token (API key validation).</p>
        <p><strong>Output:</strong> <code>&#123; draft_id, status, type, site_count &#125;</code></p>
      </Card>

      <Card title="GET /api/provision/verify-domain">
        <p>Domain verification callback (linked from DNS email).</p>
        <p><strong>Query:</strong> <code>?username=X&amp;domain=Y</code></p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Checks TLS certificate status</li>
          <li>If configured: updates DB URLs, sends confirmation email, returns <code>status: &apos;live&apos;</code></li>
          <li>If not yet issued: returns <code>status: &apos;pending&apos;</code> with manual DNS records</li>
        </ul>
      </Card>
    </>
  )
}

function GoogleSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        All Google APIs are authenticated via a GCP service account. The JSON key is stored in <code>GOOGLE_SERVICE_ACCOUNT_JSON</code>.
      </p>

      <Heading>Service Account Requirements</Heading>
      <Table
        headers={['Service', 'Required Role', 'Notes']}
        rows={[
          ['GA4', 'Editor role on Analytics account', 'Creates properties and data streams'],
          ['GTM', 'Admin-level access at account level', 'User/Edit permissions will fail silently!'],
          ['Search Console', 'Service account = verified owner', 'Auto-added via API'],
          ['Cloud Domains', 'roles/domains.admin on GCP project', 'Registers and manages domains'],
          ['Cloud DNS', 'roles/dns.admin on GCP project', 'Manages DNS zones and records'],
        ]}
      />

      <Callout type="danger">
        GTM requires <strong>Admin-level</strong> access at the account level. This is the #1 gotcha. If the service account only has User or Edit permissions, container creation will fail with an opaque error.
      </Callout>

      <Heading>Required Environment Variables</Heading>
      <Code>{`GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
GOOGLE_CLOUD_PROJECT=gen-lang-client-0071841353
GOOGLE_ANALYTICS_ACCOUNT_ID=123456789
GOOGLE_TAG_MANAGER_ACCOUNT_ID=987654321`}</Code>

      <Heading>Functions (lib/google.ts)</Heading>

      <Card title="isGoogleServiceConfigured()">
        <p>Returns <code>true</code> if <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> is set. Used to conditionally skip Google phases.</p>
      </Card>

      <Card title="createGA4Property(displayName, siteUrl, timeZone)">
        <p>Creates GA4 property + web data stream.</p>
        <p><strong>Returns:</strong> <code>&#123; propertyId, propertyName, measurementId, streamName &#125;</code></p>
      </Card>

      <Card title="createGTMContainer(containerName)">
        <p>Creates web container on configured account.</p>
        <p><strong>Returns:</strong> <code>&#123; containerId, publicId, path &#125;</code></p>
      </Card>

      <Card title="addSearchConsoleSite(siteUrl)">
        <p>Adds domain property with <code>sc-domain:</code> prefix. Gets DNS TXT verification token.</p>
        <p><strong>Returns:</strong> <code>&#123; siteUrl, domain, verificationToken, verificationMethod &#125;</code></p>
        <Callout type="warning">
          Must use <code>INET_DOMAIN</code> type. The <code>SITE</code> type fails with DNS_TXT verification.
        </Callout>
      </Card>

      <Card title="Domain Search">
        <p>Domain search is handled at the API route level (<code>POST /api/admin/domain-suggestions</code>), not as a standalone lib function.</p>
      </Card>

      <Card title="registerDomain(domainName, contactEmail, yearlyPrice, domainNotices)">
        <p>Registers domain. Privacy = <code>REDACTED_CONTACT_DATA</code>. Returns long-running operation.</p>
      </Card>

      <Card title="getDnsZone(domainName)">
        <p>Finds Cloud DNS managed zone (auto-created by Cloud Domains).</p>
        <p><strong>Returns:</strong> <code>&#123; zoneName, dnsName &#125;</code></p>
      </Card>

      <Card title="configureDnsRecords(domainName, records)">
        <p>Sets A, AAAA, CNAME (www), and TXT records. TTL: 300s. Deletes existing records first (preserves NS/SOA).</p>
        <p><strong>Input:</strong> <code>&#123; ipv4, ipv6, flyAppHostname, txtRecords? &#125;</code></p>
      </Card>

      <Heading>Diagnostic Endpoint</Heading>
      <Code>{`# Test GTM accounts
curl -H "Authorization: Bearer YOUR_SECRET" \\
  "https://your-app.fly.dev/api/admin/google-test?action=gtm-accounts"

# Test GTM containers
curl -H "Authorization: Bearer YOUR_SECRET" \\
  "https://your-app.fly.dev/api/admin/google-test?action=gtm-containers"

# Create test container
curl -H "Authorization: Bearer YOUR_SECRET" \\
  "https://your-app.fly.dev/api/admin/google-test?action=gtm-create&name=test-container"`}</Code>
    </>
  )
}

function FlySection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Each tenant gets its own Fly.io app, created dynamically during provisioning. All apps share the same Docker image.
      </p>

      <Heading>API Endpoints Used</Heading>
      <Table
        headers={['Endpoint', 'Purpose']}
        rows={[
          ['Machines REST: api.machines.dev/v1', 'App creation, machine management, certificates'],
          ['GraphQL: api.fly.io/graphql', 'Secrets management, IP allocation'],
        ]}
      />

      <Heading>Functions (lib/fly.ts)</Heading>

      <Card title="createApp(appName, orgSlug)">
        <p>Creates a Fly app. 409/422 = already exists (non-fatal).</p>
        <p>App naming: <code>&#123;username&#125;-blog</code></p>
      </Card>

      <Card title="setSecrets(appName, secrets)">
        <p>Sets app secrets via GraphQL mutation. Secrets are encrypted and not visible in machine env.</p>
      </Card>

      <Card title="allocateIpv4(appName) / allocateIpv6(appName)">
        <p>Allocates static IPs. Each retries once independently.</p>
      </Card>

      <Card title="getAppImage(appName)">
        <p>Gets Docker image from the first machine of the base app. This is how new deployments use the same code.</p>
      </Card>

      <Card title="createMachine(appName, image, env, region)">
        <p>Creates the actual VM:</p>
        <Table
          headers={['Setting', 'Value']}
          rows={[
            ['CPU', 'shared, 1 core'],
            ['Memory', '512 MB'],
            ['Ports', '80 (HTTP) → 3000, 443 (TLS+HTTP) → 3000'],
            ['Auto-stop', 'Enabled (scales to zero)'],
            ['Auto-start', 'Enabled (wakes on request)'],
            ['Min machines', '0'],
            ['Region', 'syd (default, configurable)'],
          ]}
        />
      </Card>

      <Card title="addCertificate(appName, hostname)">
        <p>Requests ACME TLS certificate for a hostname. 409 = already exists.</p>
      </Card>

      <Card title="checkCertificate(appName, hostname)">
        <p>Returns certificate status. Used by verify-domain endpoint to check if TLS is active.</p>
      </Card>

      <Heading>fly.toml (Base App)</Heading>
      <Code>{`app = 'doubledoubleclickclick'
primary_region = 'syd'

[env]
  NODE_ENV = 'production'
  PORT = '3000'
  HOSTNAME = '0.0.0.0'

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1`}</Code>

      <Callout type="info">
        New tenant apps are created via the API, not from fly.toml. The toml file is only used for the base app deployment.
      </Callout>
    </>
  )
}

function DatabaseSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        All tenants share one Supabase Postgres database. Rows are filtered by username columns.
      </p>

      <Heading>Client: lib/supabase/service.ts</Heading>
      <p><code>createServiceClient()</code> returns a Supabase client with the service role key (bypasses RLS). Auth persistence is disabled. This is the <strong>only</strong> Supabase client in the codebase.</p>

      <Heading>Column Name Inconsistency</Heading>
      <Callout type="danger">
        This is the most common source of bugs. Different tables use different column names for the tenant identifier.
      </Callout>
      <Table
        headers={['Column', 'Tables']}
        rows={[
          ['user_name', 'blog_posts, brand_guidelines, brand_specifications, authors, integration_credentials, brand_image_styles'],
          ['username', 'company_information, target_market, cluster_articles, content_schedule'],
        ]}
      />
      <Callout type="info">
        <code>app_settings</code> uses <code>setting_name</code> (not <code>user_name</code> or <code>username</code>) with the username embedded in the key, e.g. <code>publishing_settings:&#123;username&#125;</code>.
      </Callout>

      <Heading>Date Column Names (blog_posts)</Heading>
      <Callout type="warning">
        Uses <code>created_date</code>, <code>updated_date</code>, <code>published_date</code> — NOT <code>created_at</code> / <code>updated_at</code>.
      </Callout>

      <Heading>No Unique Constraints</Heading>
      <p>These tables have <strong>no unique constraint</strong> on their user column:</p>
      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li><code>brand_guidelines</code></li>
        <li><code>brand_specifications</code></li>
        <li><code>company_information</code></li>
        <li><code>authors</code></li>
      </ul>
      <p>You <strong>must</strong> use a select-first-then-insert/update pattern, NOT upsert.</p>

      <Code>{`// CORRECT pattern (dbUpsert helper)
const { data: existing } = await supabase
  .from('brand_guidelines')
  .select('id')
  .eq('user_name', username)
  .maybeSingle()

if (existing) {
  await supabase.from('brand_guidelines').update(payload).eq('id', existing.id)
} else {
  await supabase.from('brand_guidelines').insert({ user_name: username, ...payload })
}

// WRONG — will create duplicates
await supabase.from('brand_guidelines').upsert({ user_name: username, ...payload })`}</Code>

      <Heading>Foreign Key Naming</Heading>
      <p><code>brand_specifications.guideline_id</code> — NOT <code>brand_guideline_id</code>.</p>

      <Heading>Tables Seeded During Provisioning</Heading>
      <Table
        headers={['Table', 'Key Columns']}
        rows={[
          ['brand_guidelines', 'user_name, name, tagline, voice_and_tone, voice_formality, voice_perspective, voice_personality_traits, voice_sentence_style, voice_vocabulary_preferences, voice_example_sentences, niche, seed_keywords, logo_url'],
          ['brand_specifications', 'user_name, guideline_id, primary_color, accent_color, heading_font, body_font, theme'],
          ['company_information', 'username, brand_name, client_website, email, blurb'],
          ['authors', 'user_name, name, slug, bio, profile_image_url'],
          ['integration_credentials', 'user_name, provider, blog_username, translation_enabled, languages'],
          ['target_market', 'username, ica_profile'],
          ['brand_image_styles', 'user_name, name, mood, composition, color_palette'],
          ['app_settings', 'setting_name (with embedded username), articles_per_day, stitch_enabled, network_partners'],
        ]}
      />

      <Heading>Other Key Tables</Heading>
      <Table
        headers={['Table', 'Purpose']}
        rows={[
          ['blog_posts', 'Published blog content (filtered by user_name + status)'],
          ['leads', 'Lead magnet submissions'],
          ['quiz_responses', 'Quiz answers and scores'],
          ['site_drafts', 'Site concept drafts from external clients'],
          ['site_networks', 'Network definitions'],
          ['site_network_members', 'Network member status tracking'],
          ['client_api_keys', 'External client API keys (hashed)'],
          ['analytics_events', 'Provision event logs'],
          ['stitch_queue', 'Background worker queue (read by Stitch)'],
        ]}
      />
    </>
  )
}

function ThemesSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Three built-in themes control the visual appearance of every deployed blog.
      </p>

      <Table
        headers={['Theme', 'Font', 'Feel', 'Key Features']}
        rows={[
          ['editorial', 'Georgia (serif)', 'Classic newspaper', 'Top bar with date, double-line masthead, category nav, no border radius, no shadows'],
          ['boutique', 'DM Sans', 'Warm & personal', 'Accent color top bar, centered brand, pill-shaped category nav, 16px radius, soft shadows'],
          ['modern', 'Inter', 'Clean & minimal', 'Compact header, slide-down mobile menu, 8px radius, no shadows'],
        ]}
      />

      <Heading>How Themes Work</Heading>
      <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li><strong>Selection:</strong> Theme name stored in <code>brand_specifications.theme</code></li>
        <li><strong>CSS Variables:</strong> <code>BrandStyles.tsx</code> (server component) fetches brand specs, gets theme preset, merges with brand-specific overrides, injects as <code>html[data-theme]</code> CSS</li>
        <li><strong>Component Rendering:</strong> <code>ThemeRenderer.tsx</code> maps theme name → component (ThemeHomePage, ThemeBlogPost, etc.)</li>
        <li><strong>Custom CSS:</strong> <code>brand_specifications.custom_css</code> applied on top of theme variables</li>
      </ol>

      <Heading>Key Files</Heading>
      <Table
        headers={['File', 'Purpose']}
        rows={[
          ['lib/themes.ts', 'THEMES constant with all preset definitions (colors, fonts, variables)'],
          ['components/BrandStyles.tsx', 'Server component that injects theme CSS variables'],
          ['components/themes/ThemeRenderer.tsx', 'Factory mapping theme names to components'],
          ['components/themes/editorial/', 'Editorial theme components'],
          ['components/themes/boutique/', 'Boutique theme components'],
          ['components/themes/modern/', 'Modern theme components'],
          ['components/themes/types.ts', 'Shared type definitions (HomePageProps, BlogPostPageProps)'],
        ]}
      />

      <Heading>Theme Variables</Heading>
      <p>Each theme defines CSS custom properties that control every visual aspect:</p>
      <Code>{`--font-heading, --font-body
--color-bg, --color-text, --color-accent, --color-muted
--border-radius
--card-shadow (or none)
/* Plus many more for fine-grained control */`}</Code>

      <Callout type="tip">
        Brand-specific colors/fonts from <code>brand_specifications</code> override the theme defaults. So you can use the editorial layout but with completely custom colors.
      </Callout>

      <Heading>Tagline Support</Heading>
      <p>Each theme renders the brand tagline differently when present in <code>brand_guidelines.tagline</code>:</p>
      <Table
        headers={['Theme', 'Tagline Rendering']}
        rows={[
          ['Editorial', 'Below brand name, italicized'],
          ['Boutique', 'Below brand name, smaller text, accent color'],
          ['Modern', 'Next to brand name in nav, muted text'],
        ]}
      />
      <Callout type="info">
        All themes gracefully hide the tagline when it is null or empty -- no conditional rendering needed by consumers.
      </Callout>

      <Heading>Runtime Behavior</Heading>
      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li><code>ThemeRenderer</code> now logs <code>console.warn</code> for unknown theme names and falls back to <code>editorial</code>.</li>
        <li><code>CookieConsent</code> now respects theme CSS variables for consistent styling across themes.</li>
      </ul>
    </>
  )
}

function NetworkSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Network provisioning creates a constellation of related-but-distinct niche sites that cross-link with each other.
      </p>

      <Heading>How It Works</Heading>
      <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li>You define a network with a seed niche and multiple member sites</li>
        <li>Each member gets a <code>role</code>: <strong>seed</strong> (primary site) or <strong>satellite</strong> (supporting niche)</li>
        <li>The system builds a <code>network_partners</code> list for each member (all OTHER members)</li>
        <li>All members are provisioned <strong>in parallel</strong> via <code>POST /api/provision</code></li>
        <li>Each site&apos;s auto-onboard gets the network_partners context for cross-linking</li>
      </ol>

      <Heading>Admin UI</Heading>
      <p>Navigate to <code>/admin/network</code> to use the network provisioning form.</p>

      <Heading>API</Heading>
      <Code>{`POST /api/admin/provision-network
Authorization: Bearer {PROVISION_SECRET}
Content-Type: application/json

{
  "network_name": "Health & Wellness Network",
  "seed_niche": "health and wellness",
  "members": [
    {
      "username": "modernlongevity",
      "display_name": "Modern Longevity",
      "niche": "longevity and anti-aging science",
      "role": "seed",
      "contact_email": "hello@modernlongevity.com"
    },
    {
      "username": "sleepwell",
      "display_name": "Sleep Well",
      "niche": "sleep optimization and circadian health",
      "role": "satellite",
      "contact_email": "hello@sleepwell.com"
    }
  ],
  "fly_region": "syd",
  "theme": "editorial"
}`}</Code>

      <Heading>Database Tables</Heading>
      <Table
        headers={['Table', 'Purpose']}
        rows={[
          ['site_networks', 'Network definition (name, seed_niche, status)'],
          ['site_network_members', 'Individual member status (provisioning → done/failed)'],
        ]}
      />

      <Callout type="info">
        Each member&apos;s <code>network_partners</code> is stored in <code>app_settings</code> so the content pipeline can generate cross-linking content.
      </Callout>
    </>
  )
}

function DomainsSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Domain management covers purchasing, DNS configuration, TLS certificates, and verification.
      </p>

      <Heading>Domain Purchase Flow</Heading>
      <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li>Search available domains via <code>POST /api/admin/domain-suggestions</code></li>
        <li>Select domain and confirm price</li>
        <li>Provision with <code>purchase_domain: true</code> and <code>domain_yearly_price</code></li>
        <li>Phase 5 registers domain via Cloud Domains (takes 1-2 min)</li>
        <li>Phase 6 requests TLS certificates from Fly</li>
        <li>Phase 8 auto-configures DNS records in Cloud DNS</li>
        <li>Phase 9 sends email with DNS records and verification link</li>
      </ol>

      <Heading>Manual DNS Flow</Heading>
      <p>If the domain is registered elsewhere (not via Cloud Domains):</p>
      <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li>Provision with <code>manual_dns: true</code> and the <code>domain</code> field</li>
        <li>Phase 6 requests TLS certificates</li>
        <li>Phase 8 is skipped (no Cloud DNS zone to configure)</li>
        <li>Phase 9 emails the DNS records for manual configuration</li>
        <li>User configures DNS at their registrar</li>
        <li>User clicks verification link to confirm</li>
      </ol>

      <Heading>DNS Records Created</Heading>
      <Table
        headers={['Type', 'Name', 'Value', 'Purpose']}
        rows={[
          ['A', '@', 'Fly IPv4 address', 'Apex domain → Fly'],
          ['AAAA', '@', 'Fly IPv6 address', 'Apex domain → Fly (v6)'],
          ['CNAME', 'www', '{app}.fly.dev', 'www subdomain → Fly'],
          ['TXT', '@', 'google-site-verification=...', 'Search Console verification (if enabled)'],
        ]}
      />

      <Heading>Domain Verification</Heading>
      <Code>{`GET /api/provision/verify-domain?username=modernlongevity&domain=modernlongevity.com`}</Code>
      <p>Checks TLS certificate status. If active, updates DB URLs and sends confirmation email.</p>

      <Callout type="tip">
        DNS propagation typically takes 15-30 minutes but can take up to 48 hours. The verification link can be clicked repeatedly until it succeeds.
      </Callout>
    </>
  )
}

function EmailSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Email is handled by <strong>Resend</strong>. Three types of emails are sent by the system.
      </p>

      <Heading>Required Environment Variables</Heading>
      <Code>{`RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com    # Must be a verified domain in Resend
NOTIFICATION_EMAIL=admin@yourdomain.com     # Admin notification recipient`}</Code>

      <Heading>Email Types</Heading>

      <Card title="1. DNS Records Email (Phase 9)">
        <p>Sent after provisioning. Contains:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>DNS records table (type, name, value)</li>
          <li>CTA: link to live Fly.dev URL</li>
          <li>CTA: domain verification link</li>
          <li>Format varies based on <code>manual_dns</code> flag</li>
        </ul>
      </Card>

      <Card title="2. Domain Verification Email">
        <p>Sent when <code>verify-domain</code> endpoint confirms TLS is active. Confirms the domain is live.</p>
      </Card>

      <Card title="3. Contact Form Notification">
        <p>Sent to <code>NOTIFICATION_EMAIL</code> when a visitor submits the contact form. HTML formatted with sanitized fields.</p>
      </Card>

      <Callout type="warning">
        The <code>RESEND_FROM_EMAIL</code> sender address must match a verified domain in your Resend account, or emails will fail.
      </Callout>
    </>
  )
}

function ImagesSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        AI image generation is powered by <strong>fal.ai</strong> and is optional — all features degrade gracefully without it.
      </p>

      <Heading>Required Variable</Heading>
      <Code>{`OPENAI_API_KEY=sk-...  # Optional — structured voice extraction via GPT-4.1
FAL_API_KEY=fal-...   # Optional — features skip silently without it`}</Code>

      <Heading>Hero Banner Generation (Phase 2.5)</Heading>
      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li>Builds prompt from niche, brand name, and image style</li>
        <li>Updates <code>brand_specifications.hero_image_url</code> on success</li>
        <li>Non-blocking — provisioning continues regardless</li>
      </ul>

      <Heading>Logo Generation (Admin API)</Heading>
      <Code>{`POST /api/admin/generate-logo
Content-Type: application/json

{ "prompt": "minimal logo for a longevity blog", "username": "modernlongevity" }`}</Code>
      <p>Returns <code>&#123; success: true, url: &quot;https://...&quot; &#125;</code></p>
    </>
  )
}

function EnvSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Complete environment variable reference, grouped by category.
      </p>

      <Heading>Core (Always Required)</Heading>
      <Table
        headers={['Variable', 'Description']}
        rows={[
          ['PROVISION_SECRET', 'Bearer token authenticating Blog Cloner → Provision endpoint'],
          ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase project URL'],
          ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase anonymous key'],
          ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase service role key (bypasses RLS)'],
          ['DOUBLECLICKER_API_URL', 'Doubleclicker backend URL (e.g. https://doubleclicker.fly.dev)'],
          ['DOMAIN_ADMIN_EMAIL', 'Admin email for domain registrations (defaults to stuartr@sewo.io)'],
        ]}
      />

      <Heading>Fly.io (Required for Deployment)</Heading>
      <Table
        headers={['Variable', 'Description']}
        rows={[
          ['FLY_API_TOKEN', 'Fly.io API token with deploy permissions'],
          ['FLY_ORG_SLUG', 'Fly.io org slug (default: personal)'],
          ['FLY_BASE_APP', 'Base app to clone Docker image from (default: doubledoubleclickclick)'],
        ]}
      />

      <Heading>Google Services (Optional)</Heading>
      <Table
        headers={['Variable', 'Description']}
        rows={[
          ['GOOGLE_SERVICE_ACCOUNT_JSON', 'Full GCP service account JSON key'],
          ['GOOGLE_CLOUD_PROJECT', 'GCP project ID'],
          ['GOOGLE_ANALYTICS_ACCOUNT_ID', 'GA4 account ID'],
          ['GOOGLE_TAG_MANAGER_ACCOUNT_ID', 'GTM account ID'],
        ]}
      />

      <Heading>Email (Required for Notifications)</Heading>
      <Table
        headers={['Variable', 'Description']}
        rows={[
          ['RESEND_API_KEY', 'Resend API key'],
          ['RESEND_FROM_EMAIL', 'Verified sender email address'],
          ['NOTIFICATION_EMAIL', 'Admin notification recipient'],
        ]}
      />

      <Heading>AI / Image Generation (Optional)</Heading>
      <Table
        headers={['Variable', 'Description']}
        rows={[
          ['OPENAI_API_KEY', 'GPT-4.1 for structured voice extraction during provisioning'],
          ['FAL_API_KEY', 'fal.ai for hero images and logos'],
        ]}
      />

      <Heading>Analytics (Optional)</Heading>
      <Table
        headers={['Variable', 'Description']}
        rows={[
          ['NEXT_PUBLIC_POSTHOG_KEY', 'PostHog project key'],
          ['NEXT_PUBLIC_POSTHOG_HOST', 'PostHog host URL'],
        ]}
      />

      <Heading>Per-Tenant (Set on Each Fly Machine)</Heading>
      <Table
        headers={['Variable', 'Description']}
        rows={[
          ['NEXT_PUBLIC_BRAND_USERNAME / BRAND_USERNAME', 'Tenant identifier'],
          ['NEXT_PUBLIC_SITE_URL / SITE_URL', 'Canonical site URL'],
          ['NEXT_PUBLIC_SITE_NAME / SITE_NAME', 'Display name'],
          ['NEXT_PUBLIC_GA_ID / GA_ID', 'GA4 Measurement ID'],
          ['NEXT_PUBLIC_GTM_ID / GTM_ID', 'GTM Public ID'],
          ['CONTACT_EMAIL', 'Tenant contact email'],
          ['CONTACT_PHONE', 'Tenant contact phone (NOT currently set on deployed machines)'],
        ]}
      />

      <Heading>Env Var Precedence</Heading>
      <Card variant="info">
        <p><strong>Non-prefixed</strong> (runtime) → <strong>NEXT_PUBLIC_*</strong> (build-time) → <strong>empty string</strong> (default)</p>
        <p>This means <code>BRAND_USERNAME</code> takes priority over <code>NEXT_PUBLIC_BRAND_USERNAME</code>. The empty-string fallback is intentional — it allows <code>next build</code> to succeed without env vars.</p>
      </Card>
    </>
  )
}

function TenantSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Multi-tenancy is achieved through environment variables. Every deployed Fly.io app runs identical code.
      </p>

      <Heading>getTenantConfig() — lib/tenant.ts</Heading>
      <Code>{`interface TenantConfig {
  username: string       // BRAND_USERNAME || NEXT_PUBLIC_BRAND_USERNAME || ''
  siteUrl: string        // SITE_URL || derived || ''
  siteName: string       // SITE_NAME || NEXT_PUBLIC_SITE_NAME || ''
  contactEmail: string   // CONTACT_EMAIL || ''
  contactPhone: string   // CONTACT_PHONE || ''
  gtmId: string          // GTM_ID || NEXT_PUBLIC_GTM_ID || ''
  gaId: string           // GA_ID || NEXT_PUBLIC_GA_ID || ''
}`}</Code>

      <Heading>How It Works</Heading>
      <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li>Each Fly.io app is deployed from the same Docker image</li>
        <li>Env vars on the Fly machine differentiate the tenant</li>
        <li>All DB queries filter by <code>username</code> / <code>user_name</code> from <code>getTenantConfig().username</code></li>
        <li>Theme, colors, fonts, content — all fetched from Supabase filtered by this username</li>
      </ol>

      <Callout type="danger">
        <code>getTenantConfig()</code> returns empty strings when env vars are missing. This is intentional — it allows <code>next build</code> to succeed during Docker image creation. Do NOT add null checks that would break this.
      </Callout>
    </>
  )
}

function MiddlewareSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        The middleware runs on every request (except static assets and Next.js internals).
      </p>

      <Heading>Source: middleware.ts</Heading>

      <Card title="Canonical Host Redirect">
        <p>Forces apex domain → <code>www</code> redirect via <strong>308 Permanent Redirect</strong>.</p>
        <p>Uses <code>NEXT_PUBLIC_SITE_URL</code> to determine the canonical host.</p>
        <Code>{`# Example: modernlongevity.com → www.modernlongevity.com (308)`}</Code>
      </Card>

      <Card title="Legacy Path Redirect">
        <p>Handles legacy URL pattern:</p>
        <Code>{`/pages/contact → /contact (301 Moved Permanently)`}</Code>
      </Card>

      <Heading>Applies To</Heading>
      <p>All routes <strong>except</strong> (per the matcher config):</p>
      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li><code>/_next/static</code> (static assets)</li>
        <li><code>/_next/image</code> (image optimization)</li>
        <li><code>/favicon.ico</code></li>
      </ul>
    </>
  )
}

function TroubleshootSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Common issues and how to diagnose them.
      </p>

      <Card variant="danger" title="GTM container creation fails silently">
        <p><strong>Cause:</strong> Service account has User/Edit permissions instead of Admin.</p>
        <p><strong>Fix:</strong> Grant Admin-level access at the GTM <em>account</em> level (not container level).</p>
        <p><strong>Diagnose:</strong> <code>GET /api/admin/google-test?action=gtm-accounts</code> — verify the account is visible.</p>
      </Card>

      <Card variant="danger" title="Search Console verification fails">
        <p><strong>Cause:</strong> Using <code>SITE</code> type instead of <code>INET_DOMAIN</code>.</p>
        <p><strong>Fix:</strong> Already handled in code — uses <code>sc-domain:</code> prefix. If manually adding, ensure domain format is <code>sc-domain:example.com</code>.</p>
      </Card>

      <Card variant="warning" title="Duplicate rows in brand_guidelines">
        <p><strong>Cause:</strong> Using <code>.upsert()</code> instead of select-then-insert/update.</p>
        <p><strong>Fix:</strong> Always use the <code>dbUpsert()</code> helper pattern. Clean up duplicates manually: keep the most recent row, delete others.</p>
      </Card>

      <Card variant="warning" title="Wrong column name in query">
        <p><strong>Cause:</strong> Using <code>user_name</code> on a table that uses <code>username</code> (or vice versa).</p>
        <p><strong>Fix:</strong> Check the table reference:
          <code>user_name</code> → blog_posts, brand_guidelines, brand_specifications, authors.
          <code>username</code> → company_information, target_market, cluster_articles, content_schedule.
        </p>
      </Card>

      <Card variant="warning" title="Blog posts not appearing after provisioning">
        <p><strong>Cause:</strong> Stitch hasn&apos;t processed the queue yet (polls every 15s), or auto-onboard failed.</p>
        <p><strong>Diagnose:</strong></p>
        <ol style={{ paddingLeft: 20 }}>
          <li>Check <code>notifications.doubleclicker.status</code> in provision response</li>
          <li>Check pipeline status: <code>GET /api/admin/pipeline-status?path=/api/strategy/pipeline-status?username=X</code></li>
          <li>Check <code>stitch_queue</code> table for pending items</li>
          <li>Wait 2-5 minutes for Stitch to process</li>
        </ol>
      </Card>

      <Card variant="warning" title="Fly app deploys but site shows blank page">
        <p><strong>Cause:</strong> Missing or incorrect <code>NEXT_PUBLIC_BRAND_USERNAME</code> env var on the machine.</p>
        <p><strong>Fix:</strong> Check machine env vars in Fly dashboard. The username must match a row in <code>brand_guidelines</code>.</p>
      </Card>

      <Card variant="warning" title="Domain verification link returns 'pending'">
        <p><strong>Cause:</strong> DNS hasn&apos;t propagated yet, or DNS records are incorrect.</p>
        <p><strong>Fix:</strong> Wait 15-30 minutes and retry. Check DNS records with <code>dig A www.yourdomain.com</code>. Ensure they point to the Fly.io IPs.</p>
      </Card>

      <Card variant="warning" title="Structured voice fields are empty">
        <p><strong>Cause:</strong> <code>OPENAI_API_KEY</code> not set, GPT-4.1 API error, or timeout (30s).</p>
        <p><strong>Fix:</strong> Set <code>OPENAI_API_KEY</code>. This is non-fatal — the writer falls back to <code>voice_and_tone</code>. Check server logs for <code>[PROVISION] Structured voice extraction failed</code>.</p>
      </Card>

      <Card variant="warning" title="Hero image not generated">
        <p><strong>Cause:</strong> <code>FAL_API_KEY</code> not set, or fal.ai rate limit.</p>
        <p><strong>Fix:</strong> Set <code>FAL_API_KEY</code>. This is optional — the site works without a hero image.</p>
      </Card>

      <Card variant="warning" title="Email not sent (Phase 9)">
        <p><strong>Cause:</strong> <code>RESEND_API_KEY</code> missing, or sender domain not verified in Resend.</p>
        <p><strong>Fix:</strong> Verify the sender domain in Resend dashboard. Check <code>RESEND_FROM_EMAIL</code> matches.</p>
      </Card>

      <Card variant="info" title="How to re-provision a site">
        <p>Call <code>POST /api/provision</code> again with the same username. The DB upsert pattern will update existing rows. The Fly app creation will return 409 (already exists) which is non-fatal. Use <code>skip_deploy: true</code> if you only want to update DB data. Include <code>force_reprovision: true</code> to override the idempotency guard and trigger auto-onboard even if integration_credentials already exists.</p>
      </Card>

      <Card variant="warning" title="Auto-onboard skipped unexpectedly">
        <p><strong>Cause:</strong> Brand was already provisioned — <code>integration_credentials</code> exists for this username and <code>force_reprovision</code> was not set.</p>
        <p><strong>Fix:</strong> Use <code>force_reprovision: true</code> in the provision request body to override the idempotency guard and force a new auto-onboard call.</p>
      </Card>
    </>
  )
}

function ArchitectureSection() {
  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        How the key directories and files connect.
      </p>

      <Heading>Directory Map</Heading>
      <Code>{`doubleclicker-1/
├── app/
│   ├── api/
│   │   ├── provision/
│   │   │   ├── route.ts              # Main provisioning pipeline (named phases)
│   │   │   └── verify-domain/
│   │   │       └── route.ts          # Domain verification callback
│   │   ├── admin/
│   │   │   ├── provision-network/    # Network provisioning
│   │   │   ├── api-keys/            # API key management
│   │   │   ├── pipeline-status/     # DC proxy for pipeline status
│   │   │   ├── drafts/             # Draft management
│   │   │   ├── generate-logo/      # fal.ai logo generation
│   │   │   ├── google-test/        # Google API diagnostics
│   │   │   ├── domain-suggestions/ # Cloud Domains search
│   │   │   └── dc-proxy/          # General DC proxy
│   │   ├── blog/                   # Blog CRUD + categories
│   │   ├── leads/                  # Lead magnet capture
│   │   ├── lead-capture/           # Contact form + rate limiting
│   │   ├── quiz-submit/            # Quiz scoring
│   │   └── drafts/                 # External draft creation
│   ├── admin/
│   │   ├── provision/              # Single-site provision UI
│   │   ├── network/                # Network provision UI
│   │   ├── drafts/                 # Draft review UI
│   │   ├── api-keys/              # API key management UI
│   │   └── educate-provisioner/   # This guide
│   ├── blog/
│   │   ├── page.tsx               # Blog listing (12/page, categories)
│   │   └── [slug]/
│   │       └── page.tsx           # Individual blog post
│   ├── about/                     # About page
│   ├── contact/                   # Contact form
│   ├── privacy/                   # Privacy policy
│   ├── terms/                     # Terms of service
│   ├── quiz/[id]/                 # Quiz player
│   ├── layout.tsx                 # Root layout (theme, header, footer)
│   ├── page.tsx                   # Home page
│   └── globals.css                # All global styles
├── components/
│   ├── themes/
│   │   ├── editorial/             # Editorial theme
│   │   ├── boutique/              # Boutique theme
│   │   ├── modern/                # Modern theme
│   │   ├── ThemeRenderer.tsx      # Theme factory
│   │   └── types.ts               # Shared theme types
│   ├── BrandStyles.tsx            # Theme CSS injection (server)
│   ├── provision/
│   │   ├── ProvisionWizard.tsx    # Wizard shell (mode selector, step nav, context provider)
│   │   ├── ProvisionContext.tsx   # Shared state via React context + reducer
│   │   ├── PipelineTracker.tsx    # Phase status display
│   │   ├── hooks/
│   │   │   └── useProvision.ts   # Provision API + polling hook
│   │   └── steps/
│   │       ├── NicheStep.tsx      # Niche input + AI research
│   │       ├── BrandUrlStep.tsx   # Website URL + brand extraction
│   │       ├── DomainStep.tsx     # Domain search + selection
│   │       ├── VoiceContentStep.tsx # Brand voice, target market
│   │       ├── ImageStyleStep.tsx # Visual style + logo gen
│   │       ├── AuthorStep.tsx     # Author details
│   │       ├── DeployConfigStep.tsx # Theme, colors, deploy config
│   │       └── LaunchStep.tsx     # Summary + provision trigger
│   ├── NetworkForm.tsx            # Network admin form
│   ├── Footer.tsx                 # Global footer
│   ├── ArticleCard.tsx            # Blog post card
│   ├── FeaturedCard.tsx           # Featured post card
│   └── ...                        # Other shared components
├── lib/
│   ├── supabase/
│   │   └── service.ts             # THE ONLY Supabase client
│   ├── google.ts                  # All Google API integrations
│   ├── fly.ts                     # All Fly.io API integrations
│   ├── tenant.ts                  # getTenantConfig()
│   ├── themes.ts                  # Theme presets
│   ├── brand.ts                   # Brand data fetching
│   ├── posts.ts                   # Blog post queries
│   ├── spam-protection.ts         # Spam detection
│   └── draft-types.ts             # Shared types
├── middleware.ts                   # Canonical host + legacy redirects
├── next.config.js                 # Standalone output, image config
├── Dockerfile                     # Multi-stage Node 20 Alpine
├── fly.toml                       # Fly.io base app config
└── package.json                   # Dependencies and scripts`}</Code>

      <Heading>Data Flow: Visitor Hits a Blog</Heading>
      <Code>{`Browser → Fly.io app (wakes from sleep if needed)
  → middleware.ts (apex→www redirect)
  → app/layout.tsx
    → getTenantConfig() reads BRAND_USERNAME env var
    → BrandStyles.tsx fetches brand_specifications from Supabase
    → ThemeHeader renders theme-specific header
  → app/page.tsx (or /blog, /blog/[slug])
    → getPublishedPosts() filters blog_posts by user_name
    → ThemeHomePage / ThemeBlogPost renders content
  → Footer.tsx renders with brand info
  → Analytics (PostHog) + CookieConsent injected`}</Code>

      <Heading>Data Flow: Provisioning a New Site</Heading>
      <Code>{`Blog Cloner → POST /api/provision (bearer token)
  → db_seed: Supabase inserts/updates across 8 tables
  → auto_onboard: POST to Doubleclicker auto-onboard
    → DC reads config from shared DB
    → DC queues work in stitch_queue
    → Stitch polls every 15s, processes content
  → hero_image: fal.ai generates hero image
  → google_services: Google APIs create GA4 + GTM
  → fly_deploy: Fly API creates app + machine
    → Sets env vars (BRAND_USERNAME, GA_ID, etc.)
  → domain_purchase, certs, dns_auto_config (if applicable)
  → email: Resend sends DNS email
  → analytics: analytics_events insert
  → Returns 200 with phase_results + full status breakdown`}</Code>
    </>
  )
}

function ChecklistSection() {
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setChecks(prev => ({ ...prev, [key]: !prev[key] }))

  const groups = [
    {
      title: 'Environment Variables',
      items: [
        { key: 'env-provision', label: 'PROVISION_SECRET set and shared with Blog Cloner' },
        { key: 'env-supabase-url', label: 'NEXT_PUBLIC_SUPABASE_URL set' },
        { key: 'env-supabase-anon', label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY set' },
        { key: 'env-supabase-service', label: 'SUPABASE_SERVICE_ROLE_KEY set' },
        { key: 'env-dc-url', label: 'DOUBLECLICKER_API_URL set' },
        { key: 'env-fly-token', label: 'FLY_API_TOKEN set with deploy permissions' },
        { key: 'env-fly-org', label: 'FLY_ORG_SLUG set' },
        { key: 'env-fly-base', label: 'FLY_BASE_APP set and base app has running machine' },
        { key: 'env-google-sa', label: 'GOOGLE_SERVICE_ACCOUNT_JSON set (if using Google services)' },
        { key: 'env-google-project', label: 'GOOGLE_CLOUD_PROJECT set' },
        { key: 'env-ga-account', label: 'GOOGLE_ANALYTICS_ACCOUNT_ID set' },
        { key: 'env-gtm-account', label: 'GOOGLE_TAG_MANAGER_ACCOUNT_ID set' },
        { key: 'env-resend-key', label: 'RESEND_API_KEY set' },
        { key: 'env-resend-from', label: 'RESEND_FROM_EMAIL set and domain verified in Resend' },
        { key: 'env-notif', label: 'NOTIFICATION_EMAIL set' },
        { key: 'env-openai', label: 'OPENAI_API_KEY set (optional — structured voice extraction via GPT-4.1)' },
        { key: 'env-fal', label: 'FAL_API_KEY set (optional — hero image falls back to CSS gradient without it)' },
        { key: 'env-domain-email', label: 'DOMAIN_ADMIN_EMAIL set (optional, defaults to stuartr@sewo.io)' },
      ],
    },
    {
      title: 'Google Service Account Permissions',
      items: [
        { key: 'ga-editor', label: 'GA4: Editor role on Analytics account' },
        { key: 'gtm-admin', label: 'GTM: Admin-level access at account level (NOT User/Edit)' },
        { key: 'gsc-owner', label: 'Search Console: Service account added as verified owner' },
        { key: 'domains-admin', label: 'Cloud Domains: roles/domains.admin on GCP project' },
        { key: 'dns-admin', label: 'Cloud DNS: roles/dns.admin on GCP project' },
      ],
    },
    {
      title: 'Fly.io Setup',
      items: [
        { key: 'fly-base', label: 'Base app has at least one running machine with latest image' },
        { key: 'fly-billing', label: 'Fly org has billing configured for IP allocations' },
        { key: 'fly-token', label: 'fly auth token is valid and has deploy permissions' },
      ],
    },
    {
      title: 'Supabase Database',
      items: [
        { key: 'db-tables', label: 'All required tables exist (brand_guidelines, brand_specifications, company_information, authors, integration_credentials, target_market, brand_image_styles, app_settings, blog_posts, etc.)' },
        { key: 'db-rls', label: 'RLS policies allow service role key to read/write all tables' },
        { key: 'db-columns', label: 'Column names verified (user_name vs username per table)' },
      ],
    },
    {
      title: 'Doubleclicker Backend',
      items: [
        { key: 'dc-onboard', label: 'Auto-onboard endpoint live and responding' },
        { key: 'dc-secret', label: 'PROVISION_SECRET matches between this app and Doubleclicker' },
        { key: 'dc-stitch', label: 'Stitch worker running and polling stitch_queue' },
      ],
    },
    {
      title: 'DNS & Domains',
      items: [
        { key: 'gcp-billing', label: 'GCP billing enabled for Cloud Domains purchases' },
        { key: 'gcp-dns-api', label: 'Cloud DNS API enabled in GCP project' },
        { key: 'gcp-domains-api', label: 'Domain Registration API enabled in GCP project' },
      ],
    },
    {
      title: 'Email',
      items: [
        { key: 'resend-domain', label: 'Resend sender domain verified' },
        { key: 'resend-from', label: 'RESEND_FROM_EMAIL matches a verified domain' },
      ],
    },
    {
      title: 'Admin UI',
      items: [
        { key: 'admin-provision', label: '/admin/provision accessible and functional' },
        { key: 'admin-network', label: '/admin/network accessible for network provisioning' },
        { key: 'admin-google', label: 'GET /api/admin/google-test?action=gtm-accounts returns expected accounts' },
        { key: 'admin-domains', label: 'POST /api/admin/domain-suggestions returns available domains' },
        { key: 'admin-drafts', label: '/admin/drafts accessible for draft review' },
        { key: 'admin-api-keys', label: '/admin/api-keys accessible for API key management' },
      ],
    },
    {
      title: 'Smoke Test',
      items: [
        { key: 'smoke-db', label: 'Provision test site with skip_deploy=true — verify DB seeding' },
        { key: 'smoke-deploy', label: 'Provision test site with full deploy — Fly app created' },
        { key: 'smoke-load', label: 'Deployed site loads at {username}-blog.fly.dev' },
        { key: 'smoke-posts', label: 'Blog posts appear after Stitch processes (2-5 min)' },
        { key: 'smoke-domain', label: 'Domain verification flow works end-to-end' },
        { key: 'smoke-analytics', label: 'GA4 and GTM IDs appear in page source of deployed site' },
      ],
    },
  ]

  const total = groups.reduce((sum, g) => sum + g.items.length, 0)
  const checked = Object.values(checks).filter(Boolean).length
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0

  return (
    <>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155' }}>
        Interactive checklist. Check off each item as you verify it. Progress is tracked at the top.
      </p>

      {/* Progress bar */}
      <div style={{
        background: '#f1f5f9',
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            background: '#e2e8f0',
            borderRadius: 4,
            height: 8,
            overflow: 'hidden',
          }}>
            <div style={{
              background: pct === 100 ? '#22c55e' : '#3b82f6',
              height: '100%',
              width: `${pct}%`,
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: pct === 100 ? '#22c55e' : '#334155', whiteSpace: 'nowrap' }}>
          {checked} / {total} ({pct}%)
        </span>
      </div>

      {pct === 100 && (
        <Callout type="tip">
          All checks complete! You&apos;re ready to launch.
        </Callout>
      )}

      {groups.map(group => (
        <div key={group.title} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: '#0f172a' }}>{group.title}</h3>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            {group.items.map((item, i) => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: i < group.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: checks[item.key] ? '#f0fdf4' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checks[item.key]}
                  onChange={() => toggle(item.key)}
                  style={{ marginTop: 3, accentColor: '#22c55e' }}
                />
                <span style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: checks[item.key] ? '#64748b' : '#334155',
                  textDecoration: checks[item.key] ? 'line-through' : 'none',
                }}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
