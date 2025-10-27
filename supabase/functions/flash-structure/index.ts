/**
 * Flash Structure Optimization Feature
 * 
 * Optimizes content structure for scannability and readability.
 * Breaks up large text blocks, adds subheadings, improves formatting.
 * Makes content more appealing to both humans and search engines.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StructureRequest {
  postId: string
  content: string
  userName: string
  userStyles?: any
}

interface StructureResponse {
  success: boolean
  updatedContent?: string
  structureChanges?: any
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, userStyles }: StructureRequest = await req.json()

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

    // Extract text content for analysis
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    
    // Step 1: Analyze current structure
    const structureAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `Analyze this content's structure and identify areas for improvement. Return a JSON object with:

{
  "readability_score": 0-100,
  "issues": ["long paragraphs", "missing subheadings", "dense text", "poor flow"],
  "suggestions": ["add H3 subheadings", "break up paragraphs", "add bullet points", "improve transitions"],
  "paragraph_count": number,
  "average_paragraph_length": number,
  "subheading_count": number
}

Focus on scannability, readability, and SEO structure.`
        },
        {
          role: 'user',
          content: `Analyze the structure of this content:\n\n${textContent.substring(0, 4000)}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(structureAnalysis.choices[0].message.content || '{}')
    const analysisTokens = structureAnalysis.usage?.total_tokens || 0

    // If structure is already good, skip optimization
    if (analysis.readability_score > 80) {
      console.log('Content structure already optimized, skipping')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          structureChanges: analysis,
          message: 'Content structure already optimized'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Optimize structure
    const structureOptimization = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 3000,
      messages: [
        {
          role: 'system',
          content: `Optimize this content's structure for better readability and scannability. 

STRUCTURE IMPROVEMENTS:
1. Break up paragraphs longer than 4-5 sentences
2. Add H3 subheadings where logical (every 2-3 paragraphs)
3. Use bullet points for lists and key points
4. Improve transitions between sections
5. Add white space for breathing room
6. Make it more scannable with clear sections

PRESERVE:
- All original content and meaning
- Existing H1 and H2 headings
- Important details and facts
- Professional tone

Return the optimized HTML content with improved structure.`
        },
        {
          role: 'user',
          content: `Optimize the structure of this content:\n\n${content}`
        }
      ]
    })

    const optimizedContent = structureOptimization.choices[0].message.content?.trim() || content
    const optimizationTokens = structureOptimization.usage?.total_tokens || 0
    const totalTokens = analysisTokens + optimizationTokens

    // Step 3: Validate the optimized content
    if (!optimizedContent || optimizedContent.length < content.length * 0.5) {
      console.log('Structure optimization failed, returning original content')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          structureChanges: analysis,
          message: 'Structure optimization failed, keeping original'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 4: Add visual enhancements for better structure
    let finalContent = optimizedContent

    // Add subtle styling to improve visual hierarchy
    const structureStyles = userStyles?.extracted_css ? {
      subheadingColor: userStyles.extracted_css.accentColor || '#3b82f6',
      paragraphSpacing: userStyles.extracted_css.paragraphSpacing || '1.2em',
      fontFamily: userStyles.extracted_css.fontFamily || 'inherit'
    } : {
      subheadingColor: '#3b82f6',
      paragraphSpacing: '1.2em'
    }

    // Enhance H3 subheadings with better styling
    finalContent = finalContent.replace(
      /<h3([^>]*)>(.*?)<\/h3>/gi,
      `<h3$1 style="
        color: ${structureStyles.subheadingColor};
        font-size: 1.25em;
        font-weight: 600;
        margin: 1.5em 0 0.75em 0;
        padding-bottom: 0.25em;
        border-bottom: 2px solid ${structureStyles.subheadingColor}20;
        font-family: ${structureStyles.fontFamily};
      ">$2</h3>`
    )

    // Improve paragraph spacing
    finalContent = finalContent.replace(
      /<p([^>]*)>(.*?)<\/p>/gi,
      `<p$1 style="
        line-height: 1.6;
        margin-bottom: ${structureStyles.paragraphSpacing};
        font-family: ${structureStyles.fontFamily};
      ">$2</p>`
    )

    // Enhance bullet points
    finalContent = finalContent.replace(
      /<ul([^>]*)>(.*?)<\/ul>/gi,
      `<ul$1 style="
        margin: 1em 0;
        padding-left: 1.5em;
        line-height: 1.6;
        font-family: ${structureStyles.fontFamily};
      ">$2</ul>`
    )

    finalContent = finalContent.replace(
      /<li([^>]*)>(.*?)<\/li>/gi,
      `<li$1 style="
        margin-bottom: 0.5em;
        position: relative;
      ">$2</li>`
    )

    // Log execution
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('flash_execution_log')
      .insert({
        post_id: postId,
        feature_type: 'structure',
        success: true,
        execution_time_ms: 0,
        tokens_used: totalTokens
      })

    console.log(`✅ Structure optimized: readability ${analysis.readability_score} → improved`)

    const response: StructureResponse = {
      success: true,
      updatedContent: finalContent,
      structureChanges: analysis,
      tokensUsed: totalTokens
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Structure optimization error:', error)

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
          feature_type: 'structure',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log structure error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Structure optimization failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
