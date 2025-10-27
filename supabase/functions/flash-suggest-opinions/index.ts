/**
 * Flash Suggest Opinions Feature
 * 
 * AI analyzes content to suggest 4-6 optimal locations for voice-to-text opinions.
 * Creates glowing placeholder boxes with voice recording functionality.
 * Users can click to record their opinion and it gets transcribed and inserted.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SuggestOpinionsRequest {
  postId: string
  content: string
  userName: string
  count?: number
}

interface SuggestOpinionsResponse {
  success: boolean
  updatedContent?: string
  placeholdersCreated?: number
  opinionSuggestions?: any[]
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, count = 6 }: SuggestOpinionsRequest = await req.json()

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
    
    // Step 1: Analyze content for optimal opinion placement
    const opinionAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `Analyze this content and suggest ${count} optimal locations for voice-to-text opinions. Return a JSON object with:

{
  "opinion_suggestions": [
    {
      "position": "after_paragraph_X|before_section_Y|mid_content|end_content",
      "context": "what this section is about",
      "suggested_opinion": "prompt for what kind of opinion to share",
      "opinion_type": "personal_experience|expert_insight|practical_tip|controversial_view|success_story|warning|recommendation",
      "tone": "casual|professional|passionate|thoughtful|urgent",
      "placement_reason": "why this location is optimal for an opinion",
      "priority": "high|medium|low"
    }
  ]
}

Focus on:
- Areas where personal experience adds value
- Points where expert insight would be helpful
- Sections that could benefit from practical tips
- Places where controversial or different perspectives add value
- Strategic placement throughout the content for engagement`
        },
        {
          role: 'user',
          content: `Find ${count} optimal opinion placement locations in this content:\n\n${textContent.substring(0, 4000)}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(opinionAnalysis.choices[0].message.content || '{}')
    const analysisTokens = opinionAnalysis.usage?.total_tokens || 0

    if (!analysis.opinion_suggestions || !Array.isArray(analysis.opinion_suggestions) || analysis.opinion_suggestions.length === 0) {
      console.log('No opinion placement suggestions generated')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          placeholdersCreated: 0,
          message: 'No opinion placement suggestions generated'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Create opinion placeholders
    const opinionPlaceholders = analysis.opinion_suggestions.slice(0, count).map((suggestion: any, index: number) => {
      const placeholderId = `opinion-placeholder-${index + 1}`
      
      return {
        id: placeholderId,
        position: suggestion.position,
        context: suggestion.context,
        suggestedOpinion: suggestion.suggested_opinion,
        opinionType: suggestion.opinion_type,
        tone: suggestion.tone,
        placementReason: suggestion.placement_reason,
        priority: suggestion.priority,
        html: createOpinionPlaceholderHtml(placeholderId, suggestion, index + 1)
      }
    })

    // Step 3: Insert placeholders into content
    let updatedContent = content
    
    // Remove any existing opinion placeholders to avoid duplicates
    updatedContent = updatedContent.replace(/<div class="flash-opinion-placeholder"[^>]*>[\s\S]*?<\/div>/gi, '')
    
    // Insert placeholders at suggested positions
    for (const placeholder of opinionPlaceholders) {
      updatedContent = insertOpinionPlaceholder(updatedContent, placeholder)
    }

    // Step 4: Store placeholders in database
    for (const placeholder of opinionPlaceholders) {
      await supabase
        .from('content_placeholders')
        .insert({
          post_id: postId,
          placeholder_type: 'opinion',
          placeholder_id: placeholder.id,
          position: placeholder.position,
          context: placeholder.context,
          suggested_content: placeholder.suggestedOpinion,
          metadata: {
            opinion_type: placeholder.opinionType,
            tone: placeholder.tone,
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
        feature_type: 'suggest-opinions',
        success: true,
        execution_time_ms: 0,
        tokens_used: analysisTokens
      })

    console.log(`✅ Opinion placeholders created: ${opinionPlaceholders.length} locations`)

    const response: SuggestOpinionsResponse = {
      success: true,
      updatedContent,
      placeholdersCreated: opinionPlaceholders.length,
      opinionSuggestions: opinionPlaceholders.map(p => ({
        id: p.id,
        position: p.position,
        context: p.context,
        suggestedOpinion: p.suggestedOpinion,
        opinionType: p.opinionType,
        tone: p.tone,
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
    console.error('❌ Opinion suggestions error:', error)

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
          feature_type: 'suggest-opinions',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log opinion suggestions error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Opinion suggestions failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to create opinion placeholder HTML
function createOpinionPlaceholderHtml(placeholderId: string, suggestion: any, index: number): string {
  const opinionTypeIcons: { [key: string]: string } = {
    personal_experience: '👤',
    expert_insight: '🧠',
    practical_tip: '💡',
    controversial_view: '⚡',
    success_story: '🎉',
    warning: '⚠️',
    recommendation: '👍'
  }

  const toneColors: { [key: string]: string } = {
    casual: '#8b5cf6',
    professional: '#3b82f6',
    passionate: '#ef4444',
    thoughtful: '#10b981',
    urgent: '#f59e0b'
  }

  const icon = opinionTypeIcons[suggestion.opinion_type] || '🎤'
  const toneColor = toneColors[suggestion.tone] || '#3b82f6'

  return `
<div class="flash-opinion-placeholder" id="${placeholderId}" style="
  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
  border: 2px dashed #ec4899;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.1);
" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(236, 72, 153, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(236, 72, 153, 0.1)'">
  
  <div style="
    position: absolute;
    top: 8px;
    right: 8px;
    background: #ec4899;
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
    color: #be185d;
    font-size: 18px;
    font-weight: 600;
  ">Share Your Opinion</h3>
  
  <p style="
    margin: 0 0 12px 0;
    color: #374151;
    font-size: 14px;
    line-height: 1.5;
  ">${suggestion.suggested_opinion}</p>
  
  <div style="
    background: rgba(236, 72, 153, 0.1);
    border-radius: 6px;
    padding: 8px 12px;
    margin: 8px 0;
  ">
    <div style="
      font-size: 12px;
      color: #be185d;
      font-weight: 500;
      margin-bottom: 4px;
    ">💭 Why here?</div>
    <div style="
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    ">${suggestion.placement_reason}</div>
  </div>
  
  <button onclick="startVoiceRecording('${placeholderId}')" style="
    background: linear-gradient(135deg, ${toneColor}, ${toneColor}dd);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 8px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    margin-right: auto;
  " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
    Record Voice Opinion
  </button>
  
  <div style="
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 12px;
    font-size: 12px;
    color: #6b7280;
  ">
    <span>🎤 Click to record</span>
    <span>•</span>
    <span>${suggestion.opinion_type.replace('_', ' ').toUpperCase()}</span>
    <span>•</span>
    <span style="color: ${toneColor}; font-weight: 500;">${suggestion.tone.toUpperCase()}</span>
  </div>
  
  <div style="
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: rgba(236, 72, 153, 0.1);
    color: #be185d;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
  ">${suggestion.priority.toUpperCase()}</div>
  
  <div style="
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(236, 72, 153, 0.1);
    color: #be185d;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
  ">VOICE-TO-TEXT</div>
</div>

<script>
// Voice recording functionality (to be implemented in editor)
function startVoiceRecording(placeholderId) {
  console.log('Starting voice recording for:', placeholderId);
  // This will be implemented in the editor with actual voice recording
  alert('Voice recording will be implemented in the editor!');
}
</script>`
}

// Helper function to insert opinion placeholder into content
function insertOpinionPlaceholder(content: string, placeholder: any): string {
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
