import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { amount } = req.body;

    // Validate amount
    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Amount is required and must be a number' });
    }

    if (amount < 10) {
      return res.status(400).json({ error: 'Minimum top-up amount is $10.00' });
    }

    if (amount > 10000) {
      return res.status(400).json({ error: 'Maximum top-up amount is $10,000.00' });
    }

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
      console.log('[Add Funds] Creating new Stripe customer for user:', user.id);
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

    // Create Payment Intent (for embedded checkout with Stripe Elements)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert dollars to cents
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: {
        user_id: user.id,
        user_email: profile.email || user.email,
        top_up_amount: amount.toFixed(2),
        transaction_type: 'balance_top_up'
      },
      description: `Add $${amount.toFixed(2)} to account balance`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create pending top-up record
    await supabase
      .from('balance_top_ups')
      .insert({
        user_id: user.id,
        amount: amount,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending'
      })
      .then(() => {}).catch(err => {
        console.error('Failed to create top-up record:', err);
      });

    console.log('[Add Funds] Payment Intent created:', paymentIntent.id, 'for user:', user.id, 'amount:', amount);

    return res.status(200).json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: amount
    });

  } catch (error) {
    console.error('[Add Funds] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

