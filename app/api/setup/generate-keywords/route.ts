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
    productName: string
    productUrl: string
    niche: string
    nicheDescription: string
    audience: string
    region: string
    monetization: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { productName, productUrl, niche, nicheDescription, audience, region, monetization } = body

  if (!niche) {
    return NextResponse.json({ success: false, error: 'niche is required' }, { status: 400 })
  }

  const productContext = productUrl
    ? `\nProduct: ${productName || 'Unknown'}\nProduct URL: ${productUrl}\nAnalyse this product page and understand what it sells, who it targets, and what problems it solves. Generate keywords that someone would search before buying this product or learning about this topic.`
    : `\nProduct: ${productName || 'General content site'}\nNo specific product URL provided — generate keywords based on the niche and target audience.`

  const prompt = `You are an SEO keyword research expert. Generate seed keywords for a content strategy around a specific product in a specific niche.

Niche: ${niche}
Niche context: ${nicheDescription || ''}
Target audience: ${audience || 'General consumer'}
Region: ${region || 'Global English'}
Monetization: ${monetization || 'Affiliate and ads'}
${productContext}

Requirements:
- Generate exactly 12 seed keywords
- Mix of informational, commercial, and transactional intent
- Include long-tail keywords (3-5 words) that real people search
- Include comparison and "best" keywords if the product has competitors
- Include problem-aware keywords (what pain does this product solve?)
- Include solution-aware keywords (what does someone search right before buying?)
- Do NOT include the brand name in keywords
- Keywords should be specific enough to rank for, not ultra-competitive head terms

Return ONLY a JSON object (no markdown, no code fences):
{
  "seed_keywords": ["keyword1", "keyword2", ..., "keyword12"],
  "keyword_reasoning": "One sentence explaining the keyword strategy"
}`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent(prompt)
    let cleaned = result.response.text().trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      success: true,
      seed_keywords: Array.isArray(parsed.seed_keywords)
        ? parsed.seed_keywords.map((k: any) => String(k).trim()).filter(Boolean)
        : [],
      keyword_reasoning: String(parsed.keyword_reasoning || '').trim(),
    })
  } catch (error: any) {
    console.error('Keyword generation error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate keywords' },
      { status: 500 }
    )
  }
}
