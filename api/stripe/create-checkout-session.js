// Create Stripe Checkout Session for subscriptions and one-time payments
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

const requestSchema = z.object({
  price_id: z.string().min(1, 'Price ID required'),
  mode: z.enum(['payment', 'subscription'], { required_error: 'Mode must be payment or subscription' }),
  quantity: z.number().int().positive().optional().default(1),
  success_path: z.string().optional().default('/post-payment'),
  cancel_path: z.string().optional().default('/pricing'),
  coupon_code: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  affiliate_ref: z.string().optional()
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
      .select('id, email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // Get or create Stripe customer
    let stripeCustomerId = profile.stripe_customer_id;

    if (!stripeCustomerId) {
      console.log('[Checkout] Creating new Stripe customer for user:', user.id);
      const customer = await stripe.customers.create({
        email: profile.email || user.email,
        metadata: {
          user_id: user.id
        }
      });
      stripeCustomerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // Build session metadata
    const sessionMetadata = {
      user_id: user.id,
      user_email: profile.email || user.email,
      price_id: payload.price_id,
      ...payload.metadata
    };

    // Add affiliate reference if provided
    if (payload.affiliate_ref) {
      sessionMetadata.affiliate_ref = payload.affiliate_ref;
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: payload.mode,
      line_items: [
        {
          price: payload.price_id,
          quantity: payload.quantity
        }
      ],
      success_url: `${APP_URL}${payload.success_path}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}${payload.cancel_path}`,
      discounts: payload.coupon_code ? [{ coupon: payload.coupon_code }] : undefined,
      metadata: sessionMetadata,
      allow_promotion_codes: true, // Enable promo codes
      billing_address_collection: payload.mode === 'subscription' ? 'required' : 'auto'
    });

    console.log('[Checkout] Session created:', session.id, 'for user:', user.id);

    return res.status(200).json({
      url: session.url,
      session_id: session.id
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    console.error('[Checkout] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

