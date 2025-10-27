/**
 * Flash TLDR Feature
 * 
 * Generates a 2-3 sentence summary and inserts it at the top of the article.
 * Styled to match user's website CSS for competitive advantage.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TLDRRequest {
  postId: string
  content: string
  userName: string
  userStyles?: any
}

interface TLDRResponse {
  success: boolean
  updatedContent?: string
  tldrText?: string
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, userStyles }: TLDRRequest = await req.json()

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

    // Extract text content (remove HTML tags)
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    
    // Generate TLDR using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: `You are an expert content summarizer. Create a compelling 2-3 sentence summary that:
1. Captures the main value proposition
2. Includes the primary keyword naturally
3. Encourages readers to continue
4. Is under 100 words
5. Uses active voice and engaging language

Return ONLY the summary text, no additional formatting.`
        },
        {
          role: 'user',
          content: `Create a TLDR summary for this article:\n\n${textContent.substring(0, 4000)}`
        }
      ]
    })

    const tldrText = completion.choices[0].message.content?.trim() || ''
    const tokensUsed = completion.usage?.total_tokens || 0

    if (!tldrText) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate TLDR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Apply user's CSS styles if available
    const tldrStyles = userStyles?.extracted_css ? {
      backgroundColor: userStyles.extracted_css.highlightColor || '#f0f9ff',
      borderColor: userStyles.extracted_css.accentColor || '#3b82f6',
      color: userStyles.extracted_css.textColor || '#1e40af',
      fontFamily: userStyles.extracted_css.fontFamily || 'inherit'
    } : {
      backgroundColor: '#f0f9ff',
      borderColor: '#3b82f6',
      color: '#1e40af'
    }

    // Create styled TLDR HTML
    const tldrHtml = `
<div class="flash-tldr" style="
  background: linear-gradient(135deg, ${tldrStyles.backgroundColor}, ${tldrStyles.backgroundColor}dd);
  border: 2px solid ${tldrStyles.borderColor};
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  position: relative;
  font-family: ${tldrStyles.fontFamily};
">
  <div style="
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
    color: ${tldrStyles.color};
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  ">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 12l2 2 4-4"/>
      <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
      <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
    </svg>
    Key Takeaway
  </div>
  <p style="
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: ${tldrStyles.color};
    font-weight: 500;
  ">${tldrText}</p>
</div>`

    // Insert TLDR at the beginning of content (after any existing TLDR)
    let updatedContent = content
    
    // Remove any existing TLDR to avoid duplicates
    updatedContent = updatedContent.replace(/<div class="flash-tldr"[^>]*>[\s\S]*?<\/div>/gi, '')
    
    // Insert new TLDR at the very beginning
    updatedContent = tldrHtml + '\n\n' + updatedContent

    // Log execution
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('flash_execution_log')
      .insert({
        post_id: postId,
        feature_type: 'tldr',
        success: true,
        execution_time_ms: 0, // Will be calculated by orchestrator
        tokens_used: tokensUsed
      })

    console.log(`✅ TLDR generated: ${tldrText.substring(0, 50)}...`)

    const response: TLDRResponse = {
      success: true,
      updatedContent,
      tldrText,
      tokensUsed
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ TLDR generation error:', error)

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
          feature_type: 'tldr',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log TLDR error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'TLDR generation failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
