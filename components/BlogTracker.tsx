'use client'

import { useEffect, useRef } from 'react'
import { trackBlogView, trackBlogReadProgress, trackBlogTimeSpent } from '@/lib/analytics'

interface BlogTrackerProps {
  slug: string
  title: string
  category?: string
}

export default function BlogTracker({ slug, title, category }: BlogTrackerProps) {
  const readProgressTracked = useRef({ 25: false, 50: false, 75: false, 100: false })
  const startTime = useRef<number>(Date.now())

  useEffect(() => {
    // Track initial blog view
    trackBlogView(slug, title, category)

    // Track scroll depth for read progress
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const scrollPercent = ((scrollTop + windowHeight) / documentHeight) * 100

      if (scrollPercent >= 25 && !readProgressTracked.current[25]) {
        readProgressTracked.current[25] = true
        trackBlogReadProgress(slug, 25)
      }
      if (scrollPercent >= 50 && !readProgressTracked.current[50]) {
        readProgressTracked.current[50] = true
        trackBlogReadProgress(slug, 50)
      }
      if (scrollPercent >= 75 && !readProgressTracked.current[75]) {
        readProgressTracked.current[75] = true
        trackBlogReadProgress(slug, 75)
      }
      if (scrollPercent >= 100 && !readProgressTracked.current[100]) {
        readProgressTracked.current[100] = true
        trackBlogReadProgress(slug, 100)
      }
    }

    // Track time spent on page
    const trackTimeOnPage = () => {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000)
      if (timeSpent > 10) { // Only track if user spent more than 10 seconds
        trackBlogTimeSpent(slug, timeSpent)
      }
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('beforeunload', trackTimeOnPage)
    
    // Also track time when component unmounts (for SPA navigation)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', trackTimeOnPage)
      trackTimeOnPage()
    }
  }, [slug, title, category])

  return null
}

