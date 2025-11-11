'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import TextEnhancer from '@/components/TextEnhancer'

interface FAQItem {
  id: string
  question: string
  answer: string
}

interface WhyWorkWithUsItem {
  id: string
  title: string
  description: string
  link_text: string
  link_url: string
  icon?: string
}

interface HomepageContent {
  logo_image: string
  logo_text: string
  hero_title: string
  hero_description: string
  hero_image: string
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
  tech_carousel_bg_color?: string
  how_it_works_title?: string
  how_it_works_steps?: Array<{ id: string; number: string; title: string; description: string; image?: string; link_text?: string; link_url?: string }>
  how_it_works_bg_color?: string
  why_work_with_us_title?: string
  why_work_with_us_subtitle?: string
  why_work_with_us_description?: string
  why_work_with_us_items?: WhyWorkWithUsItem[]
  why_work_with_us_bg_color?: string
  faq_items?: FAQItem[]
  faq_bg_color?: string
  blog_grid_bg_color?: string
  quiz_cta_bg_color?: string
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
    hero_description: 'Hello, I\'m a freelancer specializing in minimal design with 10 years of expertise — based in Tokyo, working remote. Let\'s create!',
    hero_image: '',
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
    tech_carousel_bg_color: '#ffffff',
    how_it_works_title: 'How it works',
    how_it_works_steps: [
      { id: '1', number: '01', title: 'Simple Booking', description: 'Effortlessly schedule a consultation to discuss your business needs and challenges. We streamline the process to get started quickly.', image: '', link_text: 'Discover More', link_url: '#' }
    ],
    how_it_works_bg_color: '#ffffff',
    why_work_with_us_title: 'Why Work With Us',
    why_work_with_us_subtitle: 'We strive to deliver value to our clients',
    why_work_with_us_description: 'We are dedicated to providing the highest level of service, delivering innovative solutions, and exceeding expectations in everything we do.',
    why_work_with_us_items: [
      { id: '1', title: 'Proven track record', description: 'We have helped countless businesses overcome challenges.', link_text: 'Our track record', link_url: '#', icon: '' },
      { id: '2', title: 'Collaborative approach', description: 'We ensure transparency throughout the process.', link_text: 'Our process', link_url: '#', icon: '' },
      { id: '3', title: 'Innovative solutions', description: 'We leverage the latest technologies to deliver solutions.', link_text: 'Our solutions', link_url: '#', icon: '' }
    ],
    why_work_with_us_bg_color: '#ffffff',
    faq_items: [
      { id: '1', question: 'How does your consulting process work?', answer: 'Our consulting process begins with a comprehensive analysis of your current LLM visibility. We assess how AI systems understand and rank your brand, then create a customized strategy to improve your positioning.' },
      { id: '2', question: 'What industries do you specialize in?', answer: 'We work with brands across various industries, from technology and SaaS to e-commerce, healthcare, finance, and professional services.' },
      { id: '3', question: 'How long does it take to see results?', answer: 'Results can vary depending on your current visibility and the scope of optimization needed. Typically, you\'ll start seeing improvements in LLM rankings within 4-8 weeks.' },
      { id: '4', question: 'Do you offer one-time consultations?', answer: 'Yes, we offer both one-time consultations and ongoing partnerships. A one-time consultation provides you with a strategic roadmap and actionable recommendations.' },
      { id: '5', question: 'Can small businesses afford your services?', answer: 'Absolutely. We offer flexible pricing options designed to accommodate businesses of all sizes. Our services are structured to provide value at every level.' },
      { id: '6', question: 'How do I get started?', answer: 'Getting started is simple. Take our 12-step quiz to see where you\'re missing out on LLM visibility, or reach out directly through our contact form.' }
    ],
    faq_bg_color: '#ffffff',
    blog_grid_bg_color: '#ffffff',
    quiz_cta_bg_color: '#ffffff'
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
          tech_carousel_items: Array.isArray(data.tech_carousel_items) ? data.tech_carousel_items : prev.tech_carousel_items,
          how_it_works_steps: Array.isArray(data.how_it_works_steps) ? data.how_it_works_steps : prev.how_it_works_steps,
          why_work_with_us_items: Array.isArray(data.why_work_with_us_items) ? data.why_work_with_us_items : prev.why_work_with_us_items,
          faq_items: Array.isArray(data.faq_items) ? data.faq_items : prev.faq_items
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

