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
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    });

    if (!validation.success) {
      return createResponse(res, validation.error, 401);
    }

    const { user } = validation;

    // Route to appropriate handler based on action
    switch (action) {
      case 'update':
        return await handleUpdateWebhook(req, res, user);
      case 'filter':
        return await handleFilterWebhooks(req, res, user);
      case 'list':
        return await handleListWebhooks(req, res, user);
      default:
        return createResponse(res, { error: 'Invalid action' }, 400);
    }
  } catch (error) {
    console.error('Webhooks API error:', error);
    return createResponse(res, { error: 'Internal server error' }, 500);
  }
}

async function handleUpdateWebhook(req, res, user) {
  try {
    const { id, updates } = req.body;

    if (!id || !updates) {
      return createResponse(res, { error: 'Webhook ID and updates are required' }, 400);
    }

    // Verify the webhook belongs to the user
    const { data: existingWebhook } = await supabase
      .from('webhook_received')
      .select('*')
      .eq('id', id)
      .eq('user_name', user.email)
      .single();

    if (!existingWebhook) {
      return createResponse(res, { error: 'Webhook not found or access denied' }, 404);
    }

    // Update the webhook
    const { data, error } = await supabase
      .from('webhook_received')
      .update({
        ...updates,
        updated_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update webhook error:', error);
      return createResponse(res, { error: 'Failed to update webhook' }, 500);
    }

    return createResponse(res, data);

  } catch (error) {
    console.error('Update webhook error:', error);
    return createResponse(res, { error: 'Failed to update webhook' }, 500);
  }
}

async function handleFilterWebhooks(req, res, user) {
  try {
    const { filters = {}, sortBy = null } = req.body;

    let query = supabase
      .from('webhook_received')
      .select('*')
      .eq('user_name', user.email);

    // Apply filters
    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    // Apply sorting
    if (sortBy) {
      if (sortBy.startsWith('-')) {
        query = query.order(sortBy.substring(1), { ascending: false });
      } else {
        query = query.order(sortBy, { ascending: true });
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Filter webhooks error:', error);
      return createResponse(res, { error: 'Failed to filter webhooks' }, 500);
    }

    return createResponse(res, data || []);

  } catch (error) {
    console.error('Filter webhooks error:', error);
    return createResponse(res, { error: 'Failed to filter webhooks' }, 500);
  }
}

async function handleListWebhooks(req, res, user) {
  try {
    const { limit = 100, offset = 0, sortBy = 'created_date' } = req.body;

    let query = supabase
      .from('webhook_received')
      .select('*')
      .eq('user_name', user.email)
      .range(offset, offset + limit - 1);

    // Apply sorting
    if (sortBy) {
      if (sortBy.startsWith('-')) {
        query = query.order(sortBy.substring(1), { ascending: false });
      } else {
        query = query.order(sortBy, { ascending: true });
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('List webhooks error:', error);
      return createResponse(res, { error: 'Failed to list webhooks' }, 500);
    }

    return createResponse(res, data || []);

  } catch (error) {
    console.error('List webhooks error:', error);
    return createResponse(res, { error: 'Failed to list webhooks' }, 500);
  }
}
