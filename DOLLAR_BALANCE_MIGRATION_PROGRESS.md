# Dollar Balance System Migration - Progress Report

## ✅ COMPLETED

### 1. Database Schema
- ✅ Created migration script `supabase/migrations/031_dollar_balance_system.sql`
  - ✅ Created `balance_transactions` table for audit logs
  - ✅ Created `balance_top_ups` table for Stripe purchases
  - ✅ Renamed `token_balance` → `account_balance` in `user_profiles`
  - ✅ Renamed `token_cost` → `dollar_cost` in `feature_flags`
  - ✅ Set default balance to $5.00 for new users
  - ✅ Seeded feature costs with dollar amounts ($0.08 - $0.29)
  - ✅ Created helper function `log_balance_transaction()`
  - ✅ Set up RLS policies for new tables

### 2. Backend APIs
- ✅ Created `api/balance/check-and-deduct.js` (replaces token consumption)
- ✅ Created `api/balance/add-funds.js` (Payment Intent creation for Stripe)
- ✅ Updated `api/stripe/webhook.js` to handle balance top-ups via `payment_intent.succeeded`

### 3. Frontend Core Infrastructure
- ✅ Created `src/components/hooks/useBalanceConsumption.jsx`
- ✅ Created `src/pages/BalanceTopUp.jsx` with embedded Stripe Elements
- ✅ Created `src/components/common/BalanceTopUpBanner.jsx`
- ✅ Installed Stripe React packages (`@stripe/stripe-js` + `@stripe/react-stripe-js`)

### 4. Routing
- ✅ Added BalanceTopUp to `src/pages/index.jsx`
- ✅ Added routes for `/BalanceTopUp` and `/balance-top-up`

### 5. Navigation & UI Updates
- ✅ Updated `src/pages/Layout.jsx`:
  - ✅ Replaced `TokenTopUpBanner` with `BalanceTopUpBanner`
  - ✅ Created `getDisplayBalance()` function (shows dollars with $X.XX format)
  - ✅ Updated balance pill in header to link to BalanceTopUp
  - ✅ Updated mobile menu balance display
  - ✅ Updated help video tooltips

### 6. Feature Consumption Updates (Partial)
- ✅ Updated `src/pages/Editor.jsx`:
  - ✅ Imported `useBalanceConsumption` hook
  - ✅ Replaced `consumeTokensForFeature` with `consumeBalanceForFeature`
  - ✅ Updated AI title rewrite function
  - ✅ Updated infographic generation function

## 🔄 IN PROGRESS / TODO

### 7. Remaining Feature Consumption Updates (38 files)
Need to update all files that use `useTokenConsumption` to use `useBalanceConsumption`:

**Priority Files:**
- [ ] `src/pages/Topics.jsx` - Flash workflows
- [ ] `src/components/content/FlashButton.jsx` - Content Flash execution
- [ ] `src/components/editor/AIRewriterModal.jsx`
- [ ] `src/components/editor/FaqGeneratorModal.jsx`
- [ ] `src/components/editor/BrandItModal.jsx`
- [ ] `src/components/editor/HTMLCleanupModal.jsx`
- [ ] `src/components/editor/LocalizeModal.jsx`
- [ ] `src/components/editor/TldrGeneratorModal.jsx`
- [ ] `src/components/editor/VoiceDictationModal.jsx`

**Other Files:**
- [ ] `src/pages/YouTubeManager.jsx`
- [ ] `src/pages/TestimonialLibrary.jsx`
- [ ] `src/pages/ProductManager.jsx`
- [ ] `src/pages/PricingFaqManager.jsx`
- [ ] `src/pages/ImageLibrary.jsx`
- [ ] `src/pages/BrandGuidelinesManager.jsx`
- [ ] `src/pages/AmazonTestimonials.jsx`
- [ ] `src/pages/AmazonImport.jsx`
- [ ] `src/components/onboarding/TopicsOnboardingModal.jsx`
- [ ] `src/components/editor/YouTubeSelector.jsx`
- [ ] `src/components/editor/VideoLibraryModal.jsx`
- [ ] `src/components/editor/TikTokSelector.jsx`
- [ ] `src/components/editor/TestimonialLibraryModal.jsx`
- [ ] `src/components/editor/SitemapLinkerModal.jsx`
- [ ] `src/components/editor/SEOSettingsModal.jsx`
- [ ] `src/components/editor/RunWorkflowModal.jsx`
- [ ] `src/components/editor/PromotedProductSelector.jsx`
- [ ] `src/components/editor/MediaLibraryModal.jsx`
- [ ] `src/components/editor/LinksAndReferencesButton.jsx`
- [ ] `src/components/editor/LinkSelector.jsx`
- [ ] `src/components/editor/InternalLinkerButton.jsx`
- [ ] `src/components/editor/ImageLibraryModal.jsx`
- [ ] `src/components/editor/CtaTemplateFillModal.jsx`
- [ ] `src/components/editor/CtaSelector.jsx`
- [ ] `src/components/editor/AutoScanButton.jsx`
- [ ] `src/components/editor/AudioFromTextModal.jsx`
- [ ] `src/components/editor/AskAIQuickMenu.jsx`
- [ ] `src/components/editor/AffilifyModal.jsx`

### 8. Event System Updates
- [ ] Update all `window.dispatchEvent(new CustomEvent('tokenBalanceUpdated'))` → `balanceUpdated`
- [ ] Update all `tokenConsumptionFailed` → `balanceConsumptionFailed`

### 9. Language/Text Updates Throughout App
- [ ] Replace "tokens" → "balance" or "funds" in all UI text
- [ ] Replace "Token Balance" → "Account Balance"
- [ ] Replace "Buy Tokens" → "Add Funds"
- [ ] Replace "Insufficient tokens" → "Insufficient balance"
- [ ] Replace "Top up tokens" → "Add funds"

### 10. Testing & Deployment
- [ ] Run migration script on Supabase
- [ ] Test signup flow ($5.00 credit)
- [ ] Test add funds flow (quick-add + custom amount)
- [ ] Test balance consumption for AI features
- [ ] Test insufficient balance error handling
- [ ] Test balance display updates in real-time
- [ ] Test transactions log
- [ ] Verify Stripe webhook integration

### 11. Cleanup
- [ ] Delete `src/pages/TokenPacketsTopUp.jsx`
- [ ] Delete `src/components/hooks/useTokenConsumption.jsx`
- [ ] Delete `src/components/common/TokenTopUpBanner.jsx`
- [ ] Delete `api/tokens/` folder (after migrating functionality)

### 12. Documentation
- [ ] Update README.md with new pricing model
- [ ] Document balance transaction types
- [ ] Update API documentation

## Notes
- All dollar amounts use NUMERIC(10, 2) type
- Minimum transaction: $10.00
- Feature costs range: $0.08 - $0.29
- New users get $5.00 signup credit automatically
- Balance never goes negative (check before deduction)
- All transactions are logged for audit trail
- Stripe integration is embedded (no redirect)
- Support both quick-add and custom amounts

