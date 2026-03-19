/**
 * Hero banner image generation via fal.ai.
 * Used during site provisioning to create a unique hero image for each tenant.
 */

export async function generateHeroImage(prompt: string): Promise<string | null> {
  const FAL_API_KEY = process.env.FAL_API_KEY
  if (!FAL_API_KEY) {
    console.warn('[IMAGE-GEN] FAL_API_KEY not set, skipping hero image generation')
    return null
  }

  const response = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: 'landscape_16_9',
      num_images: 1,
    }),
  })

  if (!response.ok) {
    console.error('[IMAGE-GEN] fal.ai request failed:', response.status, await response.text().catch(() => ''))
    return null
  }

  const data = await response.json()
  return data.images?.[0]?.url || null
}

export function buildHeroImagePrompt(params: {
  niche?: string
  brandName: string
  imageStyle?: Record<string, string> | string
}): string {
  const { niche, brandName, imageStyle } = params

  if (imageStyle) {
    // imageStyle can be a string or an object from the ProvisionForm
    let styleStr: string
    if (typeof imageStyle === 'string') {
      styleStr = imageStyle
    } else {
      // Build a descriptive prompt from the image style object fields
      const parts: string[] = []
      if (imageStyle.visual_style) parts.push(imageStyle.visual_style)
      if (imageStyle.mood_and_atmosphere) parts.push(`${imageStyle.mood_and_atmosphere} mood`)
      if (imageStyle.composition_style) parts.push(`${imageStyle.composition_style} composition`)
      if (imageStyle.lighting_preferences) parts.push(`${imageStyle.lighting_preferences} lighting`)
      if (imageStyle.color_palette) parts.push(`Color palette: ${imageStyle.color_palette}`)
      if (imageStyle.ai_prompt_instructions) parts.push(imageStyle.ai_prompt_instructions)
      styleStr = parts.join('. ')
    }

    if (styleStr) {
      return `Professional blog hero banner image. ${styleStr}. For a ${niche || 'lifestyle'} blog called "${brandName}". Wide landscape format, clean composition, no text overlays, no watermarks.`
    }
  }

  return `Professional, clean hero banner image for a ${niche || 'lifestyle'} blog. Modern editorial style, warm and inviting, wide landscape format. No text, no logos, no watermarks. Suitable as a background image with text overlay.`
}

/**
 * Logo image generation via fal.ai (square format).
 */
export async function generateLogoImage(prompt: string): Promise<string | null> {
  const FAL_API_KEY = process.env.FAL_API_KEY
  if (!FAL_API_KEY) {
    console.warn('[IMAGE-GEN] FAL_API_KEY not set, skipping logo generation')
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000) // 60s timeout

  try {
    const response = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square',
        num_images: 1,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error('[IMAGE-GEN] fal.ai logo request failed:', response.status, await response.text().catch(() => ''))
      return null
    }

    const data = await response.json()
    return data.images?.[0]?.url || null
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('[IMAGE-GEN] fal.ai logo request timed out after 60s')
      return null
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

export function buildLogoPrompt(brandName: string, niche?: string): string {
  return `Simple, clean, minimal logo icon for "${brandName}"${niche ? `, a ${niche} brand` : ''}. Flat design, single icon or monogram, white background, no text, no words, no letters, modern and professional, suitable as a favicon or brand mark.`
}
