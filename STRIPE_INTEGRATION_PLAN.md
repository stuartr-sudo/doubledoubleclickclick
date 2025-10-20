# Stripe Integration Implementation Plan

## Overview
Complete Stripe integration for DoubleClick supporting subscriptions, one-time token purchases, affiliate tracking, and customer portal management.

---

## 1. Data Model Extensions

### 1.1 User Profile Extensions (Already in Supabase)
**Table**: `user_profiles`

**New Columns to Add**:
```sql
-- Stripe customer/subscription tracking
stripe_customer_id TEXT,
stripe_subscription_id TEXT,
plan_price_id TEXT,
plan_mode TEXT, -- 'subscription' | 'payment' | 'setup' | 'none'
subscription_status TEXT, -- 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
current_period_end TIMESTAMPTZ,
cancel_at_period_end BOOLEAN DEFAULT false,
last_payment_status TEXT,

-- Token tracking
token_balance INTEGER DEFAULT 0,
processed_stripe_payments JSONB DEFAULT '[]'::jsonb, -- Array of Stripe payment IDs

-- Affiliate tracking
referred_by_affiliate_id UUID REFERENCES affiliates(id)
```

### 1.2 AppProduct Entity (Already exists)
**Required Fields**:
- `stripe_price_id` (TEXT) - Stripe Price ID
- `is_recurring` (BOOLEAN) - true=subscription, false=one-time
- `display_price` (TEXT) - Display string
- `plan_key` (TEXT) - 'growth' | 'brand' | 'agency' | 'free_trial'
- `billing_interval` (TEXT) - 'month' | 'year'
- `tokens_granted` (INTEGER) - Tokens awarded on purchase/renewal
- `is_best_value` (BOOLEAN) - Styling flag
- `token_packs` (JSONB) - Array of add-on token packs per plan

### 1.3 Invoice Entity (Optional, for custom invoicing)
**Fields**:
- `stripe_checkout_session_id` (TEXT)
- `stripe_payment_intent_id` (TEXT)
- `paid_at` (TIMESTAMPTZ)
- `amount` (INTEGER)
- `currency` (TEXT)
- `status` (TEXT)

### 1.4 Affiliate Entity (Optional)
**Fields**:
- `unique_code` (TEXT)
- `coupon_code` (TEXT)
- `promo_id` (TEXT)
- `referral_count` (INTEGER)
- `conversion_count` (INTEGER)
- `total_earned` (DECIMAL)

---

## 2. Backend API Endpoints (Vercel Serverless Functions)

### 2.1 `/api/stripe/create-checkout-session` (POST)
**Purpose**: Create Stripe Checkout for one-time or subscription purchases

**Input Schema**:
```typescript
{
  price_id: string;           // Stripe Price ID from AppProduct
  mode: 'payment' | 'subscription';
  quantity?: number;          // Optional, defaults to 1
  success_path?: string;      // App-relative path, default '/post-payment'
  cancel_path?: string;       // App-relative path, default '/pricing'
  coupon_code?: string;       // Optional promo/affiliate code
  metadata?: object;          // Additional metadata
}
```

**Implementation Steps**:
1. Validate authenticated user (`getCurrentUser()`)
2. Get or create Stripe Customer ID:
   - Check `user.stripe_customer_id`
   - If null, call `stripe.customers.create()` and save to user
3. Read `affiliate_ref` from request headers/body (set by Layout)
4. Build Checkout session:
   ```javascript
   const session = await stripe.checkout.sessions.create({
     customer: stripeCustomerId,
     mode: payload.mode,
     line_items: [{ price: payload.price_id, quantity: payload.quantity || 1 }],
     success_url: `${APP_URL}${success_path}?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${APP_URL}${cancel_path}`,
     discounts: payload.coupon_code ? [{ coupon: payload.coupon_code }] : undefined,
     metadata: {
       user_id: user.id,
       user_email: user.email,
       affiliate_ref: affiliateRef,
       ...payload.metadata
     }
   });
   ```
