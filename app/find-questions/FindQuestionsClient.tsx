'use client'

import { useEffect, useRef } from 'react'
import QuestionsDiscovery from '@/components/QuestionsDiscovery'

interface FindQuestionsClientProps {
  title: string
  description: string
  ctaText: string
  aiFacts: string[]
  heroCTABgColor: string
  heroCTATextColor: string
}

export default function FindQuestionsClient({
  title,
  description,
  ctaText,
  aiFacts,
  heroCTABgColor,
  heroCTATextColor,
}: FindQuestionsClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-center content when loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const el = containerRef.current
        const rect = el.getBoundingClientRect()
        const absoluteTop = rect.top + window.scrollY
        const targetScroll = absoluteTop + rect.height / 2 - window.innerHeight / 2

        window.scrollTo({
          top: Math.max(targetScroll, 0),
          behavior: 'smooth',
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="landing-page-wrapper">
      <div className="landing-page-hero">
        <h1 className="landing-page-title">{title}</h1>
        <p className="landing-page-description">{description}</p>
      </div>
      
      <div className="landing-page-content" ref={containerRef}>
        <QuestionsDiscovery
          title={title}
          description={description}
          ctaText={ctaText}
          aiFacts={aiFacts}
          buttonBgColor={heroCTABgColor}
          buttonTextColor={heroCTATextColor}
        />
      </div>
    </div>
  )
}

