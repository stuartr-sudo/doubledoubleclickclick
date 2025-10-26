# 🚀 Quick Start: Enable Balance Display & Credit Superadmin

## Step 1: Run This SQL Script in Supabase

**File**: `SETUP_SUPERADMIN_BALANCE.sql`

```sql
-- Copy/paste this into Supabase SQL Editor and run it
```

This script will:
- ✅ Credit your superadmin account with **$1000.00**
- ✅ Enable the balance display in the top menu bar
- ✅ Verify everything is set up correctly

## Step 2: Deploy to Vercel

```bash
cd /Users/stuarta/Documents/GitHub/doubleclicker-1-new
git add .
git commit -m "feat: update UI for dollar balance system"
git push origin main
```

## Step 3: Refresh Your App

After deployment completes:
1. Open your app in the browser
2. **Hard refresh** (Cmd+Shift+R on Mac, Ctrl+Shift+F5 on Windows)
3. You should now see:
   - **$1000.00** in the top menu bar
   - **Account Balance ($)** field in User Management page

---

## What Changed?

### User Management Page ✅
- "Tokens" field → **"Account Balance ($)"** field
- Shows dollar amounts with 2 decimal places
- You can manually add/adjust user balances

### Top Menu Bar ✅
- Shows your account balance (e.g., "$1000.00")
- Clickable to go to "Add Funds" page
- Updates in real-time when you use features

### Balance System ✅
- New users start with **$5.00** credit
- Each feature costs a specific amount (e.g., AI Title Rewrite = $0.10)
- Users can add funds via Stripe
- All transactions are logged in `balance_transactions` table

---

## Admin Powers 💪

As superadmin, you can:
- ✅ See all user balances in User Management
- ✅ Manually credit any user with any amount
- ✅ View balance transaction history (coming soon)
- ✅ Adjust feature costs in Feature Flags table

---

## Need Help?

If you don't see the balance after deployment:

1. **Check the feature flag**:
   ```sql
   SELECT * FROM feature_flags WHERE flag_name = 'show_account_balance';
   ```
   Should show `is_enabled = true`

2. **Check your balance**:
   ```sql
   SELECT email, account_balance FROM user_profiles WHERE is_superadmin = true;
   ```
   Should show `$1000.00`

3. **Hard refresh the browser** (clear cache)

4. **Check browser console** for any errors

---

**That's it!** Your app now uses a dollar balance system instead of tokens. 🎉

