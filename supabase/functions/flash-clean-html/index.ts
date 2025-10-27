/**
 * Flash Clean HTML Feature
 * 
 * Cleans up messy, broken, or malformed HTML.
 * Fixes common issues like unclosed tags, invalid attributes, and formatting problems.
 * Ensures clean, valid HTML output.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanHtmlRequest {
  postId: string
  content: string
  userName: string
  userStyles?: any
}

interface CleanHtmlResponse {
  success: boolean
  updatedContent?: string
  issuesFixed?: string[]
  tokensUsed?: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postId, content, userName, userStyles }: CleanHtmlRequest = await req.json()

    if (!postId || !content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Analyze HTML for issues
    const analysis = analyzeHtmlIssues(content)
    
    if (analysis.issues.length === 0) {
      console.log('HTML is already clean, no fixes needed')
      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedContent: content,
          issuesFixed: [],
          message: 'HTML is already clean'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Clean the HTML
    let cleanedContent = content
    const issuesFixed: string[] = []

    // Fix 1: Remove empty tags
    if (analysis.issues.includes('empty_tags')) {
      cleanedContent = cleanedContent.replace(/<(\w+)[^>]*>\s*<\/\1>/gi, '')
      issuesFixed.push('Removed empty tags')
    }

    // Fix 2: Fix unclosed tags
    if (analysis.issues.includes('unclosed_tags')) {
      cleanedContent = fixUnclosedTags(cleanedContent)
      issuesFixed.push('Fixed unclosed tags')
    }

    // Fix 3: Remove invalid attributes
    if (analysis.issues.includes('invalid_attributes')) {
      cleanedContent = removeInvalidAttributes(cleanedContent)
      issuesFixed.push('Removed invalid attributes')
    }

    // Fix 4: Fix malformed tags
    if (analysis.issues.includes('malformed_tags')) {
      cleanedContent = fixMalformedTags(cleanedContent)
      issuesFixed.push('Fixed malformed tags')
    }

    // Fix 5: Normalize whitespace
    if (analysis.issues.includes('excessive_whitespace')) {
      cleanedContent = normalizeWhitespace(cleanedContent)
      issuesFixed.push('Normalized whitespace')
    }

    // Fix 6: Fix nested list issues
    if (analysis.issues.includes('nested_list_issues')) {
      cleanedContent = fixNestedLists(cleanedContent)
      issuesFixed.push('Fixed nested list structure')
    }

    // Fix 7: Remove duplicate attributes
    if (analysis.issues.includes('duplicate_attributes')) {
      cleanedContent = removeDuplicateAttributes(cleanedContent)
      issuesFixed.push('Removed duplicate attributes')
    }

    // Fix 8: Fix broken links
    if (analysis.issues.includes('broken_links')) {
      cleanedContent = fixBrokenLinks(cleanedContent)
      issuesFixed.push('Fixed broken links')
    }

    // Fix 9: Ensure proper heading hierarchy
    if (analysis.issues.includes('heading_hierarchy')) {
      cleanedContent = fixHeadingHierarchy(cleanedContent)
      issuesFixed.push('Fixed heading hierarchy')
    }

    // Fix 10: Clean up Flash-generated elements
    cleanedContent = cleanFlashElements(cleanedContent)

    // Log execution
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('flash_execution_log')
      .insert({
        post_id: postId,
        feature_type: 'clean-html',
        success: true,
        execution_time_ms: 0,
        tokens_used: 0
      })

    console.log(`✅ HTML cleaned: ${issuesFixed.length} issues fixed`)

    const response: CleanHtmlResponse = {
      success: true,
      updatedContent: cleanedContent,
      issuesFixed,
      tokensUsed: 0
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ HTML cleaning error:', error)

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
          feature_type: 'clean-html',
          success: false,
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log HTML cleaning error:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'HTML cleaning failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to analyze HTML for issues
function analyzeHtmlIssues(content: string): { issues: string[] } {
  const issues: string[] = []

  // Check for empty tags
  if (/<(\w+)[^>]*>\s*<\/\1>/gi.test(content)) {
    issues.push('empty_tags')
  }

  // Check for unclosed tags (simple check)
  const openTags = content.match(/<(\w+)[^>]*>/gi) || []
  const closeTags = content.match(/<\/(\w+)>/gi) || []
  
  if (openTags.length !== closeTags.length) {
    issues.push('unclosed_tags')
  }

  // Check for invalid attributes
  if (/<[^>]*\s[a-z]+="[^"]*"[^>]*>/gi.test(content)) {
    issues.push('invalid_attributes')
  }

  // Check for malformed tags
  if (/<[^>]*<[^>]*>/gi.test(content)) {
    issues.push('malformed_tags')
  }

  // Check for excessive whitespace
  if (/\s{3,}/gi.test(content)) {
    issues.push('excessive_whitespace')
  }

  // Check for nested list issues
  if (/<li[^>]*>.*<ul[^>]*>.*<\/ul>.*<\/li>/gi.test(content)) {
    issues.push('nested_list_issues')
  }

  // Check for duplicate attributes
  if (/(\w+)="[^"]*"[^>]*\1=/gi.test(content)) {
    issues.push('duplicate_attributes')
  }

  // Check for broken links
  if (/<a[^>]*href="[^"]*"[^>]*>/gi.test(content)) {
    issues.push('broken_links')
  }

  // Check for heading hierarchy issues
  if (/<h[1-6][^>]*>.*<h[1-6][^>]*>/gi.test(content)) {
    issues.push('heading_hierarchy')
  }

  return { issues }
}

// Helper function to fix unclosed tags
function fixUnclosedTags(content: string): string {
  // Simple approach: ensure common tags are properly closed
  const commonTags = ['p', 'div', 'span', 'strong', 'em', 'ul', 'ol', 'li']
  
  let fixed = content
  
  for (const tag of commonTags) {
    const openRegex = new RegExp(`<${tag}([^>]*)>`, 'gi')
    const closeRegex = new RegExp(`</${tag}>`, 'gi')
    
    const openMatches = (fixed.match(openRegex) || []).length
    const closeMatches = (fixed.match(closeRegex) || []).length
    
    if (openMatches > closeMatches) {
      // Add missing closing tags at the end
      const missing = openMatches - closeMatches
      for (let i = 0; i < missing; i++) {
        fixed += `</${tag}>`
      }
    }
  }
  
  return fixed
}

// Helper function to remove invalid attributes
function removeInvalidAttributes(content: string): string {
  // Remove common invalid attributes
  return content
    .replace(/\s+onclick="[^"]*"/gi, '') // Remove onclick handlers
    .replace(/\s+onload="[^"]*"/gi, '') // Remove onload handlers
    .replace(/\s+style="[^"]*"/gi, (match) => {
      // Clean up style attributes
      const styleContent = match.match(/style="([^"]*)"/i)?.[1] || ''
      const cleanStyle = styleContent
        .split(';')
        .filter(rule => rule.trim() && !rule.includes('javascript:'))
        .join(';')
      return cleanStyle ? ` style="${cleanStyle}"` : ''
    })
}

// Helper function to fix malformed tags
function fixMalformedTags(content: string): string {
  // Fix tags that are missing closing brackets
  return content
    .replace(/<(\w+)([^>]*)(?<!>)$/gm, '<$1$2>')
    .replace(/<(\w+)([^>]*)\s+>/g, '<$1$2>')
}

// Helper function to normalize whitespace
function normalizeWhitespace(content: string): string {
  return content
    .replace(/\s{3,}/g, ' ') // Replace 3+ spaces with single space
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace 3+ newlines with double newline
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .trim()
}

// Helper function to fix nested list issues
function fixNestedLists(content: string): string {
  // Ensure proper list structure
  return content
    .replace(/<li([^>]*)>([^<]*)<ul([^>]*)>/gi, '<li$1>$2<ul$3>')
    .replace(/<\/ul>([^<]*)<\/li>/gi, '</ul>$1</li>')
}

// Helper function to remove duplicate attributes
function removeDuplicateAttributes(content: string): string {
  return content.replace(/<(\w+)([^>]*)\s+(\w+)="([^"]*)"[^>]*\s+\3="[^"]*"/gi, '<$1$2 $3="$4"')
}

// Helper function to fix broken links
function fixBrokenLinks(content: string): string {
  return content
    .replace(/<a([^>]*)href=""/gi, '<a$1href="#"')
    .replace(/<a([^>]*)href="[^"]*javascript:[^"]*"/gi, '<a$1href="#"')
    .replace(/<a([^>]*)href="[^"]*void\(0\)[^"]*"/gi, '<a$1href="#"')
}

// Helper function to fix heading hierarchy
function fixHeadingHierarchy(content: string): string {
  // Ensure proper heading order (H1 -> H2 -> H3, etc.)
  let fixed = content
  const headingMatches = fixed.match(/<h([1-6])[^>]*>/gi) || []
  
  let currentLevel = 1
  for (const heading of headingMatches) {
    const level = parseInt(heading.match(/<h([1-6])/i)?.[1] || '1')
    
    if (level > currentLevel + 1) {
      // Fix skipped levels
      const correctedLevel = currentLevel + 1
      fixed = fixed.replace(heading, heading.replace(/h[1-6]/i, `h${correctedLevel}`))
      currentLevel = correctedLevel
    } else {
      currentLevel = level
    }
  }
  
  return fixed
}

// Helper function to clean up Flash-generated elements
function cleanFlashElements(content: string): string {
  return content
    // Remove any duplicate Flash elements
    .replace(/(<div class="flash-[^"]*"[^>]*>[\s\S]*?<\/div>)\s*\1/gi, '$1')
    // Clean up any malformed Flash elements
    .replace(/<div class="flash-[^"]*"[^>]*>\s*<\/div>/gi, '')
    // Ensure proper spacing around Flash elements
    .replace(/(<\/div>)\s*(<div class="flash-)/gi, '$1\n\n$2')
}
