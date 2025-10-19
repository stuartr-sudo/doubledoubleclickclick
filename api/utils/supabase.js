import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient(req) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  // For server-side requests, we need to handle authentication differently
  if (req && req.headers && req.headers.authorization) {
    // Extract token from Authorization header
    const token = req.headers.authorization.replace('Bearer ', '');
    
    // Create client with user's token for RLS
    return createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  // Fallback to service role key for admin operations
  return createClient(supabaseUrl, supabaseServiceKey);
}
