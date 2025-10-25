# OpenAI API Key Setup Guide

## ⚙️ **Add OpenAI API Key to Vercel**

The title rewrite feature (and future AI features) requires an OpenAI API key. This key is stored securely in Vercel environment variables and **never** exposed to the frontend.

### **Step 1: Get Your OpenAI API Key**

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Name it: `DoubleClick Platform`
4. Copy the key (starts with `sk-...`)
5. **Save it securely** (you can't see it again!)

---

### **Step 2: Add to Vercel**

1. Go to your Vercel project: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project (`doubleclick-platform`)
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Key:** `OPENAI_API_KEY`
   - **Value:** `sk-your-actual-key-here`
   - **Environments:** Check all (Production, Preview, Development)
5. Click **Save**

---

### **Step 3: Redeploy**

After adding the environment variable:

```bash
# Option 1: Trigger redeploy via Git
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin main

# Option 2: Redeploy via Vercel UI
# Go to Deployments → Click "..." → Redeploy
```

---

### **Step 4: Run SQL Migration**

Run the Supabase migration to create the `llm_settings` table:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/029_create_llm_settings.sql
```

Or copy the contents of that file and paste it into the Supabase SQL Editor.

---

## ✅ **Verify It's Working**

1. Log in to your platform
2. Go to **Admin** → **LLM Configuration**
3. You should see the "Title Rewrite (SEO Optimization)" setting
4. Open the Editor and click the **title rewrite** button
5. Check the browser console for: `✅ Title rewritten using gpt-4o-mini (X tokens)`

---

## 🎯 **What You Can Configure**

As an admin/superadmin, you can now control:

- ✅ **Model** (gpt-4o-mini, gpt-4o, etc.)
- ✅ **Temperature** (0 = precise, 2 = creative)
- ✅ **Max Tokens** (response length)
- ✅ **System Prompt** (AI instructions)
- ✅ **User Prompt Template** (with {{variables}})
- ✅ **Advanced Parameters** (top_p, frequency_penalty, presence_penalty)
- ✅ **Enable/Disable** features

Changes take effect immediately—no code deployment needed!

---

## 💰 **Cost Estimates**

### **Title Rewrite (gpt-4o-mini)**
- **Cost per title:** ~$0.000036 (1/30th of a cent)
- **1000 titles:** $0.036
- **Monthly budget ($10):** ~277,000 titles

### **Upgrade to GPT-4o (if needed)**
- **Cost per title:** ~$0.0015
- **1000 titles:** $1.50
- **Monthly budget ($10):** ~6,600 titles

---

## 🔒 **Security**

- ✅ API key is **server-side only**
- ✅ Never exposed to frontend/browser
- ✅ Vercel encrypts environment variables
- ✅ Users are authenticated via Supabase JWT

---

## 📊 **Usage Tracking**

The platform automatically tracks:
- Number of times each feature is used
- Last used date
- Model and token usage (logged to console)

View stats in **Admin** → **LLM Configuration**.

---

## 🚀 **Next Steps**

Once title rewrite is working, you can add more AI features:

1. **Content Generation** - Full article writing
2. **Keyword Extraction** - SEO keyword suggestions
3. **Meta Description** - Auto-generate descriptions
4. **Content Improvement** - Enhance existing content
5. **Translation** - Multi-language support

All features use the same admin-controlled system! 🎯

