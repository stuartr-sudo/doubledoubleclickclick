/**
 * Flash Humanize Content Feature
 * 
 * Makes AI-generated text more natural and human-like.
 * Uses OpenAI to detect and improve robotic language patterns.
 * Preserves meaning while enhancing readability and flow.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HumanizeRequest {
  postId: string
  content: string
  userName: string
  userStyles?: any
}

interface HumanizeResponse {
  success: boolean
  updatedContent?: string
  humanizationScore?: number
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, userStyles }: HumanizeRequest = await req.json()

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
    
    // Step 1: Analyze content for AI-like patterns
    const aiDetection = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: `Analyze this text for AI-generated patterns. Return a JSON object with:

{
  "ai_score": 0-100,
  "issues": ["repetitive phrases", "overly formal", "lack of personality", "robotic structure"],
  "suggestions": ["add contractions", "vary sentence length", "include personal touches"]
}

Score 0-30: Very human-like
Score 31-60: Somewhat AI-like
Score 61-100: Very AI-like`
        },
        {
          role: 'user',
          content: `Analyze this content for AI patterns:\n\n${textContent.substring(0, 3000)}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const aiAnalysis = JSON.parse(aiDetection.choices[0].message.content || '{}')
    const detectionTokens = aiDetection.usage?.total_tokens || 0

    // If content is already very human-like, skip humanization
    if (aiAnalysis.ai_score < 30) {
      console.log('Content already human-like, skipping humanization')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          humanizationScore: aiAnalysis.ai_score,
          message: 'Content already human-like'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Humanize the content
    const humanization = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4, // Slightly higher for more natural variation
      max_tokens: 2500,
      messages: [
        {
          role: 'system',
          content: `You are an expert content humanizer. Make AI-generated text more natural and human-like while preserving all facts and meaning.

HUMANIZATION TECHNIQUES:
1. Add natural contractions (don't, can't, won't, etc.)
2. Vary sentence length and structure
3. Include subtle personality and voice
4. Use more conversational language
5. Add natural transitions and flow
6. Remove repetitive patterns
7. Include occasional informal touches
8. Make it feel like a real person wrote it

PRESERVE:
- All facts and data
- Technical accuracy
- Professional tone (if appropriate)
- Original meaning and intent
- Important details

Focus on making it sound natural, not robotic.`
        },
        {
          role: 'user',
          content: `Humanize this content:\n\n${textContent}`
        }
      ]
    })

    const humanizedText = humanization.choices[0].message.content?.trim() || textContent
    const humanizationTokens = humanization.usage?.total_tokens || 0
    const totalTokens = detectionTokens + humanizationTokens

    // Step 3: Reconstruct HTML with humanized text
    // This is a simplified approach - in production, you'd want more sophisticated HTML preservation
    let updatedContent = content
    
    // For now, we'll do a simple text replacement approach
    // In production, you'd want to preserve HTML structure more carefully
    const textBlocks = textContent.split(/(\s+)/)
    const humanizedBlocks = humanizedText.split(/(\s+)/)
    
    if (textBlocks.length > 10 && humanizedBlocks.length > 10) {
      // Replace substantial text content while preserving HTML
      const htmlTags = content.match(/<[^>]*>/g) || []
      const textOnly = content.replace(/<[^>]*>/g, '|||HTML_TAG|||')
      const parts = textOnly.split('|||HTML_TAG|||')
      
      let reconstructed = ''
      let humanizedIndex = 0
      
      for (let i = 0; i < parts.length; i++) {
        reconstructed += parts[i]
        if (i < htmlTags.length) {
          reconstructed += htmlTags[i]
        }
      }
      
      // Simple approach: replace the main text content
      const originalText = textContent
      const newText = humanizedText
      
      if (originalText.length > 50 && newText.length > 50) {
        updatedContent = content.replace(originalText, newText)
      }
    }

    // Fallback: if reconstruction seems problematic, return original
    if (!updatedContent || updatedContent.length < content.length * 0.5) {
      console.log('Content reconstruction failed, returning original')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          humanizationScore: aiAnalysis.ai_score,
          message: 'Humanization analysis completed, no changes applied'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 4: Re-analyze to get final humanization score
    const finalAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      max_tokens: 100,
      messages: [
        {
          role: 'system',
          content: `Rate how human-like this text sounds (0-100, where 0 is very human, 100 is very AI-like). Return only a number.`
        },
        {
          role: 'user',
          content: `Rate this text: ${updatedContent.replace(/<[^>]*>/g, ' ').substring(0, 1000)}`
        }
      ]
    })

    const finalScore = parseInt(finalAnalysis.choices[0].message.content?.trim() || '50')

    // Log execution
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('flash_execution_log')
      .insert({
        post_id: postId,
        feature_type: 'humanize',
        success: true,
        execution_time_ms: 0,
        tokens_used: totalTokens
      })

    console.log(`✅ Content humanized: AI score ${aiAnalysis.ai_score} → ${finalScore}`)

    const response: HumanizeResponse = {
      success: true,
      updatedContent,
      humanizationScore: finalScore,
      tokensUsed: totalTokens
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Content humanization error:', error)

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
          feature_type: 'humanize',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log humanization error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Content humanization failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
