import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('token_balance')
      .eq('id', userId)
      .single();

    if (error || !userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      balance: userProfile.token_balance || 0
    });

  } catch (error) {
    console.error('Error fetching token balance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

