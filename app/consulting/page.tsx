'use client'

import Link from 'next/link'
import { trackServicePageView } from '@/lib/analytics'
import { useEffect } from 'react'
import SiteHeader from '@/components/SiteHeader'

export default function ConsultingPage() {
  useEffect(() => {
    trackServicePageView('consulting')
  }, [])

  return (
    <main>
      <SiteHeader />
      <section className="tier-page-hero">
        <div className="tier-page-container">
          <h1 className="tier-page-title">Fractional AI Growth Lead</h1>
          <p className="tier-page-subtitle">
            Strategic AI optimization for brands that want to lead their category in AI-powered search. I work with select organizations as a fractional lead to build systems that capture AI referral traffic at scale.
          </p>
          <div style={{ marginTop: '2.5rem' }}>
            <Link href="/book-call" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
              Book Strategy Session
            </Link>
          </div>
        </div>
      </section>

      <section className="tier-benefits-section">
        <div className="tier-benefits-container">
          <h2 className="section-label">High-Level Consulting</h2>
          <div className="tier-benefits-grid">
            <div className="tier-benefit-card">
              <h3>Custom AI Visibility Strategy</h3>
              <p>We build a bespoke roadmap for your brand, identifying the specific questions and keywords where your category-leading visibility is won.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Content Architecture Audit</h3>
              <p>Complete overhaul of how your data and content are structured for LLM crawling, indexing, and recommendation.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Team Training & Systems</h3>
              <p>I train your existing content and growth teams to implement LLM-first workflows, ensuring long-term sustainability.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>AI Performance Monitoring</h3>
              <p>Implementation of custom tracking to measure exactly how often your brand is mentioned as the top answer in ChatGPT, Claude, and Gemini.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Ongoing Optimization</h3>
              <p>Continuous refinement as AI models update. We stay ahead of the algorithm changes so your brand stays recommended.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Fractional Partnership</h3>
              <p>Regular strategic deep-dives, unlimited async support, and a dedicated partner for your AI growth journey.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '6rem 0', background: '#f8fafc', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Ready for a Category Lead?</h2>
          <p style={{ color: '#64748b', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
            Consulting partnerships are limited to 3 clients at a time. All consulting starts with a Paid Strategy Session to ensure a mutual fit.
          </p>
          <Link href="/book-call" className="btn btn-secondary" style={{ padding: '1rem 3rem' }}>
            Book Your Paid Session →
          </Link>
        </div>
      </section>
    </main>
  )
}

