'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function BetaPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    budgetRange: '',
    aiContentLevel: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  const totalSteps = 3

  const nextStep = () => setStep((s) => Math.min(totalSteps, s + 1))
  const prevStep = () => setStep((s) => Math.max(1, s - 1))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await fetch('/api/lead-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          website: formData.website,
          message: `Budget range: ${formData.budgetRange || 'n/a'}\nAI content level: ${
            formData.aiContentLevel || 'n/a'
          }\nNotes: ${formData.notes || 'n/a'}`,
          plan_type: 'beta',
          source: 'beta-page',
        }),
      })
    } catch (error) {
      console.error('Failed to submit beta application:', error)
    } finally {
      setIsSubmitting(false)
      router.push('/lead-capture?type=beta')
    }
  }

  return (
    <main>
      <section className="tier-page-hero">
        <div className="tier-page-container">
          <Link href="/" className="back-link">
            ← Back to Home
          </Link>
          <h1 className="tier-page-title">DoubleClicker — LLM Visibility (Beta)</h1>
          <p className="tier-page-subtitle">
            Plan, publish, and monitor content for AI ranking. Limited beta access for qualified brands.
          </p>
        </div>
      </section>

      <section className="tier-benefits-section">
        <div className="tier-benefits-container">
          <h2 className="section-label">Features</h2>
          <div className="tier-benefits-grid">
            <div className="tier-benefit-card">
              <h3>Research</h3>
              <p>Discover AI questions and gaps where your brand can legitimately rank and be recommended.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Workflow</h3>
              <p>Template‑driven creation and publishing, integrated with prompts and guardrails for your team.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Monitoring</h3>
              <p>Track your visibility across assistants and LLM surfaces, then iterate based on real query data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application form now appears in the hero section above; this section is no longer needed */}
    </main>
  )
}


