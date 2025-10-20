// Stripe Webhook Handler - Source of truth for payment/subscription events
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Use service role for webhook (bypass RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: Credit tokens to user with idempotency
async function creditTokens(userId, tokens, stripeId) {
  if (!tokens || tokens <= 0) return;

  console.log('[Webhook] Crediting', tokens, 'tokens to user:', userId, 'for:', stripeId);

  const { data: user, error: fetchError } = await supabase
    .from('user_profiles')
    .select('token_balance, processed_stripe_payments')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('[Webhook] Failed to fetch user:', fetchError);
    throw fetchError;
  }

  // Idempotency check
  const processed = user.processed_stripe_payments || [];
  if (processed.includes(stripeId)) {
    console.log('[Webhook] Already processed:', stripeId);
    return;
  }

  // Credit tokens
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      token_balance: (user.token_balance || 0) + tokens,
      processed_stripe_payments: [...processed, stripeId]
    })
    .eq('id', userId);

  if (updateError) {
    console.error('[Webhook] Failed to credit tokens:', updateError);
    throw updateError;
  }

  console.log('[Webhook] Tokens credited successfully');
}

// Helper: Get product by Stripe Price ID
async function getProductByPriceId(priceId) {
  const { data: product, error } = await supabase
    .from('app_products')
    .select('id, name, tokens_granted, plan_key')
    .eq('stripe_price_id', priceId)
    .single();

  if (error) {
    console.warn('[Webhook] Product not found for price:', priceId);
    return null;
  }

  return product;
}

// Helper: Track affiliate conversion
async function trackAffiliateConversion(affiliateRef, amountTotal) {
  if (!affiliateRef) return;

  try {
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, conversion_count, total_earned')
      .eq('unique_code', affiliateRef)
      .single();

    if (affiliate) {
      await supabase
        .from('affiliates')
        .update({
          conversion_count: (affiliate.conversion_count || 0) + 1,
          total_earned: (affiliate.total_earned || 0) + (amountTotal / 100) // Convert cents to dollars
        })
        .eq('id', affiliate.id);

      console.log('[Webhook] Affiliate conversion tracked:', affiliateRef);
    }
  } catch (error) {
    console.error('[Webhook] Affiliate tracking failed:', error);
    // Don't throw - affiliate tracking is non-critical
  }
}

export const config = {
  api: {
    bodyParser: false, // Required for Stripe signature verification
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'No signature' });
  }

  let event;

  try {
    // Read raw body for signature verification
    const rawBody = await new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        resolve(data);
      });
    });

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('[Webhook] Event received:', event.type, event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;

        if (!userId) {
          console.warn('[Webhook] No user_id in session metadata');
          break;
        }

        // Update customer ID if new
        if (session.customer) {
          await supabase
            .from('user_profiles')
            .update({ stripe_customer_id: session.customer })
            .eq('id', userId);
        }

        // Handle one-time payments
        if (session.mode === 'payment') {
          const priceId = session.line_items?.data?.[0]?.price?.id;
          if (priceId) {
            const product = await getProductByPriceId(priceId);
            if (product && product.tokens_granted) {
              await creditTokens(userId, product.tokens_granted, session.id);
            }
          }
        }

        // Handle subscriptions
        if (session.mode === 'subscription' && session.subscription) {
          const priceId = session.line_items?.data?.[0]?.price?.id;
          await supabase
            .from('user_profiles')
            .update({
              stripe_subscription_id: session.subscription,
              plan_price_id: priceId,
              plan_mode: 'subscription',
              subscription_status: 'active'
            })
            .eq('id', userId);
        }

        // Track affiliate
        if (session.metadata?.affiliate_ref) {
          await trackAffiliateConversion(session.metadata.affiliate_ref, session.amount_total);
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata?.user_id;
        const priceId = paymentIntent.metadata?.price_id;

        if (!userId) break;

        // Credit tokens for one-time payment
        if (priceId) {
          const product = await getProductByPriceId(priceId);
          if (product && product.tokens_granted) {
            await creditTokens(userId, product.tokens_granted, paymentIntent.id);
          }
        }

        // Update payment status
        await supabase
          .from('user_profiles')
          .update({ last_payment_status: 'paid' })
          .eq('id', userId);

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        
        // Get subscription to find user
        if (!invoice.subscription) break;
        
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          // Try to find user by customer ID
          const { data: user } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('stripe_customer_id', invoice.customer)
            .single();

          if (!user) break;
          userId = user.id;
        }

        // Credit tokens for subscription renewal
        const priceId = invoice.lines?.data?.[0]?.price?.id;
        if (priceId) {
          const product = await getProductByPriceId(priceId);
          if (product && product.tokens_granted) {
            await creditTokens(userId, product.tokens_granted, invoice.id);
          }
        }

        // Update subscription metadata
        await supabase
          .from('user_profiles')
          .update({
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            last_payment_status: 'paid'
          })
          .eq('id', userId);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Find user by customer ID
        const { data: user } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (!user) break;

        await supabase
          .from('user_profiles')
          .update({
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end || false
          })
          .eq('id', user.id);

        console.log('[Webhook] Subscription updated for user:', user.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Find user by customer ID
        const { data: user } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (!user) break;

        await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            plan_mode: 'none'
          })
          .eq('id', user.id);

        console.log('[Webhook] Subscription deleted for user:', user.id);
        break;
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
    }

    // Always return 200 to acknowledge receipt
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    // Still return 200 to prevent retries for non-retryable errors
    return res.status(200).json({ error: error.message });
  }
}

