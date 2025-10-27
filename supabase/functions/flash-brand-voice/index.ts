/**
 * Flash Brand Voice Feature
 * 
 * Analyzes user's existing content to understand their writing style and voice.
 * Makes MINOR tweaks to match brand voice while preserving accuracy and quality.
 * NO full rewrites - just tone adjustments.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BrandVoiceRequest {
  postId: string
  content: string
  userName: string
  userStyles?: any
}

interface BrandVoiceResponse {
  success: boolean
  updatedContent?: string
  voiceAnalysis?: any
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, userStyles }: BrandVoiceRequest = await req.json()

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

    // Step 1: Get user's existing content to analyze their voice
    const { data: existingPosts, error: postsError } = await supabase
      .from('blog_posts')
      .select('content, title')
      .eq('user_name', userName)
      .eq('status', 'published')
      .not('content', 'is', null)
      .limit(5)
      .order('created_date', { ascending: false })

    if (postsError || !existingPosts || existingPosts.length === 0) {
      console.log('No existing content found for voice analysis, skipping brand voice')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          message: 'No existing content for voice analysis'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Analyze user's writing style
    const sampleContent = existingPosts
      .map(post => `${post.title}\n\n${post.content}`)
      .join('\n\n')
      .substring(0, 6000) // Limit for API

    const voiceAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `Analyze the writing style and voice of this content. Return a JSON object with:

{
  "tone": "professional|casual|conversational|authoritative|friendly",
  "formality": "formal|semi-formal|informal",
  "sentence_length": "short|medium|long|varied",
  "vocabulary_level": "simple|intermediate|advanced",
  "personality_traits": ["trait1", "trait2", "trait3"],
  "common_phrases": ["phrase1", "phrase2"],
  "writing_patterns": "description of patterns"
}

Focus on identifying distinctive voice characteristics.`
        },
        {
          role: 'user',
          content: `Analyze the writing voice in this content:\n\n${sampleContent}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const voiceProfile = JSON.parse(voiceAnalysis.choices[0].message.content || '{}')
    const analysisTokens = voiceAnalysis.usage?.total_tokens || 0

    // Step 3: Apply brand voice to current content (MINOR tweaks only)
    const currentText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    
    const brandVoiceAdjustment = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2, // Low temperature for consistency
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: `You are a content editor specializing in brand voice consistency. 

IMPORTANT RULES:
1. Make ONLY MINOR tweaks to match the brand voice
2. Preserve ALL facts, data, and accuracy
3. Do NOT rewrite entire sentences
4. Focus on tone, word choice, and sentence structure
5. Keep the same meaning and information
6. Make subtle adjustments only

Brand Voice Profile:
- Tone: ${voiceProfile.tone || 'professional'}
- Formality: ${voiceProfile.formality || 'semi-formal'}
- Sentence Length: ${voiceProfile.sentence_length || 'varied'}
- Vocabulary: ${voiceProfile.vocabulary_level || 'intermediate'}
- Personality: ${voiceProfile.personality_traits?.join(', ') || 'clear and direct'}

Return the content with MINOR voice adjustments only.`
        },
        {
          role: 'user',
          content: `Apply subtle brand voice adjustments to this content:\n\n${currentText}`
        }
      ]
    })

    const adjustedText = brandVoiceAdjustment.choices[0].message.content?.trim() || currentText
    const adjustmentTokens = brandVoiceAdjustment.usage?.total_tokens || 0
    const totalTokens = analysisTokens + adjustmentTokens

    // Step 4: Only update if there are meaningful changes (avoid unnecessary updates)
    const hasSignificantChanges = adjustedText !== currentText && 
      Math.abs(adjustedText.length - currentText.length) > 10

    if (!hasSignificantChanges) {
      console.log('No significant voice changes needed, content already matches brand voice')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          voiceAnalysis: voiceProfile,
          message: 'Content already matches brand voice'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 5: Reconstruct HTML with adjusted text
    // This is a simplified approach - in production, you'd want more sophisticated HTML preservation
    let updatedContent = content
    
    // Replace the main text content while preserving HTML structure
    const textNodes = content.match(/<[^>]*>|[^<]+/g) || []
    let adjustedContent = ''
    let textIndex = 0
    
    for (const node of textNodes) {
      if (node.startsWith('<')) {
        // HTML tag - keep as is
        adjustedContent += node
      } else {
        // Text content - replace with adjusted version
        const originalText = node.trim()
        if (originalText.length > 20) { // Only adjust substantial text blocks
          const adjustedNode = adjustedText.substring(textIndex, textIndex + originalText.length)
          adjustedContent += adjustedNode || node
          textIndex += originalText.length
        } else {
          adjustedContent += node
        }
      }
    }

    // Fallback: if reconstruction fails, return original content
    if (!adjustedContent || adjustedContent.length < content.length * 0.8) {
      console.log('Content reconstruction failed, returning original')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          voiceAnalysis: voiceProfile,
          message: 'Voice analysis completed, no changes applied'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log execution
    await supabase
      .from('flash_execution_log')
      .insert({
        post_id: postId,
        feature_type: 'brand-voice',
        success: true,
        execution_time_ms: 0,
        tokens_used: totalTokens
      })

    console.log(`✅ Brand voice applied: ${voiceProfile.tone} tone, ${voiceProfile.formality} formality`)

    const response: BrandVoiceResponse = {
      success: true,
      updatedContent: adjustedContent,
      voiceAnalysis: voiceProfile,
      tokensUsed: totalTokens
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Brand voice adjustment error:', error)

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
          feature_type: 'brand-voice',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log brand voice error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Brand voice adjustment failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
