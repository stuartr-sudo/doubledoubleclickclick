import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force this route to always run dynamically (no static optimization)
export const dynamic = 'force-dynamic'

// Basic CORS support so the admin UI can call this API safely
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      aspect_ratio,
      num_images,
      enhance_prompt,
      folder,
      prompt_provider,
      prompt_model,
    } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        {
          status: 400,
          headers: corsHeaders(),
        }
      )
    }

    const FAL_KEY = process.env.FAL_KEY
    if (!FAL_KEY) {
      console.error('FAL_KEY not configured in environment variables')
      return NextResponse.json(
        { success: false, error: 'FAL_KEY not configured' },
        {
          status: 500,
          headers: corsHeaders(),
        }
      )
    }

    // Optionally enhance the prompt with an LLM before calling fal.ai
    let finalPrompt: string = prompt
    if (enhance_prompt) {
      try {
        if (prompt_provider) {
          finalPrompt = await enhanceWithProvider(prompt, prompt_provider, prompt_model)
        } else {
          finalPrompt = await enhancePrompt(prompt)
        }
      } catch (err) {
        console.error('Prompt enhancement error:', err)
        // Fall back to the original prompt if enhancement fails
        finalPrompt = prompt
      }
    }

    // Call fal.ai Nano Banana endpoint – this is where images are generated
    const response = await fetch('https://fal.run/fal-ai/nano-banana', {
      method: 'POST',
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        num_images: num_images || 1,
        output_format: 'webp', // optimized format for web
        aspect_ratio: aspect_ratio || '16:9',
        sync_mode: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('fal.ai error:', response.status, errorText)

      // Bubble up fal.ai status (e.g. 403) so the client can see the real error
      return NextResponse.json(
        { success: false, error: 'Image generation failed', details: errorText },
        {
          status: response.status,
          headers: corsHeaders(),
        }
      )
    }

    const result = (await response.json()) as { images?: Array<{ url: string }>; description?: string }

    // Upload generated images to Supabase Storage so they are cached & on your domain
    const uploadedImages = await uploadImagesToSupabase(result.images || [], folder || 'ai-generated')

    return NextResponse.json(
      {
        success: true,
        images: uploadedImages,
        description: result.description || '',
        enhanced_prompt: enhance_prompt ? finalPrompt : null,
      },
      {
        headers: corsHeaders(),
      }
    )
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: corsHeaders(),
      }
    )
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

// Enhance prompt using the selected LLM provider (OpenAI / Claude / Gemini)
async function enhanceWithProvider(prompt: string, provider: string, model?: string): Promise<string> {
  const system =
    'You are a helpful creative director. Improve the following image prompt with concrete visual details, lighting, composition, camera angle, and style. Keep it concise and suitable for an image model. Return ONLY the enhanced prompt.'

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY
    if (!apiKey) throw new Error('OpenAI API key not configured')

    const validModel = model || 'gpt-4o-mini'

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: validModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`OpenAI error (${resp.status}): ${text}`)
    }

    const data = await resp.json()
    return (data.choices?.[0]?.message?.content || prompt).trim()
  }

  if (provider === 'claude') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('Anthropic API key not configured')

    const validModel = model || 'claude-3-5-sonnet-20241022'

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: validModel,
        system,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Claude error (${resp.status}): ${text}`)
    }

    const data = await resp.json()
    return (data.content?.[0]?.text || prompt).trim()
  }

  if (provider === 'gemini') {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) throw new Error('Google AI API key not configured')

    const validModel = model || 'gemini-1.5-flash'

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${validModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\n${prompt}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
        }),
      }
    )

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Gemini error (${resp.status}): ${text}`)
    }

    const data = await resp.json()
    return (data.candidates?.[0]?.content?.parts?.[0]?.text || prompt).trim()
  }

  // Fallback – simple enhancement if provider is not recognised
  return enhancePrompt(prompt)
}

// Upload images from fal.ai to Supabase Storage for permanent hosting & caching
async function uploadImagesToSupabase(images: Array<{ url: string }>, folder: string): Promise<Array<{ url: string }>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase not configured, returning original image URLs')
    return images
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const uploadedImages: Array<{ url: string }> = []

  for (const image of images) {
    try {
      const imageResponse = await fetch(image.url)
      const imageBuffer = await imageResponse.arrayBuffer()
      const imageBlob = new Blob([imageBuffer], { type: 'image/webp' })

      const timestamp = Date.now()
      const random = Math.random().toString(36).slice(2)
      const filename = `${folder}/${timestamp}-${random}.webp`

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filename, imageBlob, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: false,
        })

      if (error) {
        console.error('Supabase upload error:', error)
        // Fall back to original URL if upload fails
        uploadedImages.push(image)
        continue
      }

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path)
      uploadedImages.push({ url: urlData.publicUrl })
    } catch (err) {
      console.error('Error uploading image to Supabase:', err)
      uploadedImages.push(image)
    }
  }

  return uploadedImages
}

// Simple prompt enhancement if no external provider is used
async function enhancePrompt(prompt: string): Promise<string> {
  const enhancements = [
    'professional photography',
    'high quality',
    'detailed',
    'sharp focus',
    'studio lighting',
    '8k resolution',
  ]

  const hasQualityDescriptor = enhancements.some((enhancement) =>
    prompt.toLowerCase().includes(enhancement.toLowerCase())
  )

  if (hasQualityDescriptor) {
    return prompt
  }

  return `${prompt}, professional photography, high quality, detailed, sharp focus, 8k resolution`
}


