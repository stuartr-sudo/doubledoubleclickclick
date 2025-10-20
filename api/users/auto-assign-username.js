// Auto-generate and assign unique username for new users
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

function slugify(input, fallback = 'user') {
  const base = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 24);
  return base || fallback;
}

const requestSchema = z.object({
  preferred_user_name: z.string().optional(),
  display_name: z.string().optional()
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClientFromRequest(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Auto Assign Username] Profile fetch error:', profileError);
      return res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
    }

    const payload = requestSchema.parse(req.body);
    
    const preferred = payload.preferred_user_name 
      || profile.full_name 
      || (user.email || '').split('@')[0] 
      || 'user';
    
    const displayName = payload.display_name 
      || profile.full_name 
      || preferred;

    const base = slugify(preferred);

    // Generate unique username: base, base-2, base-3, ...
    let uniqueName = base;
    for (let i = 0; i < 100; i++) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;
      
      // Check if username exists
      const { data: existing, error: checkError } = await supabase
        .from('usernames')
        .select('user_name')
        .eq('user_name', candidate)
        .limit(1);

      if (checkError) {
        console.error('[Auto Assign Username] Check error:', checkError);
        continue;
      }

      if (!existing || existing.length === 0) {
        // Create username
        const { error: createError } = await supabase
          .from('usernames')
          .insert({
            user_name: candidate,
            display_name: displayName,
            is_active: true,
            notes: `Auto-generated for ${user.email} on ${new Date().toISOString()}`
          });

        if (createError) {
          console.error('[Auto Assign Username] Create error:', createError);
          continue;
        }

        // Attach to user
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ assigned_usernames: [candidate] })
          .eq('id', user.id);

        if (updateError) {
          console.error('[Auto Assign Username] Update error:', updateError);
          return res.status(500).json({ success: false, error: 'Failed to assign username' });
        }

        console.log('[Auto Assign Username] Success:', candidate);
        return res.status(200).json({ success: true, username: candidate });
      }
    }

    return res.status(409).json({
      success: false,
      error: 'Could not generate a unique username after 100 attempts'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Auto Assign Username] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign username'
    });
  }
}

