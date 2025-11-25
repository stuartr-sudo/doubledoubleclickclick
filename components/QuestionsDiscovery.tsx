'use client'

import { useState, useEffect, useCallback } from 'react'
import { trackFormStart, trackFormSubmission } from '@/lib/analytics'

interface QuestionsDiscoveryProps {
  onClose?: () => void
  title?: string
  description?: string
  ctaText?: string
  aiFacts?: string[]
}

export default function QuestionsDiscovery({ 
  onClose,
  title = 'See What Questions Your Prospects Are Asking',
  description = 'Enter a keyword and discover the top questions people are asking. Answer them before your competitors do.',
  ctaText = 'Book a Discovery Call',
  aiFacts = [
    'Did you know? Over 85% of consumers use AI-powered search before making purchase decisions.',
    'ChatGPT reaches 100 million users in just 2 months - the fastest growing app in history.',
    'Brands optimized for AI discovery see up to 300% more referral traffic.',
    'By 2025, 50% of all searches will be conducted through AI assistants.',
    'AI citations drive 4x higher conversion rates than traditional search results.'
  ]
}: QuestionsDiscoveryProps) {
  const [step, setStep] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [email, setEmail] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiCallStarted, setApiCallStarted] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [currentFactIndex, setCurrentFactIndex] = useState(0)

  // Cycle through AI facts every 3 seconds while loading
  useEffect(() => {
    if (isLoading && aiFacts.length > 0) {
      const interval = setInterval(() => {
        setCurrentFactIndex((prevIndex) => (prevIndex + 1) % aiFacts.length)
      }, 3000) // Change fact every 3 seconds

      return () => clearInterval(interval)
    }
  }, [isLoading, aiFacts.length])

  // Send email once questions are loaded and we're on step 3
  useEffect(() => {
    if (step === 3 && questions.length > 0 && email.trim() && !emailSent) {
      console.log('Triggering email send from useEffect')
      sendQuestionsEmail()
    }
  }, [step, questions.length, email, emailSent, sendQuestionsEmail])

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

      // Move to results (email will be sent by useEffect when questions are ready)
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

  const sendQuestionsEmail = useCallback(async () => {
    if (!email.trim() || !keyword.trim() || questions.length === 0) {
      console.log('Skipping email send: missing data', { email: !!email, keyword: !!keyword, questionsCount: questions.length })
      return
    }

    try {
      console.log('Sending email to:', email.trim(), 'with', questions.length, 'questions')
      const res = await fetch('/api/send-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          keyword: keyword.trim(),
          questions: questions,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setEmailSent(true)
        console.log('Questions emailed successfully:', data)
      } else {
        const errorData = await res.json()
        console.error('Failed to send email:', errorData)
      }
    } catch (error) {
      console.error('Error sending email:', error)
    }
  }, [email, keyword, questions])

  const copyQuestion = async (question: string, index: number) => {
    try {
      await navigator.clipboard.writeText(question)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copyAllQuestions = async () => {
    try {
      const allQuestions = questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')
      await navigator.clipboard.writeText(allQuestions)
      setCopiedIndex(-1) // Use -1 to indicate "all copied"
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
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
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .quiz-step {
            animation: fadeInSlide 0.4s ease-out;
          }
          .loading-spinner {
            animation: spin 1s linear infinite;
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
            <p className="quiz-description" style={{ marginBottom: '2rem' }}>
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
            {isLoading && aiFacts.length > 0 && (
              <div style={{ 
                marginTop: '2rem', 
                padding: '1.5rem', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '12px',
                border: '2px solid #3b82f6',
                textAlign: 'center',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: '#3b82f6',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}>
                  <div className="loading-spinner" style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #3b82f6',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Analyzing questions...
                </div>
                <p style={{ 
                  margin: 0, 
                  color: '#1e293b', 
                  fontSize: '0.95rem', 
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  transition: 'opacity 0.5s ease-in-out',
                  maxWidth: '90%'
                }}>
                  💡 {aiFacts[currentFactIndex]}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <div className="quiz-step">
            {isLoading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem'
              }}>
                <div className="spinner" style={{ 
                  margin: '0 auto',
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e5e7eb',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: '#64748b', fontWeight: 600 }}>Finalizing your questions report...</p>
                {aiFacts.length > 0 && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '1.5rem', 
                    backgroundColor: '#f0f9ff', 
                    borderRadius: '12px',
                    border: '2px solid #3b82f6',
                    maxWidth: '500px',
                    width: '100%'
                  }}>
                    <p style={{ 
                      margin: 0, 
                      color: '#1e293b', 
                      fontSize: '0.95rem', 
                      lineHeight: 1.6,
                      fontStyle: 'italic',
                      transition: 'opacity 0.5s ease-in-out'
                    }}>
                      💡 {aiFacts[currentFactIndex]}
                    </p>
                  </div>
                )}
              </div>
            ) : questions.length > 0 ? (
              <>
                {/* Email sent confirmation */}
                {emailSent && (
                  <div style={{ 
                    marginBottom: '1rem', 
                    padding: '0.75rem', 
                    backgroundColor: '#f0fdf4', 
                    border: '1px solid #86efac',
                    borderRadius: '8px',
                    color: '#166534',
                    fontSize: '0.875rem',
                    textAlign: 'center'
                  }}>
                    ✓ Questions emailed to {email}
                  </div>
                )}
                
                {/* Copy All Button */}
                <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
                  <button
                    onClick={copyAllQuestions}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      backgroundColor: copiedIndex === -1 ? '#10b981' : '#ffffff',
                      color: copiedIndex === -1 ? '#ffffff' : '#64748b',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copiedIndex === -1 ? '✓ Copied All!' : '📋 Copy All Questions'}
                  </button>
                </div>

                {/* Questions List */}
                <div style={{ marginBottom: '1rem' }}>
                  {questions.map((question, index) => (
                    <div
                      key={index}
                      onClick={() => copyQuestion(question, index)}
                      style={{
                        padding: '1rem',
                        marginBottom: '0.75rem',
                        backgroundColor: copiedIndex === index ? '#f0fdf4' : '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${copiedIndex === index ? '#10b981' : '#3b82f6'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (copiedIndex !== index) {
                          e.currentTarget.style.backgroundColor = '#f1f5f9'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedIndex !== index) {
                          e.currentTarget.style.backgroundColor = '#f8fafc'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', flex: 1 }}>
                          <span
                            style={{
                              backgroundColor: copiedIndex === index ? '#10b981' : '#3b82f6',
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
                            {copiedIndex === index ? '✓' : index + 1}
                          </span>
                          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
                            {question}
                          </p>
                        </div>
                        <span style={{ 
                          fontSize: '1.25rem', 
                          color: '#94a3b8',
                          flexShrink: 0 
                        }}>
                          {copiedIndex === index ? '✓' : '📋'}
                        </span>
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

