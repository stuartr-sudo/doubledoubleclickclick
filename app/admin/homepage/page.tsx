'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'

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
  logo_image: string
  logo_text: string
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
  contact_cta_text: string
  contact_cta_link: string
  contact_linkedin_url: string
  contact_twitter_url: string
  contact_behance_url: string
}

export default function HomepageEditorPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<HomepageContent>({
    logo_image: '',
    logo_text: 'DoubleClicker',
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
    contact_email: 'hello@doubleclicker.com',
    contact_cta_text: 'Get Started',
    contact_cta_link: 'mailto:hello@doubleclicker.com',
    contact_linkedin_url: '#',
    contact_twitter_url: '#',
    contact_behance_url: '#'
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
        { id: String(Date.now()), title: '', description: '', icon: '' }
      ]
    }))
  }

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }))
  }

  // Programs handlers
  const handleProgramChange = (index: number, field: keyof Program, value: string) => {
    const newPrograms = [...formData.programs]
    newPrograms[index] = { ...newPrograms[index], [field]: value }
    setFormData(prev => ({ ...prev, programs: newPrograms }))
  }

  const addProgram = () => {
    setFormData(prev => ({
      ...prev,
      programs: [...prev.programs, { id: String(Date.now()), badge: '', title: '', description: '', cta_text: '', cta_link: '' }]
    }))
  }

  const removeProgram = (index: number) => {
    setFormData(prev => ({ ...prev, programs: prev.programs.filter((_, i) => i !== index) }))
  }

  // Pricing handlers
  const handlePricingChange = (index: number, field: string, value: string | boolean | string[]) => {
    const newPricing = [...formData.pricing]
    newPricing[index] = { ...newPricing[index], [field]: value }
    setFormData(prev => ({ ...prev, pricing: newPricing }))
  }

  const handlePricingFeatureChange = (tierIndex: number, featureIndex: number, value: string) => {
    const newPricing = [...formData.pricing]
    const newFeatures = [...newPricing[tierIndex].features]
    newFeatures[featureIndex] = value
    newPricing[tierIndex] = { ...newPricing[tierIndex], features: newFeatures }
    setFormData(prev => ({ ...prev, pricing: newPricing }))
  }

  const addPricingFeature = (tierIndex: number) => {
    const newPricing = [...formData.pricing]
    newPricing[tierIndex].features.push('')
    setFormData(prev => ({ ...prev, pricing: newPricing }))
  }

  const removePricingFeature = (tierIndex: number, featureIndex: number) => {
    const newPricing = [...formData.pricing]
    newPricing[tierIndex].features = newPricing[tierIndex].features.filter((_, i) => i !== featureIndex)
    setFormData(prev => ({ ...prev, pricing: newPricing }))
  }

  const addPricingTier = () => {
    setFormData(prev => ({
      ...prev,
      pricing: [...prev.pricing, { id: String(Date.now()), name: '', price: '', period: '', description: '', features: [], cta_text: '', cta_link: '', featured: false }]
    }))
  }

  const removePricingTier = (index: number) => {
    setFormData(prev => ({ ...prev, pricing: prev.pricing.filter((_, i) => i !== index) }))
  }

  // Outcomes handlers
  const handleOutcomeChange = (index: number, field: keyof Outcome, value: string) => {
    const newOutcomes = [...formData.outcomes]
    newOutcomes[index] = { ...newOutcomes[index], [field]: value }
    setFormData(prev => ({ ...prev, outcomes: newOutcomes }))
  }

  const addOutcome = () => {
    setFormData(prev => ({
      ...prev,
      outcomes: [...prev.outcomes, { id: String(Date.now()), title: '', description: '' }]
    }))
  }

  const removeOutcome = (index: number) => {
    setFormData(prev => ({ ...prev, outcomes: prev.outcomes.filter((_, i) => i !== index) }))
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
          {/* Logo Section */}
          <div className="form-section">
            <h2 className="form-section-title">Logo & Branding</h2>
            
            <div className="form-group">
              <label htmlFor="logo_text">Logo Text</label>
              <input
                type="text"
                id="logo_text"
                name="logo_text"
                value={formData.logo_text}
                onChange={handleChange}
                placeholder="DoubleClicker"
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                Text to display if no logo image is set (fallback)
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="logo_image">Logo Image</label>
              <ImageUpload
                value={formData.logo_image}
                onChange={(url) => setFormData({ ...formData, logo_image: url })}
                label="Logo Image"
                folder="logos"
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                Upload a logo image (PNG with transparency recommended). Recommended size: 200x50px
              </p>
            </div>
          </div>

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

          {/* Outcomes Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Outcomes</h2>
              <button type="button" onClick={addOutcome} className="btn btn-sm btn-primary">
                Add Outcome
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="outcomes_title">Outcomes Title</label>
              <input
                type="text"
                id="outcomes_title"
                name="outcomes_title"
                value={formData.outcomes_title}
                onChange={handleChange}
                placeholder="outcomes."
              />
            </div>

            <div className="form-group">
              <label htmlFor="outcomes_subtitle">Outcomes Subtitle</label>
              <textarea
                id="outcomes_subtitle"
                name="outcomes_subtitle"
                value={formData.outcomes_subtitle}
                onChange={handleChange}
                rows={2}
                placeholder="We specialize in..."
              />
            </div>

            <div className="services-list">
              {formData.outcomes?.map((outcome, index) => (
                <div key={outcome.id} className="service-item">
                  <div className="service-item-header">
                    <h4>Outcome {index + 1}</h4>
                    <button type="button" onClick={() => removeOutcome(index)} className="btn-remove">
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Outcome Title</label>
                    <input
                      type="text"
                      value={outcome.title}
                      onChange={(e) => handleOutcomeChange(index, 'title', e.target.value)}
                      placeholder="Visibility in AI Answers"
                    />
                  </div>

                  <div className="form-group">
                    <label>Outcome Description</label>
                    <textarea
                      value={outcome.description}
                      onChange={(e) => handleOutcomeChange(index, 'description', e.target.value)}
                      rows={2}
                      placeholder="Appear when customers ask..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Programs & Products Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Programs & Products</h2>
              <button type="button" onClick={addProgram} className="btn btn-sm btn-primary">
                Add Program
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="programs_title">Programs Title</label>
              <input
                type="text"
                id="programs_title"
                name="programs_title"
                value={formData.programs_title}
                onChange={handleChange}
                placeholder="programs & products."
              />
            </div>

            <div className="services-list">
              {formData.programs?.map((program, index) => (
                <div key={program.id} className="service-item">
                  <div className="service-item-header">
                    <h4>Program {index + 1}</h4>
                    <button type="button" onClick={() => removeProgram(index)} className="btn-remove">
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Badge</label>
                    <input
                      type="text"
                      value={program.badge}
                      onChange={(e) => handleProgramChange(index, 'badge', e.target.value)}
                      placeholder="Guide, Training, Software (Beta)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Program Title</label>
                    <input
                      type="text"
                      value={program.title}
                      onChange={(e) => handleProgramChange(index, 'title', e.target.value)}
                      placeholder="The LLM Ranking Playbook"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={program.description}
                      onChange={(e) => handleProgramChange(index, 'description', e.target.value)}
                      rows={2}
                      placeholder="A practical, step-by-step system..."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>CTA Button Text</label>
                      <input
                        type="text"
                        value={program.cta_text}
                        onChange={(e) => handleProgramChange(index, 'cta_text', e.target.value)}
                        placeholder="Get Early Access"
                      />
                    </div>

                    <div className="form-group">
                      <label>CTA Button Link</label>
                      <input
                        type="text"
                        value={program.cta_link}
                        onChange={(e) => handleProgramChange(index, 'cta_link', e.target.value)}
                        placeholder="/guide"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Pricing</h2>
              <button type="button" onClick={addPricingTier} className="btn btn-sm btn-primary">
                Add Pricing Tier
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="pricing_title">Pricing Title</label>
              <input
                type="text"
                id="pricing_title"
                name="pricing_title"
                value={formData.pricing_title}
                onChange={handleChange}
                placeholder="pricing."
              />
            </div>

            <div className="services-list">
              {formData.pricing?.map((tier, tierIndex) => (
                <div key={tier.id} className="service-item" style={{ border: tier.featured ? '2px solid #0066cc' : undefined }}>
                  <div className="service-item-header">
                    <h4>Pricing Tier {tierIndex + 1}</h4>
                    <button type="button" onClick={() => removePricingTier(tierIndex)} className="btn-remove">
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Tier Name</label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handlePricingChange(tierIndex, 'name', e.target.value)}
                      placeholder="Brands, Agencies, Enterprise"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price</label>
                      <input
                        type="text"
                        value={tier.price}
                        onChange={(e) => handlePricingChange(tierIndex, 'price', e.target.value)}
                        placeholder="$1,997 or Custom"
                      />
                    </div>

                    <div className="form-group">
                      <label>Period</label>
                      <input
                        type="text"
                        value={tier.period}
                        onChange={(e) => handlePricingChange(tierIndex, 'period', e.target.value)}
                        placeholder="/month"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description (optional)</label>
                    <textarea
                      value={tier.description}
                      onChange={(e) => handlePricingChange(tierIndex, 'description', e.target.value)}
                      rows={2}
                      placeholder="For individual brands..."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Annual Price (optional)</label>
                      <input
                        type="text"
                        value={tier.annual_price || ''}
                        onChange={(e) => handlePricingChange(tierIndex, 'annual_price', e.target.value)}
                        placeholder="$19,171"
                      />
                    </div>

                    <div className="form-group">
                      <label>Annual Savings (optional)</label>
                      <input
                        type="text"
                        value={tier.annual_savings || ''}
                        onChange={(e) => handlePricingChange(tierIndex, 'annual_savings', e.target.value)}
                        placeholder="20% off"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label>Features</label>
                      <button type="button" onClick={() => addPricingFeature(tierIndex)} className="btn btn-sm btn-secondary">
                        Add Feature
                      </button>
                    </div>
                    {tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handlePricingFeatureChange(tierIndex, featureIndex, e.target.value)}
                          placeholder="Feature description"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => removePricingFeature(tierIndex, featureIndex)}
                          className="btn-remove btn-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>CTA Button Text</label>
                      <input
                        type="text"
                        value={tier.cta_text}
                        onChange={(e) => handlePricingChange(tierIndex, 'cta_text', e.target.value)}
                        placeholder="Get Started"
                      />
                    </div>

                    <div className="form-group">
                      <label>CTA Button Link</label>
                      <input
                        type="text"
                        value={tier.cta_link}
                        onChange={(e) => handlePricingChange(tierIndex, 'cta_link', e.target.value)}
                        placeholder="#contact or /signup"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={tier.featured}
                        onChange={(e) => handlePricingChange(tierIndex, 'featured', e.target.checked)}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Featured Tier (highlighted)
                    </label>
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contact_cta_text">Contact CTA Button Text</label>
                <input
                  type="text"
                  id="contact_cta_text"
                  name="contact_cta_text"
                  value={formData.contact_cta_text}
                  onChange={handleChange}
                  placeholder="Get Started"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact_cta_link">Contact CTA Button Link</label>
                <input
                  type="text"
                  id="contact_cta_link"
                  name="contact_cta_link"
                  value={formData.contact_cta_link}
                  onChange={handleChange}
                  placeholder="mailto:hello@example.com or /contact"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contact_linkedin_url">LinkedIn URL</label>
              <input
                type="url"
                id="contact_linkedin_url"
                name="contact_linkedin_url"
                value={formData.contact_linkedin_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_twitter_url">Twitter URL</label>
              <input
                type="url"
                id="contact_twitter_url"
                name="contact_twitter_url"
                value={formData.contact_twitter_url}
                onChange={handleChange}
                placeholder="https://twitter.com/yourhandle"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_behance_url">Behance URL</label>
              <input
                type="url"
                id="contact_behance_url"
                name="contact_behance_url"
                value={formData.contact_behance_url}
                onChange={handleChange}
                placeholder="https://behance.net/yourprofile"
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

