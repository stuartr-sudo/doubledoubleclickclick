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
 * Creative prefixes/suffixes to generate varied domain queries.
 * Shuffled each call so re-runs produce different results.
 */
const PREFIXES = ['the', 'my', 'go', 'get', 'try', 'hey', 'all', 'one', 'pro', 'top', 'now', 'daily', 'pure', 'true', 'real']
const SUFFIXES = ['hub', 'lab', 'hq', 'zone', 'spot', 'nest', 'base', 'club', 'life', 'way', 'ally', 'now', 'daily', 'guide', 'co']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Generate search queries for the Cloud Domains searchDomains API.
 * Uses creative combinations and randomness so re-runs give different results.
 */
function generateQueries(niche?: string, brandName?: string): string[] {
  const all: string[] = []
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()

  const prefixes = shuffle(PREFIXES)
  const suffixes = shuffle(SUFFIXES)

  if (brandName) {
    const b = clean(brandName)
    all.push(b)
    // Creative: prefix + brand, brand + suffix
    all.push(`${prefixes[0]} ${b}`)
    all.push(`${b} ${suffixes[0]}`)
  }

  if (niche) {
    const n = clean(niche)
    const words = n.split(/\s+/).filter(w => w.length > 2)

    // Niche as-is
    all.push(n)

    // Pick a key word from the niche and combine creatively
    if (words.length > 0) {
      const key = words[Math.floor(Math.random() * words.length)]
      all.push(`${prefixes[1]} ${key}`)
      all.push(`${key} ${suffixes[1]}`)
      all.push(`${key} ${suffixes[2]}`)
    }

    // Two-word combos from niche
    if (words.length >= 2) {
      const i = Math.floor(Math.random() * (words.length - 1))
      all.push(`${words[i]} ${words[i + 1]}`)
    }
  }

  // Cross-combine brand + niche words
  if (brandName && niche) {
    const bWords = clean(brandName).split(/\s+/)
    const nWords = clean(niche).split(/\s+/).filter(w => w.length > 2)
    if (bWords.length > 0 && nWords.length > 0) {
      const b = bWords[Math.floor(Math.random() * bWords.length)]
      const n = nWords[Math.floor(Math.random() * nWords.length)]
      all.push(`${b} ${n}`)
      all.push(`${n} ${suffixes[3]}`)
    }
  }

  // Deduplicate, shuffle, and cap at 5 to avoid rate limits
  return shuffle([...new Set(all)]).slice(0, 5)
}
