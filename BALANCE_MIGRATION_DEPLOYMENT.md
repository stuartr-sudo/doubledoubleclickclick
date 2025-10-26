# Dollar Balance System - Deployment Checklist

## ✅ What's Been Completed

### 1. Database Migration ✅
- [x] Created `balance_transactions` table
- [x] Created `balance_top_ups` table
- [x] Renamed `token_balance` → `account_balance` in `user_profiles`
- [x] Renamed `token_cost` → `dollar_cost` in `feature_flags`
- [x] Set default balance to $5.00 for new users
- [x] Seeded feature costs (e.g., AI Title Rewrite = $0.10)
- [x] Created `log_balance_transaction()` helper function
- [x] Set up RLS policies for new tables

### 2. Backend Updates ✅
- [x] Updated balance consumption API (`/api/balance/consume`)
- [x] Created balance top-up endpoint (`/api/balance/top-up`)
- [x] Updated Stripe webhook handler
- [x] All serverless functions use `account_balance`

### 3. Frontend Updates ✅
- [x] Created `useBalanceConsumption` hook
- [x] Built `BalanceTopUp` page with Stripe Elements
- [x] Updated `Layout.jsx` balance display
- [x] Updated `Editor.jsx` to use balance consumption
- [x] Updated `UserManagement.jsx` to show/edit balance
- [x] Updated `BalanceTopUpBanner` component
- [x] Event listeners for balance updates

### 4. Superadmin Setup ✅
- [x] Credit superadmin with $1000
- [x] Enable `show_account_balance` feature flag
- [x] Admin can manually add balance to any user

---

## 🚀 Deployment Steps

### Step 1: Run SQL Scripts in Supabase

Run these scripts in order in your Supabase SQL Editor:

1. **Database Migration** (if not already run):
   ```bash
   # File: supabase/migrations/031_dollar_balance_system.sql
   ```

2. **Superadmin Setup**:
   ```bash
   # File: SETUP_SUPERADMIN_BALANCE.sql
   ```

3. **Verification** (optional but recommended):
   ```bash
   # File: VERIFY_BALANCE_MIGRATION.sql
   ```

### Step 2: Verify Environment Variables in Vercel

Ensure these are set in your Vercel project:

- ✅ `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- ✅ `STRIPE_SECRET_KEY` - Your Stripe secret key
- ✅ `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret
- ✅ `SUPABASE_URL` - Your Supabase project URL
- ✅ `SUPABASE_SERVICE_KEY` - Your Supabase service role key (for backend)
- ✅ `VITE_SUPABASE_URL` - Your Supabase project URL (for frontend)
- ✅ `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key (for frontend)
- ✅ `OPENAI_API_KEY` - Your OpenAI API key

### Step 3: Deploy to Vercel

```bash
# In your project directory:
git add .
git commit -m "feat: migrate from tokens to dollar balance system"
git push origin main
```

Vercel will automatically deploy your changes.

### Step 4: Set Up Stripe Webhook (if not already set)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret to Vercel env vars as `STRIPE_WEBHOOK_SECRET`

---

## 🧪 Testing Checklist

After deployment, test these flows:

### User Balance Display
- [ ] Top menu bar shows balance (e.g., "$1000.00")
- [ ] Balance is clickable and links to "Add Funds" page
- [ ] User Management page shows "Account Balance ($)" field

### Adding Funds
- [ ] Navigate to "Add Funds" page
- [ ] Quick-add buttons work ($10, $25, $50, $100, $250)
- [ ] Custom amount input works
- [ ] Stripe checkout completes successfully
- [ ] Balance updates after successful payment

### Feature Consumption
- [ ] AI Title Rewrite deducts $0.10
- [ ] Balance updates in real-time after feature use
- [ ] Error shown if insufficient funds
- [ ] All AI features (image gen, voice, etc.) work correctly

### Admin Controls
- [ ] Superadmin can see/edit all user balances
- [ ] Balance can be manually adjusted in User Management
- [ ] Changes save and persist correctly

---

## 📋 Feature Cost Reference

Current dollar costs for features:

| Feature | Cost | Flag Name |
|---------|------|-----------|
| AI Title Rewrite | $0.10 | `ai_title_rewrite` |
| Content Rewriter | $0.15 | `ai_rewriter` |
| Generate Image | $0.15 | `generate_image` |
| AI Imagineer | $0.25 | `ai_imagineer` |
| Voice AI | $0.20 | `voice_ai` |
| FAQ Generator | $0.12 | `ai_faqs` |
| TLDR Generator | $0.10 | `ai_tldr` |
| Callout Generator | $0.10 | `ai_callouts` |
| Conclusion Generator | $0.12 | `ai_conclusion` |
| Infographic Builder | $0.20 | `ai_infographics` |

---

## ⚠️ Rollback Plan (if needed)

If something goes wrong, you can rollback:

1. **Database**: Restore from backup before migration
2. **Code**: Revert to previous Git commit
3. **Vercel**: Roll back to previous deployment in Vercel dashboard

---

## 🎯 Success Criteria

Your migration is successful when:

- ✅ All users can see their balance in the top menu
- ✅ New users start with $5.00 credit
- ✅ Users can add funds via Stripe
- ✅ All AI features deduct the correct dollar amount
- ✅ Superadmin has $1000.00 and can manage user balances
- ✅ No errors in browser console or server logs

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check Vercel deployment logs
3. Check Supabase logs (Database → Logs)
4. Run verification SQL scripts
5. Verify all environment variables are set correctly

---

## 🎉 Post-Deployment

After successful deployment:

1. Announce the new balance system to users
2. Consider offering a promotional credit (e.g., "Add $50, get $10 free")
3. Monitor usage patterns and adjust feature costs if needed
4. Set up alerts for low balance notifications
5. Consider adding balance history/transactions page for users

---

**Generated**: October 26, 2025
**Version**: 1.0
**Status**: Ready for Production ✅

