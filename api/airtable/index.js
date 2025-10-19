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
    const { action } = req.query;

    // Validate request
    const validation = await validateRequest(req, {
      requiredAuth: true,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
    });

    if (!validation.success) {
      return createResponse(res, validation.error, 401);
    }

    const { user } = validation;

    // Route to appropriate handler based on action
        switch (action) {
          case 'list-records':
            return await handleListRecords(req, res, user);
          case 'create-record':
            return await handleCreateRecord(req, res, user);
          case 'update-record':
            return await handleUpdateRecord(req, res, user);
          case 'delete-record':
            return await handleDeleteRecord(req, res, user);
          case 'list-fields':
            return await handleListFields(req, res, user);
          case 'publish':
            return await handlePublish(req, res, user);
          case 'sync':
            return await handleSync(req, res, user);
          case 'test-credentials':
            return await handleTestCredentials(req, res);
          default:
            return createResponse(res, { error: 'Invalid action' }, 400);
        }
  } catch (error) {
    console.error('Airtable API error:', error);
    return createResponse(res, { error: 'Internal server error' }, 500);
  }
}

async function handleListRecords(req, res, user) {
  try {
    const { baseId, tableName, filterByFormula, maxRecords, sort } = req.query;

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

    const airtableApiKey = credentials.credentials.airtable_api_key;
    const airtableBaseId = baseId || credentials.credentials.airtable_base_id;

    if (!airtableApiKey || !airtableBaseId) {
      return createResponse(res, { error: 'Airtable API key or Base ID not configured' }, 400);
    }

    // Build Airtable API URL
    let url = `https://api.airtable.com/v0/${airtableBaseId}/${tableName}`;
    const params = new URLSearchParams();
    
    if (filterByFormula) params.append('filterByFormula', filterByFormula);
    if (maxRecords) params.append('maxRecords', maxRecords);
    if (sort) params.append('sort', JSON.stringify(sort));

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Fetch records from Airtable
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Airtable API error:', errorData);
      return createResponse(res, { error: 'Failed to fetch Airtable records' }, 500);
    }

    const data = await response.json();
    return createResponse(res, data);

  } catch (error) {
    console.error('List records error:', error);
    return createResponse(res, { error: 'Failed to list records' }, 500);
  }
}

