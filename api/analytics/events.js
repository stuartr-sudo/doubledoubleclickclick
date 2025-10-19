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

    if (method === 'POST') {
      // Track analytics event
      const validation = await validateRequest(req, {
        requiredAuth: true,
        allowedMethods: ['POST']
      });

      if (!validation.success) {
        return createResponse(res, validation.error, 401);
      }

      const { user } = validation;
      const { event, properties, timestamp } = req.body;

      if (!event) {
        return createResponse(res, { error: 'Event name is required' }, 400);
      }

      // Store analytics event
      const { data, error } = await supabase
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_name: event,
          properties: properties || {},
          timestamp: timestamp || new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Analytics event error:', error);
        return createResponse(res, { error: 'Failed to track event' }, 500);
      }

      return createResponse(res, { success: true, eventId: data[0]?.id });

    } else if (method === 'GET') {
      // Get analytics data (admin only)
      const validation = await validateRequest(req, {
        requiredAuth: true,
        allowedMethods: ['GET']
      });

      if (!validation.success) {
        return createResponse(res, validation.error, 401);
      }

      const { user } = validation;
      const { startDate, endDate, eventName, limit = 100 } = req.query;

      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role, is_superadmin')
        .eq('id', user.id)
        .single();

      if (!userProfile?.is_superadmin && userProfile?.role !== 'admin') {
        return createResponse(res, { error: 'Admin access required' }, 403);
      }

      let query = supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      if (eventName) {
        query = query.eq('event_name', eventName);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Analytics query error:', error);
        return createResponse(res, { error: 'Failed to fetch analytics data' }, 500);
      }

      return createResponse(res, { events: data || [] });

    } else {
      return createResponse(res, { error: 'Method not allowed' }, 405);
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    return createResponse(res, { error: 'Internal server error' }, 500);
  }
}
