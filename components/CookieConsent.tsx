'use client'

import { useState, useEffect } from 'react'

// EU/EEA countries + UK that require GDPR consent
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 
  'SE', 'GB', 'IS', 'LI', 'NO', 'CH'
]

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [isEUUser, setIsEUUser] = useState<boolean | null>(null)

  useEffect(() => {
    const checkLocationAndConsent = async () => {
      // First, check if user has already made a choice
      const consent = localStorage.getItem('cookie-consent')
      
      // Check if we've already determined location
      const cachedLocation = localStorage.getItem('user-region')
      
      if (cachedLocation) {
        const isEU = cachedLocation === 'EU'
        setIsEUUser(isEU)
        
        if (!isEU) {
          // US/non-EU user - automatically grant consent
          localStorage.setItem('cookie-consent', 'auto-accepted')
          setConsentGiven(true)
          loadAnalytics()
          return
        }
        
        // EU user - check consent
        if (consent === null) {
          const timer = setTimeout(() => setShowBanner(true), 1000)
          return () => clearTimeout(timer)
        } else if (consent === 'accepted' || consent === 'auto-accepted') {
          setConsentGiven(true)
          loadAnalytics()
        }
        return
      }

      // Detect user location via timezone as fallback
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        
        // Try to get more accurate location via CloudFlare headers (if available)
        // This works automatically on Vercel/CloudFlare deployments
        const response = await fetch('https://cloudflare-dns.com/dns-query?name=whoami.cloudflare&type=A', {
          headers: { 'Accept': 'application/dns-json' }
        }).catch(() => null)

        // Fallback: Detect by timezone
        const euTimezones = [
          'Europe/', 'Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Faroe', 
          'Atlantic/Madeira', 'Atlantic/Azores'
        ]
        
        const isEU = euTimezones.some(tz => timezone.startsWith(tz))
        setIsEUUser(isEU)
        localStorage.setItem('user-region', isEU ? 'EU' : 'non-EU')

        if (!isEU) {
          // US/non-EU user - automatically accept
          localStorage.setItem('cookie-consent', 'auto-accepted')
          setConsentGiven(true)
          loadAnalytics()
        } else {
          // EU user - check consent
          if (consent === null) {
            const timer = setTimeout(() => setShowBanner(true), 1000)
            return () => clearTimeout(timer)
          } else if (consent === 'accepted' || consent === 'auto-accepted') {
            setConsentGiven(true)
            loadAnalytics()
          }
        }
      } catch (error) {
        console.error('Error detecting location:', error)
        // If detection fails, show banner to be safe (GDPR compliance)
        setIsEUUser(true)
        if (consent === null) {
          const timer = setTimeout(() => setShowBanner(true), 1000)
          return () => clearTimeout(timer)
        } else if (consent === 'accepted' || consent === 'auto-accepted') {
          setConsentGiven(true)
          loadAnalytics()
        }
      }
    }

    checkLocationAndConsent()
  }, [])

  const loadAnalytics = () => {
    // Enable Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      })
    }

    // Enable GTM
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'consent_granted'
      })
    }
  }

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setConsentGiven(true)
    setShowBanner(false)
    loadAnalytics()
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setShowBanner(false)
    
    // Disable analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied'
      })
    }
  }

  if (!showBanner) return null

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
        }}
        onClick={() => setShowBanner(false)}
      />

      {/* Cookie Banner */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          padding: '24px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
              }}
            >
              🍪 Cookie Consent
            </h3>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#475569',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              We use cookies and similar technologies to analyze site traffic, personalize content, and serve targeted
              advertisements. By clicking &ldquo;Accept All&rdquo;, you consent to our use of cookies.{' '}
              <a
                href="/privacy"
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
                target="_blank"
              >
                Learn more in our Privacy Policy
              </a>
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleAccept}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
            >
              Accept All
            </button>
            <button
              onClick={handleDecline}
              style={{
                padding: '10px 24px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            >
              Decline
            </button>
            <button
              onClick={() => setShowBanner(false)}
              style={{
                padding: '10px 24px',
                backgroundColor: 'transparent',
                color: '#64748b',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Mobile responsive */}
        <style jsx>{`
          @media (max-width: 640px) {
            div[style*="padding: 24px"] {
              padding: 16px !important;
            }
            button {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </>
  )
}

declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params: Record<string, string>
    ) => void
  }
}

