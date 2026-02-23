import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/domain-suggestions
 *
 * Searches for available domain names using the Google Cloud Domains API.
 * Generates search queries from the niche and brand name, then filters
 * results to available domains under $15/year.
 *
 * Uses service account auth (GOOGLE_SERVICE_ACCOUNT_JSON) for the Cloud Domains API.
 */

let cachedAuth: GoogleAuth | null = null

function getAccessToken(): Promise<string> {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured')

  if (!cachedAuth) {
    cachedAuth = new GoogleAuth({
      credentials: JSON.parse(keyJson),
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
  }

  return cachedAuth.getClient()
    .then(c => c.getAccessToken())
    .then(t => {
      if (!t.token) throw new Error('Failed to get access token')
      return t.token
    })
}

export async function POST(req: NextRequest) {
  try {
    const { niche, brand_name } = await req.json()
    const project = process.env.GOOGLE_CLOUD_PROJECT

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured.' },
        { status: 500 }
      )
    }

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'GOOGLE_CLOUD_PROJECT not configured.' },
        { status: 500 }
      )
    }

    if (!niche && !brand_name) {
      return NextResponse.json(
        { success: false, error: 'At least one of niche or brand_name is required' },
        { status: 400 }
      )
    }

    const token = await getAccessToken()
    const location = `projects/${project}/locations/global`

    // Generate diverse search queries from niche + brand name
    const queries = generateQueries(niche, brand_name)

    const allSuggestions: DomainSuggestion[] = []
    const seen = new Set<string>()
    const errors: string[] = []

    for (const query of queries) {
      try {
        const url = `https://domains.googleapis.com/v1/${location}/registrations:searchDomains?query=${encodeURIComponent(query)}`
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: { message: res.statusText } }))
          const msg = errBody?.error?.message || `HTTP ${res.status}`

          // Fatal project/auth errors — return immediately
          if (res.status === 403 || res.status === 401) {
            return NextResponse.json({
              success: false,
              error: `Google Cloud Domains API auth error: ${msg}`,
            }, { status: 502 })
          }
          if (res.status === 404) {
            return NextResponse.json({
              success: false,
              error: `Google Cloud Domains API project error: ${msg}. Check GOOGLE_CLOUD_PROJECT.`,
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
                  yearlyPrice: param.yearlyPrice,
                  domainNotices: param.domainNotices,
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
  yearlyPrice: { currencyCode: string; units: string; nanos?: number }
  domainNotices?: string[]
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
