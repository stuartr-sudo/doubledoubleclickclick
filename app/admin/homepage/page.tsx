'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface HomepageContent {
  hero_title: string
  hero_description: string
  hero_image: string
  hero_cta_text: string
  hero_cta_link: string
  about_title: string
  about_description: string
  services_title: string
  services: Array<{
    title: string
    description: string
    icon: string
  }>
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
    about_title: 'About',
    about_description: 'When customers ask AI assistants about your industry, your brand needs to be the answer they get. LLM ranking isn&apos;t just the future of search—it&apos;s happening now.',
    services_title: 'Services',
    services: [
      {
        title: 'LLM Optimization',
        description: 'We optimize your website content to be understood and recommended by AI systems.',
        icon: ''
      },
      {
        title: 'Brand Visibility',
        description: 'Increase your presence in AI responses across ChatGPT, Claude, Perplexity, and other LLM platforms.',
        icon: ''
      },
      {
        title: 'Competitive Advantage',
        description: 'Stay ahead in AI-powered search. We help you rank higher than competitors.',
        icon: ''
      }
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
        setFormData(data)
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
              {formData.services.map((service, index) => (
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

