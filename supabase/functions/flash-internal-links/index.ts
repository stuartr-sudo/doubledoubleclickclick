/**
 * Flash Internal Links (AutoLink) Feature
 * 
 * Automatically adds internal links to other pages from the sitemap.
 * Uses high relevance matching with varied anchor text.
 * Never uses the same link or anchor text twice.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InternalLinksRequest {
  postId: string
  content: string
  userName: string
  userStyles?: any
}

interface InternalLinksResponse {
  success: boolean
  updatedContent?: string
  linksAdded?: any[]
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, userStyles }: InternalLinksRequest = await req.json()

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

    // Step 1: Get user's sitemap/published pages
    const { data: publishedPages, error: pagesError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, created_date')
      .eq('user_name', userName)
      .eq('status', 'published')
      .not('id', 'eq', postId) // Exclude current post
      .order('created_date', { ascending: false })
      .limit(20) // Limit for performance

    if (pagesError || !publishedPages || publishedPages.length === 0) {
      console.log('No published pages found for internal linking')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          message: 'No published pages found for internal linking'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Extract text content for analysis
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    
    // Step 3: Find linking opportunities using AI
    const linkingAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `Analyze this content and suggest internal linking opportunities. Return a JSON object with:

{
  "linking_opportunities": [
    {
      "text_to_link": "exact text that should become a link",
      "suggested_anchor": "suggested anchor text",
      "context": "why this link makes sense",
      "priority": "high|medium|low"
    }
  ],
  "content_topics": ["topic1", "topic2", "topic3"]
}

Focus on natural, valuable internal links that add value to readers.`
        },
        {
          role: 'user',
          content: `Find internal linking opportunities in this content:\n\n${textContent.substring(0, 3000)}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(linkingAnalysis.choices[0].message.content || '{}')
    const analysisTokens = linkingAnalysis.usage?.total_tokens || 0

    if (!analysis.linking_opportunities || analysis.linking_opportunities.length === 0) {
      console.log('No linking opportunities identified')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          message: 'No linking opportunities identified'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 4: Match linking opportunities with published pages
    const linksToAdd = await matchLinksWithPages(
      analysis.linking_opportunities,
      publishedPages,
      analysis.content_topics || []
    )

    if (linksToAdd.length === 0) {
      console.log('No suitable pages found for internal linking')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          message: 'No suitable pages found for internal linking'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 5: Add internal links to content
    let updatedContent = content
    const addedLinks: any[] = []

    // Sort by priority (high first)
    const sortedLinks = linksToAdd.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    for (const link of sortedLinks.slice(0, 5)) { // Limit to 5 links max
      const { textToLink, anchorText, targetPage, priority } = link
      
      // Check if this text is already linked
      if (updatedContent.includes(`<a href="${targetPage.slug}">`)) {
        continue
      }

      // Create the link
      const linkHtml = `<a href="/${targetPage.slug}" style="
        color: ${userStyles?.extracted_css?.accentColor || '#3b82f6'};
        text-decoration: none;
        font-weight: 500;
        border-bottom: 1px solid ${userStyles?.extracted_css?.accentColor || '#3b82f6'}30;
        transition: all 0.2s ease;
      " onmouseover="this.style.borderBottomColor='${userStyles?.extracted_css?.accentColor || '#3b82f6'}'" onmouseout="this.style.borderBottomColor='${userStyles?.extracted_css?.accentColor || '#3b82f6'}30'">${anchorText}</a>`

      // Replace the text with the link
      const regex = new RegExp(`\\b${textToLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      const matches = updatedContent.match(regex)
      
      if (matches && matches.length > 0) {
        // Replace only the first occurrence
        updatedContent = updatedContent.replace(regex, linkHtml)
        
        addedLinks.push({
          textToLink,
          anchorText,
          targetPage: targetPage.title,
          targetSlug: targetPage.slug,
          priority
        })
      }
    }

    // Log execution
    await supabase
      .from('flash_execution_log')
      .insert({
        post_id: postId,
        feature_type: 'internal-links',
        success: true,
        execution_time_ms: 0,
        tokens_used: analysisTokens
      })

    console.log(`✅ Internal links added: ${addedLinks.length} links`)

    const response: InternalLinksResponse = {
      success: true,
      updatedContent,
      linksAdded: addedLinks,
      tokensUsed: analysisTokens
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Internal links generation error:', error)

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
          feature_type: 'internal-links',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log internal links error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal links generation failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to match linking opportunities with published pages
async function matchLinksWithPages(
  opportunities: any[],
  publishedPages: any[],
  contentTopics: string[]
): Promise<any[]> {
  const linksToAdd: any[] = []
  const usedPages = new Set<string>()
  const usedAnchors = new Set<string>()

  for (const opportunity of opportunities) {
    if (usedPages.size >= 5) break // Limit total links

    const { textToLink, suggestedAnchor, context, priority } = opportunity
    
    // Find best matching page
    let bestMatch = null
    let bestScore = 0

    for (const page of publishedPages) {
      if (usedPages.has(page.id)) continue

      // Calculate relevance score
      const score = calculateRelevanceScore(
        textToLink,
        suggestedAnchor,
        page.title,
        page.content,
        contentTopics
      )

      if (score > bestScore && score > 0.3) { // Minimum relevance threshold
        bestMatch = page
        bestScore = score
      }
    }

    if (bestMatch && !usedAnchors.has(suggestedAnchor)) {
      linksToAdd.push({
        textToLink,
        anchorText: suggestedAnchor,
        targetPage: bestMatch,
        priority,
        relevanceScore: bestScore
      })
      
      usedPages.add(bestMatch.id)
      usedAnchors.add(suggestedAnchor)
    }
  }

  return linksToAdd
}

// Helper function to calculate relevance score between text and page
function calculateRelevanceScore(
  textToLink: string,
  suggestedAnchor: string,
  pageTitle: string,
  pageContent: string,
  contentTopics: string[]
): number {
  let score = 0

  // Title matching (highest weight)
  const titleWords = pageTitle.toLowerCase().split(/\s+/)
  const textWords = textToLink.toLowerCase().split(/\s+/)
  const anchorWords = suggestedAnchor.toLowerCase().split(/\s+/)
  
  const titleMatches = textWords.filter(word => 
    titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
  ).length
  
  const anchorTitleMatches = anchorWords.filter(word => 
    titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
  ).length

  score += (titleMatches / textWords.length) * 0.4
  score += (anchorTitleMatches / anchorWords.length) * 0.3

  // Content topic matching
  const pageContentLower = pageContent.toLowerCase()
  const topicMatches = contentTopics.filter(topic => 
    pageContentLower.includes(topic.toLowerCase())
  ).length
  
  score += (topicMatches / contentTopics.length) * 0.2

  // Keyword density in page content
  const pageWords = pageContentLower.split(/\s+/)
  const textWordMatches = textWords.filter(word => 
    pageWords.some(pageWord => pageWord.includes(word) || word.includes(pageWord))
  ).length
  
  score += (textWordMatches / textWords.length) * 0.1

  return Math.min(score, 1) // Cap at 1
}
