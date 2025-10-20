// Export posts and webhooks for user's assigned brands
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  usernames: z.array(z.string()).optional()
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClientFromRequest(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user profile for assigned_usernames
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('assigned_usernames')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Export Posts] Profile error:', profileError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    const payload = req.method === 'POST' ? requestSchema.parse(req.body) : {};
    
    const requested = Array.isArray(payload.usernames) ? payload.usernames.filter(Boolean) : [];
    const assigned = Array.isArray(profile.assigned_usernames) ? profile.assigned_usernames.filter(Boolean) : [];

    // Only allow intersection with user's assigned brands
    const allowed = requested.length > 0
      ? requested.filter(u => assigned.includes(u))
      : assigned;

    if (!allowed || allowed.length === 0) {
      return res.status(200).json({ posts: [], webhooks: [] });
    }

    console.log('[Export Posts] Fetching for usernames:', allowed);

    // Fetch posts and webhooks
    const [{ data: posts, error: postsError }, { data: webhooks, error: webhooksError }] = await Promise.all([
      supabase
        .from('blog_posts')
        .select('*')
        .in('user_name', allowed)
        .order('updated_date', { ascending: false }),
      supabase
        .from('webhook_received')
        .select('*')
        .in('user_name', allowed)
        .order('updated_date', { ascending: false })
    ]);

    if (postsError) {
      console.error('[Export Posts] Posts error:', postsError);
    }

    if (webhooksError) {
      console.error('[Export Posts] Webhooks error:', webhooksError);
    }

    // Ensure content field is included
    const postsWithContent = (posts || []).map(p => ({
      ...p,
      content: p.content || ''
    }));

    const webhooksWithContent = (webhooks || []).map(w => ({
      ...w,
      content: w.content || ''
    }));

    console.log('[Export Posts] Returning:', postsWithContent.length, 'posts,', webhooksWithContent.length, 'webhooks');

    return res.status(200).json({
      posts: postsWithContent,
      webhooks: webhooksWithContent
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Export Posts] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to export posts'
    });
  }
}

