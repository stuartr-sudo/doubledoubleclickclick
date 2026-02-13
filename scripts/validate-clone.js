#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const targets = [
  'app/HomePageClient.tsx',
  'app/about/page.tsx',
  'app/contact/page.tsx',
  'app/blog/page.tsx',
  'components/SiteHeader.tsx',
  'components/MobileMenu.tsx',
  'components/Footer.tsx',
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'app/shipping/page.tsx',
];

const forbidden = [
  /SEWO/g,
  /sewo\.io/g,
  /The AI Field Guide/g,
  /AI Visibility System/g,
  /Apply to Work With Us/g,
  /hello@sewo\.io/g,
  /contact@sewo\.io/g,
  /stuartr@sewo\.io/g,
];

const issues = [];

for (const file of targets) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, 'utf8');
  for (const pattern of forbidden) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push(`${file}: ${matches.length} match(es) for ${pattern}`);
    }
  }
}

if (issues.length > 0) {
  console.error('Legacy content check failed:');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('Legacy content check passed.');
