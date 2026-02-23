import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import * as fly from '@/lib/fly'

export const dynamic = 'force-dynamic'

/**
 * GET /api/provision/verify-domain — Check if DNS is configured and cert is issued.
 *
 * Query params:
 *   username - The tenant username
 *   domain   - The custom domain to verify
 *
 * Can be called by clicking the link in the DNS setup email.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const domain = searchParams.get('domain')

  if (!username || !domain) {
    return NextResponse.json(
      { success: false, error: 'Missing username or domain parameter' },
      { status: 400 }
    )
  }

  if (!process.env.FLY_API_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Fly.io not configured' },
      { status: 500 }
    )
  }

  const flyAppName = `${username}-blog`

  try {
    // Check certificate status for www subdomain
    const certData = await fly.checkCertificate(flyAppName, `www.${domain}`)

    const isIssued = certData?.data?.acme_certificate?.configured ||
                     certData?.data?.certificate?.configured ||
                     certData?.configured

    if (isIssued) {
      // Certificate is live — update the DB with the final domain
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        })

        const liveUrl = `https://www.${domain}`

        // Update brand_guidelines
        await supabase
          .from('brand_guidelines')
          .update({ website_url: liveUrl })
          .eq('user_name', username)

        // Update company_information
        await supabase
          .from('company_information')
          .update({ client_website: liveUrl })
          .eq('username', username)

        // Send confirmation email
        if (process.env.RESEND_API_KEY) {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY)
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@doubleclicker.app'

            // Look up contact email
            const { data: company } = await supabase
              .from('company_information')
              .select('email')
              .eq('username', username)
              .single()

            if (company?.email) {
              await resend.emails.send({
                from: `Doubleclicker <${fromEmail}>`,
                to: [company.email],
                subject: `Your site is live at ${liveUrl}`,
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head><meta charset="utf-8"></head>
                    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
                      <div style="max-width:600px;margin:0 auto;padding:40px 20px;text-align:center;">
                        <h1 style="color:#1e293b;font-size:28px;margin:0 0 16px;">Your site is live!</h1>
                        <p style="color:#475569;font-size:16px;margin:0 0 24px;">DNS is configured and HTTPS is active.</p>
                        <a href="${liveUrl}" style="display:inline-block;padding:14px 32px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">${liveUrl}</a>
                        <p style="color:#94a3b8;font-size:13px;margin-top:30px;">Content from Doubleclicker will appear on your blog automatically as it's published.</p>
                      </div>
                    </body>
                  </html>
                `,
              })
            }
          } catch (emailErr) {
            console.error('Error sending confirmation email:', emailErr)
          }
        }
      }

      return NextResponse.json({
        success: true,
        status: 'live',
        live_url: `https://www.${domain}`,
        message: `Your site is live at https://www.${domain}!`,
      })
    }

    // Certificate not yet issued — DNS probably not propagated
    return NextResponse.json({
      success: false,
      status: 'pending',
      message: 'DNS has not propagated yet. This can take a few minutes. Please try again shortly.',
      dns_records: [
        { type: 'CNAME', name: 'www', value: `${flyAppName}.fly.dev` },
        { type: 'A', name: '@', value: 'Check your provisioning email for the IP address' },
      ],
      raw: certData,
    })
  } catch (err) {
    console.error('Error checking certificate:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to check domain status' },
      { status: 500 }
    )
  }
}
