#!/usr/bin/env node

/**
 * New Site Setup Wizard
 * 
 * Run this script after cloning the blog to configure it for a new niche.
 * Usage: node scripts/setup-new-site.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ask(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Preset color palettes
const colorPalettes = {
  '1': { name: 'Classic Black & Blue', primary: '#000000', accent: '#0066ff' },
  '2': { name: 'Navy & Orange', primary: '#1e3a5f', accent: '#ff6b35' },
  '3': { name: 'Forest & Gold', primary: '#2d5a27', accent: '#d4af37' },
  '4': { name: 'Purple & Pink', primary: '#4a0e4e', accent: '#ff69b4' },
  '5': { name: 'Slate & Teal', primary: '#334155', accent: '#14b8a6' },
  '6': { name: 'Burgundy & Gold', primary: '#722f37', accent: '#c9a227' },
  '7': { name: 'Ocean Blue & Coral', primary: '#0077b6', accent: '#ff7f50' },
  '8': { name: 'Charcoal & Lime', primary: '#36454f', accent: '#32cd32' },
  'custom': { name: 'Custom Colors', primary: null, accent: null },
};

// Files that need to be updated with brand info
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
];

// Replacement mappings
const defaultValues = {
  oldBrand: 'SEWO',
  oldDomain: 'sewo.io',
  oldEmail: 'stuartr@sewo.io',
  oldContactEmail: 'contact@sewo.io',
  oldPrivacyEmail: 'privacy@sewo.io',
  oldPhone: '+1 342223434',
  oldPhoneRaw: '1342223434',
  oldAddress: `4286, 1007 N Orange St. 4th Floor,<br />
                Wilmington, DE, New Castle,<br />
                US, 19801`,
  oldAddressSimple: '4286, 1007 N Orange St. 4th Floor, Wilmington, DE, New Castle, US, 19801',
  oldTagline: 'Get Found Everywhere',
  oldDescription: 'Make your brand the answer AI suggests. Expert LLM ranking optimization to boost your visibility in AI-powered search.',
  oldFooterTagline: 'Expert LLM ranking optimization to boost your visibility in AI-powered search results.',
  oldGaId: 'G-TT58X7D8RV',
  oldGtmId: 'GTM-M4RMX5TG',
  oldPrimaryColor: '#000000',
  oldAccentColor: '#0066ff',
};

async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║                                                            ║', 'blue');
  log('║           🚀 NEW SITE SETUP WIZARD 🚀                      ║', 'blue');
  log('║                                                            ║', 'blue');
  log('║   This wizard will help you configure your new blog site   ║', 'blue');
  log('║                                                            ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');
  console.log('');

  log('I\'ll ask you a series of questions to configure your new site.', 'yellow');
  log('Press Enter to keep the current/default value shown in [brackets].', 'yellow');
  console.log('');

  // Collect new values
  const config = {};

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('STEP 1: BRAND IDENTITY', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  console.log('');

  config.brandName = await ask('Brand name (e.g., "Acme Blog"): ');
  if (!config.brandName) {
    log('Brand name is required!', 'red');
    process.exit(1);
  }

  config.domain = await ask('Domain (without www, e.g., "acmeblog.com"): ');
  if (!config.domain) {
    log('Domain is required!', 'red');
    process.exit(1);
  }

  config.tagline = await ask(`Tagline [${defaultValues.oldTagline}]: `) || defaultValues.oldTagline;
  config.description = await ask(`Description (1-2 sentences about your site):\n`) || defaultValues.oldDescription;
  config.footerTagline = await ask(`Footer tagline (shorter version):\n`) || config.description.substring(0, 100);

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('STEP 2: CONTACT INFORMATION', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  console.log('');

  config.email = await ask('Primary email (for notifications): ');
  if (!config.email) {
    log('Email is required!', 'red');
    process.exit(1);
  }

  config.contactEmail = await ask(`Contact email [contact@${config.domain}]: `) || `contact@${config.domain}`;
  config.privacyEmail = await ask(`Privacy email [privacy@${config.domain}]: `) || `privacy@${config.domain}`;
  config.phone = await ask('Phone number (e.g., "+1 555-123-4567"): ') || '';
  
  console.log('');
  log('Enter your business address (or press Enter to skip):', 'yellow');
  config.addressLine1 = await ask('Address line 1: ') || '';
  config.addressLine2 = await ask('Address line 2 (city, state): ') || '';
  config.addressLine3 = await ask('Address line 3 (country, zip): ') || '';

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('STEP 3: COLOR PALETTE', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  console.log('');

  log('Choose a color palette for your site:', 'yellow');
  console.log('');
  for (const [key, palette] of Object.entries(colorPalettes)) {
    if (key === 'custom') {
      console.log(`  ${colors.cyan}${key}${colors.reset}. ${palette.name}`);
    } else {
      console.log(`  ${colors.cyan}${key}${colors.reset}. ${palette.name} (Primary: ${palette.primary}, Accent: ${palette.accent})`);
    }
  }
  console.log('');

  const paletteChoice = await ask('Enter number (1-8) or "custom" [1]: ') || '1';
  
  if (paletteChoice === 'custom') {
    config.primaryColor = await ask('Primary color (hex, e.g., "#1a1a2e"): ') || '#000000';
    config.accentColor = await ask('Accent color (hex, e.g., "#e94560"): ') || '#0066ff';
  } else if (colorPalettes[paletteChoice]) {
    config.primaryColor = colorPalettes[paletteChoice].primary;
    config.accentColor = colorPalettes[paletteChoice].accent;
    log(`Selected: ${colorPalettes[paletteChoice].name}`, 'green');
  } else {
    config.primaryColor = colorPalettes['1'].primary;
    config.accentColor = colorPalettes['1'].accent;
    log('Invalid choice, using default (Classic Black & Blue)', 'yellow');
  }

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('STEP 4: ANALYTICS (optional - press Enter to skip)', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  console.log('');

  config.gaId = await ask('Google Analytics ID (e.g., "G-XXXXXXXXXX"): ') || '';
  config.gtmId = await ask('Google Tag Manager ID (e.g., "GTM-XXXXXXX"): ') || '';

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('STEP 5: CONFIRMATION', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  console.log('');

  log('Here\'s what will be configured:', 'yellow');
  console.log('');
  console.log(`  Brand Name:     ${colors.green}${config.brandName}${colors.reset}`);
  console.log(`  Domain:         ${colors.green}${config.domain}${colors.reset}`);
  console.log(`  Tagline:        ${colors.green}${config.tagline}${colors.reset}`);
  console.log(`  Email:          ${colors.green}${config.email}${colors.reset}`);
  console.log(`  Contact Email:  ${colors.green}${config.contactEmail}${colors.reset}`);
  console.log(`  Phone:          ${colors.green}${config.phone || '(not set)'}${colors.reset}`);
  console.log(`  Primary Color:  ${colors.green}${config.primaryColor}${colors.reset}`);
  console.log(`  Accent Color:   ${colors.green}${config.accentColor}${colors.reset}`);
  console.log(`  GA ID:          ${colors.green}${config.gaId || '(not set)'}${colors.reset}`);
  console.log(`  GTM ID:         ${colors.green}${config.gtmId || '(not set)'}${colors.reset}`);
  console.log('');

  const confirm = await ask('Proceed with these settings? (y/n): ');
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    log('Setup cancelled.', 'yellow');
    process.exit(0);
  }

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('APPLYING CHANGES...', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  console.log('');

  // Build replacement pairs
  const replacements = [
    // Brand name
    [/SEWO/g, config.brandName],
    
    // Domain variations
    [/sewo\.io/g, config.domain],
    [/www\.sewo\.io/g, `www.${config.domain}`],
    [/https:\/\/www\.sewo\.io/g, `https://www.${config.domain}`],
    [/https:\/\/sewo\.io/g, `https://${config.domain}`],
    
    // Emails
    [/stuartr@sewo\.io/g, config.email],
    [/contact@sewo\.io/g, config.contactEmail],
    [/privacy@sewo\.io/g, config.privacyEmail],
    [/hi@sewo\.io/g, config.contactEmail],
    
    // Package name (kebab-case)
    [/"sewo-website"/g, `"${config.brandName.toLowerCase().replace(/\s+/g, '-')}-website"`],
  ];

  // Phone (only if provided)
  if (config.phone) {
    const phoneRaw = config.phone.replace(/\D/g, '');
    replacements.push([/\+1 342223434/g, config.phone]);
    replacements.push([/\+1342223434/g, `+${phoneRaw}`]);
    replacements.push([/1342223434/g, phoneRaw]);
  }

  // Analytics IDs (only if provided, otherwise comment out)
  if (config.gaId) {
    replacements.push([/G-TT58X7D8RV/g, config.gaId]);
  }
  if (config.gtmId) {
    replacements.push([/GTM-M4RMX5TG/g, config.gtmId]);
  }

  // Tagline and description
  replacements.push([/Get Found Everywhere/g, config.tagline]);
  replacements.push([/Make your brand the answer AI suggests\. Expert LLM ranking optimization to boost your visibility in AI-powered search\./g, config.description]);
  replacements.push([/Expert LLM ranking optimization to boost your visibility in AI-powered search results\./g, config.footerTagline]);

  // Process files
  let filesUpdated = 0;
  let totalReplacements = 0;

  for (const filePath of filesToUpdate) {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      log(`  ⚠ Skipped (not found): ${filePath}`, 'yellow');
      continue;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let fileReplacements = 0;

    for (const [pattern, replacement] of replacements) {
      const matches = content.match(pattern);
      if (matches) {
        fileReplacements += matches.length;
        content = content.replace(pattern, replacement);
      }
    }

    if (fileReplacements > 0) {
      fs.writeFileSync(fullPath, content, 'utf8');
      log(`  ✓ Updated: ${filePath} (${fileReplacements} changes)`, 'green');
      filesUpdated++;
      totalReplacements += fileReplacements;
    } else {
      log(`  - No changes: ${filePath}`, 'reset');
    }
  }

  // Update address in Footer.tsx specifically (multi-line)
  if (config.addressLine1) {
    const footerPath = path.join(process.cwd(), 'components/Footer.tsx');
    if (fs.existsSync(footerPath)) {
      let footerContent = fs.readFileSync(footerPath, 'utf8');
      
      const oldAddressBlock = `4286, 1007 N Orange St. 4th Floor,<br />
                Wilmington, DE, New Castle,<br />
                US, 19801`;
      
      const newAddressBlock = [config.addressLine1, config.addressLine2, config.addressLine3]
        .filter(Boolean)
        .join(',<br />\n                ');
      
      if (footerContent.includes('4286, 1007 N Orange St')) {
        footerContent = footerContent.replace(
          /4286, 1007 N Orange St\. 4th Floor,<br \/>\s*Wilmington, DE, New Castle,<br \/>\s*US, 19801/,
          newAddressBlock
        );
        fs.writeFileSync(footerPath, footerContent, 'utf8');
        log(`  ✓ Updated address in Footer.tsx`, 'green');
      }
    }
  }

  // Update color palette in globals.css
  const cssPath = path.join(process.cwd(), 'app/globals.css');
  if (fs.existsSync(cssPath)) {
    let cssContent = fs.readFileSync(cssPath, 'utf8');
    let cssChanges = 0;

    // Update primary color
    if (config.primaryColor && config.primaryColor !== defaultValues.oldPrimaryColor) {
      cssContent = cssContent.replace(
        /--color-primary:\s*#[0-9a-fA-F]{6};/,
        `--color-primary: ${config.primaryColor};`
      );
      cssChanges++;
    }

    // Update accent color
    if (config.accentColor && config.accentColor !== defaultValues.oldAccentColor) {
      cssContent = cssContent.replace(
        /--color-accent:\s*#[0-9a-fA-F]{6};/,
        `--color-accent: ${config.accentColor};`
      );
      cssChanges++;
    }

    if (cssChanges > 0) {
      fs.writeFileSync(cssPath, cssContent, 'utf8');
      log(`  ✓ Updated color palette in globals.css (${cssChanges} colors)`, 'green');
    }
  }

  // Create/update .env.local template
  const envPath = path.join(process.cwd(), '.env.local.example');
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
`;

  fs.writeFileSync(envPath, envContent, 'utf8');
  log(`  ✓ Created: .env.local.example`, 'green');

  // Save config for reference
  const configPath = path.join(process.cwd(), '.site-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  log(`  ✓ Saved config: .site-config.json`, 'green');

  console.log('');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('✅ SETUP COMPLETE!', 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  console.log('');

  console.log(`  ${colors.bright}Summary:${colors.reset}`);
  console.log(`  • ${filesUpdated} files updated`);
  console.log(`  • ${totalReplacements} replacements made`);
  console.log('');

  log('📋 REMAINING MANUAL STEPS:', 'yellow');
  console.log('');
  console.log('  1. Create Supabase project and run migrations');
  console.log('  2. Copy .env.local.example to .env.local and fill in values');
  console.log('  3. Review and update legal pages:');
  console.log('     • app/privacy/page.tsx');
  console.log('     • app/terms/page.tsx');
  console.log('     • app/shipping/page.tsx');
  console.log('  4. Update favicon: public/favicon.svg');
  console.log('  5. Deploy to Vercel');
  console.log('');

  if (!config.gaId) {
    log('⚠ No Google Analytics ID provided - tracking is disabled', 'yellow');
  }
  if (!config.gtmId) {
    log('⚠ No GTM ID provided - tag manager is disabled', 'yellow');
  }
  if (!config.phone) {
    log('⚠ No phone number provided - phone link removed from footer', 'yellow');
  }

  console.log('');
  log('Run "npm run dev" to test your new site locally!', 'cyan');
  console.log('');

  rl.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
