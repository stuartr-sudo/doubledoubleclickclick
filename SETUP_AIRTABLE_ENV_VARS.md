# Setting Up Airtable Environment Variables in Vercel

## Required Environment Variables

You need to add these to Vercel for the Topics page to fetch Keywords and FAQs from Airtable:

### 1. Airtable API Key
- **Variable Name**: `VITE_AIRTABLE_API_KEY` or `AIRTABLE_API_KEY`
- **Value**: Your Airtable Personal Access Token
- **Where to find**: https://airtable.com/create/tokens

### 2. Airtable Base ID
- **Variable Name**: `VITE_AIRTABLE_BASE_ID` or `AIRTABLE_BASE_ID`
- **Value**: Your Airtable Base ID (starts with `app...`)
- **Where to find**: In your Airtable URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`

### 3. Airtable Table IDs (Optional - if you want to override)
- **Keyword Map Table**: `VITE_AIRTABLE_KEYWORD_TABLE_ID`
- **FAQ Table**: `VITE_AIRTABLE_FAQ_TABLE_ID`

---

## How to Add to Vercel

### Method 1: Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Select your **DoubleClick** project
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar
5. For each variable:
   - Click **Add New**
   - Enter the **Key** (e.g., `VITE_AIRTABLE_API_KEY`)
   - Enter the **Value** (your actual API key)
   - Select **Production**, **Preview**, and **Development**
   - Click **Save**
6. After adding all variables, **redeploy** your app

### Method 2: Vercel CLI (Advanced)

```bash
# Login to Vercel
vercel login

# Link your project
cd /path/to/doubleclicker-1-new
vercel link

# Add environment variables
vercel env add VITE_AIRTABLE_API_KEY
# Paste your API key when prompted

vercel env add VITE_AIRTABLE_BASE_ID
# Paste your Base ID when prompted

# Redeploy
vercel --prod
```

---

## Current Table IDs in Code

Looking at your `Topics.jsx`, these are currently hardcoded:

```javascript
const TABLE_IDS = {
  keywordMap: "tblDR9SmoK8wEYmnA",
  faq: "tblSDBPmucJA0Skvp",
  targetMarket: "tblhayydQ0Zq2NBR9",
  blogCategories: "tblyNaoalXlmc1pQO",
  companyProducts: "Company Products",
  companyInformation: "Company Information"
};
```

**Should I:**
1. ✅ Keep these hardcoded (they're table IDs, not sensitive)
2. ✅ Move them to env vars for flexibility

---

## What's Already Set Up?

Let me check your current Airtable integration...

Your app uses `airtableSync()` function which should already be reading from env vars.

**Next Step**: Tell me if you want me to:
1. Just document what env vars to add in Vercel
2. Update the code to read table IDs from env vars too
3. Check if Airtable credentials are already set

---

## Security Note

✅ **API Keys & Base IDs**: MUST be env vars (secret)  
✅ **Table IDs**: Can be hardcoded (not sensitive - they're just references)

**Recommendation**: Keep table IDs in code, only move API key and Base ID to env vars.

