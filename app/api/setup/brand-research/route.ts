import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'GEMINI_API_KEY not configured' },
      { status: 500 }
    )
  }

  let body: {
    brandName: string
    niche: string
    nicheDescription: string
    audience: string
    region: string
    monetization: string
    categoryLabel: string
    domain: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { brandName, niche, nicheDescription, audience, region, monetization, categoryLabel, domain } = body

  if (!brandName || !niche) {
    return NextResponse.json({ success: false, error: 'brandName and niche are required' }, { status: 400 })
  }

  const prompt = `You are a brand strategist and market researcher. Research and create a detailed brand profile for a new content website.

Brand: ${brandName}
Domain: ${domain || 'TBD'}
Niche: ${niche}
Category: ${categoryLabel || 'General'}
Niche context: ${nicheDescription || ''}
Target audience type: ${audience || 'General consumer'}
Primary region: ${region || 'Global English'}
Monetization model: ${monetization || 'Affiliate and ads'}

Based on your knowledge of this niche and market, produce the following. Be specific, detailed, and actionable — NOT generic filler text. Reference real trends, audience pain points, and content opportunities in this niche.

Return ONLY a JSON object (no markdown, no code fences). The object must have these exact keys:

{
  "brand_voice": "A concise tone directive for the LLM, e.g. 'First-person, conversational, technically sharp but accessible'. Keep it under 15 words.",
  "target_market_description": "A 1-2 sentence description of exactly who reads this site. Include age range, interests, and what they search for.",
  "brand_blurb": "A 1-2 sentence brand description for the About page. Position the brand clearly and state the unique value prop.",
  "seed_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "competitor_domains": ["competitor1.com", "competitor2.com", "competitor3.com"],
  "default_author_name": "Brand Name + Editorial Team or a fitting pen name",
  "author_bio": "A 1-2 sentence bio for the editorial team/author. Reference the niche expertise and what the team reviews or writes about.",
  "niche_group": "A short product category label, e.g. 'NMN Supplements', 'AI Writing Tools', 'Keto Meal Kits'. 2-4 words max."
}`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    let cleaned = text
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    const research = JSON.parse(cleaned)

    return NextResponse.json({
      success: true,
      research: {
        brand_voice: String(research.brand_voice || '').trim(),
        target_market_description: String(research.target_market_description || '').trim(),
        brand_blurb: String(research.brand_blurb || '').trim(),
        seed_keywords: Array.isArray(research.seed_keywords)
          ? research.seed_keywords.map((k: any) => String(k).trim()).filter(Boolean)
          : [],
        competitor_domains: Array.isArray(research.competitor_domains)
          ? research.competitor_domains.map((d: any) => String(d).trim()).filter(Boolean)
          : [],
        default_author_name: String(research.default_author_name || brandName).trim(),
        author_bio: String(research.author_bio || '').trim(),
        niche_group: String(research.niche_group || '').trim(),
      },
    })
  } catch (error: any) {
    console.error('Brand research error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate brand research' },
      { status: 500 }
    )
  }
}
