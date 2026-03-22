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

