import { createClient } from '@supabase/supabase-js';
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

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test if user_profiles table exists
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ user_profiles table does not exist or is not accessible:', error);
      
      // Try to create the table
      console.log('Attempting to create user_profiles table...');
      const createTableSQL = `
        -- Create custom type safely
        DO $$ BEGIN
            CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        -- Create user_profiles table
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          user_name TEXT UNIQUE,
          full_name TEXT,
          assigned_usernames TEXT[] DEFAULT '{}',
          token_balance INTEGER DEFAULT 20,
          plan_price_id TEXT,
          is_superadmin BOOLEAN DEFAULT FALSE,
          role user_role DEFAULT 'user',
          completed_tutorial_ids TEXT[] DEFAULT '{}',
          topics_completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
      `;
      
      const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });
      if (createError) {
        console.error('❌ Failed to create table:', createError);
      } else {
        console.log('✅ Table created successfully');
      }
    } else {
      console.log('✅ user_profiles table exists and is accessible');
    }
    
  } catch (err) {
    console.error('❌ Database test failed:', err);
  }
}

testDatabase();
