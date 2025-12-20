import Link from 'next/link'

export default function CoursePage() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1 className="page-title">LLM Content Accelerator</h1>
          <p className="page-description">
            A mini-course for teams who want to build an internal system for AI-powered search visibility. Learn how to transform your content into an AI-recommendation engine.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <Link href="https://buy.stripe.com/test_course" className="btn btn-primary">Enroll Now — $249</Link>
            <Link href="/book-call" className="btn btn-secondary">Bulk Team Access</Link>
          </div>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="how-it-works-header">
          <h2 className="section-label">the curriculum.</h2>
        </div>
        <div className="how-it-works-steps">
          <div className="step-card"><div className="step-number">01</div><h3 className="step-title">LLM Research</h3><p className="step-description">Find and prioritize the exact questions AI models are asking about your category.</p></div>
          <div className="step-card"><div className="step-number">02</div><h3 className="step-title">Content System</h3><p className="step-description">Build a high-scale system for structuring content for AI recommendation.</p></div>
          <div className="step-card"><div className="step-number">03</div><h3 className="step-title">The Evaluation</h3><p className="step-description">Measure your visibility scores and iterate until you own the top recommendations.</p></div>
        </div>
      </section>
    </main>
  )
}


