'use client'

import { useRef, useState } from 'react'

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

  const openQuiz = () => {
    setShowQuiz(true)
    setTimeout(() => {
      if (quizRef.current) {
        quizRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

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
          data-sa-url="https://6737d373-c306-49a0-8469-66b624092e6f.scoreapp.com/questions?sa_target=_top"
          data-sa-view="inline"
          data-sa-auto-height="1"
          style={{
            maxWidth: '100%',
            width: '100%',
            background: 'transparent',
            marginTop: '24px',
            display: showQuiz ? 'block' : 'none'
          }}
        ></div>
      </div>
    </section>
  )
}

