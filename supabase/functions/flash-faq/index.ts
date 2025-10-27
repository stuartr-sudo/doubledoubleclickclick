/**
 * Flash FAQ Section Feature
 * 
 * Generates 3-5 relevant FAQ questions and answers based on content analysis.
 * Inserts before the conclusion to address common reader questions.
 * Styled to match user's website design.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FAQRequest {
  postId: string
  content: string
  userName: string
  userStyles?: any
}

interface FAQResponse {
  success: boolean
  updatedContent?: string
  faqItems?: any[]
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, userStyles }: FAQRequest = await req.json()

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
    
    // Step 1: Generate FAQ questions and answers
    const faqGeneration = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `Generate 3-5 relevant FAQ questions and answers based on this content. Return a JSON object with:

{
  "faq_items": [
    {
      "question": "Common question readers might have",
      "answer": "Comprehensive answer based on the content",
      "relevance": "high|medium|low"
    }
  ],
  "section_title": "Suggested title for the FAQ section"
}

Focus on:
- Questions readers would naturally ask after reading this content
- Answers that provide value and additional insights
- Questions that address common concerns or misconceptions
- Questions that encourage further engagement

Make the answers informative but concise (2-3 sentences each).`
        },
        {
          role: 'user',
          content: `Generate FAQ questions and answers for this content:\n\n${textContent.substring(0, 4000)}`
        }
      ],
      response_format: { type: 'json_object' }
    })

    const faqData = JSON.parse(faqGeneration.choices[0].message.content || '{}')
    const tokensUsed = faqGeneration.usage?.total_tokens || 0

    if (!faqData.faq_items || !Array.isArray(faqData.faq_items) || faqData.faq_items.length === 0) {
      console.log('No FAQ items generated')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          message: 'No FAQ items generated'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Create FAQ HTML
    const faqHtml = createFAQHtml(faqData, userStyles)

    // Step 3: Insert FAQ before conclusion
    let updatedContent = content
    
    // Remove any existing FAQ to avoid duplicates
    updatedContent = updatedContent.replace(/<div class="flash-faq"[^>]*>[\s\S]*?<\/div>/gi, '')
    
    // Find insertion point (before conclusion or last paragraph)
    const conclusionKeywords = [
      'conclusion', 'summary', 'final thoughts', 'in summary', 'to conclude',
      'wrapping up', 'in closing', 'bottom line', 'key takeaways'
    ]
    
    let insertIndex = -1
    const contentLower = updatedContent.toLowerCase()
    
    // Look for conclusion keywords
    for (const keyword of conclusionKeywords) {
      const keywordIndex = contentLower.indexOf(keyword)
      if (keywordIndex > -1) {
        // Find the start of the paragraph containing this keyword
        const paragraphStart = updatedContent.lastIndexOf('<p', keywordIndex)
        if (paragraphStart > -1) {
          insertIndex = paragraphStart
          break
        }
      }
    }
    
    // If no conclusion found, insert before last 2 paragraphs
    if (insertIndex === -1) {
      const paragraphs = updatedContent.split('</p>')
      if (paragraphs.length > 2) {
        const lastTwoParagraphsStart = paragraphs
          .slice(0, -2)
          .join('</p>')
          .length + '</p>'.length
        insertIndex = lastTwoParagraphsStart
      } else {
        // Fallback: insert before last paragraph
        const lastParagraphStart = updatedContent.lastIndexOf('<p')
        if (lastParagraphStart > -1) {
          insertIndex = lastParagraphStart
        }
      }
    }
    
    // Insert FAQ
    if (insertIndex > -1) {
      updatedContent = 
        updatedContent.substring(0, insertIndex) + 
        '\n\n' + faqHtml + '\n\n' + 
        updatedContent.substring(insertIndex)
    } else {
      // Last resort: append to end
      updatedContent += '\n\n' + faqHtml
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
        feature_type: 'faq',
        success: true,
        execution_time_ms: 0,
        tokens_used: tokensUsed
      })

    console.log(`✅ FAQ section added: ${faqData.faq_items.length} questions`)

    const response: FAQResponse = {
      success: true,
      updatedContent,
      faqItems: faqData.faq_items.map((item: any) => ({
        question: item.question,
        answer: item.answer,
        relevance: item.relevance
      })),
      tokensUsed
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ FAQ generation error:', error)

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
          feature_type: 'faq',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log FAQ error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'FAQ generation failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to create FAQ HTML
function createFAQHtml(faqData: any, userStyles?: any): string {
  const faqStyles = userStyles?.extracted_css ? {
    backgroundColor: userStyles.extracted_css.cardBackground || '#ffffff',
    borderColor: userStyles.extracted_css.borderColor || '#e5e7eb',
    textColor: userStyles.extracted_css.textColor || '#374151',
    accentColor: userStyles.extracted_css.accentColor || '#3b82f6',
    fontFamily: userStyles.extracted_css.fontFamily || 'inherit'
  } : {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    textColor: '#374151',
    accentColor: '#3b82f6'
  }

  const faqItems = faqData.faq_items.map((item: any, index: number) => `
    <div class="faq-item" style="
      border: 1px solid ${faqStyles.borderColor};
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
      background: ${faqStyles.backgroundColor};
    ">
      <button class="faq-question" onclick="toggleFAQ(${index})" style="
        width: 100%;
        padding: 16px 20px;
        background: ${faqStyles.accentColor}10;
        border: none;
        text-align: left;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        color: ${faqStyles.textColor};
        font-family: ${faqStyles.fontFamily};
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s ease;
      " onmouseover="this.style.backgroundColor='${faqStyles.accentColor}20'" onmouseout="this.style.backgroundColor='${faqStyles.accentColor}10'">
        <span>${item.question}</span>
        <svg id="faq-icon-${index}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="
          transition: transform 0.2s ease;
          color: ${faqStyles.accentColor};
        ">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </button>
      <div id="faq-answer-${index}" class="faq-answer" style="
        padding: 0 20px;
        max-height: 0;
        overflow: hidden;
        transition: all 0.3s ease;
        background: ${faqStyles.backgroundColor};
      ">
        <div style="
          padding: 16px 0;
          color: ${faqStyles.textColor};
          line-height: 1.6;
          font-family: ${faqStyles.fontFamily};
        ">${item.answer}</div>
      </div>
    </div>
  `).join('')

  return `
<div class="flash-faq" style="
  background: ${faqStyles.backgroundColor};
  border: 1px solid ${faqStyles.borderColor};
  border-radius: 12px;
  padding: 24px;
  margin: 2em 0;
  font-family: ${faqStyles.fontFamily};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
">
  <div style="
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    font-weight: 600;
    color: ${faqStyles.textColor};
    font-size: 18px;
  ">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    ${faqData.section_title || 'Frequently Asked Questions'}
  </div>
  <div class="faq-container">
    ${faqItems}
  </div>
</div>

<script>
function toggleFAQ(index) {
  const answer = document.getElementById('faq-answer-' + index);
  const icon = document.getElementById('faq-icon-' + index);
  
  if (answer.style.maxHeight === '0px' || answer.style.maxHeight === '') {
    answer.style.maxHeight = answer.scrollHeight + 'px';
    icon.style.transform = 'rotate(180deg)';
  } else {
    answer.style.maxHeight = '0px';
    icon.style.transform = 'rotate(0deg)';
  }
}
</script>`
}
