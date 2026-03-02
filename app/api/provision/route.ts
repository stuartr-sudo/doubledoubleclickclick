import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import * as fly from '@/lib/fly'
import * as google from '@/lib/google'
import { generateHeroImage, buildHeroImagePrompt } from '@/lib/image-gen'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────
// Self-healing helpers
// ─────────────────────────────────────────────────────────────

/** Retry a DB upsert once on failure. Returns data + optional warning. */
async function dbUpsert(
  supabase: SupabaseClient,
  table: string,
  filterCol: string,
  filterVal: string,
  payload: Record<string, unknown>,
  label: string,
  /** Optional secondary filter (e.g. slug for authors) */
  filter2?: { col: string; val: string },
): Promise<{ data: any; warning: string | null }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      let query = supabase.from(table).select('id').eq(filterCol, filterVal)
      if (filter2) query = query.eq(filter2.col, filter2.val)
      const { data: existing } = await query.limit(1).single()

      let result
      if (existing) {
        // Update by primary key if we have it, otherwise by filter
        const updateQuery = existing.id
          ? supabase.from(table).update(payload).eq('id', existing.id).select()
          : supabase.from(table).update(payload).eq(filterCol, filterVal).select()
        result = await updateQuery
      } else {
        result = await supabase.from(table).insert(payload).select()
      }

      if (result.error) throw new Error(result.error.message)
      return { data: result.data, warning: null }
    } catch (err: any) {
      if (attempt === 0) {
        console.warn(`[PROVISION] ${label} attempt 1 failed, retrying:`, err.message)
        continue
      }
      console.error(`[PROVISION] ${label} failed after retry:`, err.message)
      return { data: null, warning: `${label}: ${err.message}` }
    }
  }
  return { data: null, warning: `${label}: unexpected exit` }
}

/** Fetch with timeout + one retry on transient failure. */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs = 30000,
): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      const res = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timer)
      return res
    } catch (err: any) {
      if (attempt === 0) {
        console.warn(`[PROVISION] fetch ${url} attempt 1 failed, retrying:`, err.message)
        continue
      }
      throw err
    }
  }
  throw new Error(`fetch ${url} failed after retry`)
}

/**
 * POST /api/provision — Fully automated site provisioning.
 *
 * This is the FIRST PORT OF CALL. One API call does everything:
 *   1. Seeds brand data into the shared Supabase DB
 *   2. Calls Doubleclicker's auto-onboard (which orchestrates the full chain
 *      including Stitch queueing when stitch_enabled=true)
 *   3. Deploys a new Fly.io app with the correct env vars
 *   4. Adds custom domain + requests TLS certificate
 *   5. Emails the user with DNS records to configure
 *   6. Logs the event
 *
 * Architecture:
 *   Blog Cloner ──HTTP──▶ Doubleclicker ──shared DB──▶ Stitch
 *                          (orchestrator)               (worker)
 *
 * Doubleclicker handles: workspace → brand → products → keywords → pipeline → stitch queue
 * Stitch polls stitch_queue every 15s — no HTTP API needed.
 *
 * Self-healing: Never returns 500 for phase failures. Accumulates warnings
 * and returns 200 with partial success. Only returns 500 for auth/config issues.
 *
 * Protected by PROVISION_SECRET bearer token.
 */
