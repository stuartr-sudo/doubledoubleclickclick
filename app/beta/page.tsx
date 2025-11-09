import Link from 'next/link'

export default function BetaPage() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1 className="page-title">DoubleClicker — LLM Visibility (Beta)</h1>
          <p className="page-description">
            Plan, publish, and monitor content for AI ranking. Limited beta access for qualified brands.
          </p>
          <Link href="/lead-capture?type=beta" className="btn btn-secondary">Apply for Beta</Link>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="how-it-works-header">
          <h2 className="section-label">features.</h2>
        </div>
        <div className="how-it-works-steps">
          <div className="step-card"><h3 className="step-title">Research</h3><p className="step-description">Discover AI questions and gaps where you can rank.</p></div>
          <div className="step-card"><h3 className="step-title">Workflow</h3><p className="step-description">Template‑driven creation and publishing with prompts.</p></div>
          <div className="step-card"><h3 className="step-title">Monitoring</h3><p className="step-description">Track your visibility across assistants and iterate.</p></div>
        </div>
      </section>
    </main>
  )
}


