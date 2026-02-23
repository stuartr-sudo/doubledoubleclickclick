// Simple in-memory cache for rate limiting (resets on server restart)
const submissionCache = new Map<string, number>()
const RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes
const LEGITIMATE_SOURCES = ['contact_form', 'contact-page']

export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return 'unknown'
}

export function isRateLimited(identifier: string, source?: string): boolean {
  const now = Date.now()
  const lastSubmission = submissionCache.get(identifier)

  const isLegitimateSource = source && LEGITIMATE_SOURCES.includes(source)
  const rateLimitWindow = isLegitimateSource ? RATE_LIMIT_WINDOW / 2 : RATE_LIMIT_WINDOW

  if (lastSubmission && (now - lastSubmission) < rateLimitWindow) {
    return true
  }

  return false
}

export function updateRateLimitCache(identifier: string, _source?: string): void {
  submissionCache.set(identifier, Date.now())
}
