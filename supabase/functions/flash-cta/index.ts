/**
 * Flash CTA (Call-to-Action) Buttons Feature
 * 
 * Adds strategic call-to-action buttons throughout the content.
 * Places mid-content and end-content CTAs based on content analysis.
 * Styled to match user's website design for consistency.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CTARequest {
  postId: string
  content: string
  userName: string
  userStyles?: any
}

interface CTAResponse {
  success: boolean
  updatedContent?: string
  ctaButtons?: any[]
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, userStyles }: CTARequest = await req.json()

    if (!postId || !content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Step 1: Get user's website URL for CTA context
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('website_url, business_name')
      .eq('user_name', userName)
      .single()

    const websiteUrl = userProfile?.website_url || '#'
    const businessName = userProfile?.business_name || 'our service'

    // Step 2: Analyze content for CTA opportunities
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    
    const ctaAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `Analyze this content and suggest strategic CTA button placements. Return a JSON object with:

{
  "cta_opportunities": [
    {
      "position": "mid-content|end-content",
      "context": "what section this relates to",
      "button_text": "suggested button text",
      "action": "what the button should do",
      "urgency": "high|medium|low"
    }
  ],
  "content_type": "blog|tutorial|review|guide|news",
  "target_audience": "description of likely readers"
}

Focus on natural, non-intrusive CTA placements that add value.`
        },
        {
          role: 'user',
          content: `Analyze CTA opportunities in this content:\n\n${textContent.substring(0, 3000)}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(ctaAnalysis.choices[0].message.content || '{}')
    const analysisTokens = ctaAnalysis.usage?.total_tokens || 0

    if (!analysis.cta_opportunities || analysis.cta_opportunities.length === 0) {
      console.log('No CTA opportunities identified')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          message: 'No CTA opportunities identified'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Generate CTA buttons
    const ctaButtons = analysis.cta_opportunities.map((cta: any, index: number) => {
      // Apply user's CSS styles if available
      const buttonStyles = userStyles?.extracted_css ? {
        primaryColor: userStyles.extracted_css.accentColor || '#3b82f6',
        backgroundColor: userStyles.extracted_css.cardBackground || '#ffffff',
        textColor: userStyles.extracted_css.textColor || '#ffffff',
        borderColor: userStyles.extracted_css.borderColor || '#e5e7eb',
        fontFamily: userStyles.extracted_css.fontFamily || 'inherit'
      } : {
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#ffffff',
        borderColor: '#e5e7eb'
      }

      // Determine button style based on urgency
      const buttonStyle = cta.urgency === 'high' ? {
        background: `linear-gradient(135deg, ${buttonStyles.primaryColor}, ${buttonStyles.primaryColor}dd)`,
        color: buttonStyles.textColor,
        border: 'none',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
      } : {
        background: buttonStyles.backgroundColor,
        color: buttonStyles.primaryColor,
        border: `2px solid ${buttonStyles.primaryColor}`,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }

      return {
        id: `cta-${index + 1}`,
        position: cta.position,
        context: cta.context,
        buttonText: cta.button_text,
        action: cta.action,
        urgency: cta.urgency,
        html: `
<div class="flash-cta" style="
  text-align: center;
  margin: 2em 0;
  padding: 1.5em;
  background: ${buttonStyles.backgroundColor};
  border: 1px solid ${buttonStyles.borderColor};
  border-radius: 12px;
  font-family: ${buttonStyles.fontFamily};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
">
  <p style="
    margin: 0 0 1em 0;
    font-size: 16px;
    color: ${buttonStyles.textColor};
    font-weight: 500;
  ">${cta.context}</p>
  <a href="${websiteUrl}" style="
    display: inline-block;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.3s ease;
    ${Object.entries(buttonStyle).map(([key, value]) => `${key}: ${value};`).join(' ')}
  " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.1)'">
    ${cta.button_text}
  </a>
</div>`
      }
    })

    // Step 4: Insert CTAs into content
    let updatedContent = content

    // Remove any existing CTAs to avoid duplicates
    updatedContent = updatedContent.replace(/<div class="flash-cta"[^>]*>[\s\S]*?<\/div>/gi, '')

    // Insert mid-content CTAs
    const midContentCTAs = ctaButtons.filter(cta => cta.position === 'mid-content')
    if (midContentCTAs.length > 0) {
      // Find the middle of the content (after first 40% of paragraphs)
      const paragraphs = updatedContent.split('</p>')
      const midPoint = Math.floor(paragraphs.length * 0.4)
      
      if (midPoint > 0 && midPoint < paragraphs.length - 1) {
        const insertPoint = paragraphs.slice(0, midPoint).join('</p>').length + '</p>'.length
        const midCTA = midContentCTAs[0] // Use first mid-content CTA
        
        updatedContent = 
          updatedContent.substring(0, insertPoint) + 
          '\n\n' + midCTA.html + '\n\n' + 
          updatedContent.substring(insertPoint)
      }
    }

    // Insert end-content CTAs
    const endContentCTAs = ctaButtons.filter(cta => cta.position === 'end-content')
    if (endContentCTAs.length > 0) {
      // Insert before the last paragraph or conclusion
      const lastParagraphIndex = updatedContent.lastIndexOf('</p>')
      if (lastParagraphIndex > -1) {
        const endCTA = endContentCTAs[0] // Use first end-content CTA
        
        updatedContent = 
          updatedContent.substring(0, lastParagraphIndex) + 
          '\n\n' + endCTA.html + '\n\n' + 
          updatedContent.substring(lastParagraphIndex)
      } else {
        // Fallback: append to end
        updatedContent += '\n\n' + endContentCTAs[0].html
      }
    }

    // Log execution
    await supabase
      .from('flash_execution_log')
      .insert({
        post_id: postId,
        feature_type: 'cta',
        success: true,
        execution_time_ms: 0,
        tokens_used: analysisTokens
      })

    console.log(`✅ CTAs added: ${ctaButtons.length} buttons (${midContentCTAs.length} mid, ${endContentCTAs.length} end)`)

    const response: CTAResponse = {
      success: true,
      updatedContent,
      ctaButtons: ctaButtons.map(cta => ({
        id: cta.id,
        position: cta.position,
        context: cta.context,
        buttonText: cta.buttonText,
        action: cta.action,
        urgency: cta.urgency
      })),
      tokensUsed: analysisTokens
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ CTA generation error:', error)

    // Log failure
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase
        .from('flash_execution_log')
        .insert({
          post_id: req.body?.postId,
          feature_type: 'cta',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log CTA error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'CTA generation failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
