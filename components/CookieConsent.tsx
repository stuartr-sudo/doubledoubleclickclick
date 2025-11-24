'use client'

import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    
    if (consent === null) {
      // No choice made yet, show banner after 1 second
      const timer = setTimeout(() => setShowBanner(true), 1000)
      return () => clearTimeout(timer)
    } else if (consent === 'accepted') {
      setConsentGiven(true)
      loadAnalytics()
    }
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
              advertisements. By clicking "Accept All", you consent to our use of cookies.{' '}
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

