import Link from 'next/link'

export default function CoursePage() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1 className="page-title">The AI Content Accelerator</h1>
          <p className="page-description">
            A comprehensive mini-course to build your AI content system and ship your first ranking sprint.
          </p>
          <Link href="/lead-capture?type=course" className="btn btn-secondary">Get Instant Access</Link>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="how-it-works-header">
          <h2 className="section-label">curriculum.</h2>
        </div>
        <div className="how-it-works-steps">
          <div className="step-card"><div className="step-number">01</div><h3 className="step-title">LLM Research</h3><p className="step-description">Find and prioritize AI questions for your category.</p></div>
          <div className="step-card"><div className="step-number">02</div><h3 className="step-title">Content System</h3><p className="step-description">Structure content for AI understanding and recommendation.</p></div>
          <div className="step-card"><div className="step-number">03</div><h3 className="step-title">Evaluation</h3><p className="step-description">Measure visibility and iterate for wins.</p></div>
        </div>
      </section>
    </main>
  )
}


