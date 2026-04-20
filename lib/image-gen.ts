/**
 * Image generation via fal.ai.
 * Used during site provisioning for hero banners and logos.
 * Generated images are persisted to Supabase Storage for permanent URLs.
 *
 * Models (fal.ai):
 *   - Hero:  fal-ai/nano-banana-pro          — Google's flagship photo-realistic
 *                                              model. $0.15/image (1K), $0.30 at 4K.
 *                                              No built-in prompt enhancement.
 *   - Logo:  fal-ai/ideogram/v3/generate-transparent
 *                                            — Transparent-background logos with
 *                                              real typography. $0.09/image at QUALITY.
 *                                              MagicPrompt enhancement built-in
 *                                              (expand_prompt=true).
 *
 * Hero prompts are enhanced via GPT-4.1 from brand voice + niche before
 * being sent to nano-banana-pro (since nano-banana-pro doesn't enhance).
 * Logo prompts go raw to Ideogram — its expand_prompt does the work.
 */

import { createClient } from '@supabase/supabase-js'

const FAL_POLL_INTERVAL = 3000 // 3s between polls
const FAL_TIMEOUT = 180_000     // 3 min — nano-banana-pro takes ~30-60s typical
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

/**
 * Enhance a raw hero prompt into a richer, brand-aware photographic brief.
 * Uses GPT-4.1 (the same model the provisioner already uses for structured
 * voice extraction). Returns the enhanced prompt, or the original on failure.
 *
 * Why: nano-banana-pro is a photo-realistic model that rewards specific,
 * sensory prompts ("morning light through linen curtains, warm cream and
 * brown, mother and child at a wooden kitchen table") more than generic
 * ones ("a hero image for a homeschool brand"). It does NOT have built-in
 * prompt expansion (unlike Ideogram's MagicPrompt).
 */
export async function enhanceHeroPrompt(rawPrompt: string, brand: {
  brandName?: string
  niche?: string
  voiceAndTone?: string | null
  imageryGuidelines?: string | null
} = {}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[IMAGE-GEN] OPENAI_API_KEY not set, returning raw prompt')
    return rawPrompt
  }

  const systemPrompt = `You are a senior creative director writing photographic briefs for a state-of-the-art image model (Google nano-banana-pro). The model rewards SENSORY, SPECIFIC, COMPOSITIONAL prompts over abstract descriptions. Output ONLY the enhanced prompt as a single paragraph — no preamble, no quotes, no explanation. The output must be 80-180 words. NEVER include text/words/typography in the image (the brand will overlay text separately). NEVER request logos, watermarks, or UI elements.`

  const userPrompt = `Brand: ${brand.brandName || 'a lifestyle brand'}
Niche: ${brand.niche || 'lifestyle'}
${brand.voiceAndTone ? `\nBrand voice & tone:\n${brand.voiceAndTone.substring(0, 1500)}` : ''}
${brand.imageryGuidelines ? `\nImagery guidelines:\n${brand.imageryGuidelines.substring(0, 1500)}` : ''}
\nRaw brief from the provisioner:\n${rawPrompt}\n\nEnhance into a single-paragraph photographic prompt for nano-banana-pro: documentary lifestyle, golden-hour preferred, sensory specifics (objects, textures, light), real moment captured (NOT staged/styled), 16:9 horizontal composition with negative space on the left for overlay text, palette and mood aligned with the brand voice. NO text/words/logos/watermarks in the image.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    })
    if (!res.ok) {
      console.warn('[IMAGE-GEN] Prompt enhancement failed:', res.status, await res.text().catch(() => ''))
      return rawPrompt
    }
    const data = await res.json()
    const enhanced: string = data.choices?.[0]?.message?.content?.trim() || ''
    if (!enhanced) return rawPrompt
    console.log(`[IMAGE-GEN] Enhanced hero prompt: ${enhanced.substring(0, 120)}...`)
    return enhanced
  } catch (err) {
    console.warn('[IMAGE-GEN] Prompt enhancement exception:', err)
    return rawPrompt
  }
}

export async function generateHeroImage(
  prompt: string,
  username?: string,
  brand?: {
    brandName?: string
    niche?: string
    voiceAndTone?: string | null
    imageryGuidelines?: string | null
  },
): Promise<string | null> {
  // Enhance the raw prompt with brand voice + imagery guidelines (if provided).
  const finalPrompt = brand ? await enhanceHeroPrompt(prompt, brand) : prompt

  // nano-banana-pro: Google's flagship photo-realistic model. Pricing $0.15/image
  // at 1K resolution. Use 1K (default) — the hero gets resized for web display
  // and 2K/4K is wasted bytes.
  const tempUrl = await falGenerate('fal-ai/nano-banana-pro', {
    prompt: finalPrompt,
    aspect_ratio: '16:9',
    num_images: 1,
    resolution: '1K',
    output_format: 'jpeg',
    safety_tolerance: '4',
  })
  if (!tempUrl) return null
  const path = username ? `${username}/hero.jpg` : `misc/hero-${Date.now()}.jpg`
  return persistImage(tempUrl, path)
}

export async function generateLogoImage(prompt: string, username?: string): Promise<string | null> {
  // Ideogram v3 transparent — produces real, on-brand logos with transparent
  // backgrounds (no need to manually remove). MagicPrompt (expand_prompt=true)
  // does prompt enhancement for us. QUALITY rendering is $0.09/image.
  const tempUrl = await falGenerate('fal-ai/ideogram/v3/generate-transparent', {
    prompt,
    aspect_ratio: '1:1',
    rendering_speed: 'QUALITY',
    expand_prompt: true,
    num_images: 1,
    negative_prompt: 'photograph, photorealistic, 3d render, gradient background, busy background, watermark, low quality, blurry',
  })
  if (!tempUrl) return null
  // PNG to preserve transparency.
  const path = username ? `${username}/logo.png` : `misc/logo-${Date.now()}.png`
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