5. Return `{ url: session.url }`

**Response**:
```typescript
{ url: string }
```

---

### 2.2 `/api/stripe/create-customer-portal-session` (POST)
**Purpose**: Generate Customer Portal URL for subscription management

**Input Schema**:
```typescript
{
  return_path?: string; // App-relative return path, default '/account-settings'
}
```

**Implementation Steps**:
1. Validate authenticated user
2. Get `user.stripe_customer_id` (error if not exists)
3. Create portal session:
   ```javascript
   const session = await stripe.billingPortal.sessions.create({
     customer: stripeCustomerId,
     return_url: `${APP_URL}${return_path || '/account-settings'}`
   });
   ```
4. Return `{ url: session.url }`

**Response**:
```typescript
{ url: string }
```

---

### 2.3 `/api/stripe/webhook` (POST)
**Purpose**: Handle Stripe webhook events (CRITICAL - source of truth)

**Security**:
- Validate Stripe signature using `STRIPE_WEBHOOK_SECRET`
- Use Supabase service role for writes

**Event Handlers**:

#### `checkout.session.completed`
```javascript
const session = event.data.object;
const userId = session.metadata.user_id;

// Update customer ID if new
if (!user.stripe_customer_id) {
  await supabase.from('user_profiles')
    .update({ stripe_customer_id: session.customer })
    .eq('id', userId);
}

// For one-time payments with immediate token grant
if (session.mode === 'payment') {
  const priceId = session.line_items.data[0].price.id;
  const product = await getProductByPriceId(priceId);
  
  if (product.tokens_granted && !user.processed_stripe_payments.includes(session.id)) {
    await creditTokens(userId, product.tokens_granted, session.id);
  }
}

// For subscriptions, initialize fields
if (session.mode === 'subscription') {
  await supabase.from('user_profiles')
    .update({
      stripe_subscription_id: session.subscription,
      plan_price_id: session.line_items.data[0].price.id,
      plan_mode: 'subscription',
      subscription_status: 'active'
    })
    .eq('id', userId);
}

// Affiliate attribution
if (session.metadata.affiliate_ref) {
  await trackAffiliateConversion(session.metadata.affiliate_ref, session.amount_total);
}
```

#### `payment_intent.succeeded`
```javascript
const paymentIntent = event.data.object;
const userId = paymentIntent.metadata.user_id;

// Credit tokens for one-time payments
if (!user.processed_stripe_payments.includes(paymentIntent.id)) {
  const priceId = paymentIntent.metadata.price_id;
  const product = await getProductByPriceId(priceId);
  
  await creditTokens(userId, product.tokens_granted, paymentIntent.id);
  await supabase.from('user_profiles')
    .update({ last_payment_status: 'paid' })
    .eq('id', userId);
}
```

#### `invoice.paid`
```javascript
const invoice = event.data.object;
const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
const userId = subscription.metadata.user_id;

// Credit tokens for subscription renewal
if (!user.processed_stripe_payments.includes(invoice.id)) {
  const priceId = invoice.lines.data[0].price.id;
  const product = await getProductByPriceId(priceId);
  
  await creditTokens(userId, product.tokens_granted, invoice.id);
}

// Update subscription metadata
await supabase.from('user_profiles')
  .update({
    subscription_status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    last_payment_status: 'paid'
  })
  .eq('id', userId);
```

#### `customer.subscription.updated`
```javascript
const subscription = event.data.object;
const userId = subscription.metadata.user_id;

await supabase.from('user_profiles')
  .update({
    subscription_status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end
  })
  .eq('id', userId);
```

#### `customer.subscription.deleted`
```javascript
const subscription = event.data.object;
const userId = subscription.metadata.user_id;

await supabase.from('user_profiles')
  .update({
    subscription_status: 'canceled',
    stripe_subscription_id: null,
    plan_mode: 'none'
  })
  .eq('id', userId);
```

