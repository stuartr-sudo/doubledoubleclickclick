# AI Facts Loading State Setup

## What This Feature Does

When users enter their email in the Questions Discovery flow, they'll see interesting AI facts cycling through while waiting for the API to return questions. The facts change every 3 seconds, keeping users engaged during the 5-10 second loading period.

## Step 1: Run the SQL in Supabase

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `SUPABASE_ADD_AI_FACTS.sql`
5. Click **Run** or press `Cmd/Ctrl + Enter`

The SQL will add 5 new columns to your `homepage_content` table with default AI facts.

## Step 2: Customize the Facts (Optional)

After deploying, you can customize these facts in the admin panel:

1. Go to `/admin/homepage`
2. Scroll to the **Questions Discovery (A/B Test Variant)** section
3. Find the **Loading State AI Facts** subsection
4. Edit any of the 5 facts to match your brand voice
5. Click **Save Changes**

## Default Facts

1. "Did you know? Over 85% of consumers use AI-powered search before making purchase decisions."
2. "ChatGPT reaches 100 million users in just 2 months - the fastest growing app in history."
3. "Brands optimized for AI discovery see up to 300% more referral traffic."
4. "By 2025, 50% of all searches will be conducted through AI assistants."
5. "AI citations drive 4x higher conversion rates than traditional search results."

## How It Works

- Facts cycle automatically every **3 seconds**
- Appears during Step 2 (email input) while questions load in background
- Also appears in Step 3 (results page) if still loading
- Smooth fade transitions between facts
- Loading spinner animation for visual feedback

## Testing

1. Visit your homepage
2. If you see the "Get Questions" variant (A/B test), enter a keyword
3. Enter your email
4. Watch the facts cycle while the API loads questions
5. The cycling stops once questions are displayed

That's it! Your Questions Discovery flow now has an engaging loading experience. 🎉

