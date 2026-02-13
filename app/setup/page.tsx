'use client'

import { useState } from 'react'
import Link from 'next/link'

type Step = 'brand' | 'contact' | 'colors' | 'analytics' | 'review' | 'apply' | 'external'

interface Config {
  brandName: string
  domain: string
  tagline: string
  description: string
  footerTagline: string
  email: string
  contactEmail: string
  privacyEmail: string
  phone: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  primaryColor: string
  accentColor: string
  gaId: string
  gtmId: string
}

const colorPalettes = [
  { id: '1', name: 'Classic Black & Blue', primary: '#000000', accent: '#0066ff' },
  { id: '2', name: 'Navy & Orange', primary: '#1e3a5f', accent: '#ff6b35' },
  { id: '3', name: 'Forest & Gold', primary: '#2d5a27', accent: '#d4af37' },
  { id: '4', name: 'Purple & Pink', primary: '#4a0e4e', accent: '#ff69b4' },
  { id: '5', name: 'Slate & Teal', primary: '#334155', accent: '#14b8a6' },
  { id: '6', name: 'Burgundy & Gold', primary: '#722f37', accent: '#c9a227' },
  { id: '7', name: 'Ocean Blue & Coral', primary: '#0077b6', accent: '#ff7f50' },
  { id: '8', name: 'Charcoal & Lime', primary: '#36454f', accent: '#32cd32' },
]

