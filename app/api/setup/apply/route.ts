import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface Config {
  brandName: string
  domain: string
  tagline: string
  description: string
  footerTagline: string
  email: string
  contactEmail: string
  privacyEmail: string
  phone: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  primaryColor: string
  accentColor: string
  gaId: string
  gtmId: string
}

const defaultValues = {
  oldBrand: 'SEWO',
  oldDomain: 'sewo.io',
  oldEmail: 'stuartr@sewo.io',
  oldContactEmail: 'contact@sewo.io',
  oldPrivacyEmail: 'privacy@sewo.io',
  oldPhone: '+1 342223434',
  oldPhoneRaw: '1342223434',
  oldTagline: 'Get Found Everywhere',
  oldDescription: 'Make your brand the answer AI suggests. Expert LLM ranking optimization to boost your visibility in AI-powered search.',
  oldFooterTagline: 'Expert LLM ranking optimization to boost your visibility in AI-powered search results.',
  oldGaId: 'G-TT58X7D8RV',
  oldGtmId: 'GTM-M4RMX5TG',
  oldPrimaryColor: '#000000',
  oldAccentColor: '#0066ff',
}

const filesToUpdate = [
  'package.json',
  'components/SiteHeader.tsx',
  'components/Footer.tsx',
  'components/Analytics.tsx',
  'app/layout.tsx',
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'app/shipping/page.tsx',
  'app/about/page.tsx',
  'app/api/lead-capture/route.ts',
  'app/api/apply-to-work-with-us/route.ts',
  'app/api/send-questions/route.ts',
  'app/api/homepage/route.ts',
  'app/api/blog/route.ts',
  'app/api/blog/[id]/route.ts',
  'app/robots.ts',
  'app/sitemap-pages.xml/route.ts',
  'middleware.ts',
]

