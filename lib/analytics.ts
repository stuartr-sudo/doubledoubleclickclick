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

// Generic event tracking
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

// Quiz interactions
export const trackQuizStart = (location: 'hero' | 'mid' | 'bottom') => {
  trackEvent('quiz_start', {
    quiz_location: location,
    engagement_type: 'high_intent',
  })
}

export const trackQuizView = (location: 'hero' | 'mid' | 'bottom') => {
  trackEvent('quiz_view', {
    quiz_location: location,
  })
}

// Form submissions
export const trackFormSubmission = (
  formType: 'contact' | 'agencies' | 'enterprise' | 'beta' | 'subscribe',
  success: boolean
) => {
  trackEvent('form_submission', {
    form_type: formType,
    submission_status: success ? 'success' : 'error',
    engagement_type: 'high_intent',
  })
}

export const trackFormStart = (
  formType: 'contact' | 'agencies' | 'enterprise' | 'beta' | 'subscribe'
) => {
  trackEvent('form_start', {
    form_type: formType,
  })
}

// Page views with context
export const trackServicePageView = (
  service: 'agencies' | 'enterprise' | 'beta' | 'course' | 'guide'
) => {
  trackEvent('service_page_view', {
    service_type: service,
    page_category: 'services',
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

// CTA clicks
export const trackCTAClick = (
  ctaText: string,
  ctaLocation: string,
  ctaType: 'primary' | 'secondary' | 'link'
) => {
  trackEvent('cta_click', {
    cta_text: ctaText,
    cta_location: ctaLocation,
    cta_type: ctaType,
    engagement_type: 'high_intent',
  })
}

// Navigation
export const trackNavClick = (destination: string, menuType: 'header' | 'mobile' | 'footer') => {
  trackEvent('navigation_click', {
    destination,
    menu_type: menuType,
  })
}

// External links
export const trackExternalLink = (url: string, linkText: string) => {
  trackEvent('external_link_click', {
    destination_url: url,
    link_text: linkText,
  })
}

// Scroll depth (for landing pages)
export const trackScrollDepth = (
  percentage: 25 | 50 | 75 | 100,
  page: string
) => {
  trackEvent('scroll_depth', {
    scroll_percentage: percentage,
    page_path: page,
  })
}

// Lead capture
export const trackLeadCapture = (
  source: string,
  leadType: 'email' | 'full_form'
) => {
  trackEvent('lead_capture', {
    lead_source: source,
    lead_type: leadType,
    engagement_type: 'conversion',
  })
}

// Wizard/Multi-step form progress
export const trackWizardStep = (
  formType: string,
  step: number,
  totalSteps: number
) => {
  trackEvent('wizard_step_progress', {
    form_type: formType,
    current_step: step,
    total_steps: totalSteps,
    progress_percentage: Math.round((step / totalSteps) * 100),
  })
}

