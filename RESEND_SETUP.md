# Resend Email Setup Instructions

## ✅ What Was Added:

1. **Copy Questions Feature**: Users can click any question to copy it, or click "Copy All Questions" to copy all at once
2. **Email Results**: Questions are automatically emailed to the user after they submit their email
3. **Visual Feedback**: Copied questions turn green with a checkmark

## 📧 Configure Resend API Key

### Local Development (.env.local):
Add this to your `.env.local` file:

```bash
RESEND_API_KEY=your_resend_api_key_here
```

### Vercel Production:
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `your_resend_api_key_here` (get from https://resend.com/api-keys)
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your project for changes to take effect

⚠️ **IMPORTANT**: Never commit your actual API key to git! Always use placeholder text in documentation.

## 🎨 Features:

### Copy Questions:
- ✅ Click any question to copy it to clipboard
- ✅ Click "Copy All Questions" button to copy all questions at once
- ✅ Visual feedback: Questions turn green with checkmark when copied
- ✅ Hover effect: Questions highlight on hover

### Email Results:
- ✅ Questions are automatically emailed after user submits their email
- ✅ Beautiful HTML email template with:
  - Numbered questions list
  - "Book a Discovery Call" CTA button
  - Branding footer
- ✅ Email confirmation message shown in UI

## 📝 Email Template:

The email includes:
- Header: "Your Questions Discovery Report"
- Keyword they searched for
- All questions in a numbered list
- CTA to book a discovery call
- SEWO branding footer

## 🔧 Customize Email:

To customize the "from" email address, update this line in `/app/api/send-questions/route.ts`:

```typescript
from: 'SEWO Questions Discovery <onboarding@resend.dev>',
```

Change to your verified domain:

```typescript
from: 'SEWO Questions Discovery <noreply@sewo.io>',
```

**Note:** You'll need to verify your domain in Resend dashboard first: https://resend.com/domains

## 🧪 Testing:

1. Start dev server: `npm run dev`
2. Go to homepage
3. Force the Questions Discovery variant (paste in browser console):
   ```javascript
   localStorage.setItem('hero_ab_test_variant', 'questions');
   location.reload();
   ```
4. Enter a keyword
5. Enter your email
6. Check that:
   - Questions appear
   - You can click to copy individual questions
   - You can copy all questions
   - Email confirmation appears
   - Check your inbox for the email!

## 📊 Resend Dashboard:

View sent emails and analytics at: https://resend.com/emails