export async function POST(request: Request) {
  try {
    const projectRoot = process.cwd()
    
    // SAFETY: Prevent running on the template
    const templateMarker = path.join(projectRoot, '.template-marker')
    if (fs.existsSync(templateMarker)) {
      return NextResponse.json({
        success: false,
        message: 'ERROR: This is the TEMPLATE! Do not modify it directly. Create a clone first using: ./create-new-blog.sh your-site-name',
      }, { status: 403 })
    }
    
    const config: Config = await request.json()
    
    // Validate required fields
    if (!config.brandName || !config.domain || !config.email) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: brandName, domain, and email are required.',
      }, { status: 400 })
    }
    let filesUpdated = 0
    let totalReplacements = 0

    // Build replacement pairs
    const replacements: [RegExp, string][] = [
      // Brand name
      [/SEWO/g, config.brandName],
      
      // Domain variations
      [/sewo\.io/g, config.domain],
      [/www\.sewo\.io/g, `www.${config.domain}`],
      [/https:\/\/www\.sewo\.io/g, `https://www.${config.domain}`],
      [/https:\/\/sewo\.io/g, `https://${config.domain}`],
      
      // Emails
      [/stuartr@sewo\.io/g, config.email],
      [/contact@sewo\.io/g, config.contactEmail || `contact@${config.domain}`],
      [/privacy@sewo\.io/g, config.privacyEmail || `privacy@${config.domain}`],
      [/hi@sewo\.io/g, config.contactEmail || `contact@${config.domain}`],
      
      // Package name (kebab-case)
      [/"sewo-website"/g, `"${config.brandName.toLowerCase().replace(/\s+/g, '-')}-website"`],
    ]

    // Phone (only if provided)
    if (config.phone) {
      const phoneRaw = config.phone.replace(/\D/g, '')
      replacements.push([/\+1 342223434/g, config.phone])
      replacements.push([/\+1342223434/g, `+${phoneRaw}`])
      replacements.push([/1342223434/g, phoneRaw])
    }

    // Analytics IDs (only if provided)
    if (config.gaId) {
      replacements.push([/G-TT58X7D8RV/g, config.gaId])
    }
    if (config.gtmId) {
      replacements.push([/GTM-M4RMX5TG/g, config.gtmId])
    }

    // Tagline and description
    if (config.tagline) {
      replacements.push([/Get Found Everywhere/g, config.tagline])
    }
    if (config.description) {
      replacements.push([/Make your brand the answer AI suggests\. Expert LLM ranking optimization to boost your visibility in AI-powered search\./g, config.description])
    }
    if (config.footerTagline) {
      replacements.push([/Expert LLM ranking optimization to boost your visibility in AI-powered search results\./g, config.footerTagline])
    }

    // Process files
    for (const filePath of filesToUpdate) {
      const fullPath = path.join(projectRoot, filePath)
      
      if (!fs.existsSync(fullPath)) {
        continue
      }

      let content = fs.readFileSync(fullPath, 'utf8')
      let fileReplacements = 0

      for (const [pattern, replacement] of replacements) {
        const matches = content.match(pattern)
        if (matches) {
          fileReplacements += matches.length
          content = content.replace(pattern, replacement)
        }
      }

      if (fileReplacements > 0) {
        fs.writeFileSync(fullPath, content, 'utf8')
        filesUpdated++
        totalReplacements += fileReplacements
      }
    }

    // Update address in Footer.tsx specifically (multi-line)
    if (config.addressLine1) {
      const footerPath = path.join(projectRoot, 'components/Footer.tsx')
      if (fs.existsSync(footerPath)) {
        let footerContent = fs.readFileSync(footerPath, 'utf8')
        
        const newAddressBlock = [config.addressLine1, config.addressLine2, config.addressLine3]
          .filter(Boolean)
          .join(',<br />\n                ')
        
        if (footerContent.includes('4286, 1007 N Orange St')) {
          footerContent = footerContent.replace(
            /4286, 1007 N Orange St\. 4th Floor,<br \/>\s*Wilmington, DE, New Castle,<br \/>\s*US, 19801/,
            newAddressBlock
          )
          fs.writeFileSync(footerPath, footerContent, 'utf8')
        }
      }
    }

    // Update color palette in globals.css
    const cssPath = path.join(projectRoot, 'app/globals.css')
    if (fs.existsSync(cssPath)) {
      let cssContent = fs.readFileSync(cssPath, 'utf8')
      let cssChanges = 0

      // Update primary color
      if (config.primaryColor && config.primaryColor !== defaultValues.oldPrimaryColor) {
        cssContent = cssContent.replace(
          /--color-primary:\s*#[0-9a-fA-F]{6};/,
          `--color-primary: ${config.primaryColor};`
        )
        cssChanges++
      }

      // Update accent color
      if (config.accentColor && config.accentColor !== defaultValues.oldAccentColor) {
        cssContent = cssContent.replace(
          /--color-accent:\s*#[0-9a-fA-F]{6};/,
          `--color-accent: ${config.accentColor};`
        )
        cssChanges++
      }

      if (cssChanges > 0) {
        fs.writeFileSync(cssPath, cssContent, 'utf8')
        filesUpdated++
        totalReplacements += cssChanges
      }
    }

    // Create .env.local.example
    const envPath = path.join(projectRoot, '.env.local.example')
    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site URL
NEXT_PUBLIC_SITE_URL=https://www.${config.domain}

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Analytics (Optional)
${config.gaId ? `# Google Analytics configured in code: ${config.gaId}` : '# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX'}
${config.gtmId ? `# Google Tag Manager configured in code: ${config.gtmId}` : '# NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX'}
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
`
    fs.writeFileSync(envPath, envContent, 'utf8')

    // Save config for reference
    const configPath = path.join(projectRoot, '.site-config.json')
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${filesUpdated} files with ${totalReplacements} replacements.`,
      filesUpdated,
      totalReplacements,
    })

  } catch (error) {
    console.error('Setup apply error:', error)
    return NextResponse.json({
      success: false,
      message: `Error applying changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 500 })
  }
}
