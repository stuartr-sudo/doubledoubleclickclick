'use client'

import { useRef, useState, useEffect, useId } from 'react'

// Blog Quiz CTA Component - Matches homepage design
interface BlogQuizCTAProps {
  quizCtaBgColor?: string
  quizDescription?: string
  quizCTAText?: string
  heroCTABgColor?: string
  heroCTATextColor?: string
  quizCTABorderColor?: string
}

export default function BlogQuizCTA({
  quizCtaBgColor = '#f8f9fa',
  quizDescription = 'Discover how visible your brand is to AI assistants like ChatGPT, Claude, and Gemini in just 3 minutes.',
  quizCTAText = 'Start Quiz →',
  heroCTABgColor = '#000000',
  heroCTATextColor = '#ffffff',
  quizCTABorderColor = '#000000',
}: BlogQuizCTAProps) {
  const [showQuiz, setShowQuiz] = useState(false)
  const quizRef = useRef<HTMLDivElement>(null)
  const uniqueId = useId()

  const openQuiz = () => {
    setShowQuiz(true)
    setTimeout(() => {
      if (quizRef.current) {
        quizRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      // Trigger ScoreApp to initialize the quiz
      if (typeof window !== 'undefined' && (window as any).ScoreApp) {
        try {
          (window as any).ScoreApp.init()
        } catch (e) {
          console.log('ScoreApp init called')
        }
      }
    }, 200)
  }

  // Initialize ScoreApp when quiz becomes visible
  useEffect(() => {
    if (showQuiz) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).ScoreApp) {
          try {
            (window as any).ScoreApp.init()
          } catch (e) {
            console.log('ScoreApp init on show')
          }
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [showQuiz])

  // Initialize ScoreApp when component mounts
  useEffect(() => {
    const checkScoreApp = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).ScoreApp) {
        try {
          (window as any).ScoreApp.init()
        } catch (e) {
          // Silent catch
        }
        clearInterval(checkScoreApp)
      }
    }, 500)

    return () => clearInterval(checkScoreApp)
  }, [])

  return (
    <section className="quiz-cta-section" style={{ background: quizCtaBgColor }}>
      <div className="quiz-cta-container">
        <h2 className="quiz-cta-title">Take the Quiz</h2>
        <p className="quiz-cta-subtitle">{quizDescription}</p>
        <button
          type="button"
          className="quiz-cta-button"
          onClick={openQuiz}
          style={{
            backgroundColor: heroCTABgColor,
            color: heroCTATextColor,
            borderColor: quizCTABorderColor,
            cursor: 'pointer'
          }}
        >
          {quizCTAText}
        </button>
        <div
          className="quiz-inline-container"
          ref={quizRef}
          style={{
            maxWidth: '100%',
            width: '100%',
            background: 'transparent',
            marginTop: '24px',
            display: showQuiz ? 'block' : 'none'
          }}
        >
          {showQuiz && (
            <iframe
              src="https://6737d373-c306-49a0-8469-66b624092e6f.scoreapp.com/questions?sa_target=_top"
              style={{ width: '100%', border: '0', minHeight: '900px', background: 'transparent' }}
              loading="lazy"
            />
          )}
        </div>
      </div>
    </section>
  )
}

