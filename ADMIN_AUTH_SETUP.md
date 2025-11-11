# Admin Authentication Setup Guide

## Overview
Your admin panel now has secure authentication with username/password login and persistent 30-day sessions.

## Database Migration

You need to run the SQL migration to create the authentication tables in your Supabase database.

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250113_add_admin_auth.sql`
4. Paste into the SQL Editor
5. Click **Run**

### Option 2: Using psql

```bash
psql "postgresql://[your-connection-string]" < supabase/migrations/20250113_add_admin_auth.sql
```

## Default Login Credentials

Once the migration is complete, you can log in with:

- **URL**: `https://sewo.io/admin/login`
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change this password immediately after your first login!

## What's Protected

All admin pages now require authentication:
- `/admin` - Blog admin dashboard
- `/admin/homepage` - Homepage editor
- `/admin/new` - New blog post
- `/admin/edit/[id]` - Edit blog post

## Features

### ✅ Secure Password Storage
- Passwords are hashed using bcrypt (10 rounds)
- Never stored in plain text

### ✅ Persistent Sessions
- 30-day session duration
- HTTP-only cookies (secure)
- Auto-renewal on activity

### ✅ Automatic Protection
- Unauthenticated users are redirected to `/admin/login`
- Sessions are verified on every admin page load
- Expired sessions are automatically cleaned up

### ✅ Logout Functionality
- Logout button available on all admin pages
- Completely destroys the session (both cookie and database)

## Changing Your Password

Currently, password changes must be done via SQL:

```sql
-- Generate a new hash first using bcrypt
-- Then update the password:
UPDATE public.admin_users 
SET password_hash = '$2a$10$[YOUR_NEW_HASH]'
WHERE username = 'admin';
```

You can generate a new hash by running:
```bash
node scripts/generate-admin-hash.js
```

Edit the script to use your desired password, then copy the generated hash.

## Adding More Admin Users

```sql
INSERT INTO public.admin_users (username, password_hash)
VALUES ('newadmin', '$2a$10$[BCRYPT_HASH_HERE]');
```

Use the `scripts/generate-admin-hash.js` script to generate password hashes.

## Security Notes

1. **RLS Policies**: Admin tables have Row Level Security enabled with policies that prevent direct client access
2. **HTTP-Only Cookies**: Session cookies cannot be accessed via JavaScript
3. **Secure Flag**: In production, cookies are only sent over HTTPS
4. **Session Expiration**: Sessions automatically expire after 30 days
5. **Session Cleanup**: Expired sessions are automatically removed from the database

## Troubleshooting

### "Not authenticated" error
- Clear your cookies and try logging in again
- Check that the migration was run successfully
- Verify your Supabase environment variables are set

### Can't log in
- Verify the admin user exists: `SELECT * FROM admin_users;`
- Check password hash is correct
- Look for errors in browser console

### Session expires too quickly
- Adjust `SESSION_DURATION` in `lib/auth.ts` (currently 30 days)

## Development vs Production

The authentication system works identically in development and production. The only difference is the cookie `secure` flag, which is automatically set based on `NODE_ENV`.

## Files Created

- `lib/auth.ts` - Authentication utilities
- `app/admin/login/page.tsx` - Login page
- `app/admin/layout.tsx` - Admin layout with auth check
- `app/api/admin/login/route.ts` - Login API
- `app/api/admin/logout/route.ts` - Logout API
- `app/api/admin/verify/route.ts` - Session verification API
- `components/AdminAuthCheck.tsx` - Client-side auth checker
- `components/AdminProtected.tsx` - Server-side auth wrapper
- `supabase/migrations/20250113_add_admin_auth.sql` - Database schema

## Next Steps

1. ✅ Run the migration in Supabase SQL Editor
2. ✅ Test login at `/admin/login`
3. ✅ Change the default password
4. ✅ Verify all admin pages are protected
5. ✅ Test logout functionality

Your admin panel is now secure! 🔐