  // Why Work With Us handlers
  const handleWhyWorkWithUsChange = (index: number, field: 'title' | 'description' | 'link_text' | 'link_url', value: string) => {
    const newItems = [...(formData.why_work_with_us_items || [])]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData(prev => ({ ...prev, why_work_with_us_items: newItems }))
  }

  const handleWhyWorkWithUsIconChange = (index: number, url: string) => {
    const newItems = [...(formData.why_work_with_us_items || [])]
    newItems[index] = { ...newItems[index], icon: url }
    setFormData(prev => ({ ...prev, why_work_with_us_items: newItems }))
  }

  const addWhyWorkWithUsItem = () => {
    setFormData(prev => ({
      ...prev,
      why_work_with_us_items: [
        ...(prev.why_work_with_us_items || []),
        { id: String(Date.now()), title: '', description: '', link_text: '', link_url: '#', icon: '' }
      ]
    }))
  }

  const removeWhyWorkWithUsItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      why_work_with_us_items: (prev.why_work_with_us_items || []).filter((_, i) => i !== index)
    }))
  }

  // FAQ handlers
  const handleFAQChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newFAQs = [...(formData.faq_items || [])]
    newFAQs[index] = { ...newFAQs[index], [field]: value }
    setFormData(prev => ({ ...prev, faq_items: newFAQs }))
  }

  const addFAQ = () => {
    setFormData(prev => ({
      ...prev,
      faq_items: [
        ...(prev.faq_items || []),
        { id: String(Date.now()), question: '', answer: '' }
      ]
    }))
  }

  const removeFAQ = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faq_items: (prev.faq_items || []).filter((_, i) => i !== index)
    }))
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

            <div className="form-row">
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

              <div className="form-group">
                <label htmlFor="tech_carousel_bg_color">Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="tech_carousel_bg_color"
                    value={formData.tech_carousel_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, tech_carousel_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.tech_carousel_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, tech_carousel_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
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

                  <div className="form-row">
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
                      <ImageUpload
                        value={item.icon || ''}
                        onChange={(url) => handleTechCarouselItemChange(index, 'icon', url)}
                        label="Icon/Logo"
                        folder="tech-icons"
                        defaultPromptProvider={aiProvider}
                        defaultPromptModel={aiModel}
                      />
                    </div>
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

            <div className="form-row">
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

              <div className="form-group">
                <label htmlFor="how_it_works_bg_color">Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="how_it_works_bg_color"
                    value={formData.how_it_works_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, how_it_works_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.how_it_works_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, how_it_works_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
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

          {/* Why Work With Us Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Why Work With Us Section</h2>
              <button type="button" onClick={addWhyWorkWithUsItem} className="btn btn-sm btn-primary">
                + Add Item
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <TextEnhancer
                  value={formData.why_work_with_us_title || ''}
                  onChange={(value) => setFormData({...formData, why_work_with_us_title: value})}
                  fieldType="why_work_with_us_title"
                  label="Section Label"
                  defaultProvider={aiProvider}
                  defaultModel={aiModel}
                />
              </div>

              <div className="form-group">
                <label htmlFor="why_work_with_us_bg_color">Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="why_work_with_us_bg_color"
                    value={formData.why_work_with_us_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, why_work_with_us_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.why_work_with_us_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, why_work_with_us_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.why_work_with_us_subtitle || ''}
                onChange={(value) => setFormData({...formData, why_work_with_us_subtitle: value})}
                fieldType="why_work_with_us_subtitle"
                label="Section Title"
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="form-group">
              <TextEnhancer
                value={formData.why_work_with_us_description || ''}
                onChange={(value) => setFormData({...formData, why_work_with_us_description: value})}
                fieldType="why_work_with_us_description"
                label="Section Description"
                multiline={true}
                rows={3}
                defaultProvider={aiProvider}
                defaultModel={aiModel}
              />
            </div>

            <div className="services-list">
              {(formData.why_work_with_us_items || []).map((item, index) => (
                <div key={item.id} className="service-item">
                  <div className="service-item-header">
                    <h4>Item {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeWhyWorkWithUsItem(index)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <ImageUpload
                      value={item.icon || ''}
                      onChange={(url) => handleWhyWorkWithUsIconChange(index, url)}
                      label="Icon"
                      folder="why-work-with-us"
                      defaultPromptProvider={aiProvider}
                      defaultPromptModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={item.title}
                      onChange={(value) => handleWhyWorkWithUsChange(index, 'title', value)}
                      fieldType="why_work_with_us_item_title"
                      label="Title"
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={item.description}
                      onChange={(value) => handleWhyWorkWithUsChange(index, 'description', value)}
                      fieldType="why_work_with_us_item_description"
                      label="Description"
                      multiline={true}
                      rows={2}
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Link Text</label>
                      <input
                        type="text"
                        value={item.link_text}
                        onChange={(e) => handleWhyWorkWithUsChange(index, 'link_text', e.target.value)}
                        placeholder="Our track record"
                      />
                    </div>

                    <div className="form-group">
                      <label>Link URL</label>
                      <input
                        type="text"
                        value={item.link_url}
                        onChange={(e) => handleWhyWorkWithUsChange(index, 'link_url', e.target.value)}
                        placeholder="# or /page"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">FAQ Section</h2>
              <button type="button" onClick={addFAQ} className="btn btn-sm btn-primary">
                + Add FAQ Item
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="faq_bg_color">Background Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  id="faq_bg_color"
                  value={formData.faq_bg_color || '#ffffff'}
                  onChange={(e) => setFormData({...formData, faq_bg_color: e.target.value})}
                  style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={formData.faq_bg_color || '#ffffff'}
                  onChange={(e) => setFormData({...formData, faq_bg_color: e.target.value})}
                  placeholder="#ffffff"
                  style={{ flex: 1, padding: '0.5rem' }}
                />
              </div>
            </div>

            <div className="services-list">
              {(formData.faq_items || []).map((faq, index) => (
                <div key={faq.id} className="service-item">
                  <div className="service-item-header">
                    <h4>FAQ Item {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeFAQ(index)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={faq.question}
                      onChange={(value) => handleFAQChange(index, 'question', value)}
                      fieldType="faq_question"
                      label="Question"
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>

                  <div className="form-group">
                    <TextEnhancer
                      value={faq.answer}
                      onChange={(value) => handleFAQChange(index, 'answer', value)}
                      fieldType="faq_answer"
                      label="Answer"
                      multiline={true}
                      rows={4}
                      defaultProvider={aiProvider}
                      defaultModel={aiModel}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Background Colors */}
          <div className="form-section">
            <div className="form-section-header">
              <h2 className="form-section-title">Additional Section Colors</h2>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quiz_cta_bg_color">Quiz CTA Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="quiz_cta_bg_color"
                    value={formData.quiz_cta_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, quiz_cta_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.quiz_cta_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, quiz_cta_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="blog_grid_bg_color">Blog Grid Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    id="blog_grid_bg_color"
                    value={formData.blog_grid_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, blog_grid_bg_color: e.target.value})}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.blog_grid_bg_color || '#ffffff'}
                    onChange={(e) => setFormData({...formData, blog_grid_bg_color: e.target.value})}
                    placeholder="#ffffff"
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </div>
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

