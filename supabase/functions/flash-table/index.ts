/**
 * Flash Table Summary Feature
 * 
 * Analyzes content and generates a summary table with key data points.
 * Inserts after intro section. Styled to match user's website CSS.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TableRequest {
  postId: string
  content: string
  userName: string
  userStyles?: any
}

interface TableResponse {
  success: boolean
  updatedContent?: string
  tableData?: any
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, userStyles }: TableRequest = await req.json()

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
    
    // Generate table data using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `You are an expert content analyzer. Create a summary table that highlights key information from the article.

Return a JSON object with this structure:
{
  "title": "Brief descriptive title for the table",
  "rows": [
    {
      "category": "Category name",
      "details": "Key information or value"
    }
  ]
}

Focus on:
- Key facts, statistics, or data points
- Important features, benefits, or characteristics
- Comparisons or contrasts
- Main takeaways or conclusions

Keep it concise but informative. 3-6 rows maximum.`
        },
        {
          role: 'user',
          content: `Create a summary table for this article:\n\n${textContent.substring(0, 4000)}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const tableData = JSON.parse(completion.choices[0].message.content || '{}')
    const tokensUsed = completion.usage?.total_tokens || 0

    if (!tableData.title || !tableData.rows || !Array.isArray(tableData.rows)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate table data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Apply user's CSS styles if available
    const tableStyles = userStyles?.extracted_css ? {
      backgroundColor: userStyles.extracted_css.cardBackground || '#ffffff',
      borderColor: userStyles.extracted_css.borderColor || '#e5e7eb',
      textColor: userStyles.extracted_css.textColor || '#374151',
      accentColor: userStyles.extracted_css.accentColor || '#3b82f6',
      fontFamily: userStyles.extracted_css.fontFamily || 'inherit',
      headerBackground: userStyles.extracted_css.headerBackground || '#f9fafb'
    } : {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      textColor: '#374151',
      accentColor: '#3b82f6',
      headerBackground: '#f9fafb'
    }

    // Create table HTML
    const tableRows = tableData.rows.map((row: any) => `
      <tr style="border-bottom: 1px solid ${tableStyles.borderColor};">
        <td style="
          padding: 12px 16px;
          font-weight: 600;
          color: ${tableStyles.textColor};
          background: ${tableStyles.headerBackground};
          border-right: 1px solid ${tableStyles.borderColor};
          width: 30%;
        ">${row.category}</td>
        <td style="
          padding: 12px 16px;
          color: ${tableStyles.textColor};
          line-height: 1.5;
        ">${row.details}</td>
      </tr>
    `).join('')

    const tableHtml = `
<div class="flash-table" style="
  background: ${tableStyles.backgroundColor};
  border: 1px solid ${tableStyles.borderColor};
  border-radius: 12px;
  margin: 20px 0;
  font-family: ${tableStyles.fontFamily};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
">
  <div style="
    background: ${tableStyles.accentColor};
    color: white;
    padding: 16px 20px;
    font-weight: 600;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  ">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 3h18v18H3zM9 9h6v6H9z"/>
    </svg>
    ${tableData.title}
  </div>
  <table style="
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  ">
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</div>`

    // Insert table after intro (first 2-3 paragraphs) or after anchor menu
    let updatedContent = content
    
    // Remove any existing table to avoid duplicates
    updatedContent = updatedContent.replace(/<div class="flash-table"[^>]*>[\s\S]*?<\/div>/gi, '')
    
    // Find insertion point (after first 2-3 paragraphs or after anchor menu)
    const anchorMenuRegex = /<div class="flash-anchor-menu"[^>]*>[\s\S]*?<\/div>/i
    const anchorMenuMatch = updatedContent.match(anchorMenuRegex)
    
    if (anchorMenuMatch) {
      // Insert after anchor menu
      const anchorMenuEnd = anchorMenuMatch.index! + anchorMenuMatch[0].length
      updatedContent = 
        updatedContent.substring(0, anchorMenuEnd) + 
        '\n\n' + tableHtml + 
        updatedContent.substring(anchorMenuEnd)
    } else {
      // Insert after first 2-3 paragraphs
      const paragraphRegex = /<\/p>\s*<\/p>\s*<\/p>/i
      const paragraphMatch = updatedContent.match(paragraphRegex)
      
      if (paragraphMatch) {
        const insertPoint = paragraphMatch.index! + paragraphMatch[0].length
        updatedContent = 
          updatedContent.substring(0, insertPoint) + 
          '\n\n' + tableHtml + 
          updatedContent.substring(insertPoint)
      } else {
        // Fallback: insert after first paragraph
        const firstParagraphRegex = /<\/p>/i
        const firstParagraphMatch = updatedContent.match(firstParagraphRegex)
        
        if (firstParagraphMatch) {
          const insertPoint = firstParagraphMatch.index! + firstParagraphMatch[0].length
          updatedContent = 
            updatedContent.substring(0, insertPoint) + 
            '\n\n' + tableHtml + 
            updatedContent.substring(insertPoint)
        } else {
          // Last resort: insert at beginning
          updatedContent = tableHtml + '\n\n' + updatedContent
        }
      }
    }

    // Log execution
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('flash_execution_log')
      .insert({
        post_id: postId,
        feature_type: 'table',
        success: true,
        execution_time_ms: 0,
        tokens_used: tokensUsed
      })

    console.log(`✅ Table created: ${tableData.title} (${tableData.rows.length} rows)`)

    const response: TableResponse = {
      success: true,
      updatedContent,
      tableData,
      tokensUsed
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Table generation error:', error)

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
          feature_type: 'table',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log table error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Table generation failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