async function handleCreateRecord(req, res, user) {
  try {
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

    const airtableApiKey = credentials.credentials.airtable_api_key;
    const airtableBaseId = baseId || credentials.credentials.airtable_base_id;

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

async function handleUpdateRecord(req, res, user) {
  try {
    const { baseId, tableName, recordId, fields } = req.body;

    if (!baseId || !tableName || !recordId || !fields) {
      return createResponse(res, { error: 'baseId, tableName, recordId, and fields are required' }, 400);
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

    const airtableApiKey = credentials.credentials.airtable_api_key;
    const airtableBaseId = baseId || credentials.credentials.airtable_base_id;

    if (!airtableApiKey || !airtableBaseId) {
      return createResponse(res, { error: 'Airtable API key or Base ID not configured' }, 400);
    }

    // Update record in Airtable
    const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${tableName}/${recordId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Airtable API error:', errorData);
      return createResponse(res, { error: 'Failed to update Airtable record' }, 500);
    }

    const data = await response.json();

    // Log the update
    await supabase
      .from('webhook_received')
      .insert({
        user_id: user.id,
        source: 'airtable',
        event_type: 'record_updated',
        payload: { tableName, recordId },
        processed: true
      });

    return createResponse(res, data);

  } catch (error) {
    console.error('Update record error:', error);
    return createResponse(res, { error: 'Failed to update record' }, 500);
  }
}

async function handleDeleteRecord(req, res, user) {
  try {
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

    const airtableApiKey = credentials.credentials.airtable_api_key;
    const airtableBaseId = baseId || credentials.credentials.airtable_base_id;

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

async function handleListFields(req, res, user) {
  try {
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

    const airtableApiKey = credentials.credentials.airtable_api_key;
    const airtableBaseId = baseId || credentials.credentials.airtable_base_id;

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

async function handlePublish(req, res, user) {
  try {
    const { baseId, tableName, content, title, tags } = req.body;

    if (!baseId || !tableName || !content) {
      return createResponse(res, { error: 'baseId, tableName, and content are required' }, 400);
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

    const airtableApiKey = credentials.credentials.airtable_api_key;
    const airtableBaseId = baseId || credentials.credentials.airtable_base_id;

    if (!airtableApiKey || !airtableBaseId) {
      return createResponse(res, { error: 'Airtable API key or Base ID not configured' }, 400);
    }

    // Prepare fields for Airtable
    const fields = {
      Title: title || 'Untitled',
      Content: content,
      Tags: tags || '',
      Published: new Date().toISOString(),
      Author: user.email
    };

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
      return createResponse(res, { error: 'Failed to publish to Airtable' }, 500);
    }

    const data = await response.json();

    // Log the publish action
    await supabase
      .from('webhook_received')
      .insert({
        user_id: user.id,
        source: 'airtable',
        event_type: 'content_published',
        payload: { tableName, recordId: data.id, title },
        processed: true
      });

    return createResponse(res, data);

  } catch (error) {
    console.error('Publish error:', error);
    return createResponse(res, { error: 'Failed to publish content' }, 500);
  }
}

async function handleSync(req, res, user) {
  try {
    const { 
      action, 
      tableId, 
      recordId, 
      fields, 
      filterByFormula, 
      maxRecords, 
      sort,
      baseId,
      tableName,
      direction = 'from_airtable' 
    } = req.body;

    // Handle different action types from the frontend
    if (action === 'listAll') {
      return await handleListRecords(req, res, user);
    } else if (action === 'updateRecord') {
      return await handleUpdateRecord(req, res, user);
    } else if (action === 'createRecord') {
      return await handleCreateRecord(req, res, user);
    } else if (action === 'deleteRecord') {
      return await handleDeleteRecord(req, res, user);
    } else if (action === 'listFields') {
      return await handleListFields(req, res, user);
    }

    // Legacy sync functionality
    const effectiveBaseId = baseId || tableId;
    const effectiveTableName = tableName || tableId;

    if (!effectiveBaseId || !effectiveTableName) {
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

    const airtableApiKey = credentials.credentials.airtable_api_key;
    const airtableBaseId = effectiveBaseId || credentials.credentials.airtable_base_id;

    if (!airtableApiKey || !airtableBaseId) {
      return createResponse(res, { error: 'Airtable API key or Base ID not configured' }, 400);
    }

    // Sync data based on direction
    if (direction === 'from_airtable') {
      // Fetch records from Airtable and sync to Supabase
      const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${effectiveTableName}`, {
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Airtable API error:', errorData);
        return createResponse(res, { error: 'Failed to fetch Airtable records' }, 500);
      }

      const data = await response.json();
      
      // Store synced data in Supabase
      for (const record of data.records) {
        await supabase
          .from('airtable_sync_cache')
          .upsert({
            user_id: user.id,
            base_id: airtableBaseId,
            table_name: effectiveTableName,
            record_id: record.id,
            data: record.fields,
            synced_at: new Date().toISOString()
          });
      }

      return createResponse(res, { 
        success: true, 
        synced_records: data.records.length,
        direction: 'from_airtable'
      });
    } else {
      // Sync from Supabase to Airtable (implement as needed)
      return createResponse(res, { error: 'Sync to Airtable not implemented yet' }, 501);
    }

      } catch (error) {
        console.error('Sync error:', error);
        return createResponse(res, { error: 'Failed to sync data' }, 500);
      }
    }

async function handleTestCredentials(req, res) {
  try {
    const { email, apiKey, baseId } = req.body;

    if (!email || !apiKey || !baseId) {
      return createResponse(res, { error: 'Email, API key, and Base ID are required' }, 400);
    }

    // Get user ID
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return createResponse(res, { error: 'User not found' }, 404);
    }

    // Test the Airtable API key
    try {
      const testResponse = await fetch(`https://api.airtable.com/v0/${baseId}/`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        return createResponse(res, { 
          error: 'Invalid Airtable credentials. Please check your API key and Base ID.' 
        }, 400);
      }
    } catch (testError) {
      return createResponse(res, { 
        error: 'Failed to validate Airtable credentials: ' + testError.message 
      }, 400);
    }

    // Insert or update credentials
    const { data: existingCreds } = await supabase
      .from('integration_credentials')
      .select('id')
      .eq('user_id', user.id)
      .eq('integration_type', 'airtable')
      .single();

    const credentialData = {
      user_id: user.id,
      user_name: email,
      integration_type: 'airtable',
      credential_data: {
        airtable_api_key: apiKey,
        airtable_base_id: baseId
      },
      is_active: true,
      updated_date: new Date().toISOString()
    };

    let result;
    if (existingCreds) {
      // Update existing credentials
      const { data, error } = await supabase
        .from('integration_credentials')
        .update(credentialData)
        .eq('id', existingCreds.id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      result = data;
    } else {
      // Insert new credentials
      credentialData.created_date = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('integration_credentials')
        .insert(credentialData)
        .select()
        .single();

      if (error) {
        throw error;
      }
      result = data;
    }

    return createResponse(res, {
      success: true,
      message: 'Airtable credentials added successfully',
      credentialId: result.id
    });

  } catch (error) {
    console.error('Test credentials error:', error);
    return createResponse(res, { 
      error: 'Failed to add credentials: ' + error.message 
    }, 500);
  }
}
