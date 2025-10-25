# 🚀 How to Run the Clean Schema Rebuild

## ⚠️ IMPORTANT: Read This First

This script will **completely rebuild** your database schema. It will:
- ✅ **PRESERVE:** Your user account, email, role, assigned usernames, token balance
- ❌ **DELETE:** All blog posts, webhooks, and other content
- ✅ **CREATE:** A clean, optimized schema with no Base44 legacy issues

**Estimated Time:** 2-3 minutes

---

## 📋 Pre-Flight Checklist

### 1. Backup Your Critical Info

Write down these details (you'll need them):

```
✅ Your email: _______________________
✅ Your role: admin / superadmin
✅ Your assigned usernames: _______________________
```

### 2. Are You Ready to Lose Content?

- ❌ **NO** → Stop! Export any blog posts you want to keep
- ✅ **YES** → Proceed to the next step

### 3. Confirm Supabase Access

Make sure you can access:
- Supabase Dashboard: https://supabase.com/dashboard
- Your DoubleClick project
- SQL Editor

---

## 🔧 Step-by-Step Instructions

### **Step 1: Open Supabase SQL Editor**

1. Go to https://supabase.com/dashboard
2. Select your DoubleClick project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### **Step 2: Copy the SQL Script**

1. Open `/Users/stuarta/Documents/GitHub/doubleclicker-1-new/CLEAN_SCHEMA_REBUILD.sql`
2. Select ALL the content (Cmd+A)
3. Copy it (Cmd+C)

### **Step 3: Paste and Run**

1. Paste the SQL into the Supabase SQL Editor (Cmd+V)
2. Click **RUN** (or press Cmd+Enter)
3. **WAIT** - This will take 2-3 minutes

### **Step 4: Watch the Output**

You should see progress messages like:

```
🔄 STEP 1: BACKING UP USER DATA
✅ Backed up 1 admin user(s)

🗑️  STEP 2: DROPPING LEGACY TABLES
✅ All legacy tables and functions dropped

🏗️  STEP 3: CREATING CLEAN SCHEMA
✅ Created enums: content_status, flash_status, user_role
✅ Created table: user_profiles
✅ Created table: usernames
✅ Created table: blog_posts
...

🎉 CLEAN SCHEMA REBUILD COMPLETE!
```

### **Step 5: Verify Success**

Check the final output shows row counts:

```
user_profiles: 1
usernames: 3
feature_flags: 21
llm_settings: 1
blog_posts: 0
integration_credentials: 0
```

---

## ✅ Post-Rebuild Verification

### **Test 1: Log In**

1. Go to your DoubleClick app
2. Log out if you're logged in
3. Log back in with your email
4. **Expected:** You should log in successfully

### **Test 2: Check User Management**

1. Navigate to **Admin → Users**
2. **Expected:** You should see yourself listed
3. **Expected:** You should see your assigned usernames

### **Test 3: Create a Test Post**

1. Navigate to **Content**
2. Click **Create New Post**
3. Add a title and some content
4. **Expected:** Post saves successfully (autosave)

### **Test 4: AI Title Rewrite**

1. In the Editor, click the **magic wand icon** (🪄) next to the title
2. **Expected:** Title gets rewritten
3. **Expected:** Toast notification shows success

### **Test 5: Content Feed**

1. Navigate to **Content**
2. Select your username from the dropdown
3. **Expected:** You see your test post

---

## 🎯 What Changed?

### **Before (Old Schema):**
- ❌ Missing columns (featured_image, etc.)
- ❌ Type mismatches (text[] vs jsonb)
- ❌ RLS recursion errors
- ❌ Confusing naming (assigned_usernames as jsonb)
- ❌ Inherited Base44 constraints

### **After (Clean Schema):**
- ✅ All required columns present
- ✅ Correct data types everywhere
- ✅ Simple, working RLS policies
- ✅ Consistent naming (TEXT[] for arrays)
- ✅ Purpose-built for DoubleClick

---

## 🏗️ New Schema Highlights

### **Core Tables:**
1. **user_profiles** - User accounts and permissions
2. **usernames** - Workspaces/brands
3. **blog_posts** - All content
4. **webhook_received** - External imports
5. **feature_flags** - Feature toggles
6. **llm_settings** - AI configuration (YOUR NEW SYSTEM!)
7. **integration_credentials** - Publishing platforms

### **Key Features:**
- ✅ Simple workspace system (`user_name` field)
- ✅ Array-based permissions (`assigned_usernames`)
- ✅ Admin-controlled AI settings
- ✅ No more schema errors!

---

## 🐛 Troubleshooting

### **Issue: Script fails with "permission denied"**

**Solution:**
1. Make sure you're logged in as the project owner
2. Try running the script in parts (run each section separately)

### **Issue: "infinite recursion" error**

**Solution:**
This shouldn't happen with the new schema! If it does:
1. Check that all old RLS policies were dropped
2. Re-run the script

### **Issue: Can't see my usernames**

**Solution:**
1. Check your `assigned_usernames` array in the `user_profiles` table
2. Run this SQL to verify:

```sql
SELECT id, email, assigned_usernames
FROM public.user_profiles
WHERE email = 'your@email.com';
```

### **Issue: Test posts not showing**

**Solution:**
1. Make sure the post's `user_name` matches one in your `assigned_usernames`
2. Run this SQL to fix:

```sql
UPDATE public.blog_posts
SET user_name = 'your_username'
WHERE user_name IS NULL OR user_name = '';
```

---

## 📊 Database Schema Reference

### **user_profiles**
```sql
id UUID (references auth.users)
email TEXT UNIQUE
full_name TEXT
role user_role ('user', 'admin', 'superadmin')
is_superadmin BOOLEAN
assigned_usernames TEXT[] -- Array of workspace names
completed_tutorial_ids TEXT[] -- Array of tutorial IDs
token_balance INTEGER
plan_price_id TEXT
created_date TIMESTAMPTZ
updated_date TIMESTAMPTZ
```

### **usernames (Workspaces)**
```sql
id UUID
user_name TEXT UNIQUE -- The workspace identifier
display_name TEXT
assigned_to UUID (references user_profiles)
is_active BOOLEAN
created_date TIMESTAMPTZ
updated_date TIMESTAMPTZ
```

### **blog_posts**
```sql
id UUID
title TEXT
content TEXT
user_name TEXT -- Which workspace this belongs to
user_id UUID
assigned_to_email TEXT
status content_status ('draft', 'published', 'archived', 'scheduled')
flash_status flash_status ('idle', 'running', 'completed', 'failed')
meta_title TEXT
meta_description TEXT
slug TEXT
tags TEXT[]
focus_keyword TEXT
featured_image TEXT
reading_time INTEGER
priority TEXT
client_session_key TEXT
generated_llm_schema JSONB
processing_id TEXT
created_date TIMESTAMPTZ
updated_date TIMESTAMPTZ
published_date TIMESTAMPTZ
```

### **llm_settings**
```sql
id UUID
feature_name TEXT UNIQUE
display_name TEXT
description TEXT
model TEXT (default 'gpt-4o-mini')
temperature NUMERIC(3,2)
max_tokens INTEGER
top_p NUMERIC(3,2)
frequency_penalty NUMERIC(3,2)
presence_penalty NUMERIC(3,2)
system_prompt TEXT
user_prompt_template TEXT
is_enabled BOOLEAN
usage_count INTEGER
last_used_date TIMESTAMPTZ
created_date TIMESTAMPTZ
updated_date TIMESTAMPTZ
```

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ You can log in without errors
✅ User Management page shows users
✅ You can create usernames
✅ You can create blog posts
✅ Autosave works (no 400 errors)
✅ AI title rewrite works
✅ Content feed displays posts
✅ No schema cache errors in console

---

## 🚀 What's Next?

Once the rebuild is complete and tested:

1. **Test All Features** - Systematically go through each feature
2. **Fix Any Bugs** - Address issues as you find them
3. **Enhance UX** - Improve user experience
4. **Polish UI** - Make it beautiful

You now have a **rock-solid foundation** to build on! 🎉

---

## 📞 Need Help?

If something goes wrong:
1. Check the Supabase logs
2. Copy the error message
3. Review the "Troubleshooting" section above
4. Don't panic - the old data was already causing issues!

Remember: **This clean slate fixes the root cause** of all the schema errors you've been fighting. It's worth it! 💪

