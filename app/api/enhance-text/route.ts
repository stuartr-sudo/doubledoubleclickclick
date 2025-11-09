import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, field_type, provider, model, custom_instructions } = await request.json()

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    // Get the appropriate API key based on provider
    let apiKey: string | undefined
    let enhancedText: string

    switch (provider) {
      case 'openai':
        apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'OpenAI API key not configured' },
            { status: 500 }
          )
        }
        enhancedText = await enhanceWithOpenAI(text, field_type, model, custom_instructions, apiKey)
        break

      case 'claude':
        apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'Anthropic API key not configured' },
            { status: 500 }
          )
        }
        enhancedText = await enhanceWithClaude(text, field_type, model, custom_instructions, apiKey)
        break

      case 'gemini':
        apiKey = process.env.GOOGLE_AI_API_KEY
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'Google AI API key not configured' },
            { status: 500 }
          )
        }
        enhancedText = await enhanceWithGemini(text, field_type, model, custom_instructions, apiKey)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid provider' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      enhanced_text: enhancedText,
      provider,
      model,
    })
  } catch (error) {
    console.error('Error enhancing text:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to enhance text' },
      { status: 500 }
    )
  }
}

// OpenAI (ChatGPT) enhancement
async function enhanceWithOpenAI(
  text: string,
  fieldType: string,
  model: string,
  customInstructions: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = getSystemPrompt(fieldType, customInstructions)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

// Claude (Anthropic) enhancement
async function enhanceWithClaude(
  text: string,
  fieldType: string,
  model: string,
  customInstructions: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = getSystemPrompt(fieldType, customInstructions)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: text },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const data = await response.json()
  return data.content[0].text.trim()
}

// Gemini (Google AI) enhancement
async function enhanceWithGemini(
  text: string,
  fieldType: string,
  model: string,
  customInstructions: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = getSystemPrompt(fieldType, customInstructions)
  const fullPrompt = `${systemPrompt}\n\nOriginal text:\n${text}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: fullPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${error}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text.trim()
}

// Generate system prompt based on field type
function getSystemPrompt(fieldType: string, customInstructions?: string): string {
  const basePrompts: Record<string, string> = {
    hero_title: 'You are a professional copywriter. Rewrite the following hero headline to be more compelling, benefit-driven, and action-oriented. Keep it under 10 words. Focus on the outcome and value proposition. Return ONLY the enhanced text, no explanations.',
    hero_description: 'You are a professional copywriter. Rewrite the following hero description to be clear, concise, and persuasive. Keep it under 25 words. Focus on the main benefit and unique value. Return ONLY the enhanced text, no explanations.',
    about_title: 'You are a professional copywriter. Rewrite the following section title to be engaging and professional. Keep it short (1-3 words). Return ONLY the enhanced text, no explanations.',
    about_description: 'You are a professional copywriter. Rewrite the following about section to be clear, professional, and compelling. Keep it under 50 words. Focus on credibility and value. Return ONLY the enhanced text, no explanations.',
    service_title: 'You are a professional copywriter. Rewrite the following service/feature title to be clear and benefit-focused. Keep it under 8 words. Return ONLY the enhanced text, no explanations.',
    service_description: 'You are a professional copywriter. Rewrite the following service/feature description to be clear and persuasive. Keep it under 30 words. Focus on the benefit. Return ONLY the enhanced text, no explanations.',
    cta_text: 'You are a professional copywriter. Rewrite the following CTA button text to be action-oriented and compelling. Keep it 2-4 words. Return ONLY the enhanced text, no explanations.',
    program_title: 'You are a professional copywriter. Rewrite the following program/product title to be compelling and clear. Keep it under 10 words. Return ONLY the enhanced text, no explanations.',
    program_description: 'You are a professional copywriter. Rewrite the following program/product description to be persuasive and benefit-focused. Keep it under 35 words. Return ONLY the enhanced text, no explanations.',
    outcome_title: 'You are a professional copywriter. Rewrite the following outcome title to be clear and impactful. Keep it under 8 words. Return ONLY the enhanced text, no explanations.',
    outcome_description: 'You are a professional copywriter. Rewrite the following outcome description to be concise and compelling. Keep it under 25 words. Return ONLY the enhanced text, no explanations.',
    pricing_description: 'You are a professional copywriter. Rewrite the following pricing tier description to be clear and value-focused. Keep it under 20 words. Return ONLY the enhanced text, no explanations.',
    default: 'You are a professional copywriter. Rewrite the following text to be clear, professional, and compelling. Maintain the general length and tone. Return ONLY the enhanced text, no explanations.',
  }

  const systemPrompt = basePrompts[fieldType] || basePrompts.default

  if (customInstructions) {
    return `${systemPrompt}\n\nAdditional instructions: ${customInstructions}`
  }

  return systemPrompt
}

