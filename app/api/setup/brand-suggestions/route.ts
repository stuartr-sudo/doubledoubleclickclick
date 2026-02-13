import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'GEMINI_API_KEY not configured in .env.local' },
      { status: 500 }
    )
  }

  let body: {
    niche: string
    audience: string
    region: string
    monetization: string
    categoryLabel: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { niche, audience, region, monetization, categoryLabel } = body

  if (!niche) {
    return NextResponse.json({ success: false, error: 'niche is required' }, { status: 400 })
  }

  const prompt = `You are a brand naming expert. Generate 8 unique, creative brand name ideas for a new blog/content website.

Context:
- Niche: ${niche}
- Category: ${categoryLabel || 'General'}
- Target audience: ${audience || 'General consumer'}
- Region: ${region || 'Global English'}
- Monetization: ${monetization || 'Affiliate and ads'}

Requirements for each name:
- Short (1-3 words max)
- Memorable and brandable
- Works as a domain name (no spaces, special characters)
- Sounds professional and trustworthy
- Not generic — should feel like a real brand
- Mix of styles: some clever/punny, some authoritative, some modern/clean
- Do NOT use the words "blog", "site", or "web" in the name

Return ONLY a JSON array of objects. No markdown, no explanation, no code fences. Just the raw JSON array.
Each object: {"name": "Brand Name", "slug": "brandname", "reason": "One-sentence reason why this works"}

Example format:
[{"name": "Peak Perform", "slug": "peakperform", "reason": "Conveys aspiration and authority in fitness"},{"name": "Strength Daily", "slug": "strengthdaily", "reason": "Implies consistent, reliable content delivery"}]`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Parse the JSON from the response (handle possible markdown code fences)
    let cleaned = text
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    const suggestions = JSON.parse(cleaned)

    if (!Array.isArray(suggestions)) {
      throw new Error('Response is not an array')
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions.map((s: any) => ({
        name: String(s.name || '').trim(),
        slug: String(s.slug || s.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 30),
        reason: String(s.reason || '').trim(),
      })),
    })
  } catch (error: any) {
    console.error('Brand suggestion error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate brand suggestions' },
      { status: 500 }
    )
  }
}
