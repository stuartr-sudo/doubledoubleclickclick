import { NextRequest, NextResponse } from 'next/server'
import { promises as dns } from 'dns'

export const runtime = 'nodejs'
export const maxDuration = 30 // allow up to 30s for all lookups

/**
 * Smart domain search: takes a brand slug, generates many variations,
 * checks availability via DNS, filters by budget, and returns ONLY
 * available + affordable domains with estimated annual cost.
 */

/* ── Approximate annual retail pricing per TLD (USD) ─────── */
const tldPricing: Record<string, number> = {
  '.com': 12,
  '.co': 12,
  '.net': 13,
  '.org': 12,
  '.dev': 14,
  '.app': 14,
  '.me': 12,
  '.life': 8,
  '.io': 40,
  '.health': 60,
}

function getTldPrice(domain: string): number {
  for (const [tld, price] of Object.entries(tldPricing)) {
    if (domain.endsWith(tld)) return price
  }
  return 99 // unknown TLD = assume expensive
}

function sanitize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/** Generate smart domain variations from a base slug */
function generateVariations(base: string, maxPrice: number): string[] {
  // Only use TLDs within budget
  const affordableTlds = Object.entries(tldPricing)
    .filter(([, price]) => price <= maxPrice)
    .map(([tld]) => tld)

  // Split compound slug into parts for creative combos
  const splitPoints: string[] = []
  for (let i = 3; i < base.length - 2; i++) {
    const left = base.slice(0, i)
    const right = base.slice(i)
    if (left.length >= 3 && right.length >= 3) {
      splitPoints.push(`${left}-${right}`)
    }
  }

  const prefixes = ['get', 'the', 'my', 'go', 'try', 'use', 'hey']
  const suffixes = ['hq', 'app', 'hub', 'now', 'lab', 'daily', 'zone']

  const candidates = new Set<string>()

  // 1. Exact slug + all affordable TLDs
  for (const tld of affordableTlds) {
    candidates.add(`${base}${tld}`)
  }

  // 2. Hyphenated version (best split) + affordable TLDs
  if (splitPoints.length > 0) {
    const mid = Math.floor(splitPoints.length / 2)
    const picks = [
      splitPoints[mid],
      splitPoints[Math.max(0, mid - 1)],
      splitPoints[Math.min(splitPoints.length - 1, mid + 1)],
    ]
    for (const slug of new Set(picks)) {
      for (const tld of affordableTlds) {
        candidates.add(`${slug}${tld}`)
      }
    }
  }

  // 3. Prefix variations + affordable TLDs (top 3)
  const topTlds = affordableTlds.slice(0, 3)
  for (const prefix of prefixes) {
    for (const tld of topTlds) {
      candidates.add(`${prefix}${base}${tld}`)
      candidates.add(`${prefix}-${base}${tld}`)
    }
  }

  // 4. Suffix variations + affordable TLDs (top 3)
  for (const suffix of suffixes) {
    for (const tld of topTlds) {
      candidates.add(`${base}${suffix}${tld}`)
      candidates.add(`${base}-${suffix}${tld}`)
    }
  }

  return Array.from(candidates)
}

/** Check if a domain is likely available (no DNS records = possibly available) */
async function isLikelyAvailable(domain: string): Promise<boolean> {
  try {
    const checks = [
      dns.resolve4(domain).catch(() => null),
      dns.resolve6(domain).catch(() => null),
      dns.resolveMx(domain).catch(() => null),
      dns.resolveNs(domain).catch(() => null),
    ]
    const results = await Promise.all(checks)
    return results.every((r) => r === null || (Array.isArray(r) && r.length === 0))
  } catch {
    return true
  }
}

export async function GET(req: NextRequest) {
  const base = sanitize(req.nextUrl.searchParams.get('base') || '')
  if (!base) {
    return NextResponse.json({ success: false, error: 'Missing base parameter' }, { status: 400 })
  }

  const maxPrice = parseInt(req.nextUrl.searchParams.get('maxPrice') || '15', 10)

  const allCandidates = generateVariations(base, maxPrice)

  // Check all in parallel
  const checkResults = await Promise.all(
    allCandidates.map(async (domain) => {
      const available = await isLikelyAvailable(domain)
      return { domain, available }
    })
  )

  // Only return available + within budget, sorted by price then length
  const available = checkResults
    .filter((r) => r.available && getTldPrice(r.domain) <= maxPrice)
    .map((r) => ({
      domain: r.domain,
      estimatedAnnualCost: getTldPrice(r.domain),
    }))
    .sort((a, b) => {
      // Cheapest first
      if (a.estimatedAnnualCost !== b.estimatedAnnualCost) return a.estimatedAnnualCost - b.estimatedAnnualCost
      // Then shorter domains first
      return a.domain.length - b.domain.length
    })
    .slice(0, 15) // top 15

  return NextResponse.json({
    success: true,
    brandSlug: base,
    maxPrice,
    totalChecked: allCandidates.length,
    available,
  })
}
