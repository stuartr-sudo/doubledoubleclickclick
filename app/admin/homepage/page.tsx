'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Service {
  id: string
  title: string
  description: string
  icon?: string
}

interface Program {
  id: string
  badge: string
  title: string
  description: string
  cta_text: string
  cta_link: string
}

interface PricingTier {
  id: string
  name: string
  price: string
  period: string
  description: string
  annual_price?: string
  annual_savings?: string
  features: string[]
  cta_text: string
  cta_link: string
  featured: boolean
}

interface Outcome {
  id: string
  title: string
  description: string
}

interface HomepageContent {
  hero_title: string
  hero_description: string
  hero_image: string
  hero_cta_text: string
  hero_cta_link: string
  about_title: string
  about_description: string
  services_title: string
  services: Service[]
  programs_title: string
  programs: Program[]
  pricing_title: string
  pricing: PricingTier[]
  outcomes_title: string
  outcomes_subtitle: string
  outcomes: Outcome[]
  contact_email: string
}

export default function HomepageEditorPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<HomepageContent>({
    hero_title: 'Make Your Brand the Answer AI Suggests',
    hero_description: 'Hello, I&apos;m a freelancer specializing in minimal design with 10 years of expertise — based in Tokyo, working remote. Let&apos;s create!',
    hero_image: '',
    hero_cta_text: 'Get Started',
    hero_cta_link: '#contact',
    about_title: 'about.',
    about_description: 'When customers ask AI assistants about your industry, your brand needs to be the answer they get. LLM ranking isn&apos;t just the future of search—it&apos;s happening now.',
    services_title: 'how it works.',
    services: [
      { id: '1', title: 'Audit & Strategy', description: 'We analyze your current digital presence and identify LLM ranking opportunities.', icon: '' },
      { id: '2', title: 'Content Optimization', description: 'Implement AI-optimized content architecture, schema markup, and semantic SEO.', icon: '' },
      { id: '3', title: 'Monitor and Improve Rankings', description: 'Track your visibility across AI platforms and continuously optimize.', icon: '' }
    ],
    programs_title: 'programs & products.',
    programs: [
      { id: '1', badge: 'Guide', title: 'The LLM Ranking Playbook', description: 'A practical, step-by-step system to make your brand the answer AI suggests.', cta_text: 'Get Early Access', cta_link: '/guide' },
      { id: '2', badge: 'Training', title: 'Rank in LLMs — Team Course', description: 'A live, cohort-based program for brand and content teams.', cta_text: 'Join the Waitlist', cta_link: '/course' },
      { id: '3', badge: 'Software (Beta)', title: 'DoubleClicker — LLM Visibility', description: 'Plan, publish, and monitor content for AI ranking.', cta_text: 'Apply for Beta', cta_link: '/beta' }
    ],
    pricing_title: 'pricing.',
    pricing: [
      { id: '1', name: 'Brands', price: '$1,997', period: '/month', description: '', annual_price: '$19,171', annual_savings: '20% off', features: ['LLM Optimization for 1 website', 'Monthly visibility reports', 'Content optimization recommendations', 'Email support'], cta_text: 'Get Started', cta_link: '#contact', featured: false },
      { id: '2', name: 'Agencies', price: 'Custom', period: '', description: 'Tailored solutions for agencies managing multiple client websites.', features: ['Multi-website management', 'White-label reporting', 'Priority support', 'Dedicated account manager', 'Custom integrations'], cta_text: 'Learn More', cta_link: '/agencies', featured: true },
      { id: '3', name: 'Enterprise', price: 'Custom', period: '', description: 'Enterprise-grade solutions for large organizations.', features: ['Unlimited websites', 'Advanced analytics & insights', '24/7 priority support', 'Custom SLA', 'On-site training & consultation', 'API access'], cta_text: 'Contact Sales', cta_link: '/enterprise', featured: false }
    ],
    outcomes_title: 'outcomes.',
    outcomes_subtitle: 'We specialize in one thing: ranking your brand inside AI assistants. Every program below is designed to move you toward that outcome.',
    outcomes: [
      { id: '1', title: 'Visibility in AI Answers', description: 'Appear when customers ask ChatGPT, Claude, and Perplexity about your category.' },
      { id: '2', title: 'Qualified Demand', description: 'Turn intent-rich AI recommendations into visitors, trials, and purchases.' },
      { id: '3', title: 'Competitive Positioning', description: 'Own the answer before competitors do with a defensible LLM content strategy.' },
      { id: '4', title: 'Future-Proof SEO', description: 'Bridge traditional search and LLM ranking to sustain growth through the shift to AI.' }
    ],
    contact_email: 'hello@doubleclicker.com'
  })

  useEffect(() => {
    fetchHomepageContent()
  }, [])

  const fetchHomepageContent = async () => {
    try {
      const res = await fetch('/api/homepage')
      if (res.ok) {
        const data = await res.json()
        // Merge fetched data with defaults, ensuring all arrays exist
        setFormData(prev => ({
          ...prev,
          ...data,
          services: Array.isArray(data.services) ? data.services : prev.services,
          programs: Array.isArray(data.programs) ? data.programs : prev.programs,
          pricing: Array.isArray(data.pricing) ? data.pricing : prev.pricing,
          outcomes: Array.isArray(data.outcomes) ? data.outcomes : prev.outcomes
        }))
      }
    } catch (error) {
      console.error('Error fetching homepage content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleServiceChange = (index: number, field: string, value: string) => {
    const newServices = [...formData.services]
    newServices[index] = {
      ...newServices[index],
      [field]: value
    }
    setFormData(prev => ({
      ...prev,
      services: newServices
    }))
  }

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [
        ...prev.services,
        { title: '', description: '', icon: '' }
      ]
    }))
  }

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        alert('Homepage content updated successfully!')
      } else {
        alert('Failed to update homepage content')
      }
    } catch (error) {
      console.error('Error updating homepage:', error)
      alert('Error updating homepage')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-loading">Loading homepage content...</div>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <h1>Edit Homepage</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/" className="btn btn-secondary" target="_blank">
                Preview
              </Link>
              <Link href="/admin" className="btn btn-secondary">
                ← Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-container">
        <form onSubmit={handleSubmit} className="homepage-form">
          {/* Hero Section */}
          <div className="form-section">
            <h2 className="form-section-title">Hero Section</h2>
            
            <div className="form-group">
              <label htmlFor="hero_title">Hero Title</label>
              <input
                type="text"
                id="hero_title"
                name="hero_title"
                value={formData.hero_title}
                onChange={handleChange}
                placeholder="Main headline"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hero_description">Hero Description</label>
              <textarea
                id="hero_description"
                name="hero_description"
                value={formData.hero_description}
                onChange={handleChange}
                rows={4}
                placeholder="Subheading or description"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hero_image">Hero Image URL</label>
              <input
                type="url"
                id="hero_image"
                name="hero_image"
                value={formData.hero_image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
              {formData.hero_image && (
                <div className="image-preview">
                  <img src={formData.hero_image} alt="Hero preview" />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hero_cta_text">CTA Button Text</label>
                <input
                  type="text"
                  id="hero_cta_text"
                  name="hero_cta_text"
                  value={formData.hero_cta_text}
                  onChange={handleChange}
                  placeholder="Get Started"
                />
              </div>

              <div className="form-group">
                <label htmlFor="hero_cta_link">CTA Button Link</label>
                <input
                  type="text"
                  id="hero_cta_link"
                  name="hero_cta_link"
                  value={formData.hero_cta_link}
                  onChange={handleChange}
                  placeholder="#contact or /signup"
                />
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="form-section">
            <h2 className="form-section-title">About Section</h2>
            
            <div className="form-group">
              <label htmlFor="about_title">About Title</label>
              <input
                type="text"
                id="about_title"
                name="about_title"
                value={formData.about_title}
                onChange={handleChange}
                placeholder="About"
              />
            </div>

            <div className="form-group">
              <label htmlFor="about_description">About Description</label>
              <textarea
                id="about_description"
                name="about_description"
                value={formData.about_description}
                onChange={handleChange}
                rows={4}
                placeholder="Tell your story..."
              />
            </div>
          </div>

          {/* Services Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Services</h2>
              <button type="button" onClick={addService} className="btn btn-sm btn-secondary">
                + Add Service
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="services_title">Services Section Title</label>
              <input
                type="text"
                id="services_title"
                name="services_title"
                value={formData.services_title}
                onChange={handleChange}
                placeholder="Services"
              />
            </div>

            <div className="services-list">
              {formData.services?.map((service, index) => (
                <div key={index} className="service-item">
                  <div className="service-item-header">
                    <h4>Service {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Service Title</label>
                    <input
                      type="text"
                      value={service.title}
                      onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                      placeholder="Service name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Service Description</label>
                    <textarea
                      value={service.description}
                      onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                      rows={3}
                      placeholder="What this service offers..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Icon/Image URL (optional)</label>
                    <input
                      type="url"
                      value={service.icon}
                      onChange={(e) => handleServiceChange(index, 'icon', e.target.value)}
                      placeholder="https://example.com/icon.svg"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="form-section">
            <h2 className="form-section-title">Contact</h2>
            
            <div className="form-group">
              <label htmlFor="contact_email">Contact Email</label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                placeholder="hello@example.com"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Homepage Content'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

