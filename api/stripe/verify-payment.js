// Verify Stripe payment status after Checkout redirect
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const requestSchema = z.object({
  session_id: z.string().optional(),
  payment_intent_id: z.string().optional()
}).refine(
  data => data.session_id || data.payment_intent_id,
  { message: 'Either session_id or payment_intent_id is required' }
);

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

    // Get authenticated user (optional for this endpoint)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    let result = {
      ok: false,
      status: 'unknown',
      mode: null,
      customer_email: null,
      amount_total: 0,
      currency: 'usd',
      product_labels: [],
      tokens_granted: 0,
      subscription_info: null
    };

    // Verify by session ID
    if (payload.session_id) {
      const session = await stripe.checkout.sessions.retrieve(payload.session_id, {
        expand: ['line_items.data.price.product', 'payment_intent', 'subscription']
      });

      result.ok = session.payment_status === 'paid';
      result.status = session.payment_status;
      result.mode = session.mode;
      result.customer_email = session.customer_email;
      result.amount_total = session.amount_total;
      result.currency = session.currency;

      // Extract product names
      if (session.line_items?.data) {
        result.product_labels = session.line_items.data.map(
          item => item.price?.product?.name || 'Unknown Product'
        );

        // Calculate tokens from our database
        for (const item of session.line_items.data) {
          const priceId = item.price?.id;
          if (priceId) {
            const { data: product } = await supabase
              .from('app_products')
              .select('tokens_granted')
              .eq('stripe_price_id', priceId)
              .single();

            if (product) {
              result.tokens_granted += (product.tokens_granted || 0) * (item.quantity || 1);
            }
          }
        }
      }

      // Get subscription info if applicable
      if (session.mode === 'subscription' && session.subscription) {
        const sub = typeof session.subscription === 'string'
          ? await stripe.subscriptions.retrieve(session.subscription)
          : session.subscription;

        result.subscription_info = {
          id: sub.id,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString()
        };
      }
    }
    // Verify by payment intent ID
    else if (payload.payment_intent_id) {
      const paymentIntent = await stripe.paymentIntents.retrieve(payload.payment_intent_id);

      result.ok = paymentIntent.status === 'succeeded';
      result.status = paymentIntent.status;
      result.mode = 'payment';
      result.amount_total = paymentIntent.amount;
      result.currency = paymentIntent.currency;

      // Try to get product info from metadata
      const priceId = paymentIntent.metadata?.price_id;
      if (priceId) {
        const { data: product } = await supabase
          .from('app_products')
          .select('name, tokens_granted')
          .eq('stripe_price_id', priceId)
          .single();

        if (product) {
          result.product_labels = [product.name];
          result.tokens_granted = product.tokens_granted || 0;
        }
      }
    }

    console.log('[Verify Payment] Result:', result.ok, 'for user:', userId || 'anonymous');

    return res.status(200).json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    console.error('[Verify Payment] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

