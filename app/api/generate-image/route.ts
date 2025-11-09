import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspect_ratio, num_images, enhance_prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const FAL_KEY = process.env.FAL_KEY
    if (!FAL_KEY) {
      return NextResponse.json(
        { success: false, error: 'FAL_KEY not configured' },
        { status: 500 }
      )
    }

    // Enhance prompt if requested
    let finalPrompt = prompt
    if (enhance_prompt) {
      // Call fal.ai prompt enhancement (or use a simple enhancement)
      finalPrompt = await enhancePrompt(prompt)
    }

    // Call fal.ai Nano Banana endpoint
    const response = await fetch('https://fal.run/fal-ai/nano-banana', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        num_images: num_images || 1,
        output_format: 'jpeg',
        aspect_ratio: aspect_ratio || '16:9',
        sync_mode: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('fal.ai error:', errorText)
      return NextResponse.json(
        { success: false, error: 'Image generation failed', details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()

    // Return the generated image URLs
    return NextResponse.json({
      success: true,
      images: result.images || [],
      description: result.description || '',
      enhanced_prompt: enhance_prompt ? finalPrompt : null,
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}

// Simple prompt enhancement function
async function enhancePrompt(prompt: string): Promise<string> {
  // Add professional photography/design keywords to enhance the prompt
  const enhancements = [
    'professional photography',
    'high quality',
    'detailed',
    'sharp focus',
    'studio lighting',
    '8k resolution',
    'photorealistic',
  ]

  // Check if prompt already has quality descriptors
  const hasQualityDescriptor = enhancements.some(enhancement =>
    prompt.toLowerCase().includes(enhancement.toLowerCase())
  )

  if (hasQualityDescriptor) {
    return prompt
  }

  // Add quality descriptors
  return `${prompt}, professional photography, high quality, detailed, sharp focus, 8k resolution`
}

