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
      allowedMethods: ['DELETE']
    });

    if (!validation.success) {
      return createResponse(res, validation.error, 401);
    }

    const { user } = validation;
    const { baseId, tableName, recordId } = req.query;

    if (!baseId || !tableName || !recordId) {
      return createResponse(res, { error: 'baseId, tableName, and recordId are required' }, 400);
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

    // Delete record from Airtable
    const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${tableName}/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Airtable API error:', errorData);
      return createResponse(res, { error: 'Failed to delete Airtable record' }, 500);
    }

    // Log the deletion
    await supabase
      .from('webhook_received')
      .insert({
        user_id: user.id,
        source: 'airtable',
        event_type: 'record_deleted',
        payload: { tableName, recordId },
        processed: true
      });

    return createResponse(res, { success: true, deleted: true });

  } catch (error) {
    console.error('Delete record error:', error);
    return createResponse(res, { error: 'Failed to delete record' }, 500);
  }
}
