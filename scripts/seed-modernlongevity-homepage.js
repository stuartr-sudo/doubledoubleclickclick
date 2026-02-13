#!/usr/bin/env node
/**
 * One-off script to seed modernlongevity.io homepage with Modern Longevity
 * content and (optionally) Stitch Imagineer images.
 *
 * Usage:
 *   node scripts/seed-modernlongevity-homepage.js
 *
 * With Stitch images (set env first; Stitch doc default is 3003):
 *   export STITCH_URL=http://localhost:3003
 *   export STITCH_API_TOKEN=stitch_dev_token_2024
 *   node scripts/seed-modernlongevity-homepage.js
 */

const HOMEPAGE_API_URL = 'https://www.modernlongevity.io/api/homepage'

// Base columns (exist in minimal schema). After running docs/MODERNLONGEVITY_ADD_HOMEPAGE_COLUMNS.sql
// on the site's Supabase, set USE_EXTENDED_PAYLOAD=true to also send about_*, blog_grid_title, hero_background_image.
const USE_EXTENDED_PAYLOAD = process.env.USE_EXTENDED_PAYLOAD === 'true' || process.env.USE_EXTENDED_PAYLOAD === '1'

const PAYLOAD_BASE = {
  logo_text: 'Modern Longevity',
  hero_title: 'Science-First Guide to Living Longer and Healthier',
  hero_description:
    'We translate longevity research and supplement evidence into clear, actionable advice so you can choose what\'s worth your time and money.',
  hero_cta_text: 'Explore the Science',
  hero_cta_link: '/blog',
}

const PAYLOAD_EXTENDED = {
  ...PAYLOAD_BASE,
  about_title: 'About Modern Longevity',
  about_description:
    'Modern Longevity helps health-conscious adults navigate the longevity and anti-aging supplement space with evidence-based content. We focus on mechanisms (NAD+, NMN, resveratrol, etc.), honest product comparisons, and practical lifestyle and supplementation strategies—no hype, no pseudoscience.',
  blog_grid_title: 'Latest from Modern Longevity',
}

const PAYLOAD = USE_EXTENDED_PAYLOAD ? PAYLOAD_EXTENDED : PAYLOAD_BASE

const IMAGE_PROMPT =
  'Editorial wellness style, clean and modern, soft natural lighting, warm neutrals and soft teal, science-backed longevity theme, no clinical or scary imagery.'

const SLOTS = [
  { field: 'hero_image', dimensions: '16:9', style: 'instagram-candid', promptSuffix: ', landscape, wide horizontal format' },
  { field: 'hero_background_image', dimensions: '16:9', style: 'instagram-candid', promptSuffix: ', abstract background', extendedOnly: true },
  { field: 'logo_image', dimensions: '1:1', style: 'instagram-candid', promptSuffix: ', minimal logo or wordmark for Modern Longevity' },
]

function extractImageUrl(data) {
  if (!data || typeof data !== 'object') return null
  return (
    data.imageUrl ??
    data.url ??
    data.image_url ??
    data.data?.url ??
    data.data?.imageUrl ??
    data.result?.url ??
    data.output?.url ??
    (typeof data.image === 'string' && data.image.startsWith('http') ? data.image : null) ??
    (Array.isArray(data.images) && data.images[0]?.url ? data.images[0].url : null) ??
    (Array.isArray(data.images) && typeof data.images[0] === 'string' && data.images[0].startsWith('http') ? data.images[0] : null)
  )
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callStitchImagineer(stitchUrl, token, prompt, style, dimensions) {
  const base = stitchUrl.replace(/\/$/, '')
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // 1. Start generation
  const genRes = await fetch(`${base}/api/imagineer/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ prompt, style, dimensions }),
  })
  if (!genRes.ok) {
    const text = await genRes.text()
    throw new Error(`Stitch Imagineer failed ${genRes.status}: ${text}`)
  }
  const genData = await genRes.json()

  let url = extractImageUrl(genData)
  if (url) return url

  const requestId = genData.requestId ?? genData.request_id ?? genData.id
  if (!requestId) {
    console.warn('    Stitch response keys:', Object.keys(genData).join(', '))
    return null
  }

  // 2. Poll for result (Imagineer is async like Jumpstart)
  const pollIntervalMs = 3000
  const maxWaitMs = 60000
  const resultUrl = `${base}/api/imagineer/result`
  const started = Date.now()

  while (Date.now() - started < maxWaitMs) {
    await sleep(pollIntervalMs)
    const resultRes = await fetch(resultUrl, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ requestId }),
    })
    if (!resultRes.ok) continue
    const resultData = await resultRes.json()
    const status = resultData.status ?? resultData.state
    if (status === 'failed' || status === 'error') {
      console.warn('    Stitch job failed:', resultData.error ?? resultData.message ?? status)
      return null
    }
    url = extractImageUrl(resultData)
    if (url) return url
    if (status === 'completed' || status === 'done') break
  }

  return null
}

async function main() {
  const stitchUrl = process.env.STITCH_URL
  const stitchToken = process.env.STITCH_API_TOKEN
  const useStitch = stitchUrl && stitchToken

  const payload = { ...PAYLOAD }

  if (useStitch) {
    console.log('Calling Stitch Imagineer for images...')
    for (const slot of SLOTS) {
      if (slot.extendedOnly && !USE_EXTENDED_PAYLOAD) continue
      const prompt = IMAGE_PROMPT + (slot.promptSuffix || '')
      try {
        const imageUrl = await callStitchImagineer(
          stitchUrl,
          stitchToken,
          prompt,
          slot.style,
          slot.dimensions
        )
        if (imageUrl) {
          payload[slot.field] = imageUrl
          console.log(`  ${slot.field}: ${imageUrl}`)
        } else {
          console.warn(`  ${slot.field}: no URL in response`)
        }
      } catch (err) {
        console.warn(`  ${slot.field}: ${err.message}`)
      }
    }
  } else {
    console.log('STITCH_URL / STITCH_API_TOKEN not set — skipping images. Homepage text will still be updated.')
  }

  console.log('POSTing to', HOMEPAGE_API_URL, 'with keys:', Object.keys(payload).join(', '))
  const res = await fetch(HOMEPAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Homepage API failed ${res.status}: ${text}`)
  }

  const result = await res.json().catch(() => ({}))
  console.log('Homepage updated successfully.', result.id ? `id: ${result.id}` : '')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
