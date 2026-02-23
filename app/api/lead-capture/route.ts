import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getClientIP, isRateLimited, updateRateLimitCache } from '@/lib/spam-protection'
import { getTenantConfig } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const config = getTenantConfig()
    const body = await request.json()
    const {
      name,
      email,
      company,
      company_name,
      website,
      message,
      source,
      topic,
    } = body || {}

    const companyName = company_name || company

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get client IP address
    let ipAddress: string
    try {
      ipAddress = getClientIP(request)
    } catch (error) {
      console.error('Error getting client IP:', error)
      ipAddress = 'unknown'
    }

    // Check rate limiting
    const rateLimitKey = `${ipAddress}:${source || 'default'}:${email}`
    try {
      if (isRateLimited(rateLimitKey, source)) {
        return NextResponse.json(
          { success: false, error: 'Too many submissions. Please wait a few minutes before trying again.' },
          { status: 429 }
        )
      }
    } catch (error) {
      console.error('Error checking rate limit:', error)
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase env vars missing for lead capture')
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })

    // Insert into the shared Doubleclicker `leads` table
    const insertPayload: Record<string, unknown> = {
      name: name || 'Contact Form Lead',
      email,
      company: companyName || null,
      website: website || null,
      message: message || null,
      tag: source || 'contact_form',
      brand_id: config.username,
      author_username: config.username,
      ip_address: ipAddress,
    }

    if (topic) {
      insertPayload.topic = topic
    }

    try {
      const { data: insertData, error } = await supabase
        .from('leads')
        .insert(insertPayload)
        .select()

      if (error) {
        console.error('Supabase insert error:', error)

        if (error.code === '23505') {
          return NextResponse.json(
            { success: false, error: 'This email has already been submitted.' },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { success: false, error: 'Failed to save your submission. Please try again.' },
          { status: 500 }
        )
      }

      console.log('Lead inserted successfully:', insertData?.[0]?.id)
      updateRateLimitCache(rateLimitKey, source)
    } catch (insertError) {
      console.error('Exception during lead insert:', insertError)
      return NextResponse.json(
        { success: false, error: 'An unexpected error occurred. Please try again.' },
        { status: 500 }
      )
    }

    // Send email notification via Resend
    const notificationEmail = process.env.NOTIFICATION_EMAIL || config.contactEmail
    if (process.env.RESEND_API_KEY && notificationEmail) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail = process.env.RESEND_FROM_EMAIL || `noreply@${new URL(config.siteUrl).hostname}`

        const sourceDisplay = source || 'Contact Form'

        const sanitize = (str: string | null | undefined): string => {
          if (!str) return ''
          return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
        }

        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><title>New Lead: ${sourceDisplay}</title></head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 40px;">
                  <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">New Lead Submission</h1>
                  <p style="color: #64748b; font-size: 16px; margin: 0;">${sourceDisplay} - ${sanitize(config.siteName)}</p>
                </div>
                <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">Contact Information</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600; width: 140px;">Name:</td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${sanitize(name) || 'Not provided'}</td></tr>
                    <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Email:</td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;"><a href="mailto:${sanitize(email)}" style="color: #3b82f6; text-decoration: none;">${sanitize(email)}</a></td></tr>
                    ${companyName ? `<tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Company:</td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${sanitize(companyName)}</td></tr>` : ''}
                    ${topic ? `<tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Topic:</td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${sanitize(topic)}</td></tr>` : ''}
                  </table>
                </div>
                ${message ? `<div style="background-color: #ffffff; border-radius: 12px; padding: 30px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">Message</h2><div style="color: #334155; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${sanitize(message).replace(/\n/g, '<br>')}</div></div>` : ''}
                <div style="margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px;">
                  <p style="margin: 0;">Lead captured from ${sanitize(config.siteName)}</p>
                </div>
              </div>
            </body>
          </html>
        `

        const { error: emailError } = await resend.emails.send({
          from: `${config.siteName} <${fromEmail}>`,
          to: [notificationEmail],
          subject: `New Lead: ${sanitize(sourceDisplay)} - ${sanitize(companyName || name || email)}`,
          html: htmlContent,
        })

        if (emailError) {
          console.error('Resend email error:', emailError)
        }
      } catch (emailErr) {
        console.error('Error sending email notification:', emailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead capture API error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