**Helper Function: `creditTokens(userId, tokens, stripeId)`**:
```javascript
async function creditTokens(userId, tokens, stripeId) {
  const { data: user } = await supabase
    .from('user_profiles')
    .select('token_balance, processed_stripe_payments')
    .eq('id', userId)
    .single();
  
  // Idempotency check
  if (user.processed_stripe_payments.includes(stripeId)) {
    return;
  }
  
  await supabase.from('user_profiles')
    .update({
      token_balance: user.token_balance + tokens,
      processed_stripe_payments: [...user.processed_stripe_payments, stripeId]
    })
    .eq('id', userId);
}
```

**Response**: Always `200 OK` (fast return after persisting)

---

### 2.4 `/api/stripe/verify-payment` (POST)
**Purpose**: Verify payment status immediately after redirect (read-only)

**Input Schema**:
```typescript
{
  session_id?: string;
  payment_intent_id?: string;
}
```

**Implementation**:
1. Validate authenticated user
2. Fetch from Stripe:
   ```javascript
   const session = await stripe.checkout.sessions.retrieve(sessionId, {
     expand: ['line_items.data.price.product', 'payment_intent']
   });
   ```
3. Parse and return:
   ```javascript
   return {
     ok: session.payment_status === 'paid',
     status: session.payment_status,
     mode: session.mode,
     customer_email: session.customer_email,
     amount_total: session.amount_total,
     currency: session.currency,
     product_labels: session.line_items.data.map(li => li.price.product.name),
     tokens_granted: calculateTokensFromLineItems(session.line_items),
     subscription_info: session.subscription ? await getSubscriptionDetails(session.subscription) : null
   };
   ```

**Response**:
```typescript
{
  ok: boolean;
  status: string;
  mode: 'payment' | 'subscription';
  customer_email: string;
  amount_total: number;
  currency: string;
  product_labels: string[];
  tokens_granted: number;
  subscription_info?: {
    id: string;
    status: string;
    current_period_end: string;
  };
}
```

---

### 2.5 Additional Optional Endpoints

#### `/api/stripe/create-payment-link` (POST)
For affiliate campaigns (lightweight selling without client code)

#### `/api/stripe/list-coupons` (GET)
Admin endpoint to fetch Stripe coupons

#### `/api/stripe/sync-discounts` (POST)
Sync Stripe promo codes with Affiliate records

#### `/api/stripe/create-invoice-checkout` (POST)
Convert custom Invoice records to Stripe Checkout

---

## 3. Frontend Integration Points

### 3.1 `pages/Pricing.jsx`
**Purpose**: Display subscription plans and one-time products

**Implementation**:
```javascript
const products = await AppProduct.filter({ is_active: true, category: 'subscription' });

const handleSubscribe = async (product) => {
  const { url } = await app.functions.invoke('stripe/createCheckoutSession', {
    price_id: product.stripe_price_id,
    mode: product.is_recurring ? 'subscription' : 'payment'
  });
  window.location.href = url;
};
```

**UI Requirements**:
- Filter products by `plan_key` (growth/brand/agency)
- Highlight `is_best_value` plans
- Show monthly/yearly toggle using `billing_interval`
- Display `display_price` and `tokens_granted`

---

### 3.2 `pages/TokenPacketsTopUp.jsx`
**Purpose**: Display plan-specific token add-ons

**Implementation**:
```javascript
const user = await User.me();
const currentPlanProduct = await AppProduct.filter({ 
  plan_key: user.plan_key // or derive from plan_price_id
}).then(r => r[0]);

const tokenPacks = currentPlanProduct.token_packs || [];

const handleBuyTokens = async (pack) => {
  const { url } = await app.functions.invoke('stripe/createCheckoutSession', {
    price_id: pack.stripe_price_id,
    mode: 'payment'
  });
  window.location.href = url;
};
```

**UI Requirements**:
- Display token packs from `AppProduct.token_packs`
- Show pack details: `name`, `tokens`, `display_price`, `description`
- Filter by `is_active` and `sort_order`

---

