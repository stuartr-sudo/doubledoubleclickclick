/**
 * Flash Suggest Product Feature
 * 
 * AI analyzes content to suggest 1 optimal location for a promoted product section.
 * Creates a glowing placeholder box for product promotion.
 * Different from products woven into content - this is a dedicated promotion section.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SuggestProductRequest {
  postId: string
  content: string
  userName: string
  count?: number
}

interface SuggestProductResponse {
  success: boolean
  updatedContent?: string
  placeholdersCreated?: number
  productSuggestions?: any[]
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, count = 1 }: SuggestProductRequest = await req.json()

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
    
    // Step 1: Analyze content for optimal product promotion placement
    const productAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `Analyze this content and suggest ${count} optimal location for a promoted product section. Return a JSON object with:

{
  "product_suggestions": [
    {
      "position": "after_paragraph_X|before_section_Y|mid_content|end_content",
      "context": "what this section is about",
      "suggested_product": "description of ideal product to promote",
      "product_type": "software|service|course|book|tool|consultation|subscription",
      "placement_reason": "why this location is optimal for product promotion",
      "priority": "high|medium|low"
    }
  ]
}

Focus on:
- Natural transition points where product promotion feels relevant
- Areas where readers are most engaged and likely to convert
- Strategic placement that adds value rather than interrupts
- Context where the product naturally fits the content flow`
        },
        {
          role: 'user',
          content: `Find ${count} optimal product promotion location in this content:\n\n${textContent.substring(0, 4000)}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(productAnalysis.choices[0].message.content || '{}')
    const analysisTokens = productAnalysis.usage?.total_tokens || 0

    if (!analysis.product_suggestions || !Array.isArray(analysis.product_suggestions) || analysis.product_suggestions.length === 0) {
      console.log('No product placement suggestions generated')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          placeholdersCreated: 0,
          message: 'No product placement suggestions generated'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Create product placeholders
    const productPlaceholders = analysis.product_suggestions.slice(0, count).map((suggestion: any, index: number) => {
      const placeholderId = `product-placeholder-${index + 1}`
      
      return {
        id: placeholderId,
        position: suggestion.position,
        context: suggestion.context,
        suggestedProduct: suggestion.suggested_product,
        productType: suggestion.product_type,
        placementReason: suggestion.placement_reason,
        priority: suggestion.priority,
        html: createProductPlaceholderHtml(placeholderId, suggestion, index + 1)
      }
    })

    // Step 3: Insert placeholders into content
    let updatedContent = content
    
    // Remove any existing product placeholders to avoid duplicates
    updatedContent = updatedContent.replace(/<div class="flash-product-placeholder"[^>]*>[\s\S]*?<\/div>/gi, '')
    
    // Insert placeholders at suggested positions
    for (const placeholder of productPlaceholders) {
      updatedContent = insertProductPlaceholder(updatedContent, placeholder)
    }

    // Step 4: Store placeholders in database
    for (const placeholder of productPlaceholders) {
      await supabase
        .from('content_placeholders')
        .insert({
          post_id: postId,
          placeholder_type: 'product',
          placeholder_id: placeholder.id,
          position: placeholder.position,
          context: placeholder.context,
          suggested_content: placeholder.suggestedProduct,
          metadata: {
            product_type: placeholder.productType,
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
        feature_type: 'suggest-product',
        success: true,
        execution_time_ms: 0,
        tokens_used: analysisTokens
      })

    console.log(`✅ Product placeholders created: ${productPlaceholders.length} locations`)

    const response: SuggestProductResponse = {
      success: true,
      updatedContent,
      placeholdersCreated: productPlaceholders.length,
      productSuggestions: productPlaceholders.map(p => ({
        id: p.id,
        position: p.position,
        context: p.context,
        suggestedProduct: p.suggestedProduct,
        productType: p.productType,
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
    console.error('❌ Product suggestions error:', error)

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
          feature_type: 'suggest-product',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log product suggestions error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Product suggestions failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to create product placeholder HTML
function createProductPlaceholderHtml(placeholderId: string, suggestion: any, index: number): string {
  const productTypeIcons: { [key: string]: string } = {
    software: '💻',
    service: '🛠️',
    course: '🎓',
    book: '📚',
    tool: '🔧',
    consultation: '💬',
    subscription: '🔄'
  }

  const icon = productTypeIcons[suggestion.product_type] || '🛍️'

  return `
<div class="flash-product-placeholder" id="${placeholderId}" style="
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 2px dashed #22c55e;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1);
" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(34, 197, 94, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(34, 197, 94, 0.1)'">
  
  <div style="
    position: absolute;
    top: 8px;
    right: 8px;
    background: #22c55e;
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
    color: #15803d;
    font-size: 18px;
    font-weight: 600;
  ">Promoted Product Section</h3>
  
  <p style="
    margin: 0 0 12px 0;
    color: #374151;
    font-size: 14px;
    line-height: 1.5;
  ">${suggestion.suggested_product}</p>
  
  <div style="
    background: rgba(34, 197, 94, 0.1);
    border-radius: 6px;
    padding: 8px 12px;
    margin: 8px 0;
  ">
    <div style="
      font-size: 12px;
      color: #15803d;
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
    <span>🛍️ Add product promotion here</span>
    <span>•</span>
    <span>${suggestion.product_type.toUpperCase()}</span>
  </div>
  
  <div style="
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: rgba(34, 197, 94, 0.1);
    color: #15803d;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
  ">${suggestion.priority.toUpperCase()}</div>
  
  <div style="
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(34, 197, 94, 0.1);
    color: #15803d;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
  ">PROMOTION</div>
</div>`
}

// Helper function to insert product placeholder into content
function insertProductPlaceholder(content: string, placeholder: any): string {
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
