/**
 * Flash Suggest Videos Feature
 * 
 * AI analyzes content to suggest 1-3 optimal locations for videos.
 * Creates glowing placeholder boxes with descriptive text.
 * Focuses on tutorial, demo, and explanatory video opportunities.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SuggestVideosRequest {
  postId: string
  content: string
  userName: string
  count?: number
}

interface SuggestVideosResponse {
  success: boolean
  updatedContent?: string
  placeholdersCreated?: number
  videoSuggestions?: any[]
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, count = 3 }: SuggestVideosRequest = await req.json()

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

    // Extract text content for analysis
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    
    // Step 1: Analyze content for optimal video placement
    const videoAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content: `Analyze this content and suggest ${count} optimal locations for videos. Return a JSON object with:

{
  "video_suggestions": [
    {
      "position": "after_paragraph_X|before_section_Y|mid_content|end_content",
      "context": "what this section is about",
      "suggested_video": "description of ideal video content",
      "video_type": "tutorial|demo|explanation|interview|testimonial|animation|screencast",
      "duration": "short|medium|long",
      "placement_reason": "why this location is optimal for video",
      "priority": "high|medium|low"
    }
  ]
}

Focus on:
- Complex concepts that benefit from visual demonstration
- Step-by-step processes that need video explanation
- Areas where video adds significant value
- Strategic placement for engagement and retention`
        },
        {
          role: 'user',
          content: `Find ${count} optimal video placement locations in this content:\n\n${textContent.substring(0, 4000)}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(videoAnalysis.choices[0].message.content || '{}')
    const analysisTokens = videoAnalysis.usage?.total_tokens || 0

    if (!analysis.video_suggestions || !Array.isArray(analysis.video_suggestions) || analysis.video_suggestions.length === 0) {
      console.log('No video placement suggestions generated')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          placeholdersCreated: 0,
          message: 'No video placement suggestions generated'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Create video placeholders
    const videoPlaceholders = analysis.video_suggestions.slice(0, count).map((suggestion: any, index: number) => {
      const placeholderId = `video-placeholder-${index + 1}`
      
      return {
        id: placeholderId,
        position: suggestion.position,
        context: suggestion.context,
        suggestedVideo: suggestion.suggested_video,
        videoType: suggestion.video_type,
        duration: suggestion.duration,
        placementReason: suggestion.placement_reason,
        priority: suggestion.priority,
        html: createVideoPlaceholderHtml(placeholderId, suggestion, index + 1)
      }
    })

    // Step 3: Insert placeholders into content
    let updatedContent = content
    
    // Remove any existing video placeholders to avoid duplicates
    updatedContent = updatedContent.replace(/<div class="flash-video-placeholder"[^>]*>[\s\S]*?<\/div>/gi, '')
    
    // Insert placeholders at suggested positions
    for (const placeholder of videoPlaceholders) {
      updatedContent = insertVideoPlaceholder(updatedContent, placeholder)
    }

    // Step 4: Store placeholders in database
    for (const placeholder of videoPlaceholders) {
      await supabase
        .from('content_placeholders')
        .insert({
          post_id: postId,
          placeholder_type: 'video',
          placeholder_id: placeholder.id,
          position: placeholder.position,
          context: placeholder.context,
          suggested_content: placeholder.suggestedVideo,
          metadata: {
            video_type: placeholder.videoType,
            duration: placeholder.duration,
            placement_reason: placeholder.placementReason,
            priority: placeholder.priority,
            created_at: new Date().toISOString()
          }
        })
    }

    // Log execution
    await supabase
      .from('flash_execution_log')
      .insert({
        post_id: postId,
        feature_type: 'suggest-videos',
        success: true,
        execution_time_ms: 0,
        tokens_used: analysisTokens
      })

    console.log(`✅ Video placeholders created: ${videoPlaceholders.length} locations`)

    const response: SuggestVideosResponse = {
      success: true,
      updatedContent,
      placeholdersCreated: videoPlaceholders.length,
      videoSuggestions: videoPlaceholders.map(p => ({
        id: p.id,
        position: p.position,
        context: p.context,
        suggestedVideo: p.suggestedVideo,
        videoType: p.videoType,
        duration: p.duration,
        placementReason: p.placementReason,
        priority: p.priority
      })),
      tokensUsed: analysisTokens
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Video suggestions error:', error)

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
          feature_type: 'suggest-videos',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log video suggestions error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Video suggestions failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to create video placeholder HTML
function createVideoPlaceholderHtml(placeholderId: string, suggestion: any, index: number): string {
  const videoTypeIcons: { [key: string]: string } = {
    tutorial: '🎓',
    demo: '🎬',
    explanation: '💡',
    interview: '🎤',
    testimonial: '⭐',
    animation: '🎨',
    screencast: '📹'
  }

  const durationIcons: { [key: string]: string } = {
    short: '⏱️',
    medium: '⏰',
    long: '⏳'
  }

  const icon = videoTypeIcons[suggestion.video_type] || '🎬'
  const durationIcon = durationIcons[suggestion.duration] || '⏰'

  return `
<div class="flash-video-placeholder" id="${placeholderId}" style="
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px dashed #f59e0b;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(245, 158, 11, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.1)'">
  
  <div style="
    position: absolute;
    top: 8px;
    right: 8px;
    background: #f59e0b;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  ">${index}</div>
  
  <div style="
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.7;
  ">${icon}</div>
  
  <h3 style="
    margin: 0 0 8px 0;
    color: #92400e;
    font-size: 18px;
    font-weight: 600;
  ">Insert Video Here</h3>
  
  <p style="
    margin: 0 0 12px 0;
    color: #374151;
    font-size: 14px;
    line-height: 1.5;
  ">${suggestion.suggested_video}</p>
  
  <div style="
    background: rgba(245, 158, 11, 0.1);
    border-radius: 6px;
    padding: 8px 12px;
    margin: 8px 0;
  ">
    <div style="
      font-size: 12px;
      color: #92400e;
      font-weight: 500;
      margin-bottom: 4px;
    ">🎯 Why here?</div>
    <div style="
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    ">${suggestion.placement_reason}</div>
  </div>
  
  <div style="
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 12px;
    font-size: 12px;
    color: #6b7280;
  ">
    <span>🎬 Drag & drop video here</span>
    <span>•</span>
    <span>${suggestion.video_type.toUpperCase()}</span>
    <span>•</span>
    <span>${durationIcon} ${suggestion.duration.toUpperCase()}</span>
  </div>
  
  <div style="
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: rgba(245, 158, 11, 0.1);
    color: #92400e;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
  ">${suggestion.priority.toUpperCase()}</div>
  
  <div style="
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(245, 158, 11, 0.1);
    color: #92400e;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
  ">${suggestion.video_type.toUpperCase()}</div>
</div>`
}

// Helper function to insert video placeholder into content
function insertVideoPlaceholder(content: string, placeholder: any): string {
  const { position, html } = placeholder
  
  // Parse position to find insertion point
  if (position.startsWith('after_paragraph_')) {
    const paragraphNum = parseInt(position.replace('after_paragraph_', ''))
    const paragraphs = content.split('</p>')
    
    if (paragraphNum > 0 && paragraphNum <= paragraphs.length) {
      const insertIndex = paragraphs.slice(0, paragraphNum).join('</p>').length + '</p>'.length
      return content.substring(0, insertIndex) + '\n\n' + html + '\n\n' + content.substring(insertIndex)
    }
  } else if (position.startsWith('before_section_')) {
    // Look for H2 headings
    const h2Regex = /<h2[^>]*>/gi
    const h2Matches = content.match(h2Regex) || []
    const sectionNum = parseInt(position.replace('before_section_', ''))
    
    if (sectionNum > 0 && sectionNum <= h2Matches.length) {
      let currentSection = 0
      let insertIndex = -1
      
      for (let i = 0; i < content.length; i++) {
        if (content.substring(i, i + 4).toLowerCase() === '<h2>') {
          currentSection++
          if (currentSection === sectionNum) {
            insertIndex = i
            break
          }
        }
      }
      
      if (insertIndex > -1) {
        return content.substring(0, insertIndex) + '\n\n' + html + '\n\n' + content.substring(insertIndex)
      }
    }
  } else if (position === 'mid_content') {
    // Insert in middle of content
    const midPoint = Math.floor(content.length / 2)
    return content.substring(0, midPoint) + '\n\n' + html + '\n\n' + content.substring(midPoint)
  } else if (position === 'end_content') {
    // Insert before last paragraph
    const lastParagraphIndex = content.lastIndexOf('</p>')
    if (lastParagraphIndex > -1) {
      return content.substring(0, lastParagraphIndex) + '\n\n' + html + '\n\n' + content.substring(lastParagraphIndex)
    } else {
      // Fallback: append to end
      return content + '\n\n' + html
    }
  }
  
  // Fallback: append to end
  return content + '\n\n' + html
}
