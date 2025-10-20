-- Migration: Ensure app_products table has all required Stripe fields
-- Purpose: Store product/price metadata for Stripe integration

-- Add Stripe-specific columns
ALTER TABLE app_products
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_key TEXT DEFAULT 'growth',
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'month',
  ADD COLUMN IF NOT EXISTS tokens_granted INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS token_packs JSONB DEFAULT '[]'::jsonb;

-- Create index for quick price lookup
CREATE INDEX IF NOT EXISTS idx_app_products_stripe_price ON app_products(stripe_price_id);

-- Add comments for documentation
COMMENT ON COLUMN app_products.stripe_price_id IS 'Stripe Price ID (price_...) for checkout';
COMMENT ON COLUMN app_products.is_recurring IS 'true=subscription, false=one-time payment';
COMMENT ON COLUMN app_products.plan_key IS 'growth | brand | agency | free_trial';
COMMENT ON COLUMN app_products.billing_interval IS 'month | year';
COMMENT ON COLUMN app_products.tokens_granted IS 'Tokens awarded on purchase or renewal';
COMMENT ON COLUMN app_products.token_packs IS 'Array of token add-on packs for this plan';

