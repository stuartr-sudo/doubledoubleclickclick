/**
 * Image generation via fal.ai.
 * Used during site provisioning for hero banners and logos.
 * Generated images are persisted to Supabase Storage for permanent URLs.
 *
 * Hero banners use fal-ai/nano-banana-2 (Google's photo-realistic model)
 * since flux/schnell produced low-quality lifestyle imagery for brands.
 * Logos still use flux/schnell — fast, cheap, and adequate for line-art
 * marks where photo realism is not required.
 */

import { createClient } from '@supabase/supabase-js'

const FAL_POLL_INTERVAL = 2000 // 2s between polls
const FAL_TIMEOUT = 90_000      // 90s — nano-banana-2 is slower than schnell
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
 * Submit a request to a fal.ai queue endpoint and poll until complete.
 * Generic over model — caller specifies endpoint + body.
 */
async function falGenerate(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<string | null> {
  const FAL_API_KEY = process.env.FAL_API_KEY
  if (!FAL_API_KEY) {
    console.warn('[IMAGE-GEN] FAL_API_KEY not set, skipping image generation')
    return null
  }

  const headers = {
    'Authorization': `Key ${FAL_API_KEY}`,
    'Content-Type': 'application/json',
  }

  const submitRes = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!submitRes.ok) {
    console.error(`[IMAGE-GEN] fal.ai submit failed (${endpoint}):`, submitRes.status, await submitRes.text().catch(() => ''))
    return null
  }

  const submitData = await submitRes.json()

  // Fast path
  if (submitData.images?.[0]?.url) {
    return submitData.images[0].url
  }

  // Some fal endpoints expose a different polling path than response_url
  // (e.g. nano-banana-2 returns status_url + a base requests/{id} endpoint).
  // Build the result URL from request_id if response_url is missing.
  const requestId = submitData.request_id as string | undefined
  const baseEndpoint = endpoint.split('/').slice(0, 2).join('/') // fal-ai/<model>
  const responseUrl = (submitData.response_url as string)
    || (requestId ? `https://queue.fal.run/${baseEndpoint}/requests/${requestId}` : null)
  const statusUrl = (submitData.status_url as string)
    || (requestId ? `https://queue.fal.run/${baseEndpoint}/requests/${requestId}/status` : null)

  if (!responseUrl || !statusUrl) {
    console.error('[IMAGE-GEN] No response_url/status_url in queue response:', JSON.stringify(submitData).substring(0, 200))
    return null
  }

  const deadline = Date.now() + FAL_TIMEOUT
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, FAL_POLL_INTERVAL))

    const statusRes = await fetch(statusUrl, { headers })
    if (!statusRes.ok) {
      if (statusRes.status === 202) continue
      console.error(`[IMAGE-GEN] fal.ai status poll failed (${endpoint}):`, statusRes.status)
      return null
    }
    const statusData = await statusRes.json()
    if (statusData.status === 'IN_QUEUE' || statusData.status === 'IN_PROGRESS') {
      continue
    }
    if (statusData.status === 'FAILED') {
      console.error(`[IMAGE-GEN] fal.ai request failed (${endpoint}):`, JSON.stringify(statusData).substring(0, 200))
      return null
    }

    // COMPLETED — fetch the actual result
    const resultRes = await fetch(responseUrl, { headers })
    if (!resultRes.ok) {
      console.error(`[IMAGE-GEN] fal.ai result fetch failed (${endpoint}):`, resultRes.status)
      return null
    }
    const resultData = await resultRes.json()
    if (resultData.images?.[0]?.url) {
      return resultData.images[0].url
    }
    console.error(`[IMAGE-GEN] fal.ai returned no images (${endpoint}):`, JSON.stringify(resultData).substring(0, 200))
    return null
  }

  console.error(`[IMAGE-GEN] fal.ai request timed out after ${FAL_TIMEOUT / 1000}s (${endpoint})`)
  return null
}

export async function generateHeroImage(prompt: string, username?: string): Promise<string | null> {
  // nano-banana-2 — Google's photo-realistic model. Much higher quality than
  // flux/schnell for lifestyle/brand hero imagery.
  const tempUrl = await falGenerate('fal-ai/nano-banana-2', {
    prompt,
    aspect_ratio: '16:9',
    num_images: 1,
    output_format: 'jpeg',
  })
  if (!tempUrl) return null
  const path = username ? `${username}/hero.jpg` : `misc/hero-${Date.now()}.jpg`
  return persistImage(tempUrl, path)
}

export async function generateLogoImage(prompt: string, username?: string): Promise<string | null> {
  // flux/schnell still fine for logo line-art — fast, cheap, low-stakes.
  const tempUrl = await falGenerate('fal-ai/flux/schnell', {
    prompt,
    image_size: 'square',
    num_images: 1,
    num_inference_steps: 4,
  })
  if (!tempUrl) return null
  const path = username ? `${username}/logo.jpg` : `misc/logo-${Date.now()}.jpg`
  return persistImage(tempUrl, path)
}

/**
 * Derive a small favicon from an existing logo URL.
 *
 * Downloads the source image, resizes to 64×64 via the fal-ai background
 * removal endpoint? — too heavy. Instead, we just upload a copy of the
 * source under a known favicon path. Modern browsers render PNG/JPG icons
 * fine and Next.js metadata.icons accepts any URL.
 *
 * Returns the public URL of the persisted favicon, or null.
 */
export async function generateFavicon(logoUrl: string, username: string): Promise<string | null> {
  if (!logoUrl) return null
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) return null

    // Fetch the source logo
    const imgRes = await fetch(logoUrl)
    if (!imgRes.ok) return null
    const blob = await imgRes.arrayBuffer()
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
    await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {})

    // Upload as favicon.png at the same path the layout expects
    const path = `${username}/favicon.png`
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, blob, { contentType, upsert: true })
    if (error) {
      console.error('[IMAGE-GEN] Favicon upload failed:', error.message)
      return null
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    console.log(`[IMAGE-GEN] Favicon persisted to ${data.publicUrl}`)
    return data.publicUrl
  } catch (err) {
    console.error('[IMAGE-GEN] Favicon generation failed:', err)
    return null
  }
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