export async function POST(request: NextRequest) {
  // Auth + config validation — these are the ONLY reasons to return non-200
  const provisionSecret = process.env.PROVISION_SECRET
  if (!provisionSecret) {
    return NextResponse.json(
      { success: false, error: 'Provisioning not configured' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader || authHeader !== `Bearer ${provisionSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body = await request.json()
  const {
    username,
    display_name,
    website_url,
    contact_email,
    domain,
    blurb,
    target_market,
    brand_voice_tone,
    primary_color,
    accent_color,
    logo_url,
    heading_font,
    body_font,
    author_name,
    author_bio,
    author_image_url,
    author_url,
    author_social_urls,
    product_url,
    approved_products,
    seed_keywords,
    niche,
    stitch_enabled,
    fly_region = 'syd',
    skip_pipeline = false,
    skip_deploy = false,
    setup_google_analytics = false,
    setup_google_tag_manager = false,
    setup_search_console = false,
    purchase_domain = false,
    domain_yearly_price,
    domain_notices,
    network_partners,
  } = body

  // Validate required fields
  if (!username || !display_name || !contact_email) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: username, display_name, contact_email' },
      { status: 400 }
    )
  }
  if (!website_url && !niche) {
    return NextResponse.json(
      { success: false, error: 'At least one of website_url or niche is required' },
      { status: 400 }
    )
  }

  // Initialize Supabase with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })

  const results: Record<string, unknown> = {}
  const notifications: Record<string, unknown> = {}
  const warnings: string[] = []

  // ─────────────────────────────────────────────────────────────
  // PHASE 1: Seed the shared database
  //
  // Self-healing: each table upsert retries once. Failures are
  // collected as warnings — pipeline continues regardless.
  //
  // DB Column Naming:
  //   brand_guidelines, brand_specifications, authors → use `user_name`
  //   company_information → uses `username` (different column name, same value)
  // ─────────────────────────────────────────────────────────────

  // 1. brand_guidelines (uses `user_name` column)
  const guidelinesPayload = {
    user_name: username,
    name: display_name,
    website_url: website_url || null,
    voice_and_tone: brand_voice_tone || null,
    brand_personality: brand_voice_tone || null,
    target_market: target_market || null,
    default_author: author_name || display_name,
    author_bio: author_bio || null,
    author_image_url: author_image_url || null,
    author_url: author_url || null,
    author_social_urls: author_social_urls || null,
  }

  const guidelinesResult = await dbUpsert(
    supabase, 'brand_guidelines', 'user_name', username,
    guidelinesPayload, 'brand_guidelines'
  )
  results.brand_guidelines = guidelinesResult.data
  if (guidelinesResult.warning) warnings.push(guidelinesResult.warning)

  // 2. brand_specifications (uses `user_name` column, FK via `guideline_id`)
  const guidelineId = guidelinesResult.data?.[0]?.id
  if (guidelineId) {
    const specsPayload = {
      guideline_id: guidelineId,
      user_name: username,
      primary_color: primary_color || '#000000',
      accent_color: accent_color || '#ffffff',
      secondary_color: accent_color || '#ffffff',
      logo_url: logo_url || null,
      heading_font: heading_font || null,
      body_font: body_font || null,
    }

    const specsResult = await dbUpsert(
      supabase, 'brand_specifications', 'user_name', username,
      specsPayload, 'brand_specifications'
    )
    results.brand_specifications = specsResult.data
    if (specsResult.warning) warnings.push(specsResult.warning)
  } else if (!guidelinesResult.warning) {
    warnings.push('brand_specifications: skipped (no guideline ID available)')
  }

  // 3. company_information (uses `username` column — NOT `user_name`)
  const companyPayload = {
    username: username,
    client_website: website_url || null,
    email: contact_email,
    blurb: blurb || null,
    target_market: target_market || null,
  }

  const companyResult = await dbUpsert(
    supabase, 'company_information', 'username', username,
    companyPayload, 'company_information'
  )
  results.company_information = companyResult.data
  if (companyResult.warning) warnings.push(companyResult.warning)

  // 4. Default author (uses `user_name` column + slug for uniqueness)
  const authorSlug = (author_name || display_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const authorPayload = {
    user_name: username,
    name: author_name || display_name,
    bio: author_bio || `Author at ${display_name}`,
    profile_image_url: author_image_url || null,
    slug: authorSlug,
  }

  const authorResult = await dbUpsert(
    supabase, 'authors', 'user_name', username,
    authorPayload, 'authors',
    { col: 'slug', val: authorSlug }
  )
  results.author = authorResult.data
  if (authorResult.warning) warnings.push(authorResult.warning)

  // ─────────────────────────────────────────────────────────────
  // PHASE 1.5: Generate hero banner image via fal.ai
  // Non-blocking — site works fine with gradient fallback.
  // ─────────────────────────────────────────────────────────────

  try {
    const heroPrompt = buildHeroImagePrompt({
      niche,
      brandName: display_name,
      imageStyle: body.image_style,
    })
    const heroImageUrl = await generateHeroImage(heroPrompt)

    if (heroImageUrl) {
      await supabase
        .from('brand_specifications')
        .update({ hero_image_url: heroImageUrl })
        .eq('user_name', username)
      console.log(`Hero image generated for ${username}: ${heroImageUrl}`)
      notifications.hero_image = { status: 'generated', url: heroImageUrl }
    } else {
      notifications.hero_image = { status: 'skipped', reason: 'Generation returned null (FAL_API_KEY may not be set)' }
    }
  } catch (err) {
    console.warn('[PROVISION] Hero image generation failed, continuing:', err)
    notifications.hero_image = { status: 'error', error: err instanceof Error ? err.message : String(err) }
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 2: Create Google services (GA4, GTM)
  //
  // Creates tracking properties that get injected as env vars
  // into the Fly.io app. Requires GOOGLE_SERVICE_ACCOUNT_JSON.
  // ─────────────────────────────────────────────────────────────

  let gaId = ''
  let gtmId = ''

  if (google.isGoogleServiceConfigured()) {
    const siteUrl = domain ? `https://www.${domain}` : website_url || `https://${username}-blog.fly.dev`

    if (setup_google_analytics) {
      try {
        const ga = await google.createGA4Property(display_name, siteUrl)
        gaId = ga.measurementId || ''
        console.log(`GA4 property created: ${ga.propertyName}, Measurement ID: ${gaId}`)
        notifications.google_analytics = {
          status: 'created',
          measurement_id: gaId,
          property_id: ga.propertyId,
        }
      } catch (err) {
        console.error('Error creating GA4 property:', err)
        notifications.google_analytics = { status: 'error', error: err instanceof Error ? err.message : String(err) }
      }
    }

    if (setup_google_tag_manager) {
      try {
        const gtm = await google.createGTMContainer(display_name)
        gtmId = gtm.publicId || ''
        console.log(`GTM container created: ${gtm.path}, Public ID: ${gtmId}`)
        notifications.google_tag_manager = {
          status: 'created',
          public_id: gtmId,
          container_id: gtm.containerId,
        }
      } catch (err) {
        console.error('Error creating GTM container:', err)
        notifications.google_tag_manager = { status: 'error', error: err instanceof Error ? err.message : String(err) }
      }
    }
  } else {
    if (setup_google_analytics) notifications.google_analytics = { status: 'skipped', reason: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured' }
    if (setup_google_tag_manager) notifications.google_tag_manager = { status: 'skipped', reason: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured' }
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 3: Notify Doubleclicker to start content pipeline
  //
  // Doubleclicker orchestrates the full chain:
  //   create_workspace → auto_brand → save_brand → discover_products
  //   → launch_pipeline (keywords, topical maps, content schedule)
  //   → queue Stitch jobs (when stitch_enabled=true)
  //
  // Stitch polls stitch_queue every 15s and picks up jobs
  // autonomously — no direct HTTP call needed.
  //
  // ALL research data must be forwarded here so DC has full context.
  // ─────────────────────────────────────────────────────────────

  const doubleclickerUrl = process.env.DOUBLECLICKER_API_URL
  if (!skip_pipeline && doubleclickerUrl) {
    try {
      const onboardPayload: Record<string, unknown> = {
        username,
        displayName: display_name,
        // Always assign to stuartr@sewo.io regardless of contact_email
        assignToEmail: 'stuartr@sewo.io',
      }

      // Core identity
      if (website_url) onboardPayload.websiteUrl = website_url
      if (product_url) onboardPayload.productUrl = product_url
      if (niche) onboardPayload.niche = niche

      // In brand-first mode (no niche, has product), derive seed keywords
      // from product name so Doubleclicker has topical direction
      const productName = body.product_name || (Array.isArray(approved_products) && approved_products[0]?.name)
      if (seed_keywords?.length) {
        onboardPayload.seed_keywords = seed_keywords
      } else if (productName && !niche) {
        const derived = [productName, `${productName} review`, `best ${productName}`, `${display_name} ${productName}`].filter(Boolean)
        onboardPayload.seed_keywords = derived
      }

      // Brand voice & content
      if (blurb) onboardPayload.brand_blurb = blurb
      if (target_market) onboardPayload.target_market = target_market
      if (brand_voice_tone) onboardPayload.brand_voice = brand_voice_tone
      if (body.image_style) onboardPayload.image_style = body.image_style
      if (body.product_name) onboardPayload.product_name = body.product_name
      if (body.research_context) onboardPayload.research_context = body.research_context

      // Author data — DC needs this for content attribution
      if (author_name) onboardPayload.author_name = author_name
      if (author_bio) onboardPayload.author_bio = author_bio
      if (author_image_url) onboardPayload.author_image_url = author_image_url
      if (author_url) onboardPayload.author_url = author_url
      if (author_social_urls) onboardPayload.author_social_urls = author_social_urls

      // Visual identity — DC needs this for image generation prompts
      if (logo_url) onboardPayload.logo_url = logo_url
      if (primary_color) onboardPayload.primary_color = primary_color
      if (accent_color) onboardPayload.accent_color = accent_color
      if (heading_font) onboardPayload.heading_font = heading_font
      if (body_font) onboardPayload.body_font = body_font

      // Pipeline control
      if (stitch_enabled !== undefined) onboardPayload.stitch_enabled = stitch_enabled

      // Network partners for cross-linking
      if (Array.isArray(network_partners) && network_partners.length > 0) {
        onboardPayload.network_partners = network_partners
      }

      // Pass approved products so Doubleclicker can create promoted_products
      // records and scrape each URL into the RAG knowledge base.
      if (Array.isArray(approved_products) && approved_products.length > 0) {
        if (!product_url && approved_products[0]?.url) {
          onboardPayload.productUrl = approved_products[0].url
          onboardPayload.product_name = approved_products[0].name
        }
        onboardPayload.approved_products = approved_products
        const additionalUrls = approved_products
          .slice(product_url ? 0 : 1)
          .map((p: { url?: string }) => p.url)
          .filter(Boolean)
        if (additionalUrls.length > 0) {
          onboardPayload.additional_urls = additionalUrls
        }
      }

      // Self-healing: retry once with 30s timeout
      const onboardRes = await fetchWithRetry(
        `${doubleclickerUrl}/api/strategy/auto-onboard`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-provision-secret': provisionSecret,
          },
          body: JSON.stringify(onboardPayload),
        },
        30000
      )

      const onboardData = await onboardRes.json().catch(() => ({}))
      // Check both HTTP status AND response body success flag
      const dcSuccess = onboardRes.ok && onboardData.success !== false
      notifications.doubleclicker = {
        status: dcSuccess ? 'triggered' : 'failed',
        statusCode: onboardRes.status,
        data: onboardData,
        ...(dcSuccess ? {} : { error: onboardData.error || `HTTP ${onboardRes.status}` }),
      }
    } catch (err) {
      console.error('Error notifying Doubleclicker:', err)
      notifications.doubleclicker = { status: 'error', error: err instanceof Error ? err.message : String(err) }
    }
  } else {
    notifications.doubleclicker = { status: 'skipped', reason: !doubleclickerUrl ? 'DOUBLECLICKER_API_URL not set' : 'skip_pipeline=true' }
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 4: Deploy to Fly.io
  // Self-healing: wraps each step, captures error with context.
  // ─────────────────────────────────────────────────────────────

  const flyAppName = `${username}-blog`
  const flyOrgSlug = process.env.FLY_ORG_SLUG || 'personal'
  const flyBaseApp = process.env.FLY_BASE_APP || 'doubledoubleclickclick'
  let flyIpv4 = ''
  let flyIpv6 = ''

  if (!skip_deploy && process.env.FLY_API_TOKEN) {
    try {
      // 1. Get the Docker image from the base app
      let imageRef: string
      try {
        imageRef = await fly.getAppImage(flyBaseApp)
        console.log(`Using image from ${flyBaseApp}: ${imageRef}`)
      } catch (err: any) {
        throw new Error(`Failed to get base image from "${flyBaseApp}": ${err.message}. Ensure the base app exists and has at least one machine.`)
      }

      // 2. Create the new app
      await fly.createApp(flyAppName, flyOrgSlug)
      console.log(`Created Fly app: ${flyAppName}`)

      // 3. Set secrets (sensitive values that shouldn't be in machine env)
      await fly.setSecrets(flyAppName, {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        SUPABASE_SERVICE_ROLE_KEY: supabaseKey,
        RESEND_API_KEY: process.env.RESEND_API_KEY || '',
      })
      console.log(`Set secrets on ${flyAppName}`)

      // 4. Allocate IPs (required for custom domains) — retry each once
      try {
        flyIpv4 = await fly.allocateIpv4(flyAppName)
      } catch {
        // Retry once
        try { flyIpv4 = await fly.allocateIpv4(flyAppName) } catch (e: any) {
          warnings.push(`IPv4 allocation failed: ${e.message}`)
        }
      }
      try {
        flyIpv6 = await fly.allocateIpv6(flyAppName)
      } catch {
        // Retry once
        try { flyIpv6 = await fly.allocateIpv6(flyAppName) } catch (e: any) {
          warnings.push(`IPv6 allocation failed: ${e.message}`)
        }
      }
      if (flyIpv4 || flyIpv6) {
        console.log(`Allocated IPs: ${flyIpv4} / ${flyIpv6}`)
      }

      // 5. Create machine with site-specific env vars (including GA/GTM IDs if created)
      const siteUrl = domain ? `https://www.${domain}` : website_url || `https://${flyAppName}.fly.dev`
      const machineEnv: Record<string, string> = {
        BRAND_USERNAME: username,
        SITE_URL: siteUrl,
        SITE_NAME: display_name,
        CONTACT_EMAIL: contact_email,
        NEXT_PUBLIC_BRAND_USERNAME: username,
        NEXT_PUBLIC_SITE_URL: siteUrl,
        NEXT_PUBLIC_SITE_NAME: display_name,
        NEXT_PUBLIC_CONTACT_EMAIL: contact_email,
      }
      if (gaId) {
        machineEnv.GA_ID = gaId
        machineEnv.NEXT_PUBLIC_GA_ID = gaId
      }
      if (gtmId) {
        machineEnv.GTM_ID = gtmId
        machineEnv.NEXT_PUBLIC_GTM_ID = gtmId
      }
      await fly.createMachine(flyAppName, imageRef, machineEnv, fly_region)
      console.log(`Machine created in ${flyAppName}`)

      notifications.fly = {
        status: 'deployed',
        app: flyAppName,
        url: `https://${flyAppName}.fly.dev`,
        ipv4: flyIpv4,
        ipv6: flyIpv6,
      }
    } catch (err) {
      console.error('Error deploying to Fly.io:', err)
      notifications.fly = { status: 'error', error: err instanceof Error ? err.message : String(err) }
    }
  } else {
    notifications.fly = {
      status: 'skipped',
      reason: !process.env.FLY_API_TOKEN ? 'FLY_API_TOKEN not set' : 'skip_deploy=true',
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 5: Purchase domain via Google Cloud Domains (optional)
  // ─────────────────────────────────────────────────────────────

  if (purchase_domain && domain && domain_yearly_price && google.isGoogleServiceConfigured()) {
    try {
      const regResult = await google.registerDomain(
        domain,
        contact_email,
        domain_yearly_price,
        domain_notices || []
      )
      console.log(`Domain registration initiated: ${domain} (${regResult.operationName})`)
      notifications.domain_purchase = {
        status: 'registration_pending',
        domain,
        operation: regResult.operationName,
        price: domain_yearly_price,
      }
    } catch (err) {
      console.error('Error registering domain:', err)
      notifications.domain_purchase = { status: 'error', error: err instanceof Error ? err.message : String(err) }
    }
  } else if (purchase_domain) {
    notifications.domain_purchase = {
      status: 'skipped',
      reason: !google.isGoogleServiceConfigured()
        ? 'GOOGLE_SERVICE_ACCOUNT_JSON not configured'
        : !domain_yearly_price ? 'Missing yearly price data' : 'Missing domain',
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 6: Add custom domain + request TLS certificate
  // Self-healing: tries both www and apex independently.
  // ─────────────────────────────────────────────────────────────

  const dnsRecords: Array<{ type: string; name: string; value: string }> = []

  if (domain && (notifications.fly as Record<string, unknown>)?.status === 'deployed') {
    // Request certs for both www and apex — independently so one failure doesn't block the other
    const [wwwResult, apexResult] = await Promise.allSettled([
      fly.addCertificate(flyAppName, `www.${domain}`),
      fly.addCertificate(flyAppName, domain),
    ])

    const wwwCert = wwwResult.status === 'fulfilled' ? wwwResult.value : null
    const apexCert = apexResult.status === 'fulfilled' ? apexResult.value : null

    if (wwwResult.status === 'rejected') {
      warnings.push(`www certificate: ${wwwResult.reason?.message || 'failed'}`)
    }
    if (apexResult.status === 'rejected') {
      warnings.push(`apex certificate: ${apexResult.reason?.message || 'failed'}`)
    }

    // Build DNS records from whichever succeeded
    if (wwwCert || apexCert) {
      dnsRecords.push(
        { type: 'CNAME', name: 'www', value: `${flyAppName}.fly.dev` },
      )
      if (flyIpv4) dnsRecords.push({ type: 'A', name: '@', value: flyIpv4 })
      if (flyIpv6) dnsRecords.push({ type: 'AAAA', name: '@', value: flyIpv6 })
    }

    notifications.domain = {
      status: (wwwCert && apexCert) ? 'certificates_requested'
        : (wwwCert || apexCert) ? 'partial_certificates'
        : 'error',
      domain,
      www_cert: wwwCert,
      apex_cert: apexCert,
      dns_records: dnsRecords,
    }
  } else if (domain) {
    notifications.domain = { status: 'skipped', reason: 'Fly deployment did not succeed' }
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 7: Add to Google Search Console + get verification token
  // ─────────────────────────────────────────────────────────────

  if (setup_search_console && google.isGoogleServiceConfigured()) {
    const siteUrl = domain ? `https://www.${domain}` : `https://${flyAppName}.fly.dev`
    try {
      const gsc = await google.addSearchConsoleSite(siteUrl)
      console.log(`Search Console site added: ${siteUrl}`)
      notifications.search_console = {
        status: 'added',
        site_url: gsc.siteUrl,
        verification_token: gsc.verificationToken,
        verification_method: gsc.verificationMethod,
      }
      if (domain && gsc.verificationToken) {
        dnsRecords.push({
          type: 'TXT',
          name: '@',
          value: gsc.verificationToken,
        })
      }
    } catch (err) {
      console.error('Error adding to Search Console:', err)
      notifications.search_console = { status: 'error', error: err instanceof Error ? err.message : String(err) }
    }
  } else if (setup_search_console) {
    notifications.search_console = { status: 'skipped', reason: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured' }
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 8: Auto-configure DNS (if domain purchased via Cloud Domains)
  // ─────────────────────────────────────────────────────────────

  const domainWasPurchased = (notifications.domain_purchase as any)?.status === 'registration_pending'

  if (domainWasPurchased && domain && flyIpv4 && flyIpv6 && google.isGoogleServiceConfigured()) {
    try {
      const txtRecords = dnsRecords
        .filter(r => r.type === 'TXT')
        .map(r => r.value)

      const dnsResult = await google.configureDnsRecords(domain, {
        ipv4: flyIpv4,
        ipv6: flyIpv6,
        flyAppHostname: `${flyAppName}.fly.dev`,
        txtRecords: txtRecords.length > 0 ? txtRecords : undefined,
      })
      console.log(`DNS auto-configured for ${domain}: ${dnsResult.status}`)
      notifications.dns_auto_config = {
        status: 'configured',
        records: dnsResult.additions,
      }
    } catch (err) {
      console.error('Error auto-configuring DNS:', err)
      notifications.dns_auto_config = {
        status: 'deferred',
        reason: err instanceof Error ? err.message : String(err),
        note: 'Domain registration may still be in progress. DNS records can be configured manually or will be set on domain verification.',
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 9: Email user with DNS records via Resend
  // ─────────────────────────────────────────────────────────────

  if (dnsRecords.length > 0 && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@doubleclicker.app'
      const verifyUrl = `https://${flyAppName}.fly.dev/api/provision/verify-domain?username=${username}&domain=${domain}`

      const dnsTable = dnsRecords.map(r =>
        `<tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:14px;">${r.type}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:14px;">${r.name}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:14px;">${r.value}</td>
        </tr>`
      ).join('')

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"><title>DNS Setup Required</title></head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
            <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="text-align:center;margin-bottom:30px;">
                <h1 style="color:#1e293b;font-size:24px;margin:0 0 8px;">Your new site is almost live!</h1>
                <p style="color:#64748b;font-size:16px;margin:0;">${display_name} — ${domain}</p>
              </div>

              <div style="background:#fff;border-radius:12px;padding:30px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:20px;">
                <h2 style="color:#1e293b;font-size:18px;margin:0 0 12px;">Your site is live now at:</h2>
                <p style="margin:0 0 20px;">
                  <a href="https://${flyAppName}.fly.dev" style="color:#3b82f6;font-size:16px;">https://${flyAppName}.fly.dev</a>
                </p>

                <h2 style="color:#1e293b;font-size:18px;margin:0 0 12px;">To use your custom domain (${domain}):</h2>
                <p style="color:#475569;font-size:14px;margin:0 0 16px;">Add these DNS records at your domain registrar:</p>

                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                  <thead>
                    <tr style="background:#f1f5f9;">
                      <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left;font-size:13px;color:#64748b;">Type</th>
                      <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left;font-size:13px;color:#64748b;">Name</th>
                      <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left;font-size:13px;color:#64748b;">Value</th>
                    </tr>
                  </thead>
                  <tbody>${dnsTable}</tbody>
                </table>

                <p style="color:#475569;font-size:14px;margin:0 0 8px;">DNS changes can take a few minutes to propagate.</p>
              </div>

              <div style="background:#fff;border-radius:12px;padding:30px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <h2 style="color:#1e293b;font-size:18px;margin:0 0 12px;">Once you've added the DNS records:</h2>
                <p style="color:#475569;font-size:14px;margin:0 0 16px;">Click the button below to verify your domain and activate HTTPS:</p>
                <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Verify Domain</a>
              </div>

              <div style="margin-top:30px;text-align:center;color:#94a3b8;font-size:12px;">
                <p style="margin:0;">Provisioned by Doubleclicker</p>
              </div>
            </div>
          </body>
        </html>
      `

      const { error: emailError } = await resend.emails.send({
        from: `Doubleclicker <${fromEmail}>`,
        to: [contact_email],
        subject: `Your new site is almost live — DNS setup for ${domain}`,
        html: htmlContent,
      })

      notifications.email = emailError
        ? { status: 'failed', error: emailError }
        : { status: 'sent', to: contact_email }
    } catch (err) {
      console.error('Error sending DNS email:', err)
      notifications.email = { status: 'error', error: err instanceof Error ? err.message : String(err) }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 10: Log the provisioning event
  // ─────────────────────────────────────────────────────────────

  try {
    await supabase.from('analytics_events').insert({
      event_name: 'site_provisioned',
      properties: {
        username,
        display_name,
        website_url,
        domain,
        fly_app: flyAppName,
        notifications,
        warnings,
      },
    })
  } catch {
    // best-effort
  }

  // Always return 200 with full status — never 500 for phase failures
  return NextResponse.json({
    success: true,
    message: `Site provisioned for ${username}`,
    data: results,
    notifications,
    warnings: warnings.length > 0 ? warnings : undefined,
    fly: {
      app: flyAppName,
      url: `https://${flyAppName}.fly.dev`,
      ipv4: flyIpv4,
      ipv6: flyIpv6,
    },
    dns_records: dnsRecords.length > 0 ? dnsRecords : undefined,
    google: {
      ga_measurement_id: gaId || undefined,
      gtm_public_id: gtmId || undefined,
    },
  })
}
