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
      allowedMethods: ['POST']
    });

    if (!validation.success) {
      return createResponse(res, validation.error, 401);
    }

    const { user } = validation;
    const { baseId, tableName, fields } = req.body;

    if (!baseId || !tableName || !fields) {
      return createResponse(res, { error: 'baseId, tableName, and fields are required' }, 400);
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

    // Create record in Airtable
    const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${tableName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Airtable API error:', errorData);
      return createResponse(res, { error: 'Failed to create Airtable record' }, 500);
    }

    const data = await response.json();

    // Log the creation
    await supabase
      .from('webhook_received')
      .insert({
        user_id: user.id,
        source: 'airtable',
        event_type: 'record_created',
        payload: { tableName, recordId: data.id },
        processed: true
      });

    return createResponse(res, data);

  } catch (error) {
    console.error('Create record error:', error);
    return createResponse(res, { error: 'Failed to create record' }, 500);
  }
}
