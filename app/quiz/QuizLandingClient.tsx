'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'

interface QuizLandingClientProps {
  title: string
  description: string
  heroCTABgColor: string
  heroCTATextColor: string
}

export default function QuizLandingClient({
  title,
  description,
  heroCTABgColor,
  heroCTATextColor,
}: QuizLandingClientProps) {
  const quizContainerRef = useRef<HTMLDivElement>(null)

  // Auto-center quiz when loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      if (quizContainerRef.current) {
        const el = quizContainerRef.current
        const rect = el.getBoundingClientRect()
        const absoluteTop = rect.top + window.scrollY
        const targetScroll = absoluteTop + rect.height / 2 - window.innerHeight / 2

        window.scrollTo({
          top: Math.max(targetScroll, 0),
          behavior: 'smooth',
        })
      }
    }, 500) // Delay to ensure ScoreApp script has loaded

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="landing-page-wrapper">
      <div className="landing-page-hero">
        <h1 className="landing-page-title">{title}</h1>
        <p className="landing-page-description">{description}</p>
      </div>
      
      <div className="landing-page-content" ref={quizContainerRef}>
        <div 
          className="quiz-embed-container"
          data-sa-url="https://6737d373-c306-49a0-8469-66b624092e6f.scoreapp.com/questions?sa_target=_top" 
          data-sa-view="inline" 
          style={{ maxWidth: '100%', width: '100%', background: 'transparent' }} 
          data-sa-auto-height="1"
        ></div>
      </div>

      <Script
        src="https://cdn.scoreapp.com/scoreapp.js"
        strategy="lazyOnload"
      />
    </div>
  )
}

