// Run migration via Supabase management API
const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250113_add_admin_auth.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

console.log('Migration SQL to run:');
console.log('---');
console.log(migrationSql);
console.log('---');
console.log('\nPlease run this SQL in your Supabase SQL Editor or via psql');