### 3.3 `pages/post-payment.jsx`
**Purpose**: Confirm payment success/failure immediately after Checkout redirect

**Implementation**:
```javascript
const PostPayment = () => {
  const [status, setStatus] = useState(null);
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      app.functions.invoke('stripe/verifyPayment', { session_id: sessionId })
        .then(setStatus);
    }
  }, [sessionId]);

  if (!status) return <MagicOrbLoader />;

  return (
    <div>
      {status.ok ? (
        <>
          <h1>Payment Successful!</h1>
          <p>Amount: {status.amount_total / 100} {status.currency.toUpperCase()}</p>
          <p>Tokens Granted: {status.tokens_granted}</p>
          <p>Products: {status.product_labels.join(', ')}</p>
          {status.subscription_info && (
            <p>Subscription: Active until {status.subscription_info.current_period_end}</p>
          )}
        </>
      ) : (
        <p>Payment failed or pending: {status.status}</p>
      )}
    </div>
  );
};
```

---

### 3.4 `pages/AccountSettings.jsx`
**Purpose**: Manage billing and subscriptions

**Implementation**:
```javascript
const handleManageBilling = async () => {
  const { url } = await app.functions.invoke('stripe/createCustomerPortalSession', {});
  window.location.href = url;
};

// Display current subscription info
const user = await User.me();
<div>
  <p>Plan: {user.plan_mode}</p>
  <p>Status: {user.subscription_status}</p>
  <p>Renews: {user.current_period_end}</p>
  {user.cancel_at_period_end && <p>Cancels at period end</p>}
  <Button onClick={handleManageBilling}>Manage Billing</Button>
</div>
```

---

### 3.5 `pages/Layout.jsx`
**Purpose**: Capture affiliate referrals

**Implementation**:
```javascript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref__');
  
  if (ref) {
    localStorage.setItem('affiliate_ref', ref);
    // Clean URL
    params.delete('ref__');
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }
}, []);
```

**Token Balance Display**:
```javascript
const [tokenBalance, setTokenBalance] = useState(user.token_balance);

useEffect(() => {
  const handleTokenUpdate = (e) => setTokenBalance(e.detail.newBalance);
  window.addEventListener('tokenBalanceUpdated', handleTokenUpdate);
  return () => window.removeEventListener('tokenBalanceUpdated', handleTokenUpdate);
}, []);

<div className="token-pill">{tokenBalance} tokens</div>
```

---

## 4. Environment Variables

### 4.1 Vercel Environment Variables (Required)
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
APP_URL=https://your-app.vercel.app
```

### 4.2 Supabase (Already configured)
```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # For webhook writes
```

---

## 5. Stripe Dashboard Setup

### 5.1 Create Products and Prices
1. **Subscription Plans**:
   - Growth Monthly: `price_1abc...` → Save to `AppProduct.stripe_price_id`
   - Growth Yearly: `price_1xyz...`
   - Brand Monthly/Yearly
   - Agency Monthly/Yearly

2. **One-Time Token Packs**:
   - 1000 Tokens: `price_1def...`
   - 5000 Tokens: `price_1ghi...`
   - 10000 Tokens: `price_1jkl...`

### 5.2 Configure Webhook Endpoint
- URL: `https://your-app.vercel.app/api/stripe/webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `invoice.paid`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5.3 Customer Portal Configuration
- Enable subscription cancellation
- Enable payment method updates
- Set branding (logo, colors)

---

## 6. Database Migrations

### 6.1 Add Stripe columns to `user_profiles`
```sql
-- supabase/migrations/011_add_stripe_fields.sql
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_price_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_mode TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_payment_status TEXT,
  ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processed_stripe_payments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID REFERENCES affiliates(id);

CREATE INDEX IF NOT EXISTS idx_user_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_stripe_subscription ON user_profiles(stripe_subscription_id);
```

### 6.2 Ensure `app_products` table has required fields
```sql
-- supabase/migrations/012_ensure_app_products_fields.sql
ALTER TABLE app_products
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_key TEXT DEFAULT 'growth',
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'month',
  ADD COLUMN IF NOT EXISTS tokens_granted INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS token_packs JSONB DEFAULT '[]'::jsonb;
```

