# LLM Text Enhancement Feature

AI-powered text enhancement is now integrated into the homepage editor, allowing you to improve any text field with the click of a button.

## 🤖 **Supported AI Providers**

Choose from 3 leading LLM providers:

### **1. ChatGPT (OpenAI)**
- **GPT-4o** - Best quality, most creative
- **GPT-4o Mini** - Fast and cost-effective (recommended)
- **GPT-4 Turbo** - Balanced performance

### **2. Claude (Anthropic)**
- **Claude 3.5 Sonnet** - Best overall, excellent at copywriting (recommended)
- **Claude 3.5 Haiku** - Fastest, budget-friendly
- **Claude 3 Opus** - Most powerful

### **3. Gemini (Google)**
- **Gemini 1.5 Pro** - Best quality
- **Gemini 1.5 Flash** - Fast and efficient (recommended)
- **Gemini 2.0 Flash** - Experimental, latest features

---

## 📋 **Setup**

### **Step 1: Get API Keys**

You need at least ONE of these API keys (or all three for flexibility):

#### **OpenAI (ChatGPT)**
1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Sign up / Log in
3. Click "Create new secret key"
4. Copy the key

#### **Anthropic (Claude)**
1. Go to [console.anthropic.com](https://console.anthropic.com/settings/keys)
2. Sign up / Log in
3. Click "Create Key"
4. Copy the key

#### **Google (Gemini)**
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign up / Log in
3. Click "Create API Key"
4. Copy the key

### **Step 2: Add to Environment Variables**

Add to your `.env.local` file:

```bash
# OpenAI (ChatGPT)
OPENAI_API_KEY=sk-...your_openai_key_here

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...your_anthropic_key_here

# Google (Gemini)
GOOGLE_AI_API_KEY=...your_google_ai_key_here

# Optional: Choose your preferred default provider
# (The UI will default to OpenAI if not specified)
```

### **Step 3: Add to Vercel (Production)**

1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add each API key you want to use:
   - **Key**: `OPENAI_API_KEY` (and/or `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`)
   - **Value**: Your API key
   - **Environments**: Production, Preview, Development
3. Click **Save**
4. **Redeploy** your project

### **Step 4: Restart Dev Server**

```bash
npm run dev
```

---

## 🎯 **How to Use**

### **In Homepage Editor** (`/admin/homepage`)

Every text field now has an **✨ Enhance** button:

1. **Type or paste your text** into any field
2. **Click the ⚙️ settings icon** (optional):
   - Select AI Provider (ChatGPT, Claude, or Gemini)
   - Choose Model (e.g., GPT-4o Mini, Claude 3.5 Sonnet)
   - Add custom instructions (e.g., "Make it more professional" or "Focus on benefits")
3. **Click ✨ Enhance**
4. Wait 2-5 seconds
5. **Enhanced text appears automatically!**

### **Quick Example**

**Original text:**
```
We help businesses rank better
```

**After AI Enhancement (Hero Title):**
```
Make Your Brand the Answer AI Suggests
```

---

## 📝 **Field Types & Optimization**

Each field type has specialized prompts for best results:

| Field Type | Optimization Focus | Max Length |
|------------|-------------------|------------|
| Hero Title | Compelling, benefit-driven, action-oriented | ~10 words |
| Hero Description | Clear, concise, persuasive value prop | ~25 words |
| About Title | Engaging and professional | 1-3 words |
| About Description | Professional, credible, compelling | ~50 words |
| Service Title | Clear and benefit-focused | ~8 words |
| Service Description | Clear and persuasive benefits | ~30 words |
| CTA Text | Action-oriented and compelling | 2-4 words |
| Program Title | Compelling and clear | ~10 words |
| Program Description | Persuasive and benefit-focused | ~35 words |
| Outcome Title | Clear and impactful | ~8 words |
| Outcome Description | Concise and compelling | ~25 words |
| Pricing Description | Clear and value-focused | ~20 words |

---

## 💡 **Best Practices**

### ✅ **DO:**
- Start with a rough draft, let AI refine it
- Use custom instructions for specific tone/audience
- Compare outputs from different providers
- Keep originals (you can always re-enhance)
- Enhance titles and descriptions separately for best results

### ❌ **DON'T:**
- Expect perfect results on first try (iterate if needed)
- Use AI for technical terms without review
- Blindly accept all suggestions (you're the expert on your brand)
- Over-enhance (sometimes simpler is better)

---

## 🔄 **Workflow Example**

### **Enhancing a Hero Section:**

1. **Original Draft:**
   ```
   Title: We rank websites in AI
   Description: Our tool helps you get found by LLMs
   ```

2. **Enhance Title:**
   - Provider: Claude 3.5 Sonnet
   - Custom: "Make it benefit-focused"
   - Result: **"Make Your Brand the Answer AI Suggests"**

3. **Enhance Description:**
   - Provider: Claude 3.5 Sonnet
   - Custom: "Professional but accessible tone"
   - Result: **"When customers ask AI assistants about your industry, your brand becomes the recommended solution."**

4. **Review & Adjust:**
   - Tweak if needed
   - Save when satisfied

---

## 💰 **Cost Estimates**

Text enhancement is very affordable:

| Provider | Model | Cost per 1000 chars | ~Cost per field |
|----------|-------|---------------------|-----------------|
| OpenAI | GPT-4o Mini | ~$0.0002 | ~$0.0001 |
| OpenAI | GPT-4o | ~$0.005 | ~$0.0025 |
| Anthropic | Claude 3.5 Haiku | ~$0.0001 | ~$0.00005 |
| Anthropic | Claude 3.5 Sonnet | ~$0.003 | ~$0.0015 |
| Google | Gemini 1.5 Flash | ~$0.0001 | ~$0.00005 |

**Example:** Enhancing 20 fields = **$0.01 - $0.05** total

---

## 🎨 **Custom Instructions Examples**

Add these in the settings panel for tailored results:

### **For Hero Sections:**
- "Make it punchy and direct"
- "Focus on the transformation, not the process"
- "Appeal to enterprise buyers"
- "Keep it under 8 words"

### **For Descriptions:**
- "Write for B2B SaaS audience"
- "Emphasize ROI and business impact"
- "Use simple, jargon-free language"
- "Make it sound more premium"

### **For CTAs:**
- "Make it more action-oriented"
- "Less salesy, more helpful"
- "Create urgency without being pushy"

---

## 🚫 **Troubleshooting**

### **Error: "API key not configured"**

**Solution:** Add the API key to environment variables and restart server.

### **Error: "Failed to enhance text"**

**Possible causes:**
1. Invalid API key
2. Rate limit exceeded
3. API service down
4. Empty text field

**Solution:** Check API key, wait a few minutes, or try different provider.

### **Enhancement takes too long**

**Solution:** 
- Switch to faster model (e.g., GPT-4o Mini, Claude Haiku, Gemini Flash)
- Check internet connection
- Try different provider

### **Results not good enough**

**Solution:**
1. Add custom instructions
2. Try different provider/model
3. Give more context in original text
4. Enhance multiple times and pick best result

---

## 🔐 **Security & Privacy**

- API keys are stored as environment variables (never in code)
- Text is sent to chosen AI provider for processing
- No data is stored by the providers (per their policies)
- Use only for non-sensitive content
- Review all AI-generated text before publishing

---

## 📊 **Comparison: Which Provider to Choose?**

| Use Case | Recommended Provider | Why |
|----------|---------------------|-----|
| Best Overall | Claude 3.5 Sonnet | Excellent at copywriting, natural tone |
| Fastest | Gemini 1.5 Flash | Very fast, good quality |
| Most Creative | GPT-4o | Great for unique angles |
| Budget-Friendly | Claude 3.5 Haiku | Cheap + good quality |
| Enterprise Content | Claude 3.5 Sonnet | Professional, sophisticated |
| Technical Content | GPT-4o | Handles jargon well |

---

## 🎯 **Tips for Best Results**

1. **Write a draft first** - AI enhances better than creates from scratch
2. **Be specific in custom instructions** - "Professional tone for B2B SaaS" > "Make it better"
3. **Try multiple providers** - Different AIs have different strengths
4. **Iterate** - Enhance, review, tweak, enhance again
5. **Keep it simple** - Don't over-complicate with instructions
6. **Review everything** - AI is a tool, you're the editor

---

## 🚀 **Advanced Usage**

### **Batch Enhancement**

1. Copy all your rough text into fields
2. Go through each field clicking "Enhance"
3. Review all at once
4. Make final adjustments
5. Save

### **A/B Testing Copy**

1. Enhance same text with different providers
2. Compare results
3. Pick the best or combine elements
4. Test with your audience

### **Brand Voice Consistency**

Add custom instructions across all fields:
```
Custom: "Professional but friendly, emphasize outcomes, avoid jargon"
```

This ensures consistent tone throughout your site.

---

## ✅ **All Features**

- ✅ 3 AI providers (OpenAI, Anthropic, Google)
- ✅ 9+ models to choose from
- ✅ Custom instructions per field
- ✅ Specialized prompts for each field type
- ✅ Settings panel (collapsible)
- ✅ Real-time enhancement (2-5 seconds)
- ✅ Works on all text fields in homepage editor
- ✅ Beautiful gradient button styling
- ✅ Loading states and error handling

**Start enhancing your copy with AI! 🎨✨**