const steps: { id: Step; label: string; description: string }[] = [
  { id: 'brand', label: 'Brand Identity', description: 'Name, domain, and messaging' },
  { id: 'contact', label: 'Contact Info', description: 'Email, phone, and address' },
  { id: 'colors', label: 'Color Palette', description: 'Choose your brand colors' },
  { id: 'analytics', label: 'Analytics', description: 'Tracking IDs (optional)' },
  { id: 'review', label: 'Review', description: 'Confirm your settings' },
  { id: 'apply', label: 'Apply Changes', description: 'Update your codebase' },
  { id: 'external', label: 'External Setup', description: 'Supabase & Vercel' },
]

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState<Step>('brand')
  const [isApplying, setIsApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<{ success: boolean; message: string } | null>(null)
  const [selectedPalette, setSelectedPalette] = useState<string>('1')
  const [useCustomColors, setUseCustomColors] = useState(false)
  
  const [config, setConfig] = useState<Config>({
    brandName: '',
    domain: '',
    tagline: '',
    description: '',
    footerTagline: '',
    email: '',
    contactEmail: '',
    privacyEmail: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    primaryColor: '#000000',
    accentColor: '#0066ff',
    gaId: '',
    gtmId: '',
  })

  const [externalChecklist, setExternalChecklist] = useState({
    supabaseCreated: false,
    migrationsRun: false,
    adminUser: false,
    vercelConnected: false,
    envVarsAdded: false,
    deployed: false,
    domainConnected: false,
  })

  const updateConfig = (field: keyof Config, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const goBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  const selectPalette = (id: string) => {
    setSelectedPalette(id)
    setUseCustomColors(false)
    const palette = colorPalettes.find(p => p.id === id)
    if (palette) {
      setConfig(prev => ({
        ...prev,
        primaryColor: palette.primary,
        accentColor: palette.accent,
      }))
    }
  }

  const applyChanges = async () => {
    setIsApplying(true)
    setApplyResult(null)
    
    try {
      const response = await fetch('/api/setup/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      
      const result = await response.json()
      setApplyResult(result)
      
      if (result.success) {
        goNext()
      }
    } catch (error) {
      setApplyResult({ success: false, message: 'Failed to apply changes. Please try again.' })
    } finally {
      setIsApplying(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'brand':
        return config.brandName.trim() !== '' && config.domain.trim() !== ''
      case 'contact':
        return config.email.trim() !== ''
      case 'colors':
        return true
      case 'analytics':
        return true
      case 'review':
        return true
      default:
        return true
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
            New Site Setup Wizard
          </h1>
          <p style={{ color: '#64748b' }}>
            Configure your new blog in a few simple steps
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            <Link href="/setup/auto" style={{ color: '#2563eb', fontWeight: 600 }}>
              Prefer no typing? Open automated setup →
            </Link>
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '2rem',
          padding: '1rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {steps.map((step, index) => (
            <div 
              key={step.id}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: 1,
                cursor: index <= currentStepIndex ? 'pointer' : 'default',
                opacity: index <= currentStepIndex ? 1 : 0.4,
              }}
              onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: index < currentStepIndex ? '#10b981' : index === currentStepIndex ? '#3b82f6' : '#e2e8f0',
                color: index <= currentStepIndex ? 'white' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
              }}>
                {index < currentStepIndex ? '✓' : index + 1}
              </div>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: index === currentStepIndex ? '600' : '400',
                color: index === currentStepIndex ? '#1e293b' : '#64748b',
                textAlign: 'center',
              }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1rem',
        }}>
          {/* Step 1: Brand Identity */}
          {currentStep === 'brand' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                Brand Identity
              </h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                Tell us about your brand
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Brand Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={config.brandName}
                    onChange={(e) => updateConfig('brandName', e.target.value)}
                    placeholder="e.g., FitLife Blog"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Domain <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={config.domain}
                    onChange={(e) => updateConfig('domain', e.target.value)}
                    placeholder="e.g., fitlifeblog.com (without www)"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => updateConfig('tagline', e.target.value)}
                    placeholder="e.g., Your Fitness Journey Starts Here"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Description
                  </label>
                  <textarea
                    value={config.description}
                    onChange={(e) => updateConfig('description', e.target.value)}
                    placeholder="A brief description of your site (1-2 sentences)"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {currentStep === 'contact' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                Contact Information
              </h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                How can people reach you?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Primary Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={config.email}
                    onChange={(e) => updateConfig('email', e.target.value)}
                    placeholder="e.g., you@yourdomain.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Used for form notifications
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={config.contactEmail}
                      onChange={(e) => updateConfig('contactEmail', e.target.value)}
                      placeholder={`contact@${config.domain || 'yourdomain.com'}`}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={config.phone}
                      onChange={(e) => updateConfig('phone', e.target.value)}
                      placeholder="e.g., +1 555-123-4567"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Business Address (optional)
                  </label>
                  <input
                    type="text"
                    value={config.addressLine1}
                    onChange={(e) => updateConfig('addressLine1', e.target.value)}
                    placeholder="Street address"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      marginBottom: '0.5rem',
                    }}
                  />
                  <input
                    type="text"
                    value={config.addressLine2}
                    onChange={(e) => updateConfig('addressLine2', e.target.value)}
                    placeholder="City, State"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      marginBottom: '0.5rem',
                    }}
                  />
                  <input
                    type="text"
                    value={config.addressLine3}
                    onChange={(e) => updateConfig('addressLine3', e.target.value)}
                    placeholder="Country, ZIP"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Colors */}
          {currentStep === 'colors' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                Color Palette
              </h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                Choose colors that represent your brand
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {colorPalettes.map((palette) => (
                  <div
                    key={palette.id}
                    onClick={() => selectPalette(palette.id)}
                    style={{
                      padding: '1rem',
                      border: selectedPalette === palette.id && !useCustomColors ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedPalette === palette.id && !useCustomColors ? '#f0f9ff' : 'white',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: palette.primary,
                        border: '1px solid #e2e8f0',
                      }} />
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: palette.accent,
                        border: '1px solid #e2e8f0',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                      {palette.name}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                padding: '1rem',
                border: useCustomColors ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: '8px',
                background: useCustomColors ? '#f0f9ff' : 'white',
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={useCustomColors}
                    onChange={(e) => setUseCustomColors(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: '500', color: '#374151' }}>Use custom colors</span>
                </label>

                {useCustomColors && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                        Primary Color
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="color"
                          value={config.primaryColor}
                          onChange={(e) => updateConfig('primaryColor', e.target.value)}
                          style={{ width: '50px', height: '40px', border: 'none', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={config.primaryColor}
                          onChange={(e) => updateConfig('primaryColor', e.target.value)}
                          placeholder="#000000"
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                        Accent Color
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="color"
                          value={config.accentColor}
                          onChange={(e) => updateConfig('accentColor', e.target.value)}
                          style={{ width: '50px', height: '40px', border: 'none', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={config.accentColor}
                          onChange={(e) => updateConfig('accentColor', e.target.value)}
                          placeholder="#0066ff"
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.75rem' }}>
                  Preview
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '700', 
                    color: config.primaryColor 
                  }}>
                    {config.brandName || 'Your Brand'}
                  </span>
                  <button style={{
                    padding: '0.5rem 1rem',
                    background: config.accentColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Analytics */}
          {currentStep === 'analytics' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                Analytics (Optional)
              </h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                Add tracking IDs to monitor your site traffic
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Google Analytics ID
                  </label>
                  <input
                    type="text"
                    value={config.gaId}
                    onChange={(e) => updateConfig('gaId', e.target.value)}
                    placeholder="e.g., G-XXXXXXXXXX"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Google Tag Manager ID
                  </label>
                  <input
                    type="text"
                    value={config.gtmId}
                    onChange={(e) => updateConfig('gtmId', e.target.value)}
                    placeholder="e.g., GTM-XXXXXXX"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div style={{ 
                  padding: '1rem', 
                  background: '#fefce8', 
                  borderRadius: '8px',
                  border: '1px solid #fef08a'
                }}>
                  <p style={{ color: '#854d0e', fontSize: '0.875rem', margin: 0 }}>
                    💡 You can add these later in the codebase if you don&apos;t have them yet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 'review' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                Review Your Settings
              </h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                Please confirm everything looks correct
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem' }}>
                    BRAND IDENTITY
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748b' }}>Brand Name:</span>
                    <span style={{ fontWeight: '500' }}>{config.brandName || '—'}</span>
                    <span style={{ color: '#64748b' }}>Domain:</span>
                    <span style={{ fontWeight: '500' }}>{config.domain || '—'}</span>
                    <span style={{ color: '#64748b' }}>Tagline:</span>
                    <span style={{ fontWeight: '500' }}>{config.tagline || '—'}</span>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem' }}>
                    CONTACT
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748b' }}>Email:</span>
                    <span style={{ fontWeight: '500' }}>{config.email || '—'}</span>
                    <span style={{ color: '#64748b' }}>Phone:</span>
                    <span style={{ fontWeight: '500' }}>{config.phone || '—'}</span>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem' }}>
                    COLORS
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: config.primaryColor, border: '1px solid #e2e8f0' }} />
                      <span style={{ fontSize: '0.875rem' }}>Primary: {config.primaryColor}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: config.accentColor, border: '1px solid #e2e8f0' }} />
                      <span style={{ fontSize: '0.875rem' }}>Accent: {config.accentColor}</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem' }}>
                    ANALYTICS
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748b' }}>GA ID:</span>
                    <span style={{ fontWeight: '500' }}>{config.gaId || 'Not set'}</span>
                    <span style={{ color: '#64748b' }}>GTM ID:</span>
                    <span style={{ fontWeight: '500' }}>{config.gtmId || 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Apply Changes */}
          {currentStep === 'apply' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                Apply Changes
              </h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                This will update all configuration files in your codebase
              </p>

              <div style={{ 
                padding: '1.5rem', 
                background: '#f0fdf4', 
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ color: '#166534', fontWeight: '600', marginBottom: '0.75rem' }}>
                  Files that will be updated:
                </h3>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#166534', fontSize: '0.875rem' }}>
                  <li>package.json (project name)</li>
                  <li>components/SiteHeader.tsx (logo)</li>
                  <li>components/Footer.tsx (branding, contact info)</li>
                  <li>components/Analytics.tsx (GA ID)</li>
                  <li>app/layout.tsx (metadata, GTM ID)</li>
                  <li>app/globals.css (color palette)</li>
                  <li>API routes (email templates)</li>
                  <li>And more...</li>
                </ul>
              </div>

              {applyResult && (
                <div style={{ 
                  padding: '1rem', 
                  background: applyResult.success ? '#f0fdf4' : '#fef2f2', 
                  borderRadius: '8px',
                  border: `1px solid ${applyResult.success ? '#bbf7d0' : '#fecaca'}`,
                  marginBottom: '1rem'
                }}>
                  <p style={{ 
                    color: applyResult.success ? '#166534' : '#dc2626', 
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    {applyResult.success ? '✓ ' : '✗ '}{applyResult.message}
                  </p>
                </div>
              )}

              <button
                onClick={applyChanges}
                disabled={isApplying}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: isApplying ? '#94a3b8' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isApplying ? 'not-allowed' : 'pointer',
                }}
              >
                {isApplying ? 'Applying Changes...' : 'Apply Changes to Codebase'}
              </button>
            </div>
          )}

          {/* Step 7: External Setup */}
          {currentStep === 'external' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                External Setup
              </h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                Complete these steps to finish your deployment
              </p>

              {/* Supabase Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
                  1. Supabase on Elestio
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={externalChecklist.supabaseCreated}
                      onChange={(e) => setExternalChecklist(prev => ({ ...prev, supabaseCreated: e.target.checked }))}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div>
                      <span style={{ fontWeight: '500' }}>Create Supabase service on Elestio</span>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                        Go to <a href="https://elest.io" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>elest.io</a> → Create Service → Search &quot;Supabase&quot;
                      </p>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={externalChecklist.migrationsRun}
                      onChange={(e) => setExternalChecklist(prev => ({ ...prev, migrationsRun: e.target.checked }))}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div>
                      <span style={{ fontWeight: '500' }}>Run database setup (ONE file!)</span>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                        In Supabase Studio → SQL Editor → Copy/paste <code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>supabase/COMPLETE_SETUP.sql</code> → Run
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#10b981', margin: '0.25rem 0 0' }}>
                        ✓ Creates all tables, storage bucket, and default admin user
                      </p>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={externalChecklist.adminUser}
                      onChange={(e) => setExternalChecklist(prev => ({ ...prev, adminUser: e.target.checked }))}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div>
                      <span style={{ fontWeight: '500' }}>Change admin password (optional)</span>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                        Default: <code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>admin</code> / <code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>admin123</code>
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                        To change: run <code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>node scripts/generate-admin-hash.js YOUR_PASSWORD</code>
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Vercel Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
                  2. Vercel Deployment
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={externalChecklist.vercelConnected}
                      onChange={(e) => setExternalChecklist(prev => ({ ...prev, vercelConnected: e.target.checked }))}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div>
                      <span style={{ fontWeight: '500' }}>Connect GitHub repo to Vercel</span>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                        Go to <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>vercel.com</a> → Add New Project → Import your repository
                      </p>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={externalChecklist.envVarsAdded}
                      onChange={(e) => setExternalChecklist(prev => ({ ...prev, envVarsAdded: e.target.checked }))}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div>
                      <span style={{ fontWeight: '500' }}>Add environment variables</span>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                        Add these from your Elestio Supabase config:
                      </p>
                      <ul style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                        <li><code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>NEXT_PUBLIC_SUPABASE_URL</code></li>
                        <li><code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                        <li><code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>SUPABASE_SERVICE_ROLE_KEY</code></li>
                        <li><code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>NEXT_PUBLIC_SITE_URL</code></li>
                        <li><code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>RESEND_API_KEY</code></li>
                      </ul>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={externalChecklist.deployed}
                      onChange={(e) => setExternalChecklist(prev => ({ ...prev, deployed: e.target.checked }))}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div>
                      <span style={{ fontWeight: '500' }}>Deploy</span>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                        Click Deploy and wait for build to complete
                      </p>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={externalChecklist.domainConnected}
                      onChange={(e) => setExternalChecklist(prev => ({ ...prev, domainConnected: e.target.checked }))}
                      style={{ width: '20px', height: '20px', marginTop: '2px' }}
                    />
                    <div>
                      <span style={{ fontWeight: '500' }}>Connect custom domain</span>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                        Settings → Domains → Add <code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>{config.domain || 'yourdomain.com'}</code>
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* API Info */}
              <div style={{ 
                padding: '1rem', 
                background: '#f0f9ff', 
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <h4 style={{ color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Your Blog API Endpoint
                </h4>
                <code style={{ 
                  display: 'block',
                  background: '#e0f2fe', 
                  padding: '0.75rem', 
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  color: '#0c4a6e'
                }}>
                  POST https://www.{config.domain || 'yourdomain.com'}/api/blog
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={goBack}
            disabled={currentStepIndex === 0}
            style={{
              padding: '0.75rem 1.5rem',
              background: currentStepIndex === 0 ? '#e2e8f0' : 'white',
              color: currentStepIndex === 0 ? '#94a3b8' : '#374151',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Back
          </button>

          {currentStep !== 'apply' && currentStep !== 'external' && (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              style={{
                padding: '0.75rem 1.5rem',
                background: canProceed() ? '#3b82f6' : '#94a3b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
