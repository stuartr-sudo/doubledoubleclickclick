import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getClientIP, isRateLimited, checkEmailExists, updateRateLimitCache } from '@/lib/spam-protection'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      company,
      company_name, // Handle both company and company_name
      website,
      message,
      plan_type,
      source,
      topic, // Topic from contact form
    } = body || {}

    // Use company_name if provided, otherwise fall back to company
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

    // Create rate limit key (used for both checking and updating)
    const rateLimitKey = `${ipAddress}:${source || 'default'}:${email}`

    // Check rate limiting by IP (more lenient for legitimate forms)
    // Allow different emails from same IP to prevent blocking legitimate users
    try {
      if (isRateLimited(rateLimitKey, source)) {
        return NextResponse.json(
          { success: false, error: 'Too many submissions from this email address. Please wait a few minutes before trying again.' },
          { status: 429 }
        )
      }
    } catch (error) {
      console.error('Error checking rate limit:', error)
      // Continue processing if rate limit check fails (fail open)
    }

    // Check if email already exists (globally across all sources)
    let emailExists = false
    try {
      emailExists = await checkEmailExists(email)
    } catch (error) {
      console.error('Error checking email existence:', error)
      // Continue processing if email check fails (fail open)
    }
    
    if (emailExists) {
      return NextResponse.json(
        { success: false, error: 'This email has already been registered. Each email can only be used once.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase env vars missing for lead capture')
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
      const insertPayload = {
        name: name || 'Questions Discovery Lead',
        email,
        company: companyName || null,
        website: website || null,
        message: message || null,
        plan_type: plan_type || null,
        source: source || null,
        topic: topic || null,
        ip_address: ipAddress,
      }
      
      console.log('Attempting to insert lead capture:', { 
        email, 
        source, 
        hasName: !!name,
        hasCompany: !!companyName,
        hasWebsite: !!website,
        hasMessage: !!message
      })

      const { data: insertData, error } = await supabase
        .from('lead_captures')
        .insert(insertPayload)
        .select()

      if (error) {
        console.error('Supabase insert error:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        console.error('Full error object:', JSON.stringify(error, null, 2))
        
        // Check for specific error types
        if (error.code === '23505') { // Unique constraint violation
          return NextResponse.json(
            { success: false, error: 'This email has already been registered. Each email can only be used once.' },
            { status: 400 }
          )
        }
        
        // Check for missing column errors
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          console.error('DATABASE SCHEMA ERROR: Missing column detected')
          return NextResponse.json(
            { 
              success: false, 
              error: 'Database configuration error. Please contact support at stuartr@sewo.io.',
              details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
          )
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to save your submission. Please try again or contact us directly at stuartr@sewo.io.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 500 }
        )
      }

      console.log('Lead capture inserted successfully:', insertData)
      
      // Update rate limit cache AFTER successful submission
      // This prevents blocking legitimate retries after failed submissions
      updateRateLimitCache(rateLimitKey, source)
    } catch (insertError) {
      console.error('Exception during lead capture insert:', insertError)
      console.error('Exception type:', insertError instanceof Error ? insertError.constructor.name : typeof insertError)
      console.error('Exception message:', insertError instanceof Error ? insertError.message : String(insertError))
      console.error('Exception stack:', insertError instanceof Error ? insertError.stack : 'No stack trace')
      
      const errorMsg = insertError instanceof Error ? insertError.message : 'Unknown error'
      return NextResponse.json(
        { 
          success: false, 
          error: 'An error occurred while saving your submission. Please try again or contact us directly at stuartr@sewo.io.',
          details: process.env.NODE_ENV === 'development' ? errorMsg : undefined
        },
        { status: 500 }
      )
    }

    // Send email notification via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        // Format source for display
        const sourceDisplay = source === 'apply_to_work_with_us' 
          ? 'Apply to Work With Us Form' 
          : source || 'Contact Form'

        // Sanitize strings for HTML to prevent injection
        const sanitize = (str: string | null | undefined): string => {
          if (!str) return ''
          return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
        }

        // Create HTML email content
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Lead: ${sourceDisplay}</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">
                    New Lead Submission
                  </h1>
                  <p style="color: #64748b; font-size: 16px; margin: 0;">
                    ${sourceDisplay}
                  </p>
                </div>

                <!-- Lead Details -->
                <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">
                    Contact Information
                  </h2>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600; width: 140px;">Name:</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${sanitize(name) || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Email:</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;"><a href="mailto:${sanitize(email)}" style="color: #3b82f6; text-decoration: none;">${sanitize(email)}</a></td>
                    </tr>
                    ${companyName ? `
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Company:</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${sanitize(companyName)}</td>
                    </tr>
                    ` : ''}
                    ${website ? `
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Website:</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;"><a href="${sanitize(website)}" target="_blank" style="color: #3b82f6; text-decoration: none;">${sanitize(website)}</a></td>
                    </tr>
                    ` : ''}
                    ${topic ? `
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Topic:</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${sanitize(topic)}</td>
                    </tr>
                    ` : ''}
                    ${source ? `
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Source:</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${sanitize(sourceDisplay)}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>

                ${message ? `
                <!-- Message Content -->
                <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">
                    Message
                  </h2>
                  <div style="color: #334155; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${sanitize(message).replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}

                <!-- Footer -->
                <div style="margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px;">
                  <p style="margin: 0;">
                    This lead was captured from <a href="https://www.sewo.io" style="color: #3b82f6; text-decoration: none;">sewo.io</a>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `

        // Send email notification
        const { data, error: emailError } = await resend.emails.send({
          from: 'SEWO <stuartr@sewo.io>', // Update with your verified domain
          to: ['stuartr@sewo.io'], // Notification recipient
          subject: `New Lead: ${sanitize(sourceDisplay)} - ${sanitize(companyName || name || email)}`,
          html: htmlContent,
        })

        if (emailError) {
          console.error('Resend email error:', emailError)
          // Don't fail the request if email fails, just log it
        } else {
          console.log('Email notification sent successfully:', data?.id)
        }
      } catch (emailErr) {
        console.error('Error sending email notification:', emailErr)
        // Don't fail the request if email fails, just log it
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead capture API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error'
    const errorStack = error instanceof Error ? error.stack : String(error)
    console.error('Error details:', { errorMessage, errorStack })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred while processing your submission. Please try again or contact us directly at stuartr@sewo.io.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}


