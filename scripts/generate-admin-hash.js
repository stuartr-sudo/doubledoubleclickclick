#!/usr/bin/env node

// Script to generate bcrypt hash for admin password
// Usage: node scripts/generate-admin-hash.js YourPassword123

const bcrypt = require('bcryptjs');

// Get password from command line argument or use default
const password = process.argv[2] || 'admin123';

if (process.argv[2]) {
  console.log('\nGenerating hash for custom password...\n');
} else {
  console.log('\nNo password provided. Using default: admin123');
  console.log('Usage: node scripts/generate-admin-hash.js YourPassword123\n');
}

const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Bcrypt Hash:', hash);
console.log('\n--- Copy this SQL to update your admin password ---\n');
console.log(`UPDATE public.admin_users SET password_hash = '${hash}' WHERE username = 'admin';`);
console.log('\n--- Or to create a new admin user ---\n');
console.log(`INSERT INTO public.admin_users (username, password_hash)
VALUES ('admin', '${hash}')
ON CONFLICT (username) DO UPDATE SET password_hash = '${hash}';`);
console.log('');
