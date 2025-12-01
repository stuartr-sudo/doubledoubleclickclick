# Fix Lead Captures Issue

## Problem Identified

The `lead_captures` table was missing the `ip_address` column that the API was trying to insert, causing all lead submissions to fail silently.

## Solution

A migration has been created to add the missing column and performance indexes.

## How to Fix (Run This Migration)

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste this SQL:

```sql
-- Add ip_address column to lead_captures table for spam protection
ALTER TABLE public.lead_captures 
  ADD COLUMN IF NOT EXISTS ip_address text;

-- Add index for faster IP lookups (used in spam protection)
CREATE INDEX IF NOT EXISTS idx_lead_captures_ip_address 
  ON public.lead_captures(ip_address);

-- Add index for faster email lookups (used in duplicate checking)
CREATE INDEX IF NOT EXISTS idx_lead_captures_email 
  ON public.lead_captures(email);

-- Add index for source + IP combination (used in rate limiting)
CREATE INDEX IF NOT EXISTS idx_lead_captures_source_ip 
  ON public.lead_captures(source, ip_address);
```

4. Click **Run** or press `Cmd/Ctrl + Enter`
5. Verify success message

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Apply the migration
supabase db push
```

### Option 3: Manual SQL Query

Connect to your database and run:

```sql
ALTER TABLE public.lead_captures ADD COLUMN IF NOT EXISTS ip_address text;
CREATE INDEX IF NOT EXISTS idx_lead_captures_ip_address ON public.lead_captures(ip_address);
CREATE INDEX IF NOT EXISTS idx_lead_captures_email ON public.lead_captures(email);
CREATE INDEX IF NOT EXISTS idx_lead_captures_source_ip ON public.lead_captures(source, ip_address);
```

## Verify the Fix

After running the migration, test lead capture:

1. Go to your website
2. Use the "Get Questions" form
3. Enter an email and keyword
4. Submit the form
5. Check the `/admin/leads` page - you should now see the lead!

## What This Fixed

✅ **Lead submissions now save** to the database  
✅ **Spam protection works** (IP tracking)  
✅ **Rate limiting works** (prevents abuse)  
✅ **Email duplicate checking works** (one email per submission)  
✅ **Performance improved** with indexes  

## Check Your Leads

After the migration, view your leads at:
```
https://www.sewo.io/admin/leads
```

Or locally:
```
http://localhost:3000/admin/leads
```

## Database Schema (Updated)

The `lead_captures` table now has:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Lead name |
| `email` | TEXT | Email address (indexed) |
| `company` | TEXT | Company name |
| `website` | TEXT | Website URL |
| `message` | TEXT | Message/notes |
| `plan_type` | TEXT | Plan type |
| `source` | TEXT | Form source |
| `ip_address` | TEXT | IP address (indexed) ← **NEW** |
| `created_at` | TIMESTAMPTZ | Timestamp |

## Troubleshooting

If leads still don't appear:

1. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'lead_captures';
   ```

2. **Test API directly:**
   ```bash
   curl -X POST http://localhost:3000/api/lead-capture \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","source":"test"}'
   ```

3. **Check browser console** for errors when submitting the form

4. **Check server logs** for detailed error messages

## Prevention

The migration file has been committed to the repository:
```
supabase/migrations/20251201_add_ip_address_to_lead_captures.sql
```

Future deployments will automatically include this column.

---

**Created**: December 1, 2025  
**Status**: Ready to apply

