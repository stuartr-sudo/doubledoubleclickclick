import { SiteConceptPayload, DraftRecord, SiteConcept } from './draft-types'

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateDraftPayload(payload: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const data = payload as SiteConceptPayload

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Payload must be a JSON object'] }
  }

  if (!data.type || !['single', 'network'].includes(data.type)) {
    errors.push('type is required and must be "single" or "network"')
  }

  if (!data.contact_email || !EMAIL_REGEX.test(data.contact_email)) {
    errors.push('contact_email is required and must be a valid email')
  }

  if (!Array.isArray(data.sites) || data.sites.length === 0) {
    errors.push('sites must be a non-empty array')
  } else {
    data.sites.forEach((site, i) => {
      if (!site.niche || typeof site.niche !== 'string' || site.niche.trim() === '') {
        errors.push(`sites[${i}].niche is required`)
      }
      if (!site.brand_voice || typeof site.brand_voice !== 'string' || site.brand_voice.trim() === '') {
        errors.push(`sites[${i}].brand_voice is required`)
      }
      if (!site.role || !['main', 'hub', 'sub'].includes(site.role)) {
        errors.push(`sites[${i}].role must be "main", "hub", or "sub"`)
      }
      if (site.style_guide?.primary_color && !HEX_COLOR_REGEX.test(site.style_guide.primary_color)) {
        errors.push(`sites[${i}].style_guide.primary_color must be a valid hex color`)
      }
      if (site.style_guide?.accent_color && !HEX_COLOR_REGEX.test(site.style_guide.accent_color)) {
        errors.push(`sites[${i}].style_guide.accent_color must be a valid hex color`)
      }
    })

    if (data.type === 'single') {
      if (data.sites.length !== 1) errors.push('Single site type must have exactly 1 site')
      else if (data.sites[0]?.role !== 'main') errors.push('Single site must have role "main"')
    }

    if (data.type === 'network') {
      const hubs = data.sites.filter(s => s.role === 'hub')
      const subs = data.sites.filter(s => s.role === 'sub')
      if (hubs.length !== 1) errors.push('Network must have exactly 1 hub site')
      if (subs.length < 1) errors.push('Network must have at least 1 sub site')
    }
  }

  return { valid: errors.length === 0, errors }
}

export function mapDraftToProvisionPayload(draft: DraftRecord) {
  if (draft.type === 'single') {
    return mapSingleSite(draft.sites[0], draft.domain_selections?.[0], draft.contact_email)
  } else {
    return mapNetwork(draft)
  }
}

function mapSingleSite(
  site: SiteConcept,
  domain?: DraftRecord['domain_selections'] extends (infer T)[] | null ? T : never,
  contactEmail?: string
) {
  return {
    username: domain?.username || slugify(site.niche),
    display_name: site.placeholder_name || site.niche,
    niche: site.niche,
    brand_voice: site.brand_voice,
    tone: site.tone,
    target_market: site.ica_profile ? formatICA(site.ica_profile) : '',
    primary_color: site.style_guide?.primary_color || '#1a1a1a',
    accent_color: site.style_guide?.accent_color || '#8b7355',
    heading_font: site.style_guide?.heading_font,
    body_font: site.style_guide?.body_font,
    author_name: site.author_name || 'Editorial Team',
    author_bio: site.author_bio || '',
    contact_email: contactEmail || '',
    domain: domain?.domain,
    purchase_domain: domain?.purchase_domain || false,
    domain_yearly_price: domain?.domain_yearly_price,
    seed_keywords: site.seed_keywords || [],
    approved_products: (site.affiliate_products || []).map(p => ({
      name: p.name,
      category: p.category,
      product_url: p.url,
      product_type: p.product_type,
    })),
    content_types: site.content_types,
    articles_per_day: site.articles_per_day || 3,
    languages: site.languages || [],
  }
}

function mapNetwork(draft: DraftRecord) {
  const members = draft.sites.map((site, i) => {
    const domainSel = draft.domain_selections?.find(d => d.site_index === i)
    return {
      ...mapSingleSite(site, domainSel, draft.contact_email),
      role: site.role === 'hub' ? 'seed' : 'satellite',
    }
  })

  return {
    network_name: draft.network_name || 'Site Network',
    members,
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatICA(ica: NonNullable<SiteConcept['ica_profile']>): string {
  const parts = []
  if (ica.persona_name) parts.push(ica.persona_name)
  if (ica.age_range) parts.push(`Age: ${ica.age_range}`)
  if (ica.pain_points?.length) parts.push(`Pain points: ${ica.pain_points.join(', ')}`)
  if (ica.goals?.length) parts.push(`Goals: ${ica.goals.join(', ')}`)
  return parts.join('. ')
}
