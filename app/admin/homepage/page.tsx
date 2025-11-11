'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import TextEnhancer from '@/components/TextEnhancer'

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
  about_image: string
  hero_cta_text: string
  hero_cta_link: string
  hero_footer_cta_text: string
  hero_footer_cta_link: string
  hero_bg_gradient?: string
  hero_text_color?: string
  hero_cta_bg_color?: string
  hero_cta_text_color?: string
  quiz_title?: string
  quiz_description?: string
  quiz_cta_text?: string
  quiz_cta_link?: string
  quiz_steps?: string
  quiz_badge_text?: string
  tech_carousel_title?: string
  tech_carousel_items?: Array<{ id: string; name: string; icon?: string }>
  how_it_works_title?: string
  how_it_works_steps?: Array<{ id: string; number: string; title: string; description: string; image?: string; link_text?: string; link_url?: string }>
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
  // Gradient color picker state
  const [gradientStartColor, setGradientStartColor] = useState('#667eea')
  const [gradientEndColor, setGradientEndColor] = useState('#764ba2')
  const [gradientDirection, setGradientDirection] = useState('135deg')
  // Global AI provider/model used as defaults across fields
  const AI_PROVIDERS = {
    openai: {
      name: 'ChatGPT (OpenAI)',
      models: [
        { id: 'gpt-5-2025-08-07', name: 'GPT-5 (Latest)' },
        { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini (Latest)' },
        { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1 (Latest)' },
        { id: 'gpt-4o', name: 'GPT-4o (Best Quality)' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Recommended)' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Fastest)' },
      ],
      default: 'gpt-4o-mini',
    },
    claude: {
      name: 'Claude (Anthropic)',
      models: [
        { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5 (Latest)' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Best)' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      ],
      default: 'claude-3-5-sonnet-20241022',
    },
    gemini: {
      name: 'Gemini (Google)',
      models: [
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Latest)' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Latest)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Best)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' },
        { id: 'gemini-pro', name: 'Gemini Pro' },
      ],
      default: 'gemini-1.5-flash',
    },
  } as const
  const [aiProvider, setAiProvider] = useState<keyof typeof AI_PROVIDERS>('openai')
  const [aiModel, setAiModel] = useState<string>(AI_PROVIDERS.openai.default)
  const [formData, setFormData] = useState<HomepageContent>({
    logo_image: '',
    logo_text: 'DoubleClicker',
    hero_title: 'Make Your Brand the Answer AI Suggests',
    hero_description: 'Hello, I&apos;m a freelancer specializing in minimal design with 10 years of expertise — based in Tokyo, working remote. Let&apos;s create!',
      hero_image: '',
      about_image: '',
      hero_cta_text: 'Get Started',
      hero_cta_link: '#contact',
      hero_footer_cta_text: 'Get Started',
      hero_footer_cta_link: 'mailto:hello@doubleclicker.com',
      hero_bg_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      hero_text_color: '#ffffff',
      hero_cta_bg_color: '#000000',
      hero_cta_text_color: '#ffffff',
      quiz_title: 'Take the 12-Step Quiz',
      quiz_description: 'See where you\'re missing out on LLM visibility. Get personalized insights in minutes.',
      quiz_cta_text: 'Start Quiz',
      quiz_cta_link: '/quiz',
      quiz_steps: '12',
      quiz_badge_text: 'Steps',
      tech_carousel_title: 'Technology we work with',
      tech_carousel_items: [
        { id: '1', name: 'ChatGPT', icon: '' },
        { id: '2', name: 'Claude', icon: '' },
        { id: '3', name: 'Gemini', icon: '' },
        { id: '4', name: 'Grok', icon: '' },
        { id: '5', name: 'Perplexity', icon: '' },
        { id: '6', name: 'Supabase', icon: '' },
        { id: '7', name: 'n8n', icon: '' }
      ],
      how_it_works_title: 'How it works',
      how_it_works_steps: [
        { id: '1', number: '01', title: 'Simple Booking', description: 'Effortlessly schedule a consultation to discuss your business needs and challenges. We streamline the process to get started quickly.', image: '', link_text: 'Discover More', link_url: '#' },
        { id: '2', number: '02', title: 'Tailored Strategy', description: 'We analyze your goals and create a customized strategy designed to drive measurable success for your business needs.', image: '', link_text: 'Discover More', link_url: '#' },
        { id: '3', number: '03', title: 'Continuous Support', description: 'From implementation to optimization, we provide ongoing guidance and adjustments to ensure long-term growth for you and your business.', image: '', link_text: 'Discover More', link_url: '#' }
      ],
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

  // Generate gradient string from color picker values
  const generateGradient = (start: string, end: string, direction: string) => {
    return `linear-gradient(${direction}, ${start} 0%, ${end} 100%)`
  }

  // Parse gradient string to extract colors and direction
  const parseGradient = (gradientString: string) => {
    try {
      // Match pattern: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
      const match = gradientString.match(/linear-gradient\((\d+deg),\s*(#[0-9a-fA-F]{6})\s+\d+%,\s*(#[0-9a-fA-F]{6})\s+\d+%\)/i)
      if (match) {
        setGradientDirection(match[1])
        setGradientStartColor(match[2])
        setGradientEndColor(match[3])
      }
    } catch (error) {
      console.error('Error parsing gradient:', error)
    }
  }

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
          outcomes: Array.isArray(data.outcomes) ? data.outcomes : prev.outcomes,
          tech_carousel_items: Array.isArray(data.tech_carousel_items) ? data.tech_carousel_items : prev.tech_carousel_items,
          how_it_works_steps: Array.isArray(data.how_it_works_steps) ? data.how_it_works_steps : prev.how_it_works_steps
        }))
        
        // Parse gradient and set color picker states
        if (data.hero_bg_gradient) {
          parseGradient(data.hero_bg_gradient)
        }
      }
    } catch (error) {
      console.error('Error fetching homepage content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle gradient color changes
  const handleGradientColorChange = (type: 'start' | 'end', color: string) => {
    if (type === 'start') {
      setGradientStartColor(color)
    } else {
      setGradientEndColor(color)
    }
    const newGradient = generateGradient(
      type === 'start' ? color : gradientStartColor,
      type === 'end' ? color : gradientEndColor,
      gradientDirection
    )
    setFormData(prev => ({ ...prev, hero_bg_gradient: newGradient }))
  }

  // Handle gradient direction change
  const handleGradientDirectionChange = (direction: string) => {
    setGradientDirection(direction)
    const newGradient = generateGradient(gradientStartColor, gradientEndColor, direction)
    setFormData(prev => ({ ...prev, hero_bg_gradient: newGradient }))
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

  // Tech Carousel handlers
  const handleTechCarouselItemChange = (index: number, field: 'name' | 'icon', value: string) => {
    const newItems = [...(formData.tech_carousel_items || [])]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData(prev => ({ ...prev, tech_carousel_items: newItems }))
  }

  const addTechCarouselItem = () => {
    setFormData(prev => ({
      ...prev,
      tech_carousel_items: [
        ...(prev.tech_carousel_items || []),
        { id: String(Date.now()), name: '', icon: '' }
      ]
    }))
  }

  const removeTechCarouselItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tech_carousel_items: (prev.tech_carousel_items || []).filter((_, i) => i !== index)
    }))
  }

  // How It Works handlers
  const handleHowItWorksStepChange = (index: number, field: 'number' | 'title' | 'description' | 'link_text' | 'link_url', value: string) => {
    const newSteps = [...(formData.how_it_works_steps || [])]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setFormData(prev => ({ ...prev, how_it_works_steps: newSteps }))
  }

  const handleHowItWorksStepImageChange = (index: number, url: string) => {
    const newSteps = [...(formData.how_it_works_steps || [])]
    newSteps[index] = { ...newSteps[index], image: url }
    setFormData(prev => ({ ...prev, how_it_works_steps: newSteps }))
  }

  const addHowItWorksStep = () => {
    const currentSteps = formData.how_it_works_steps || []
    const nextNumber = String(currentSteps.length + 1).padStart(2, '0')
    setFormData(prev => ({
      ...prev,
      how_it_works_steps: [
        ...currentSteps,
        { id: String(Date.now()), number: nextNumber, title: '', description: '', image: '', link_text: 'Discover More', link_url: '#' }
      ]
    }))
  }

  const removeHowItWorksStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      how_it_works_steps: (prev.how_it_works_steps || []).filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Log what we're sending (for debugging)
      console.log('Submitting formData:', { ...formData, logo_text: formData.logo_text })
      
      const res = await fetch('/api/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const responseData = await res.json()

      if (res.ok) {
        // Refresh the data to show updated values
        fetchHomepageContent()
      } else {
        console.error('API Error:', responseData)
        alert(`Failed to update homepage content: ${responseData.error || 'Unknown error'}${responseData.details ? `\n\nDetails: ${responseData.details}` : ''}`)
      }
    } catch (error) {
      console.error('Error updating homepage:', error)
      alert(`Error updating homepage: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
          {/* AI Settings */}
          <div className="form-section">
            <h2 className="form-section-title">AI Settings</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ai_provider">Default AI Provider</label>
                <select
                  id="ai_provider"
                  value={aiProvider}
                  onChange={(e) => {
                    const prov = e.target.value as keyof typeof AI_PROVIDERS
                    setAiProvider(prov)
                    setAiModel(AI_PROVIDERS[prov].default)
                  }}
                >
                  {Object.entries(AI_PROVIDERS).map(([key, p]) => (
                    <option key={key} value={key}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="ai_model">Default Model</label>
                <select
                  id="ai_model"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                >
                  {AI_PROVIDERS[aiProvider].models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
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
              <TextEnhancer
                value={formData.hero_title}
                onChange={(value) => setFormData({...formData, hero_title: value})}
                fieldType="hero_title"
                label="Hero Title"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.hero_description}
                onChange={(value) => setFormData({...formData, hero_description: value})}
                fieldType="hero_description"
                label="Hero Description"
                multiline={true}
                rows={4}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <ImageUpload
                value={formData.hero_image}
                onChange={(url) => setFormData({ ...formData, hero_image: url })}
                label="Hero Image (AI)"
                folder="hero"
                defaultPromptProvider={aiProvider}
                defaultPromptModel={aiModel}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <TextEnhancer
                  value={formData.hero_cta_text}
                  onChange={(value) => setFormData({...formData, hero_cta_text: value})}
                  fieldType="cta_text"
                  label="CTA Button Text"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
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

            <div className="form-row">
              <div className="form-group">
                <TextEnhancer
                  value={formData.hero_footer_cta_text}
                  onChange={(value) => setFormData({...formData, hero_footer_cta_text: value})}
                  fieldType="cta_text"
                  label="Footer CTA Button Text"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <label htmlFor="hero_footer_cta_link">Footer CTA Button Link</label>
                <input
                  type="text"
                  id="hero_footer_cta_link"
                  name="hero_footer_cta_link"
                  value={formData.hero_footer_cta_link}
                  onChange={handleChange}
                  placeholder="mailto:hello@example.com or /contact"
                />
              </div>
            </div>

            {/* Hero Colors & Styling */}
            <div className="form-section">
              <h2 className="form-section-title">Hero Colors & Styling</h2>
              
              <div className="form-group">
                <label htmlFor="hero_bg_gradient">Background Gradient</label>
                
                {/* Color Pickers */}
                <div className="form-row" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="gradient_start_color" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                      Start Color
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        id="gradient_start_color"
                        value={gradientStartColor}
                        onChange={(e) => handleGradientColorChange('start', e.target.value)}
                        style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={gradientStartColor}
                        onChange={(e) => handleGradientColorChange('start', e.target.value)}
                        placeholder="#667eea"
                        style={{ flex: 1, padding: '0.5rem' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="gradient_end_color" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                      End Color
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        id="gradient_end_color"
                        value={gradientEndColor}
                        onChange={(e) => handleGradientColorChange('end', e.target.value)}
                        style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={gradientEndColor}
                        onChange={(e) => handleGradientColorChange('end', e.target.value)}
                        placeholder="#764ba2"
                        style={{ flex: 1, padding: '0.5rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Direction Selector */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="gradient_direction" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                    Direction
                  </label>
                  <select
                    id="gradient_direction"
                    value={gradientDirection}
                    onChange={(e) => handleGradientDirectionChange(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="0deg">To Right (→)</option>
                    <option value="45deg">To Bottom Right (↘)</option>
                    <option value="90deg">To Bottom (↓)</option>
                    <option value="135deg">To Bottom Left (↙)</option>
                    <option value="180deg">To Left (←)</option>
                    <option value="225deg">To Top Left (↖)</option>
                    <option value="270deg">To Top (↑)</option>
                    <option value="315deg">To Top Right (↗)</option>
                  </select>
                </div>

                {/* Gradient Preview */}
                <div 
                  key={formData.hero_bg_gradient || 'default'}
                  style={{
                    width: '100%',
                    height: '60px',
                    borderRadius: '8px',
                    background: formData.hero_bg_gradient || generateGradient(gradientStartColor, gradientEndColor, gradientDirection),
                    marginTop: '0.5rem',
                    border: '1px solid #ddd',
                    transition: 'background 0.1s ease'
                  }}
                />

                {/* Manual Override (Advanced) */}
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                    Advanced: Manual CSS Gradient String
                  </summary>
                  <input
                    type="text"
                    id="hero_bg_gradient"
                    name="hero_bg_gradient"
                    value={formData.hero_bg_gradient || ''}
                    onChange={(e) => {
                      handleChange(e)
                      if (e.target.value) {
                        parseGradient(e.target.value)
                      }
                    }}
                    placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                    You can manually enter a CSS gradient string. The color pickers above will update automatically.
                  </p>
                </details>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="hero_text_color">Text Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      id="hero_text_color"
                      name="hero_text_color"
                      value={formData.hero_text_color || '#ffffff'}
                      onChange={handleChange}
                      style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={formData.hero_text_color || '#ffffff'}
                      onChange={(e) => setFormData({...formData, hero_text_color: e.target.value})}
                      placeholder="#ffffff"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="hero_cta_bg_color">CTA Background Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      id="hero_cta_bg_color"
                      name="hero_cta_bg_color"
                      value={formData.hero_cta_bg_color || '#000000'}
                      onChange={handleChange}
                      style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={formData.hero_cta_bg_color || '#000000'}
                      onChange={(e) => setFormData({...formData, hero_cta_bg_color: e.target.value})}
                      placeholder="#000000"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="hero_cta_text_color">CTA Text Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="hero_cta_text_color"
                    name="hero_cta_text_color"
                    value={formData.hero_cta_text_color || '#ffffff'}
                    onChange={handleChange}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.hero_cta_text_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, hero_cta_text_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quiz CTA Section */}
          <div className="form-section">
            <h2 className="form-section-title">Quiz CTA (Right Side)</h2>
            
            <div className="form-group">
              <label htmlFor="quiz_steps">Number of Steps</label>
              <input
                type="text"
                id="quiz_steps"
                name="quiz_steps"
                value={formData.quiz_steps || '12'}
                onChange={handleChange}
                placeholder="12"
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                The number displayed in the quiz badge (e.g., &quot;12 Steps&quot;)
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="quiz_badge_text">Badge Text</label>
              <input
                type="text"
                id="quiz_badge_text"
                name="quiz_badge_text"
                value={formData.quiz_badge_text || 'Steps'}
                onChange={handleChange}
                placeholder="Steps"
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                The text displayed next to the number in the badge (e.g., &quot;Steps&quot;, &quot;Questions&quot;, &quot;Minutes&quot;)
              </p>
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.quiz_title || ''}
                onChange={(value) => setFormData({...formData, quiz_title: value})}
                fieldType="quiz_title"
                label="Quiz Title"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.quiz_description || ''}
                onChange={(value) => setFormData({...formData, quiz_description: value})}
                fieldType="quiz_description"
                label="Quiz Description"
                multiline={true}
                rows={3}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quiz_cta_text">Quiz CTA Button Text</label>
                <input
                  type="text"
                  id="quiz_cta_text"
                  name="quiz_cta_text"
                  value={formData.quiz_cta_text || ''}
                  onChange={handleChange}
                  placeholder="Start Quiz"
                />
              </div>

              <div className="form-group">
                <label htmlFor="quiz_cta_link">Quiz CTA Button Link</label>
                <input
                  type="text"
                  id="quiz_cta_link"
                  name="quiz_cta_link"
                  value={formData.quiz_cta_link || ''}
                  onChange={handleChange}
                  placeholder="/quiz"
                />
              </div>
            </div>
          </div>

          {/* Technology Carousel Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Technology Carousel</h2>
              <button type="button" onClick={addTechCarouselItem} className="btn btn-sm btn-primary">
                + Add Technology
              </button>
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.tech_carousel_title || ''}
                onChange={(value) => setFormData({...formData, tech_carousel_title: value})}
                fieldType="tech_carousel_title"
                label="Carousel Title"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="services-list">
              {(formData.tech_carousel_items || []).map((item, index) => (
                <div key={item.id} className="service-item">
                  <div className="service-item-header">
                    <h4>Technology {index + 1}</h4>
                    <button type="button" onClick={() => removeTechCarouselItem(index)} className="btn-remove">
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Technology Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleTechCarouselItemChange(index, 'name', e.target.value)}
                      placeholder="ChatGPT, Claude, Gemini, etc."
                    />
                  </div>

                  <div className="form-group">
                    <label>Icon/Logo (AI)</label>
                    <ImageUpload
                      value={item.icon || ''}
                      onChange={(url) => handleTechCarouselItemChange(index, 'icon', url)}
                      label="Technology Icon/Logo"
                      folder="tech-icons"
                      defaultPromptProvider={aiProvider}
                      defaultPromptModel={aiModel}
                    />
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      Upload or generate an icon/logo for this technology. Recommended size: 80x80px or 1:1 aspect ratio.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">How It Works Section</h2>
              <button type="button" onClick={addHowItWorksStep} className="btn btn-sm btn-primary">
                + Add Step
              </button>
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.how_it_works_title || ''}
                onChange={(value) => setFormData({...formData, how_it_works_title: value})}
                fieldType="how_it_works_title"
                label="Section Title"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="services-list">
              {(formData.how_it_works_steps || []).map((step, index) => (
                <div key={step.id} className="service-item">
                  <div className="service-item-header">
                    <h4>Step {index + 1}</h4>
                    <button type="button" onClick={() => removeHowItWorksStep(index)} className="btn-remove">
                      Remove
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Step Number</label>
                      <input
                        type="text"
                        value={step.number}
                        onChange={(e) => handleHowItWorksStepChange(index, 'number', e.target.value)}
                        placeholder="01, 02, 03..."
                        style={{ width: '100px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={step.title}
                      onChange={(value) => handleHowItWorksStepChange(index, 'title', value)}
                      fieldType="step_title"
                      label="Step Title"
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={step.description}
                      onChange={(value) => handleHowItWorksStepChange(index, 'description', value)}
                      fieldType="step_description"
                      label="Step Description"
                      multiline={true}
                      rows={4}
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <label>Step Image (AI)</label>
                    <ImageUpload
                      value={step.image || ''}
                      onChange={(url) => handleHowItWorksStepImageChange(index, url)}
                      label="Step Image"
                      folder="how-it-works"
                      defaultPromptProvider={aiProvider}
                      defaultPromptModel={aiModel}
                    />
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      Upload or generate an image for this step. Recommended: 1:1 aspect ratio (square).
                    </p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Link Text</label>
                      <input
                        type="text"
                        value={step.link_text || ''}
                        onChange={(e) => handleHowItWorksStepChange(index, 'link_text', e.target.value)}
                        placeholder="Discover More"
                      />
                    </div>
                    <div className="form-group">
                      <label>Link URL</label>
                      <input
                        type="text"
                        value={step.link_url || ''}
                        onChange={(e) => handleHowItWorksStepChange(index, 'link_url', e.target.value)}
                        placeholder="# or /page"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* About Section */}
          <div className="form-section">
            <h2 className="form-section-title">About Section</h2>
            
            <div className="form-group">
              <TextEnhancer
                value={formData.about_title}
                onChange={(value) => setFormData({...formData, about_title: value})}
                fieldType="about_title"
                label="About Title"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.about_description}
                onChange={(value) => setFormData({...formData, about_description: value})}
                fieldType="about_description"
                label="About Description"
                multiline={true}
                rows={4}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <ImageUpload
                value={formData.about_image}
                onChange={(url) => setFormData({ ...formData, about_image: url })}
                label="About Image (optional)"
                folder="about"
                defaultPromptProvider={aiProvider}
                defaultPromptModel={aiModel}
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
                    <ImageUpload
                      value={service.icon || ''}
                      onChange={(url) => handleServiceChange(index, 'icon', url)}
                      label="Service Icon/Image (optional)"
                      folder="services"
                      defaultPromptProvider={aiProvider}
                      defaultPromptModel={aiModel}
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

