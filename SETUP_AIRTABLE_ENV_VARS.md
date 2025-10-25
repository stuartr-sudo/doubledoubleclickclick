# 🔧 Airtable Environment Variables Setup

## Required Environment Variables

Your Vercel deployment needs these environment variables:

```bash
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
```

## How to Add Them to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project (`doubleclicker-1-new` or similar)
3. Click **Settings** tab
4. Click **Environment Variables** in the left sidebar
5. Add each variable:
   - Key: `AIRTABLE_API_KEY`
   - Value: Your Airtable personal access token
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click **Save**
6. Repeat for `AIRTABLE_BASE_ID`

## How to Get These Values

### AIRTABLE_API_KEY
1. Go to https://airtable.com/create/tokens
2. Create a new personal access token
3. Grant it access to your base
4. Copy the token

### AIRTABLE_BASE_ID
1. Open your Airtable base in browser
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. The part starting with `app` is your base ID (e.g., `appAbC123dEf456`)

## After Adding Variables

1. **Redeploy your app**:
   - Go to Vercel dashboard
   - Click **Deployments** tab
   - Click the 3 dots next to your latest deployment
   - Click **Redeploy**
   
   OR
   
   - Make a small change to your code and push to GitHub

2. **Test in browser console**:
```javascript
// Open DevTools Console
// Select "keppi" from the dropdown
// Check Network tab for /api/airtable/sync requests
// Look for the response - should show your Airtable records
```

## Troubleshooting

### "Missing Airtable environment variables" error in logs
- ❌ Variables not set in Vercel
- ❌ Variables set but not redeployed
- ✅ Add variables and redeploy

### "401 Unauthorized" or "403 Forbidden"
- ❌ API key is invalid or expired
- ❌ API token doesn't have access to the base
- ✅ Create a new token with proper permissions

### "404 Not Found" on table
- ❌ Table ID is wrong in Topics.jsx (lines 41-48)
- ✅ Update TABLE_IDS to match your actual Airtable table IDs

### No data loads when selecting "keppi"
- ❌ No records in Airtable with `Username = "keppi"`
- ✅ Check your Airtable and ensure:
  - Keyword Map table has a "Username" field
  - Records exist with Username = "keppi"
  - FAQs table has a "Username" field
  - FAQs linked to keywords with Username = "keppi"

## Current TABLE_IDS in Code

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

**Make sure these match your actual Airtable table IDs!**

To find your table IDs:
1. Open your base in Airtable
2. Click a table
3. Look at the URL: `https://airtable.com/appXXX/tblYYYYYY/...`
4. The `tblYYYYYY` part is the table ID

## Quick Test

Once variables are set and redeployed, run this in your browser console:

```javascript
// Test the API endpoint
fetch('/api/airtable/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'listAll',
    tableId: 'tblDR9SmoK8wEYmnA',
    filterByFormula: "{Username} = 'keppi'"
  })
})
.then(r => r.json())
.then(data => console.log('Airtable Response:', data));
```

If it returns `success: true` with records, you're all set! 🎉
