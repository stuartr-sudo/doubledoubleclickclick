// Script to add Airtable credentials to Supabase
// Run this with: node add-airtable-credentials.js

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const supabaseUrl = 'https://uscmvlfleccbctuvhhcj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to set this

if (!supabaseServiceKey) {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function addAirtableCredentials() {
  try {
    console.log('🔧 Adding Airtable Credentials to Supabase\n');
    
    // Get user selection
    console.log('Available users:');
    console.log('1. stuart.asta@doubleclick.work');
    console.log('2. stuartr@doubleclick.work');
    console.log('3. Enter different email\n');
    
    const userChoice = await question('Select user (1-3): ');
    let userEmail;
    
    switch(userChoice) {
      case '1':
        userEmail = 'stuart.asta@doubleclick.work';
        break;
      case '2':
        userEmail = 'stuartr@doubleclick.work';
        break;
      case '3':
        userEmail = await question('Enter user email: ');
        break;
      default:
        console.log('Invalid choice');
        rl.close();
        return;
    }
    
    // Get Airtable credentials
    const airtableApiKey = await question('Enter your Airtable API Key: ');
    const airtableBaseId = await question('Enter your Airtable Base ID: ');
    
    // Get user ID
    const { data: user } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (!user) {
      console.error(`User ${userEmail} not found`);
      rl.close();
      return;
    }
    
    // Insert credentials
    const { data, error } = await supabase
      .from('integration_credentials')
      .insert({
        user_id: user.id,
        user_name: userEmail,
        integration_type: 'airtable',
        credential_data: {
          airtable_api_key: airtableApiKey,
          airtable_base_id: airtableBaseId
        },
        is_active: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error adding credentials:', error);
    } else {
      console.log('✅ Airtable credentials added successfully!');
      console.log('📋 Credential ID:', data[0].id);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    rl.close();
  }
}

addAirtableCredentials();
