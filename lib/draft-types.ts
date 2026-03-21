export interface SiteConceptPayload {
  type: "single" | "network"
  network_name?: string
  sites: SiteConcept[]
  contact_email: string
  contact_name?: string
  notes?: string
}

export interface SiteConcept {
  role: "main" | "hub" | "sub"
  niche: string
  placeholder_name?: string
  brand_voice: string
  tone?: string
  tagline?: string
  ica_profile?: ICAProfile
  style_guide?: StyleGuide
  affiliate_products?: AffiliateProduct[]
  content_types?: string[]
  seed_keywords?: string[]
  articles_per_day?: number
  languages?: string[]
  author_name?: string
  author_bio?: string
}

export interface ICAProfile {
  persona_name?: string
  age_range?: string
  income?: string
  pain_points?: string[]
  goals?: string[]
  motivations?: string[]
  buying_behavior?: string
  search_behaviour?: string[]
}

export interface StyleGuide {
  primary_color?: string
  accent_color?: string
  heading_font?: string
  body_font?: string
  visual_mood?: string
  imagery_style?: string
  dark_light?: "dark" | "light"
}

export interface AffiliateProduct {
  name: string
  category?: string
  commission?: string
  product_type?: "saas" | "physical" | "course"
  url?: string
}

export interface DraftRecord {
  id: string
  client_api_key_id: string
  client_name: string
  contact_email: string
  contact_name: string | null
  type: "single" | "network"
  network_name: string | null
  sites: SiteConcept[]
  notes: string | null
  status: "pending" | "reviewed" | "provisioning" | "provisioned" | "rejected"
  admin_notes: string | null
  domain_selections: DomainSelection[] | null
  provision_results: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface DomainSelection {
  site_index: number
  domain: string
  username: string
  purchase_domain?: boolean
  domain_yearly_price?: Record<string, unknown>
}

export interface ClientApiKey {
  id: string
  client_name: string
  contact_email: string
  key_prefix: string
  created_at: string
  revoked_at: string | null
}
