import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspect_ratio, num_images, enhance_prompt, folder } = await request.json()

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
      finalPrompt = await enhancePrompt(prompt)
    }

    // Call fal.ai Nano Banana endpoint with WebP format for optimization
    const response = await fetch('https://fal.run/fal-ai/nano-banana', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        num_images: num_images || 1,
        output_format: 'webp', // WebP for better compression and faster loading
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

    // Upload generated images to Supabase Storage for better performance and permanence
    const uploadedImages = await uploadImagesToSupabase(result.images || [], folder || 'ai-generated')

    // Return the optimized image URLs from Supabase
    return NextResponse.json({
      success: true,
      images: uploadedImages,
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

// Upload images to Supabase Storage for permanent hosting and better performance
async function uploadImagesToSupabase(
  images: Array<{ url: string }>,
  folder: string
): Promise<Array<{ url: string }>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase not configured, returning original URLs')
    return images
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const uploadedImages: Array<{ url: string }> = []

  for (const image of images) {
    try {
      // Fetch the image from fal.ai
      const imageResponse = await fetch(image.url)
      const imageBuffer = await imageResponse.arrayBuffer()
      const imageBlob = new Blob([imageBuffer], { type: 'image/webp' })

      // Generate a unique filename
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(7)
      const filename = `${folder}/${timestamp}-${random}.webp`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filename, imageBlob, {
          contentType: 'image/webp',
          cacheControl: '31536000', // Cache for 1 year (optimized for performance)
          upsert: false,
        })

      if (error) {
        console.error('Supabase upload error:', error)
        // Fall back to original URL if upload fails
        uploadedImages.push(image)
        continue
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(data.path)

      uploadedImages.push({ url: urlData.publicUrl })
    } catch (error) {
      console.error('Error uploading image to Supabase:', error)
      // Fall back to original URL
      uploadedImages.push(image)
    }
  }

  return uploadedImages
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

