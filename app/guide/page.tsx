import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export default function GuidePage() {
  return (
    <main>
      <SiteHeader />
      <section className="hero">
        <div className="container">
          <h1 className="page-title">The LLM Ranking Playbook</h1>
          <p className="page-description">
            A practical, step‑by‑step system to make your brand the answer AI suggests. This is the exact blueprint I use for my high-ticket consulting clients.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <Link href="https://buy.stripe.com/test_guide" className="btn btn-primary">Buy Playbook — $97</Link>
            <Link href="#what-you-get" className="btn btn-secondary">Learn More</Link>
          </div>
        </div>
      </section>

      <section id="what-you-get" className="how-it-works-section">
        <div className="how-it-works-header">
          <h2 className="section-label">inside the playbook.</h2>
        </div>
        <div className="how-it-works-steps">
          <div className="step-card"><h3 className="step-title">The Architecture</h3><p className="step-description">Build an LLM‑first content architecture mapped to the questions that matter most in your industry.</p></div>
          <div className="step-card"><h3 className="step-title">The Prompt Library</h3><p className="step-description">Tested prompting patterns for automated research, content drafting, and AI-readiness evaluation.</p></div>
          <div className="step-card"><h3 className="step-title">The Checklist</h3><p className="step-description">A 30-day implementation plan with templates to ship your first ranking sprint and see immediate results.</p></div>
        </div>
      </section>

      <section className="more-topics">
        <div className="container">
          <div className="more-topics-header">
            <h2 className="section-label">FAQs</h2>
          </div>
          <div className="topics-grid">
            <div className="topic-card"><div className="topic-card-content"><h3 className="topic-card-title">Who is it for?</h3><p>Brand owners, content leaders, and growth teams.</p></div></div>
            <div className="topic-card"><div className="topic-card-content"><h3 className="topic-card-title">Format</h3><p>PDF + Notion templates + Prompt library.</p></div></div>
            <div className="topic-card"><div className="topic-card-content"><h3 className="topic-card-title">Time to value</h3><p>Ship a first sprint in 7–14 days.</p></div></div>
          </div>
        </div>
      </section>
    </main>
  )
}


