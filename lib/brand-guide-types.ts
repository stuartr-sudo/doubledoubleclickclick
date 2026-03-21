// lib/brand-guide-types.ts

export interface ParsedProduct {
  name: string
  category: string
  commission: string
  recurring: boolean
  cookie_duration: string
  product_type: 'saas' | 'physical' | 'course'
}

export interface ParsedStyleGuide {
  primary_color: string
  accent_color: string
  heading_font: string
  body_font: string
  visual_mood: string
  imagery_style: string
  dark_light: 'dark' | 'light'
  prohibited_elements: string
  preferred_elements: string
}

export interface ParsedICAProfile {
  persona_name: string
  age_range: string
  income: string
  pain_points: string[]
  goals: string[]
  motivations: string[]
  buying_behavior: string
  search_behaviour: string[]
  content_voice: string
  email_hook: string
}

export interface ResearchContext {
  market_overview: string
  content_pillars: string[]
  keyword_themes: string[]
  primary_persona: {
    name: string
    description: string
    pain_points: string[]
    goals: string[]
  }
  buyer_journey: {
    awareness: string
    consideration: string
    decision: string
  }
  unique_angles: string[]
}

export interface ParsedSite {
  niche: string
  hub_or_sub: 'hub' | 'sub'
  placeholder_name: string
  brand_voice: string
  tagline: string
  tone: string
  visual_direction: string
  brand_personality: string
  style_guide: ParsedStyleGuide
  ica_profile: ParsedICAProfile
  affiliate_products: ParsedProduct[]
  content_types: string[]
  pod_name: string
  pod_theme: string
  research_context?: ResearchContext
}

export interface ParseJobStatus {
  status: 'parsing' | 'extracting' | 'synthesizing' | 'done' | 'error'
  result?: ParsedSite[]
  error?: string
}