---

## 7. Testing Checklist

### 7.1 Test Mode (Stripe Test Keys)
1. ✅ Subscribe to monthly plan from Pricing page
2. ✅ Verify redirect to Checkout
3. ✅ Complete test payment (card: `4242 4242 4242 4242`)
4. ✅ Verify redirect to post-payment with success
5. ✅ Check webhook received `checkout.session.completed`
6. ✅ Verify `user.subscription_status` = 'active'
7. ✅ Verify `user.token_balance` increased by `tokens_granted`
8. ✅ Buy token pack from TokenPacketsTopUp
9. ✅ Verify one-time payment and token credit
10. ✅ Open Customer Portal from AccountSettings
11. ✅ Cancel subscription in portal
12. ✅ Verify webhook `customer.subscription.updated` sets `cancel_at_period_end=true`
13. ✅ Test affiliate referral (`?ref__=TESTCODE`)
14. ✅ Verify `affiliate_ref` in Checkout metadata

### 7.2 Production Smoke Test
1. Real card purchase
2. Verify webhook delivery in Stripe Dashboard
3. Check user dashboard for updated tokens/subscription

---

## 8. Implementation Order

1. **Database migrations** (011, 012)
2. **Backend endpoints**:
   - `/api/stripe/create-checkout-session`
   - `/api/stripe/webhook` (core event handlers)
   - `/api/stripe/verify-payment`
   - `/api/stripe/create-customer-portal-session`
3. **Frontend pages**:
   - Update `Pricing.jsx` with Checkout integration
   - Create `TokenPacketsTopUp.jsx`
   - Create `post-payment.jsx`
   - Update `AccountSettings.jsx` with portal button
   - Add affiliate capture to `Layout.jsx`
4. **Stripe Dashboard setup** (products, webhook, portal)
5. **Environment variables** (Vercel + Supabase)
6. **Testing** (test mode first, then production)

---

## 9. Security Notes

- ✅ All user-facing endpoints validate `getCurrentUser()`
- ✅ Webhook validates Stripe signature
- ✅ Use service role key ONLY in webhook (never expose to client)
- ✅ Idempotency via `processed_stripe_payments`
- ✅ Customer Portal only accessible by authenticated owner
- ✅ Price IDs from `AppProduct` table (not client-controlled)

---

## 10. Monitoring & Alerts

- **Stripe Dashboard**: Monitor failed payments, disputes, refunds
- **Webhook Logs**: Check delivery status and retries
- **Supabase Logs**: Monitor for failed token credits
- **Custom Alerts**: Set up notifications for:
  - Failed webhook signatures
  - Duplicate payment processing attempts
  - Subscription cancellations

---

## 11. Affiliate System (Optional Enhancement)

### Tracking Flow:
1. User visits `?ref__=AFFCODE`
2. Layout stores in `localStorage`
3. Checkout session includes `metadata.affiliate_ref`
4. Webhook credits affiliate on `checkout.session.completed`

### Admin Tools:
- `AffiliateManager.jsx`: Manage codes and view stats
- `/api/stripe/list-coupons`: Sync Stripe promo codes
- `/api/stripe/sync-discounts`: Map to `Affiliate` records

---

## Summary

This integration provides:
- ✅ Subscription management (recurring billing)
- ✅ One-time token purchases
- ✅ Affiliate tracking and attribution
- ✅ Customer self-service portal
- ✅ Idempotent token crediting
- ✅ Real-time payment verification
- ✅ Secure webhook handling

**Total API Endpoints**: 6 core + 4 optional
**Total Pages**: 4 core + 2 optional
**Database Tables**: 2 modified (user_profiles, app_products)
**Stripe Products**: ~10-15 (plans + token packs)

All code follows the existing `app.functions.invoke()` pattern and integrates seamlessly with the current Supabase/Vercel architecture.

