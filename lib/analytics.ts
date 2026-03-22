// Google Analytics event tracking utilities

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}

// Generic event tracking (internal helper)
const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

// Form submissions
export const trackFormSubmission = (
  formType: 'contact' | 'agencies' | 'enterprise' | 'beta' | 'subscribe' | 'questions_discovery' | 'consulting',
  success: boolean | string,
  metadata?: Record<string, any>
) => {
  trackEvent('form_submission', {
    form_type: formType,
    submission_status: typeof success === 'boolean' ? (success ? 'success' : 'error') : success,
    engagement_type: 'high_intent',
    ...metadata,
  })
}

export const trackFormStart = (
  formType: 'contact' | 'agencies' | 'enterprise' | 'beta' | 'subscribe' | 'questions_discovery' | 'consulting'
) => {
  trackEvent('form_start', {
    form_type: formType,
  })
}

// Blog engagement
export const trackBlogView = (slug: string, title: string, category?: string) => {
  trackEvent('blog_view', {
    article_slug: slug,
    article_title: title,
    article_category: category || 'general',
    content_type: 'blog',
  })
}

export const trackBlogReadProgress = (
  slug: string,
  percentage: 25 | 50 | 75 | 100
) => {
  trackEvent('blog_read_progress', {
    article_slug: slug,
    read_percentage: percentage,
    engagement_type: 'content_consumption',
  })
}

export const trackBlogTimeSpent = (slug: string, seconds: number) => {
  trackEvent('blog_time_spent', {
    article_slug: slug,
    time_seconds: seconds,
    engagement_type: 'content_consumption',
  })
}
