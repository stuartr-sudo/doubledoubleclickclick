import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import * as fly from '@/lib/fly'
import * as google from '@/lib/google'

export const dynamic = 'force-dynamic'

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
 * Protected by PROVISION_SECRET bearer token.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify provision secret
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
      product_url,
      approved_products,
      seed_keywords,
      niche,
      fly_region = 'syd',
      skip_pipeline = false,
      skip_deploy = false,
      setup_google_analytics = false,
      setup_google_tag_manager = false,
      setup_search_console = false,
      purchase_domain = false,
      domain_yearly_price,
      domain_notices,
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

    // ─────────────────────────────────────────────────────────────
    // PHASE 1: Seed the shared database
    // No unique constraints exist on these tables, so we check for
    // existing rows first and insert or update accordingly.
    // ─────────────────────────────────────────────────────────────

    // 1. brand_guidelines
    const guidelinesPayload = {
      user_name: username,
      name: display_name,
      website_url: website_url || null,
      brand_personality: brand_voice_tone || null,
      default_author: author_name || display_name,
      author_bio: author_bio || null,
      author_image_url: author_image_url || null,
    }

    const { data: existingGuidelines } = await supabase
      .from('brand_guidelines')
      .select('id')
      .eq('user_name', username)
      .limit(1)
      .single()

    let guidelinesData
    let guidelinesError

    if (existingGuidelines) {
      const res = await supabase
        .from('brand_guidelines')
        .update(guidelinesPayload)
        .eq('user_name', username)
        .select()
      guidelinesData = res.data
      guidelinesError = res.error
    } else {
      const res = await supabase
        .from('brand_guidelines')
        .insert(guidelinesPayload)
        .select()
      guidelinesData = res.data
      guidelinesError = res.error
    }

    if (guidelinesError) {
      console.error('Error saving brand_guidelines:', guidelinesError)
      return NextResponse.json(
        { success: false, error: 'Failed to create brand guidelines', details: guidelinesError.message },
        { status: 500 }
      )
    }
    results.brand_guidelines = guidelinesData

    // 2. brand_specifications
    if (guidelinesData && guidelinesData[0]?.id) {
      const specsPayload = {
        guideline_id: guidelinesData[0].id,
        user_name: username,
        primary_color: primary_color || '#000000',
        accent_color: accent_color || '#ffffff',
        secondary_color: accent_color || '#ffffff',
        logo_url: logo_url || null,
        heading_font: heading_font || null,
        body_font: body_font || null,
      }

      const { data: existingSpecs } = await supabase
        .from('brand_specifications')
        .select('id')
        .eq('user_name', username)
        .limit(1)
        .single()

      if (existingSpecs) {
        const { data, error } = await supabase
          .from('brand_specifications')
          .update(specsPayload)
          .eq('user_name', username)
          .select()
        if (error) console.error('Error updating brand_specifications:', error)
        results.brand_specifications = data
      } else {
        const { data, error } = await supabase
          .from('brand_specifications')
          .insert(specsPayload)
          .select()
        if (error) console.error('Error inserting brand_specifications:', error)
        results.brand_specifications = data
      }
    }

    // 3. company_information
    const companyPayload = {
      username: username,
      client_website: website_url || null,
      email: contact_email,
      blurb: blurb || null,
      target_market: target_market || null,
    }

    const { data: existingCompany } = await supabase
      .from('company_information')
      .select('id')
      .eq('username', username)
      .limit(1)
      .single()

    if (existingCompany) {
      const { data, error } = await supabase
        .from('company_information')
        .update(companyPayload)
        .eq('username', username)
        .select()
      if (error) console.error('Error updating company_information:', error)
      results.company_information = data
    } else {
      const { data, error } = await supabase
        .from('company_information')
        .insert(companyPayload)
        .select()
      if (error) console.error('Error inserting company_information:', error)
      results.company_information = data
    }

    // 4. Default author
    const authorSlug = (author_name || display_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const authorPayload = {
      user_name: username,
      name: author_name || display_name,
      bio: author_bio || `Author at ${display_name}`,
      profile_image_url: author_image_url || null,
      slug: authorSlug,
    }

    const { data: existingAuthor } = await supabase
      .from('authors')
      .select('id')
      .eq('user_name', username)
      .eq('slug', authorSlug)
      .limit(1)
      .single()

    if (existingAuthor) {
      const { data, error } = await supabase
        .from('authors')
        .update(authorPayload)
        .eq('id', existingAuthor.id)
        .select()
      if (error) console.error('Error updating author:', error)
      results.author = data
    } else {
      const { data, error } = await supabase
        .from('authors')
        .insert(authorPayload)
        .select()
      if (error) console.error('Error inserting author:', error)
      results.author = data
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
    // ─────────────────────────────────────────────────────────────

    const doubleclickerUrl = process.env.DOUBLECLICKER_API_URL
    if (!skip_pipeline && doubleclickerUrl) {
      try {
        const onboardPayload: Record<string, unknown> = {
          username,
          displayName: display_name,
          assignToEmail: contact_email,
        }
        if (website_url) onboardPayload.websiteUrl = website_url
        if (product_url) onboardPayload.productUrl = product_url
        if (niche) onboardPayload.niche = niche
        if (seed_keywords?.length) onboardPayload.seed_keywords = seed_keywords

        // Pass approved products so Doubleclicker can create promoted_products
        // records and scrape each URL into the RAG knowledge base.
        // Products in the same niche share one pipeline run (same clusters).
        // Unrelated products should be sent via separate onboard calls.
        if (Array.isArray(approved_products) && approved_products.length > 0) {
          // First product becomes the primary (used for product page)
          if (!product_url && approved_products[0]?.url) {
            onboardPayload.productUrl = approved_products[0].url
            onboardPayload.product_name = approved_products[0].name
          }
          // All product URLs get scraped into RAG + created as promoted_products
          onboardPayload.approved_products = approved_products
          // Additional URLs (beyond primary) for RAG scraping
          const additionalUrls = approved_products
            .slice(product_url ? 0 : 1)
            .map((p: { url?: string }) => p.url)
            .filter(Boolean)
          if (additionalUrls.length > 0) {
            onboardPayload.additional_urls = additionalUrls
          }
        }

        const onboardRes = await fetch(`${doubleclickerUrl}/api/strategy/auto-onboard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-provision-secret': provisionSecret,
          },
          body: JSON.stringify(onboardPayload),
        })

        const onboardData = await onboardRes.json().catch(() => ({}))
        notifications.doubleclicker = {
          status: onboardRes.ok ? 'triggered' : 'failed',
          statusCode: onboardRes.status,
          data: onboardData,
        }
      } catch (err) {
        console.error('Error notifying Doubleclicker:', err)
        notifications.doubleclicker = { status: 'error', error: err instanceof Error ? err.message : String(err) }
      }
    } else {
      notifications.doubleclicker = { status: 'skipped', reason: !doubleclickerUrl ? 'DOUBLECLICKER_API_URL not set' : 'skip_pipeline=true' }
    }

    // ─────────────────────────────────────────────────────────────
    // PHASE 3: Deploy to Fly.io
    // ─────────────────────────────────────────────────────────────

    const flyAppName = `${username}-blog`
    const flyOrgSlug = process.env.FLY_ORG_SLUG || 'personal'
    const flyBaseApp = process.env.FLY_BASE_APP || 'doubledoubleclickclick'
    let flyIpv4 = ''
    let flyIpv6 = ''

    if (!skip_deploy && process.env.FLY_API_TOKEN) {
      try {
        // 1. Get the Docker image from the base app
        const imageRef = await fly.getAppImage(flyBaseApp)
        console.log(`Using image from ${flyBaseApp}: ${imageRef}`)

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

        // 4. Allocate IPs (required for custom domains)
        flyIpv4 = await fly.allocateIpv4(flyAppName)
        flyIpv6 = await fly.allocateIpv6(flyAppName)
        console.log(`Allocated IPs: ${flyIpv4} / ${flyIpv6}`)

        // 5. Create machine with site-specific env vars (including GA/GTM IDs if created)
        const siteUrl = domain ? `https://www.${domain}` : website_url || `https://${flyAppName}.fly.dev`
        const machineEnv: Record<string, string> = {
          NEXT_PUBLIC_BRAND_USERNAME: username,
          NEXT_PUBLIC_SITE_URL: siteUrl,
          NEXT_PUBLIC_SITE_NAME: display_name,
          NEXT_PUBLIC_CONTACT_EMAIL: contact_email,
        }
        if (gaId) machineEnv.NEXT_PUBLIC_GA_ID = gaId
        if (gtmId) machineEnv.NEXT_PUBLIC_GTM_ID = gtmId
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
    // PHASE 4: Purchase domain via Google Cloud Domains (optional)
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
    // PHASE 5: Add custom domain + request TLS certificate
    // ─────────────────────────────────────────────────────────────

    const dnsRecords: Array<{ type: string; name: string; value: string }> = []

    if (domain && (notifications.fly as Record<string, unknown>)?.status === 'deployed') {
      try {
        // Request certs for both www and apex
        const wwwCert = await fly.addCertificate(flyAppName, `www.${domain}`)
        const apexCert = await fly.addCertificate(flyAppName, domain)

        // Build DNS records the user needs to add
        dnsRecords.push(
          { type: 'CNAME', name: 'www', value: `${flyAppName}.fly.dev` },
          { type: 'A', name: '@', value: flyIpv4 },
          { type: 'AAAA', name: '@', value: flyIpv6 },
        )

        notifications.domain = {
          status: 'certificates_requested',
          domain,
          www_cert: wwwCert,
          apex_cert: apexCert,
          dns_records: dnsRecords,
        }
      } catch (err) {
        console.error('Error adding domain:', err)
        notifications.domain = { status: 'error', error: err instanceof Error ? err.message : String(err) }
      }
    } else if (domain) {
      notifications.domain = { status: 'skipped', reason: 'Fly deployment did not succeed' }
    }

    // ─────────────────────────────────────────────────────────────
    // PHASE 6: Add to Google Search Console + get verification token
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
        // Add verification TXT record to DNS records list
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
    // PHASE 7: Auto-configure DNS (if domain purchased via Cloud Domains)
    // ─────────────────────────────────────────────────────────────

    const domainWasPurchased = (notifications.domain_purchase as any)?.status === 'registration_pending'

    if (domainWasPurchased && domain && flyIpv4 && flyIpv6 && google.isGoogleServiceConfigured()) {
      try {
        // Collect TXT records (Search Console verification, etc.)
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
        // Non-fatal — domain may not be active yet (registration takes 1-2 min)
        notifications.dns_auto_config = {
          status: 'deferred',
          reason: err instanceof Error ? err.message : String(err),
          note: 'Domain registration may still be in progress. DNS records can be configured manually or will be set on domain verification.',
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // PHASE 8: Email user with DNS records via Resend
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
    // PHASE 9: Log the provisioning event
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
        },
      })
    } catch {
      // best-effort
    }

    return NextResponse.json({
      success: true,
      message: `Site provisioned for ${username}`,
      data: results,
      notifications,
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
  } catch (error) {
    console.error('Provision API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
