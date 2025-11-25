# Email Troubleshooting Guide - Questions Discovery

## Issue: Not Receiving Questions Email

I've fixed the email sending logic to ensure it works reliably. Here's what was wrong and how to verify it's working:

---

## What I Fixed

### 1. **Timing Issue Fixed** ✅
**Problem**: Email was only sent if questions were already loaded when user submitted email.

**Solution**: 
- Added a `useEffect` hook that automatically sends email once questions are loaded
- Email now sends reliably even if questions take 5-10 seconds to load
- Added detailed console logging for debugging

### 2. **Better Error Handling** ✅
- Added validation to prevent sending empty emails
- Added detailed console logs at every step
- API now returns full error details

---

## How to Test Email Sending

### Step 1: Check Console Logs
Open browser DevTools (F12) → Console tab, then:

1. Enter a keyword (e.g., "AI marketing")
2. Enter your email
3. Look for these console messages:

```
✅ Success Flow:
- "Starting DataForSEO API call for keyword: AI marketing"
- "Successfully fetched X questions"
- "Triggering email send from useEffect"
- "Sending email to: your@email.com with X questions"
- "Questions emailed successfully: { messageId: 'xxx' }"
```

```
❌ Error Flow (if something fails):
- "Failed to send email: { error: 'reason here' }"
- "Error sending email: [error details]"
```

### Step 2: Check Resend Dashboard
1. Go to https://resend.com/emails
2. Login to your account
3. Check the "Emails" tab for recent sends
4. Look for emails with subject: "Your Questions Discovery Report: [keyword]"

### Step 3: Check Email Spam Folder
- The email comes from: `Stuart A <stuartr@sewo.io>`
- Subject: "Your Questions Discovery Report: [keyword]"
- Sometimes first emails go to spam until domain reputation builds

---

## Common Issues & Fixes

### Issue 1: RESEND_API_KEY Not Set
**Symptom**: Console shows "Email service not configured"

**Fix**:
```bash
# In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add: RESEND_API_KEY = your_actual_key_here
3. Redeploy

# For Local Testing:
# Create .env.local file if it doesn't exist
echo "RESEND_API_KEY=your_key_here" >> .env.local
# Restart dev server
```

### Issue 2: Domain Not Verified in Resend
**Symptom**: Emails show as sent in code but never arrive

**Fix**:
1. Go to https://resend.com/domains
2. Verify `sewo.io` domain by adding DNS records
3. Wait for DNS propagation (can take 24-48 hours)
4. OR use `onboarding@resend.dev` for testing (100 emails/day limit)

**To use test domain temporarily:**
```typescript
// In app/api/send-questions/route.ts, line 102:
from: 'onboarding@resend.dev',  // For testing only
```

### Issue 3: No Questions Loaded
**Symptom**: Console shows "Skipping email send: missing data"

**Fix**: 
- This means DataForSEO didn't return any questions
- Check the DataForSEO API credentials are correct
- Try a different, more popular keyword
- Check DataForSEO dashboard for API usage/errors

### Issue 4: Rate Limited
**Symptom**: "Too many submissions" error

**Fix**:
- Wait 1 hour before trying same email again
- OR use a different email address
- OR clear rate limit in Supabase (check `lead_captures` table)

---

## Verify Resend Configuration

### Check if Resend is Configured:
```bash
# In terminal:
cd /Users/stuarta/Documents/GitHub/doubleclicker-1

# Check if key is set in Vercel (for production):
vercel env ls

# Check if key is set locally:
cat .env.local | grep RESEND
```

### Get Your Resend API Key:
1. Go to https://resend.com/api-keys
2. Copy your API key (starts with `re_`)
3. Add it to:
   - **Vercel**: Project Settings → Environment Variables
   - **Local**: `.env.local` file

---

## Test Email Manually (API Route)

You can test the email API directly:

```bash
curl -X POST http://localhost:3000/api/send-questions \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "keyword": "AI marketing",
    "questions": [
      "What is AI marketing?",
      "How does AI improve marketing ROI?",
      "What are the best AI marketing tools?"
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "messageId": "some-message-id"
}
```

---

## What Happens Now (Flow Diagram)

```
1. User enters keyword
   ↓
2. API starts fetching questions (5-10 seconds)
   ↓
3. User enters email → Saved to database
   ↓
4. User sees Step 3 (loading facts cycle)
   ↓
5. Questions finish loading
   ↓
6. ✅ useEffect detects questions are ready
   ↓
7. ✅ Email automatically sent via Resend
   ↓
8. Questions display on screen
   ↓
9. Email arrives in inbox (within 1-2 minutes)
```

---

## Need More Help?

**Check these logs:**
1. **Browser Console** (F12) - Client-side errors
2. **Vercel Functions Logs** - API route errors (if deployed)
3. **Resend Dashboard** - Email delivery status
4. **Terminal** (if running locally) - Server errors

**Still not working?**
Share these details:
- Console error messages (screenshot)
- Resend dashboard status (screenshot)
- What email address you're testing with
- Whether you're testing locally or on production

---

## Summary of Changes

✅ **Fixed**: Email now sends automatically when questions load (not just at submission)
✅ **Added**: Detailed console logging for debugging
✅ **Added**: Better error handling and validation
✅ **Added**: useCallback to prevent memory leaks
✅ **Improved**: Reliability - email will always send once questions are ready

**Deploy these changes to see the fix in action!** 🚀

