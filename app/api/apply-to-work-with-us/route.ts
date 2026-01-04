import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getClientIP } from '@/lib/spam-protection'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      company_name,
      contact_name,
      email_address,
      website_url,
      company_description,
      current_challenges,
      goals,
    } = body || {}

    // Validate required fields
    if (!email_address || !company_name || !contact_name) {
      return NextResponse.json(
        { success: false, error: 'Company name, contact name, and email address are required.' },
        { status: 400 }
      )
    }

    // Get client IP address
    const ipAddress = getClientIP(request)

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase env vars missing')
      return NextResponse.json(
        { success: false, error: 'Server configuration error. Please contact support at stuartr@sewo.io.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Insert into dedicated table
    const { data: insertData, error } = await supabase
      .from('apply_to_work_with_us')
      .insert({
        company_name,
        contact_name,
        email_address,
        website_url: website_url || null,
        company_description: company_description || null,
        current_challenges: current_challenges || null,
        goals: goals || null,
        ip_address: ipAddress,
      })
      .select()

    if (error) {
      console.error('Database insert error:', error)
      
      // Check for duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'This email has already been registered. Each email can only be used once.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Database error: ${error.message}. Please try again or contact support at stuartr@sewo.io.`,
          details: process.env.NODE_ENV === 'development' ? JSON.stringify(error) : undefined
        },
        { status: 500 }
      )
    }

    console.log('Application submitted successfully:', insertData)

    // Send email notification via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        // Sanitize strings for HTML
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
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Application: Apply to Work With Us</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 40px;">
                  <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">
                    New Application: Apply to Work With Us
                  </h1>
                </div>

                <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">
                    Contact Information
                  </h2>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600; width: 140px;">Company:</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${sanitize(company_name)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Contact Name:</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${sanitize(contact_name)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Email:</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;"><a href="mailto:${sanitize(email_address)}" style="color: #3b82f6; text-decoration: none;">${sanitize(email_address)}</a></td>
                    </tr>
                    ${website_url ? `
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Website:</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;"><a href="${sanitize(website_url)}" target="_blank" style="color: #3b82f6; text-decoration: none;">${sanitize(website_url)}</a></td>
                    </tr>
                    ` : ''}
                  </table>
                </div>

                ${company_description ? `
                <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">Company Description</h2>
                  <div style="color: #334155; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${sanitize(company_description).replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}

                ${current_challenges ? `
                <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">Current Challenges</h2>
                  <div style="color: #334155; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${sanitize(current_challenges).replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}

                ${goals ? `
                <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">Goals</h2>
                  <div style="color: #334155; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${sanitize(goals).replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}

                <div style="margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px;">
                  <p style="margin: 0;">
                    This application was submitted from <a href="https://www.sewo.io" style="color: #3b82f6; text-decoration: none;">sewo.io</a>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `

        await resend.emails.send({
          from: 'SEWO <stuartr@sewo.io>',
          to: ['stuartr@sewo.io'],
          subject: `New Application: ${sanitize(company_name)} - ${sanitize(contact_name)}`,
          html: htmlContent,
        })

        console.log('Email notification sent successfully')
      } catch (emailErr) {
        console.error('Error sending email notification:', emailErr)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Apply to Work With Us API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error'
    
    return NextResponse.json(
      { 
        success: false, 
        error: `An error occurred: ${errorMessage}. Please try again or contact support at stuartr@sewo.io.`,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}
