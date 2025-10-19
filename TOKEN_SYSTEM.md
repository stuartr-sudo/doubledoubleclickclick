# Token Consumption System - Implementation Guide

## Overview
The token consumption system is now fully implemented and ready for testing. This system manages feature access and token deduction for all AI-powered features in the application.

## What Was Implemented

### 1. Database Schema ✅
- **Enhanced `feature_flags` table** with:
  - `flag_name` (unique feature identifier)
  - `is_enabled` (global on/off switch)
  - `token_cost` (tokens required to use the feature)
  - `is_coming_soon` (preview/beta flag)
  - `required_plan_keys` (plan-based restrictions)
  - `user_overrides` (per-user access control)
  - `youtube_tutorial_url` and `loom_tutorial_url` (help resources)

- **Seeded 20 feature flags** with token costs:
  - `ai_rewriter` (2 tokens)
  - `ai_seo` (3 tokens)
  - `ai_faq` (2 tokens)
  - `ai_tldr` (1 token)
  - `ai_brand_it` (2 tokens)
  - `ai_html_cleanup` (1 token)
  - `ai_autolink` (2 tokens)
  - `ai_autoscan` (3 tokens)
  - `ai_schema` (2 tokens)
  - `ai_links_references` (2 tokens)
  - `ai_humanize` (2 tokens)
  - `ai_localize` (3 tokens)
  - `ai_imagineer` (5 tokens)
  - `ai_content_detection` (1 token)
  - `voice_ai` (3 tokens)
  - `generate_image` (4 tokens)
  - `youtube_import` (1 token)
  - `tiktok_import` (1 token)
  - `amazon_import` (1 token)
  - `sitemap_scraper` (1 token)

### 2. Backend API ✅
- **`/api/tokens/check-and-consume`** - Main endpoint for token consumption
  - Validates user authentication
  - Checks feature flag status
  - Verifies token balance
  - Deducts tokens
  - Logs transaction to `analytics_events`
  - Handles superadmin bypass
  - Enforces plan-based restrictions

- **`/api/tokens/balance`** - Simple balance query endpoint

### 3. Frontend Integration ✅
- **`src/api/appClient.js`** - Updated with `checkAndConsumeTokens` function
- **`src/lib/tokens.js`** - Helper utilities for token operations
- **`src/components/hooks/useFeatureFlag.jsx`** - Fixed to use correct DB column names
- **`src/pages/TokenTest.jsx`** - Test page for manual verification

### 4. Environment Configuration ✅
- Added `SUPABASE_SERVICE_KEY` to Vercel production environment
- Added `SUPABASE_URL` to Vercel production environment
- Updated `vercel.json` for proper routing

## How to Test

### Step 1: Navigate to the Token Test Page
1. Go to: `https://sewo-e15p1vr36-doubleclicks.vercel.app/TokenTest`
2. You'll see your current user info and token balance

### Step 2: Test Token Consumption
Click any of the test buttons:
- **AI Rewriter (2 tokens)** - Should deduct 2 tokens
- **AI SEO (3 tokens)** - Should deduct 3 tokens
- **AI TLDR (1 token)** - Should deduct 1 token
- **Generate Image (4 tokens)** - Should deduct 4 tokens

### Step 3: Verify Results
After clicking a button, you should see:
- ✅ Success toast notification
- ✅ Updated token balance
- ✅ JSON response showing tokens consumed
- ✅ Transaction logged to analytics_events table

### Step 4: Test Error Cases
To test error handling:
1. **Insufficient tokens**: Click a button when you don't have enough tokens
2. **Disabled feature**: Disable a feature flag in Supabase and try to use it
3. **Plan restrictions**: Add a `required_plan_keys` array and test without the right plan

## How Features Use This System

### In Any Component:
```javascript
import { checkAndConsumeTokens } from '@/api/functions';
import { User } from '@/api/entities';
import { toast } from 'sonner';

// Inside your component:
const user = await User.me();

// Before executing an expensive operation:
try {
  const result = await checkAndConsumeTokens({
    userId: user.id,
    featureName: 'ai_rewriter'
  });

  if (result.success) {
    // Proceed with the AI operation
    toast.success(`Consumed ${result.tokensConsumed} tokens. Balance: ${result.remainingBalance}`);
    
    // ... do the actual work ...
  }
} catch (error) {
  toast.error(error.message);
  // Don't proceed
}
```

## Superadmin Bypass
Superadmins (`is_superadmin = true`) do NOT consume tokens. This allows admins to test features without depleting their balance.

## Plan-Based Restrictions
To restrict a feature to specific plans:
1. Go to Supabase SQL Editor
2. Update the feature flag:
```sql
UPDATE feature_flags 
SET required_plan_keys = '["pro", "enterprise"]'::jsonb
WHERE flag_name = 'ai_imagineer';
```

Now only users with a `pro` or `enterprise` plan can use `ai_imagineer`.

## User-Specific Overrides
To enable/disable a feature for a specific user:
```sql
UPDATE feature_flags 
SET user_overrides = jsonb_set(
  COALESCE(user_overrides, '{}'::jsonb),
  '{USER_ID_HERE}',
  'true'
)
WHERE flag_name = 'ai_rewriter';
```

## Analytics
All token consumption is logged to the `analytics_events` table with:
- `event_name`: `'token_consumption'`
- `properties.feature`: The feature name
- `properties.tokens_consumed`: Amount deducted
- `properties.balance_before`: Balance before transaction
- `properties.balance_after`: Balance after transaction

## Next Steps
1. **Test the `/TokenTest` page** to verify everything works
2. **Integrate token checks** into actual feature endpoints (AI Rewriter, SEO, etc.)
3. **Add token purchase flow** via Stripe
4. **Create token balance UI** in the main layout/header
5. **Add low-balance warnings** when user is running out of tokens

## Files Modified
- `api/tokens/check-and-consume.js` (NEW)
- `api/tokens/balance.js` (NEW)
- `src/lib/tokens.js` (NEW)
- `src/pages/TokenTest.jsx` (NEW)
- `src/api/appClient.js` (UPDATED)
- `src/components/hooks/useFeatureFlag.jsx` (UPDATED)
- `src/pages/index.jsx` (UPDATED)
- `supabase/migrations/002_enhance_feature_flags.sql` (NEW)
- `vercel.json` (UPDATED)

## Deployment Status
✅ **Deployed to Production**: https://sewo-e15p1vr36-doubleclicks.vercel.app

All changes are live and ready for testing!

