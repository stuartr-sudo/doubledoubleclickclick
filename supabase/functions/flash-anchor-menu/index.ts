/**
 * Flash Anchor Links Menu Feature
 * 
 * Extracts H2 headings and creates a clickable menu list with anchor links.
 * Inserts after TLDR for easy navigation. Styled to match user's website.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnchorMenuRequest {
  postId: string
  content: string
  userName: string
  userStyles?: any
}

interface AnchorMenuResponse {
  success: boolean
  updatedContent?: string
  headingsFound?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, userStyles }: AnchorMenuRequest = await req.json()

    if (!postId || !content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract H2 headings from content
    const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi
    const headings: { text: string; id: string; original: string }[] = []
    
    let match
    while ((match = h2Regex.exec(content)) !== null) {
      const headingText = match[1].replace(/<[^>]*>/g, '').trim()
      if (headingText) {
        const id = headingText
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50)
        
        headings.push({
          text: headingText,
          id: id,
          original: match[0]
        })
      }
    }

    // Only create menu if we have at least 2 headings
    if (headings.length < 2) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          headingsFound: headings.length,
          message: 'Not enough headings for anchor menu'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Apply user's CSS styles if available
    const menuStyles = userStyles?.extracted_css ? {
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

    // Create anchor menu HTML
    const menuItems = headings.map(heading => `
      <li style="margin: 0; padding: 0;">
        <a href="#${heading.id}" style="
          display: block;
          padding: 8px 12px;
          color: ${menuStyles.textColor};
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-size: 14px;
          line-height: 1.4;
        " onmouseover="this.style.backgroundColor='${menuStyles.accentColor}15'; this.style.color='${menuStyles.accentColor}'" onmouseout="this.style.backgroundColor='transparent'; this.style.color='${menuStyles.textColor}'">
          ${heading.text}
        </a>
      </li>
    `).join('')

    const anchorMenuHtml = `
<div class="flash-anchor-menu" style="
  background: ${menuStyles.backgroundColor};
  border: 1px solid ${menuStyles.borderColor};
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  font-family: ${menuStyles.fontFamily};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
">
  <div style="
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-weight: 600;
    color: ${menuStyles.textColor};
    font-size: 16px;
  ">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
    Table of Contents
  </div>
  <ul style="
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  ">
    ${menuItems}
  </ul>
</div>`

    // Add IDs to H2 headings in the content
    let updatedContent = content
    headings.forEach(heading => {
      const newH2 = heading.original.replace(
        /<h2([^>]*)>/i,
        `<h2$1 id="${heading.id}">`
      )
      updatedContent = updatedContent.replace(heading.original, newH2)
    })

    // Insert anchor menu after TLDR (if it exists) or at the beginning
    const tldrRegex = /<div class="flash-tldr"[^>]*>[\s\S]*?<\/div>/i
    const tldrMatch = updatedContent.match(tldrRegex)
    
    if (tldrMatch) {
      // Insert after TLDR
      const tldrEnd = tldrMatch.index! + tldrMatch[0].length
      updatedContent = 
        updatedContent.substring(0, tldrEnd) + 
        '\n\n' + anchorMenuHtml + 
        updatedContent.substring(tldrEnd)
    } else {
      // Insert at the beginning
      updatedContent = anchorMenuHtml + '\n\n' + updatedContent
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
        feature_type: 'anchor-menu',
        success: true,
        execution_time_ms: 0,
        tokens_used: 0
      })

    console.log(`✅ Anchor menu created with ${headings.length} headings`)

    const response: AnchorMenuResponse = {
      success: true,
      updatedContent,
      headingsFound: headings.length
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Anchor menu generation error:', error)

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
          feature_type: 'anchor-menu',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log anchor menu error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Anchor menu generation failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
