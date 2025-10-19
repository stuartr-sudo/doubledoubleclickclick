import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '../utils/validation.js';
import { createResponse } from '../utils/response.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    const { method } = req;

    // Validate request
    const validation = await validateRequest(req, {
      requiredAuth: true,
      allowedMethods: ['GET']
    });

    if (!validation.success) {
      return createResponse(res, validation.error, 401);
    }

    const { user } = validation;
    const { baseId, tableName } = req.query;

    if (!baseId || !tableName) {
      return createResponse(res, { error: 'baseId and tableName are required' }, 400);
    }

    // Get user's Airtable credentials
    const { data: credentials } = await supabase
      .from('integration_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_type', 'airtable')
      .single();

    if (!credentials) {
      return createResponse(res, { error: 'Airtable credentials not found' }, 404);
    }

    const airtableApiKey = credentials.credential_data.airtable_api_key;
    const airtableBaseId = baseId || credentials.credential_data.airtable_base_id;

    if (!airtableApiKey || !airtableBaseId) {
      return createResponse(res, { error: 'Airtable API key or Base ID not configured' }, 400);
    }

    // Fetch table schema from Airtable
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${airtableBaseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Airtable API error:', errorData);
      return createResponse(res, { error: 'Failed to fetch Airtable table schema' }, 500);
    }

    const data = await response.json();
    const table = data.tables.find(t => t.name === tableName);
    
    if (!table) {
      return createResponse(res, { error: 'Table not found' }, 404);
    }

    return createResponse(res, { fields: table.fields });

  } catch (error) {
    console.error('List fields error:', error);
    return createResponse(res, { error: 'Failed to list fields' }, 500);
  }
}
