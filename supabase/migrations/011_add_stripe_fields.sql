-- Migration: Add Stripe payment and subscription fields to user_profiles
-- Purpose: Track Stripe customers, subscriptions, tokens, and payment history

-- Add Stripe customer and subscription tracking columns
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_price_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_mode TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_payment_status TEXT;

-- Add token balance and payment tracking
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processed_stripe_payments JSONB DEFAULT '[]'::jsonb;

-- Add affiliate referral tracking
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID REFERENCES affiliates(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_stripe_subscription ON user_profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_token_balance ON user_profiles(token_balance);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.stripe_customer_id IS 'Stripe Customer ID (cus_...)';
COMMENT ON COLUMN user_profiles.stripe_subscription_id IS 'Stripe Subscription ID (sub_...)';
COMMENT ON COLUMN user_profiles.plan_price_id IS 'Stripe Price ID (price_...) for current plan';
COMMENT ON COLUMN user_profiles.plan_mode IS 'subscription | payment | setup | none';
COMMENT ON COLUMN user_profiles.subscription_status IS 'active | trialing | past_due | canceled | none';
COMMENT ON COLUMN user_profiles.token_balance IS 'Current token balance for feature consumption';
COMMENT ON COLUMN user_profiles.processed_stripe_payments IS 'Array of Stripe payment IDs already credited (idempotency)';

