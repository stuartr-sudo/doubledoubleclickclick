import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.vercel' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filePath) {
  try {
    console.log(`Running migration: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        const { error } = await supabase.rpc('exec', { sql: statement.trim() });
        
        if (error) {
          console.error(`Error executing statement:`, error);
          console.error(`Statement was: ${statement.trim()}`);
          return false;
        }
      }
    }
    
    console.log(`✅ Migration ${filePath} completed successfully`);
    return true;
  } catch (err) {
    console.error(`Error running migration ${filePath}:`, err);
    return false;
  }
}

async function runAllMigrations() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const migrationFiles = [
    '001_initial_schema.sql',
    '002_rls_policies.sql',
    '003_storage_setup.sql',
    '004_auth_setup.sql'
  ];

  console.log('Starting database migrations...');
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (fs.existsSync(filePath)) {
      const success = await runMigration(filePath);
      if (!success) {
        console.error(`Migration failed: ${file}`);
        process.exit(1);
      }
    } else {
      console.error(`Migration file not found: ${filePath}`);
      process.exit(1);
    }
  }
  
  console.log('🎉 All migrations completed successfully!');
}

runAllMigrations().catch(console.error);
