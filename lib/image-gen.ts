/**
 * Image generation via fal.ai.
 * Used during site provisioning for hero banners and logos.
 * Generated images are persisted to Supabase Storage for permanent URLs.
 */

import { createClient } from '@supabase/supabase-js'

const FAL_POLL_INTERVAL = 2000 // 2s between polls
const FAL_TIMEOUT = 60_000      // 60s max wait
const STORAGE_BUCKET = 'brand-assets'

/**
 * Download an image from a temporary URL and upload to Supabase Storage.
 * Returns the permanent public URL, or the original URL if upload fails.
 */
async function persistImage(tempUrl: string, path: string): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[IMAGE-GEN] Supabase not configured, using temporary fal.ai URL')
    return tempUrl
  }

  try {
    // Download the image
    const imgRes = await fetch(tempUrl)
    if (!imgRes.ok) return tempUrl
    const blob = await imgRes.arrayBuffer()
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

    // Ensure bucket exists (idempotent)
    await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {})

    // Upload
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, blob, { contentType, upsert: true })

    if (error) {
      console.error('[IMAGE-GEN] Supabase upload failed:', error.message)
      return tempUrl
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path)

    console.log(`[IMAGE-GEN] Persisted image to ${publicUrlData.publicUrl}`)
    return publicUrlData.publicUrl
  } catch (err) {
    console.error('[IMAGE-GEN] Failed to persist image:', err)
    return tempUrl
  }
}

/**
 * Submit a request to fal.ai queue and poll until complete.
 */
async function falGenerate(prompt: string, imageSize: string): Promise<string | null> {
  const FAL_API_KEY = process.env.FAL_API_KEY
  if (!FAL_API_KEY) {
    console.warn('[IMAGE-GEN] FAL_API_KEY not set, skipping image generation')
    return null
  }

  const headers = {
    'Authorization': `Key ${FAL_API_KEY}`,
    'Content-Type': 'application/json',
  }

  // 1. Submit to queue
  const submitRes = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, image_size: imageSize, num_images: 1 }),
  })

  if (!submitRes.ok) {
    console.error('[IMAGE-GEN] fal.ai submit failed:', submitRes.status, await submitRes.text().catch(() => ''))
    return null
  }

  const submitData = await submitRes.json()

  // If the response already has images (fast path), return immediately
  if (submitData.images?.[0]?.url) {
    return submitData.images[0].url
  }

  // 2. Poll the response_url until complete
  const responseUrl = submitData.response_url
  if (!responseUrl) {
    console.error('[IMAGE-GEN] No response_url in queue response:', JSON.stringify(submitData).substring(0, 200))
    return null
  }

  const deadline = Date.now() + FAL_TIMEOUT
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, FAL_POLL_INTERVAL))

    const pollRes = await fetch(responseUrl, { headers })
    if (!pollRes.ok) {
      // 202 means still processing, anything else is an error
      if (pollRes.status === 202) continue
      console.error('[IMAGE-GEN] fal.ai poll failed:', pollRes.status)
      return null
    }

    const pollData = await pollRes.json()

    // Check if still in queue
    if (pollData.status === 'IN_QUEUE' || pollData.status === 'IN_PROGRESS') {
      continue
    }

    // Completed — extract image URL
    if (pollData.images?.[0]?.url) {
      return pollData.images[0].url
    }

    // Response arrived but no images
    console.error('[IMAGE-GEN] fal.ai returned no images:', JSON.stringify(pollData).substring(0, 200))
    return null
  }

  console.error('[IMAGE-GEN] fal.ai request timed out after 60s')
  return null
}

export async function generateHeroImage(prompt: string, username?: string): Promise<string | null> {
  const tempUrl = await falGenerate(prompt, 'landscape_16_9')
  if (!tempUrl) return null
  const path = username ? `${username}/hero.jpg` : `misc/hero-${Date.now()}.jpg`
  return persistImage(tempUrl, path)
}

export async function generateLogoImage(prompt: string, username?: string): Promise<string | null> {
  const tempUrl = await falGenerate(prompt, 'square')
  if (!tempUrl) return null
  const path = username ? `${username}/logo.jpg` : `misc/logo-${Date.now()}.jpg`
  return persistImage(tempUrl, path)
}

export function buildHeroImagePrompt(params: {
  niche?: string
  brandName: string
  imageStyle?: Record<string, string> | string
}): string {
  const { niche, brandName, imageStyle } = params

  if (imageStyle) {
    let styleStr: string
    if (typeof imageStyle === 'string') {
      styleStr = imageStyle
    } else {
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

