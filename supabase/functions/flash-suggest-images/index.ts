/**
 * Flash Suggest Images Feature
 * 
 * AI analyzes content to suggest 2 optimal locations for images.
 * Creates glowing placeholder boxes with descriptive text.
 * Placeholders appear in editor for drag-and-drop functionality.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SuggestImagesRequest {
  postId: string
  content: string
  userName: string
  count?: number
}

interface SuggestImagesResponse {
  success: boolean
  updatedContent?: string
  placeholdersCreated?: number
  imageSuggestions?: any[]
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, count = 2 }: SuggestImagesRequest = await req.json()

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
    
    // Step 1: Analyze content for optimal image placement
    const imageAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: `Analyze this content and suggest ${count} optimal locations for images. Return a JSON object with:

{
  "image_suggestions": [
    {
      "position": "after_paragraph_X|before_section_Y|mid_content|end_content",
      "context": "what this section is about",
      "suggested_image": "description of ideal image",
      "image_type": "hero|illustration|diagram|chart|photo|infographic",
      "placement_reason": "why this location is optimal",
      "priority": "high|medium|low"
    }
  ]
}

Focus on:
- Natural break points in content
- Sections that would benefit from visual support
- Areas where images add value to understanding
- Strategic placement for engagement`
        },
        {
          role: 'user',
          content: `Find ${count} optimal image placement locations in this content:\n\n${textContent.substring(0, 4000)}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(imageAnalysis.choices[0].message.content || '{}')
    const analysisTokens = imageAnalysis.usage?.total_tokens || 0

    if (!analysis.image_suggestions || !Array.isArray(analysis.image_suggestions) || analysis.image_suggestions.length === 0) {
      console.log('No image placement suggestions generated')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          placeholdersCreated: 0,
          message: 'No image placement suggestions generated'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Create image placeholders
    const imagePlaceholders = analysis.image_suggestions.slice(0, count).map((suggestion: any, index: number) => {
      const placeholderId = `image-placeholder-${index + 1}`
      
      return {
        id: placeholderId,
        position: suggestion.position,
        context: suggestion.context,
        suggestedImage: suggestion.suggested_image,
        imageType: suggestion.image_type,
        placementReason: suggestion.placement_reason,
        priority: suggestion.priority,
        html: createImagePlaceholderHtml(placeholderId, suggestion, index + 1)
      }
    })

    // Step 3: Insert placeholders into content
    let updatedContent = content
    
    // Remove any existing image placeholders to avoid duplicates
    updatedContent = updatedContent.replace(/<div class="flash-image-placeholder"[^>]*>[\s\S]*?<\/div>/gi, '')
    
    // Insert placeholders at suggested positions
    for (const placeholder of imagePlaceholders) {
      updatedContent = insertImagePlaceholder(updatedContent, placeholder)
    }

    // Step 4: Store placeholders in database
    for (const placeholder of imagePlaceholders) {
      await supabase
        .from('content_placeholders')
        .insert({
          post_id: postId,
          placeholder_type: 'image',
          placeholder_id: placeholder.id,
          position: placeholder.position,
          context: placeholder.context,
          suggested_content: placeholder.suggestedImage,
          metadata: {
            image_type: placeholder.imageType,
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
        feature_type: 'suggest-images',
        success: true,
        execution_time_ms: 0,
        tokens_used: analysisTokens
      })

    console.log(`✅ Image placeholders created: ${imagePlaceholders.length} locations`)

    const response: SuggestImagesResponse = {
      success: true,
      updatedContent,
      placeholdersCreated: imagePlaceholders.length,
      imageSuggestions: imagePlaceholders.map(p => ({
        id: p.id,
        position: p.position,
        context: p.context,
        suggestedImage: p.suggestedImage,
        imageType: p.imageType,
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
    console.error('❌ Image suggestions error:', error)

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
          feature_type: 'suggest-images',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log image suggestions error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Image suggestions failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to create image placeholder HTML
function createImagePlaceholderHtml(placeholderId: string, suggestion: any, index: number): string {
  const imageTypeIcons: { [key: string]: string } = {
    hero: '🖼️',
    illustration: '🎨',
    diagram: '📊',
    chart: '📈',
    photo: '📷',
    infographic: '📋'
  }

  const icon = imageTypeIcons[suggestion.image_type] || '🖼️'

  return `
<div class="flash-image-placeholder" id="${placeholderId}" style="
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 2px dashed #3b82f6;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(59, 130, 246, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.1)'">
  
  <div style="
    position: absolute;
    top: 8px;
    right: 8px;
    background: #3b82f6;
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
    color: #1e40af;
    font-size: 18px;
    font-weight: 600;
  ">Insert Image Here</h3>
  
  <p style="
    margin: 0 0 12px 0;
    color: #374151;
    font-size: 14px;
    line-height: 1.5;
  ">${suggestion.suggested_image}</p>
  
  <div style="
    background: rgba(59, 130, 246, 0.1);
    border-radius: 6px;
    padding: 8px 12px;
    margin: 8px 0;
  ">
    <div style="
      font-size: 12px;
      color: #1e40af;
      font-weight: 500;
      margin-bottom: 4px;
    ">💡 Why here?</div>
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
    gap: 8px;
    margin-top: 12px;
    font-size: 12px;
    color: #6b7280;
  ">
    <span>📏 Drag & drop image here</span>
    <span>•</span>
    <span>${suggestion.image_type.toUpperCase()}</span>
  </div>
  
  <div style="
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: rgba(59, 130, 246, 0.1);
    color: #1e40af;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
  ">${suggestion.priority.toUpperCase()}</div>
</div>`
}

// Helper function to insert image placeholder into content
function insertImagePlaceholder(content: string, placeholder: any): string {
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
