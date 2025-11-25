'use client'

import { useState } from 'react'
import { trackFormStart, trackFormSubmission } from '@/lib/analytics'

interface QuestionsDiscoveryProps {
  onClose?: () => void
  title?: string
  description?: string
  ctaText?: string
}

export default function QuestionsDiscovery({ 
  onClose,
  title = 'See What Questions Your Prospects Are Asking',
  description = 'Enter a keyword and discover the top questions people are asking. Answer them before your competitors do.',
  ctaText = 'Book a Discovery Call'
}: QuestionsDiscoveryProps) {
  const [step, setStep] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [email, setEmail] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiCallStarted, setApiCallStarted] = useState(false)

  const handleKeywordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedKeyword = keyword.trim()
    if (!trimmedKeyword) {
      setError('Please enter a keyword')
      return
    }

    // Prevent duplicate submissions
    if (apiCallStarted) {
      console.log('API call already in progress, ignoring duplicate submission')
      return
    }

    setError('')
    setApiCallStarted(true)
    trackFormStart('questions_discovery')

    console.log('Starting DataForSEO API call for keyword:', trimmedKeyword)

    // Move to step 2 immediately for better UX
    setStep(2)
    setIsLoading(true)

    try {
      // Make API call and WAIT for completion
      console.log('Fetching questions from DataForSEO...')
      const response = await fetch('/api/questions-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: trimmedKeyword }),
      })

      const data = await response.json()
      console.log('DataForSEO API response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch questions')
      }

      const fetchedQuestions = data.questions || []
      console.log(`Successfully fetched ${fetchedQuestions.length} questions`)
      setQuestions(fetchedQuestions)
      setIsLoading(false)
      
      if (fetchedQuestions.length === 0) {
        setError('No questions found for this keyword. Try a different one.')
      }
    } catch (err: any) {
      console.error('Error fetching questions:', err)
      setError('Unable to fetch questions. Please try again.')
      setIsLoading(false)
      // Stay on step 2 but show error - user can still enter email
      trackFormSubmission('questions_discovery', 'error')
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Save lead to database
      const res = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: keyword.trim(), // Use keyword as name for now
          email: email.trim(),
          source: 'questions_discovery',
          website: keyword.trim(), // Store keyword in website field for reference
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save email')
      }

      // Wait for questions to finish loading if still processing
      if (isLoading) {
        // Show a brief loading message
        setStep(3)
        // Wait for questions to be ready (max 40 seconds total)
        let attempts = 0
        while (isLoading && attempts < 80) {
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
        }
      }

      // Move to results
      setStep(3)
      trackFormSubmission('questions_discovery', 'success')
    } catch (err: any) {
      console.error('Error saving email:', err)
      setError(err.message || 'Unable to save email. Please try again.')
      trackFormSubmission('questions_discovery', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="quiz-inline-container">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInSlide {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .quiz-step {
            animation: fadeInSlide 0.4s ease-out;
          }
        `
      }} />
      <div className="quiz-inline-wrapper">
        {/* Step 1: Keyword Input */}
        {step === 1 && (
          <div className="quiz-step">
            <h3 className="quiz-title">
              {title}
            </h3>
            <p className="quiz-description">
              {description}
            </p>
            <form onSubmit={handleKeywordSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  id="keyword"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value)
                    setError('') // Clear error when user types
                  }}
                  placeholder="e.g. AI marketing, SaaS tools"
                  className="form-control"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                  }}
                  required
                />
              </div>
              {error && (
                <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Email Capture (while API processes) */}
        {step === 2 && (
          <div className="quiz-step">
            <h3 className="quiz-title">
              Get Your Questions Report
            </h3>
            <p className="quiz-description">
              We&apos;re analyzing questions for <strong>{keyword}</strong>. Enter your email to receive the results.
            </p>
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('') // Clear error when user types
                  }}
                  placeholder="you@example.com"
                  className="form-control"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                  }}
                  required
                />
              </div>
              {error && (
                <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {isSubmitting ? 'Saving...' : 'Show Me the Questions'}
              </button>
            </form>
            {isLoading && (
              <p style={{ textAlign: 'center', marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                🔍 Analyzing questions in the background...
              </p>
            )}
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <div className="quiz-step">
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p style={{ color: '#64748b' }}>Finalizing your questions report...</p>
              </div>
            ) : questions.length > 0 ? (
              <>
                {/* Hide intro text to save space on desktop */}
                <div style={{ marginBottom: '1rem' }}>
                  {questions.map((question, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        marginBottom: '0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: '4px solid #3b82f6',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                        <span
                          style={{
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </span>
                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                          {question}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                    Want help answering these questions to boost your Ai visibility?
                  </p>
                  <a 
                    href="/book-call" 
                    className="btn btn-primary"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.gtag) {
                        window.gtag('event', 'book_call_click', {
                          source: 'questions_discovery',
                          keyword: keyword,
                        })
                      }
                    }}
                  >
                    {ctaText}
                  </a>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                  No questions found for {keyword}
                </p>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                  We couldn&apos;t find any questions for this keyword. Try a different keyword.
                </p>
                <button
                  onClick={() => {
                    setStep(1)
                    setKeyword('')
                    setEmail('')
                    setQuestions([])
                    setError('')
                  }}
                  className="btn btn-secondary"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

