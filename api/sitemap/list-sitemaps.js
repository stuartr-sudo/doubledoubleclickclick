// List sitemaps for current user or all sitemaps for admins
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClientFromRequest(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[List Sitemaps] Authentication error:', authError?.message);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch user profile to check role and assigned usernames
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, access_level, assigned_usernames')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('[List Sitemaps] Error fetching user profile:', profileError?.message);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    const isAdmin = userProfile.role === 'admin' || userProfile.access_level === 'full';
    let items = [];

    if (isAdmin) {
      // Admins see all sitemaps, ordered by created_date descending
      console.log('[List Sitemaps] Admin access - fetching all sitemaps');
      
      const { data, error } = await supabase
        .from('sitemaps')
        .select('*')
        .order('created_date', { ascending: false });

      if (error) {
        console.error('[List Sitemaps] Error fetching all sitemaps:', error);
        return res.status(500).json({ error: 'Failed to fetch sitemaps' });
      }

      items = data || [];
    } else {
      // Non-admins see only sitemaps for their assigned usernames
      const usernames = Array.isArray(userProfile.assigned_usernames) 
        ? userProfile.assigned_usernames 
        : [];

      if (usernames.length === 0) {
        console.log('[List Sitemaps] User has no assigned usernames');
        items = [];
      } else {
        console.log('[List Sitemaps] Fetching sitemaps for usernames:', usernames);
        
        // Fetch sitemaps for each username (Supabase filter only supports equality per call)
        const results = await Promise.all(
          usernames.map(async (username) => {
            const { data, error } = await supabase
              .from('sitemaps')
              .select('*')
              .eq('user_name', username)
              .order('created_date', { ascending: false });

            if (error) {
              console.error(`[List Sitemaps] Error fetching sitemaps for ${username}:`, error);
              return [];
            }

            return data || [];
          })
        );

        // Flatten results and sort by created_date
        items = results.flat().sort((a, b) => {
          const dateA = new Date(a.created_date || 0);
          const dateB = new Date(b.created_date || 0);
          return dateB - dateA; // Descending order
        });
      }
    }

    console.log('[List Sitemaps] Returning', items.length, 'sitemaps');

    return res.status(200).json({
      success: true,
      items: items,
      count: items.length,
      user_role: userProfile.role,
      is_admin: isAdmin
    });

  } catch (error) {
    console.error('[List Sitemaps] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to list sitemaps' 
    });
  }
}

