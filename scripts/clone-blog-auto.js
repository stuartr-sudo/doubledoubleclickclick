#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`Error: ${msg}`);
    process.exit(1);
  }
}

function copyTemplate(templateDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const ignore = new Set(['.git', 'node_modules', '.next']);
  fs.cpSync(templateDir, targetDir, {
    recursive: true,
    force: true,
    filter: (src) => {
      const rel = path.relative(templateDir, src);
      if (!rel) return true;
      const top = rel.split(path.sep)[0];
      return !ignore.has(top);
    },
  });

  // Remove template-only bootstrap script in clone folder.
  const templateScript = path.join(targetDir, 'create-new-blog.sh');
  if (fs.existsSync(templateScript)) fs.unlinkSync(templateScript);
}

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function main() {
  const profilePathArg = getArgValue('--profile');
  const outputBaseArg = getArgValue('--output-base');

  assert(profilePathArg, 'Missing --profile path (JSON)');

  const templateDir = path.resolve(__dirname, '..');
  const profilePath = path.isAbsolute(profilePathArg)
    ? profilePathArg
    : path.resolve(process.cwd(), profilePathArg);

  assert(fs.existsSync(profilePath), `Profile not found: ${profilePath}`);

  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  const setupConfig = {
    brandName: profile.brandName,
    domain: profile.domain,
    email: profile.email,
    contactEmail: profile.contactEmail,
    privacyEmail: profile.privacyEmail,
    phone: profile.phone || '',
    tagline: profile.tagline,
    description: profile.description,
    footerTagline: profile.footerTagline,
    primaryColor: profile.primaryColor,
    accentColor: profile.accentColor,
    gaId: profile.gaId || '',
    gtmId: profile.gtmId || '',
  };

  assert(setupConfig.brandName, 'profile.brandName is required');
  assert(setupConfig.domain, 'profile.domain is required');
  assert(setupConfig.email, 'profile.email is required');

  const outputBase = outputBaseArg
    ? path.resolve(outputBaseArg)
    : path.dirname(templateDir);
  const folderName = (profile.username || setupConfig.brandName).toLowerCase().replace(/\s+/g, '-');
  const targetDir = path.join(outputBase, folderName);

  if (fs.existsSync(targetDir)) {
    console.error(`Target already exists: ${targetDir}`);
    process.exit(1);
  }

  console.log(`Creating clone at: ${targetDir}`);
  copyTemplate(templateDir, targetDir);

  const configPath = path.join(targetDir, '.clone-setup.json');
  fs.writeFileSync(configPath, JSON.stringify(setupConfig, null, 2));

  run('git init', targetDir);
  run('npm install', targetDir);
  run(`node scripts/setup-new-site.js --config ".clone-setup.json"`, targetDir);
  run('node scripts/validate-clone.js', targetDir);

  run('git add .', targetDir);
  run('git commit -m "Initial branded clone setup"', targetDir);

  console.log('');
  console.log('Clone automation complete.');
  console.log(`Folder: ${targetDir}`);
  console.log('Next: connect GitHub origin, set Supabase/Vercel env vars, and deploy.');
}

main();
