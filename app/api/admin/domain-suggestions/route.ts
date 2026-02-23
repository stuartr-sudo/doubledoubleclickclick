import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/domain-suggestions
 *
 * Searches for available domain names using the Google Cloud Domains API.
 * Generates search queries from the niche and brand name, then filters
 * results to available domains under $15/year.
 *
 * Requires env vars:
 *   GOOGLE_DOMAINS_API_KEY — Google Cloud API key with Cloud Domains enabled
 *   GOOGLE_CLOUD_PROJECT  — GCP project ID (required for Cloud Domains API path)
 */
export async function POST(req: NextRequest) {
  try {
    const { niche, brand_name } = await req.json()
    const apiKey = process.env.GOOGLE_DOMAINS_API_KEY
    const project = process.env.GOOGLE_CLOUD_PROJECT

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_DOMAINS_API_KEY not configured. Add it to your environment variables.' },
        { status: 500 }
      )
    }

    if (!niche && !brand_name) {
      return NextResponse.json(
        { success: false, error: 'At least one of niche or brand_name is required' },
        { status: 400 }
      )
    }

    // Cloud Domains API requires a project path
    const location = project
      ? `projects/${project}/locations/global`
      : 'projects/-/locations/global'

    // Generate diverse search queries from niche + brand name
    const queries = generateQueries(niche, brand_name)

    const allSuggestions: DomainSuggestion[] = []
    const seen = new Set<string>()
    const errors: string[] = []

    for (const query of queries) {
      try {
        const url = `https://domains.googleapis.com/v1/${location}/registrations:searchDomains?query=${encodeURIComponent(query)}&key=${apiKey}`
        const res = await fetch(url)

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: { message: res.statusText } }))
          const msg = errBody?.error?.message || `HTTP ${res.status}`

          // Fatal project/auth errors — return immediately
          if (res.status === 403 || res.status === 401) {
            return NextResponse.json({
              success: false,
              error: `Google Cloud Domains API auth error: ${msg}. Check GOOGLE_DOMAINS_API_KEY and ensure Cloud Domains API is enabled.`,
            }, { status: 502 })
          }
          if (res.status === 404) {
            return NextResponse.json({
              success: false,
              error: `Google Cloud Domains API project error: ${msg}. Set GOOGLE_CLOUD_PROJECT env var to your GCP project ID.`,
            }, { status: 502 })
          }

          errors.push(`Query "${query}": ${msg}`)
          continue
        }

        const data = await res.json()

        if (data.registerParameters) {
          for (const param of data.registerParameters) {
            if (param.availability === 'AVAILABLE' && !seen.has(param.domainName)) {
              const units = parseInt(param.yearlyPrice?.units || '0', 10)
              const nanos = param.yearlyPrice?.nanos || 0
              const price = units + nanos / 1_000_000_000

              if (price <= 15) {
                seen.add(param.domainName)
                allSuggestions.push({
                  domain: param.domainName,
                  available: true,
                  price,
                  currency: param.yearlyPrice?.currencyCode || 'USD',
                })
              }
            }
          }
        }
      } catch (err) {
        errors.push(`Query "${query}": ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // Sort by price ascending
    allSuggestions.sort((a, b) => a.price - b.price)

    return NextResponse.json({
      success: true,
      suggestions: allSuggestions.slice(0, 20),
      queries_tried: queries.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

interface DomainSuggestion {
  domain: string
  available: boolean
  price: number
  currency: string
}

/**
 * Generate search queries for the Cloud Domains searchDomains API.
 * The API takes a natural-language query and returns domain suggestions.
 */
function generateQueries(niche?: string, brandName?: string): string[] {
  const queries: string[] = []
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()

  // Brand name is the strongest signal
  if (brandName) {
    queries.push(clean(brandName))
  }

  // Niche as a search query
  if (niche) {
    queries.push(clean(niche))

    // Try shorter combinations for more .com options
    const words = clean(niche).split(/\s+/).filter(w => w.length > 2)
    if (words.length >= 2) {
      queries.push(words.slice(0, 2).join(' '))
    }
    if (words.length >= 3) {
      queries.push(`${words[0]} ${words[2]}`)
    }
  }

  // Combined brand + niche
  if (brandName && niche) {
    const bWords = clean(brandName).split(/\s+/)
    const nWords = clean(niche).split(/\s+/).filter(w => w.length > 2)
    if (bWords.length > 0 && nWords.length > 0) {
      queries.push(`${bWords[0]} ${nWords[0]}`)
    }
  }

  // Deduplicate and cap at 5 to avoid rate limits
  return [...new Set(queries)].slice(0, 5)
}
