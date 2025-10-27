/**
 * Extract Website CSS Edge Function
 * 
 * Analyzes user's website to extract design elements for AI matching.
 * Extracts colors, fonts, spacing, and other design patterns.
 * Stores results for use in Flash features to create competitive moat advantage.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CSSExtractionRequest {
  websiteUrl: string
  userName: string
}

interface CSSExtractionResponse {
  success: boolean
  extractedCSS?: any
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { websiteUrl, userName }: CSSExtractionRequest = await req.json()

    if (!websiteUrl || !userName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: websiteUrl, userName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`🔍 Extracting CSS from: ${websiteUrl}`)

    // Step 1: Fetch the website HTML
    const websiteResponse = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlashAI/1.0; +https://doubleclicker.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 10000 // 10 second timeout
    })

    if (!websiteResponse.ok) {
      throw new Error(`Failed to fetch website: ${websiteResponse.status} ${websiteResponse.statusText}`)
    }

    const html = await websiteResponse.text()

    // Step 2: Extract CSS from <style> tags and external stylesheets
    const extractedCSS = await extractCSSFromHTML(html, websiteUrl)

    // Step 3: Store extracted CSS in database
    const { error: insertError } = await supabase
      .from('user_website_styles')
      .upsert({
        user_name: userName,
        website_url: websiteUrl,
        extracted_css: extractedCSS,
        last_extracted: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_name,website_url'
      })

    if (insertError) {
      console.error('Failed to store extracted CSS:', insertError)
      throw new Error('Failed to store extracted CSS')
    }

    console.log(`✅ CSS extracted and stored for ${userName}`)

    const response: CSSExtractionResponse = {
      success: true,
      extractedCSS
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ CSS extraction error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'CSS extraction failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to extract CSS from HTML
async function extractCSSFromHTML(html: string, baseUrl: string): Promise<any> {
  const extractedCSS: any = {
    colors: {
      primary: null,
      secondary: null,
      accent: null,
      text: null,
      background: null,
      cardBackground: null,
      border: null,
      highlight: null
    },
    typography: {
      fontFamily: null,
      headingFont: null,
      bodyFont: null,
      fontSize: null
    },
    spacing: {
      padding: null,
      margin: null,
      borderRadius: null,
      lineHeight: null
    },
    layout: {
      maxWidth: null,
      containerPadding: null,
      gridGap: null
    },
    components: {
      buttonStyle: null,
      cardStyle: null,
      linkStyle: null
    },
    rawCSS: '',
    extractedAt: new Date().toISOString()
  }

  try {
    // Extract inline styles from <style> tags
    const styleRegex = /<style[^>]*>(.*?)<\/style>/gis
    const styleMatches = html.match(styleRegex) || []
    
    let allCSS = ''
    for (const styleMatch of styleMatches) {
      const cssContent = styleMatch.replace(/<\/?style[^>]*>/gi, '')
      allCSS += cssContent + '\n'
    }

    // Extract external stylesheet links
    const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi
    const linkMatches = html.match(linkRegex) || []
    
    for (const linkMatch of linkMatches) {
      const hrefMatch = linkMatch.match(/href=["']([^"']+)["']/i)
      if (hrefMatch) {
        try {
          const cssUrl = new URL(hrefMatch[1], baseUrl).href
          const cssResponse = await fetch(cssUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; FlashAI/1.0)',
            },
            timeout: 5000
          })
          
          if (cssResponse.ok) {
            const cssText = await cssResponse.text()
            allCSS += cssText + '\n'
          }
        } catch (cssError) {
          console.warn('Failed to fetch external CSS:', cssError)
        }
      }
    }

    extractedCSS.rawCSS = allCSS

    // Parse CSS to extract design tokens
    const designTokens = parseCSSTokens(allCSS)
    
    // Map extracted tokens to our structure
    extractedCSS.colors = {
      primary: designTokens.colors.primary || '#3b82f6',
      secondary: designTokens.colors.secondary || '#6b7280',
      accent: designTokens.colors.accent || '#3b82f6',
      text: designTokens.colors.text || '#374151',
      background: designTokens.colors.background || '#ffffff',
      cardBackground: designTokens.colors.cardBackground || '#f9fafb',
      border: designTokens.colors.border || '#e5e7eb',
      highlight: designTokens.colors.highlight || '#f0f9ff'
    }

    extractedCSS.typography = {
      fontFamily: designTokens.typography.fontFamily || 'inherit',
      headingFont: designTokens.typography.headingFont || 'inherit',
      bodyFont: designTokens.typography.bodyFont || 'inherit',
      fontSize: designTokens.typography.fontSize || '16px'
    }

    extractedCSS.spacing = {
      padding: designTokens.spacing.padding || '16px',
      margin: designTokens.spacing.margin || '16px',
      borderRadius: designTokens.spacing.borderRadius || '8px',
      lineHeight: designTokens.spacing.lineHeight || '1.6'
    }

    extractedCSS.layout = {
      maxWidth: designTokens.layout.maxWidth || '1200px',
      containerPadding: designTokens.layout.containerPadding || '20px',
      gridGap: designTokens.layout.gridGap || '20px'
    }

    extractedCSS.components = {
      buttonStyle: designTokens.components.buttonStyle || 'solid',
      cardStyle: designTokens.components.cardStyle || 'elevated',
      linkStyle: designTokens.components.linkStyle || 'underline'
    }

  } catch (error) {
    console.error('Error extracting CSS:', error)
  }

  return extractedCSS
}

// Helper function to parse CSS and extract design tokens
function parseCSSTokens(css: string): any {
  const tokens: any = {
    colors: {},
    typography: {},
    spacing: {},
    layout: {},
    components: {}
  }

  // Extract color values
  const colorRegex = /(?:color|background|border-color|background-color):\s*([^;]+)/gi
  const colorMatches = css.match(colorRegex) || []
  
  const colors = new Set<string>()
  for (const match of colorMatches) {
    const colorValue = match.split(':')[1]?.trim()
    if (colorValue && isValidColor(colorValue)) {
      colors.add(colorValue)
    }
  }

  // Categorize colors
  const colorArray = Array.from(colors)
  if (colorArray.length > 0) {
    tokens.colors.primary = colorArray[0]
    tokens.colors.secondary = colorArray[1] || colorArray[0]
    tokens.colors.accent = colorArray[2] || colorArray[0]
    tokens.colors.text = findTextColor(colorArray)
    tokens.colors.background = findBackgroundColor(colorArray)
    tokens.colors.border = findBorderColor(colorArray)
  }

  // Extract font families
  const fontRegex = /font-family:\s*([^;]+)/gi
  const fontMatches = css.match(fontRegex) || []
  if (fontMatches.length > 0) {
    const fontFamily = fontMatches[0].split(':')[1]?.trim()
    tokens.typography.fontFamily = fontFamily
    tokens.typography.headingFont = fontFamily
    tokens.typography.bodyFont = fontFamily
  }

  // Extract font sizes
  const fontSizeRegex = /font-size:\s*([^;]+)/gi
  const fontSizeMatches = css.match(fontSizeRegex) || []
  if (fontSizeMatches.length > 0) {
    const fontSize = fontSizeMatches[0].split(':')[1]?.trim()
    tokens.typography.fontSize = fontSize
  }

  // Extract spacing values
  const paddingRegex = /padding:\s*([^;]+)/gi
  const paddingMatches = css.match(paddingRegex) || []
  if (paddingMatches.length > 0) {
    tokens.spacing.padding = paddingMatches[0].split(':')[1]?.trim()
  }

  const marginRegex = /margin:\s*([^;]+)/gi
  const marginMatches = css.match(marginRegex) || []
  if (marginMatches.length > 0) {
    tokens.spacing.margin = marginMatches[0].split(':')[1]?.trim()
  }

  const borderRadiusRegex = /border-radius:\s*([^;]+)/gi
  const borderRadiusMatches = css.match(borderRadiusRegex) || []
  if (borderRadiusMatches.length > 0) {
    tokens.spacing.borderRadius = borderRadiusMatches[0].split(':')[1]?.trim()
  }

  const lineHeightRegex = /line-height:\s*([^;]+)/gi
  const lineHeightMatches = css.match(lineHeightRegex) || []
  if (lineHeightMatches.length > 0) {
    tokens.spacing.lineHeight = lineHeightMatches[0].split(':')[1]?.trim()
  }

  // Extract layout values
  const maxWidthRegex = /max-width:\s*([^;]+)/gi
  const maxWidthMatches = css.match(maxWidthRegex) || []
  if (maxWidthMatches.length > 0) {
    tokens.layout.maxWidth = maxWidthMatches[0].split(':')[1]?.trim()
  }

  return tokens
}

// Helper function to validate color values
function isValidColor(color: string): boolean {
  // Check for hex colors
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) return true
  
  // Check for rgb/rgba colors
  if (/^rgba?\([^)]+\)$/.test(color)) return true
  
  // Check for hsl/hsla colors
  if (/^hsla?\([^)]+\)$/.test(color)) return true
  
  // Check for named colors
  const namedColors = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
    'black', 'white', 'gray', 'grey', 'transparent', 'currentColor'
  ]
  if (namedColors.includes(color.toLowerCase())) return true
  
  return false
}

// Helper function to find text color
function findTextColor(colors: string[]): string {
  const textColors = colors.filter(color => 
    color.includes('black') || 
    color.includes('#000') || 
    color.includes('rgb(0,0,0)') ||
    color.includes('gray') ||
    color.includes('grey')
  )
  return textColors[0] || colors[0] || '#374151'
}

// Helper function to find background color
function findBackgroundColor(colors: string[]): string {
  const bgColors = colors.filter(color => 
    color.includes('white') || 
    color.includes('#fff') || 
    color.includes('rgb(255,255,255)') ||
    color.includes('#f') && color.length <= 7
  )
  return bgColors[0] || colors[1] || '#ffffff'
}

// Helper function to find border color
function findBorderColor(colors: string[]): string {
  const borderColors = colors.filter(color => 
    color.includes('gray') ||
    color.includes('grey') ||
    color.includes('#e') ||
    color.includes('rgb(229,231,235)')
  )
  return borderColors[0] || colors[2] || '#e5e7eb'
}
