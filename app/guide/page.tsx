import Link from 'next/link'

export default function GuidePage() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1 className="page-title">The LLM Ranking Playbook</h1>
          <p className="page-description">
            A practical, step‑by‑step system to make your brand the answer AI suggests.
          </p>
          <Link href="/lead-capture?type=ebook" className="btn btn-secondary">Get Early Access</Link>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="how-it-works-header">
          <h2 className="section-label">what you get.</h2>
        </div>
        <div className="how-it-works-steps">
          <div className="step-card"><h3 className="step-title">Architecture</h3><p className="step-description">Build an LLM‑first content architecture mapped to the questions that matter.</p></div>
          <div className="step-card"><h3 className="step-title">Prompts</h3><p className="step-description">Reusable prompting patterns for research, drafting, reviewing, and evaluation.</p></div>
          <div className="step-card"><h3 className="step-title">Implementation</h3><p className="step-description">Checklists and templates to ship your first ranking sprint.</p></div>
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


