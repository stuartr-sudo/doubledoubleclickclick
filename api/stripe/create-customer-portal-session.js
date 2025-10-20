// Create Stripe Customer Portal session for subscription management
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

const requestSchema = z.object({
  return_path: z.string().optional().default('/account-settings')
});

export default async function handler(req, res) {
  // CORS headers
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
    // Parse and validate request
    const payload = requestSchema.parse(req.body);

    // Get authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized - No auth header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    if (!profile.stripe_customer_id) {
      return res.status(400).json({ 
        error: 'No Stripe customer found',
        message: 'You need to make a purchase before managing billing'
      });
    }

    // Create Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${APP_URL}${payload.return_path}`
    });

    console.log('[Customer Portal] Session created for user:', user.id);

    return res.status(200).json({
      url: session.url
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    console.error('[Customer Portal] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

