# Flash Automation System - Setup Guide

## 🎉 What We Built

A fully automated AI content enhancement system where:
1. User selects Flash Template in Topics page
2. External system generates content
3. Our system automatically enhances it with Flash features
4. User sees completed post ready to publish

---

## 📋 Setup Steps

### 1. Database Migration

Run this SQL in your Supabase SQL Editor:

```bash
# File location:
/supabase/migrations/030_flash_automation_system.sql
```

This creates:
- `content_structures` table (AI analysis cache)
- `flash_analytics` table (metrics tracking)
- `track_flash_usage()` function
- 5 default Flash workflow templates

### 2. Airtable Configuration

Add a new field to your "Keyword Map" table (tblDR9SmoK8wEYmnA):

**Field Name**: `Flash Template`  
**Type**: Single Select  
**Options**:
- None (default)
- Product Review
- How-To Guide
- Listicle
- Educational
- News & Blog

### 3. Environment Variables

Verify these exist in Vercel:

```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=eyJ...
```

### 4. Deploy to Vercel

```bash
git push origin main
# Vercel will auto-deploy
```

---

## 🚀 How It Works

### User Flow

```
TOPICS PAGE
  ↓ User selects:
  • Target Market: "Small business owners"
  • Promoted Product: "Wireless headphones XYZ"
  • Flash Template: "Product Review" ← NEW!
  • Keyword: "best wireless headphones"
  ↓
Click "Get Questions" (triggers external content gen)
  ↓
External system writes content to Airtable "Body Content" field
  ↓
OUR SYSTEM (useFlashAutoTrigger hook):
  • Detects content arrival (polls every 10 sec)
  • Creates blog_post in Supabase
  • Checks if Flash Template selected
  • If yes → Triggers /api/flash/auto-trigger
  ↓
FLASH AUTOMATION:
  1. Analyzes content structure (GPT-4o-mini)
  2. Identifies insertion points for Flash features
  3. Executes workflow steps (SEO, FAQ, TLDR, etc.)
  4. Updates post with enhanced content
  5. Sets flash_status = "completed"
  ↓
CONTENT FEED
  • User sees post with green checkmark ✅
  • Opens in Editor
  • Adds voice notes (double-click feature)
  • Publishes!
```

### System Components

#### 1. Topics Page (`src/pages/Topics.jsx`)
- Added Flash Template dropdown column
- Integrated `useFlashAutoTrigger` hook
- Monitors Airtable for content arrival

#### 2. useFlashAutoTrigger Hook (`src/components/hooks/useFlashAutoTrigger.jsx`)
- Polls Airtable records every 10 seconds
- Detects when "Body Content" is populated
- Creates blog_post if Flash Template selected
- Calls `/api/flash/auto-trigger` endpoint

#### 3. Flash Auto-Trigger API (`api/flash/auto-trigger.js`)
- Orchestrates Flash automation
- Analyzes content structure with AI
- Executes workflow steps
- Tracks analytics
- Updates post status

#### 4. AI Services
- **`/api/ai/analyze-content-structure.js`**: Identifies insertion points
- **`/api/ai/insert-flash-feature.js`**: Intelligently inserts features
- Uses GPT-4o-mini for cost-efficiency

#### 5. Database
- **`content_structures`**: Caches AI analysis
- **`flash_analytics`**: Tracks metrics
- **`editor_workflows`**: 5 pre-built templates

---

## 🎯 Pre-Built Flash Templates

### 1. Product Review
- HTML Cleanup
- Key Takeaway (TLDR)
- FAQ Generation
- SEO Optimization
- **Token Cost**: 150

### 2. How-To Guide
- HTML Cleanup
- Key Takeaway
- FAQ Generation
- SEO Optimization
- **Token Cost**: 140

### 3. Listicle
- HTML Cleanup
- Key Takeaway
- SEO Optimization
- **Token Cost**: 120

### 4. Educational
- HTML Cleanup
- FAQ Generation
- Links & References
- SEO Optimization
- **Token Cost**: 160

### 5. News & Blog
- HTML Cleanup
- Key Takeaway
- SEO Optimization
- **Token Cost**: 100

---

## 📊 Monitoring

### Flash Analytics Dashboard
Access via Supabase:

```sql
-- View Flash success rates
SELECT 
  feature_type,
  COUNT(*) as total_executions,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
  ROUND(AVG(execution_time_ms), 2) as avg_time_ms,
  SUM(tokens_used) as total_tokens
FROM flash_analytics
WHERE created_date > NOW() - INTERVAL '7 days'
GROUP BY feature_type
ORDER BY total_executions DESC;
```

### Check Flash Status

```sql
-- View posts with Flash automation
SELECT 
  title,
  user_name,
  flash_status,
  flashed_at,
  created_date
FROM blog_posts
WHERE flash_status IS NOT NULL
ORDER BY created_date DESC
LIMIT 20;
```

---

## 🛠️ Admin Tools

### Flash Workflow Builder
**Path**: `/EditorWorkflowManager`  
**Access**: Superadmin only  
**Features**:
- Create custom Flash workflows
- Configure step order
- Set token costs
- Mark as default template

### LLM Configuration
**Path**: `/AdminLLMSettings`  
**Access**: Superadmin only  
**Features**:
- Configure AI models
- Adjust temperature
- Customize prompts
- Track usage

---

## 🐛 Troubleshooting

### Content not auto-flashing?

1. Check Airtable field name: Must be exactly "Flash Template"
2. Verify "Body Content" is populated
3. Check browser console for errors
4. Verify user is authenticated

### Flash workflow failing?

1. Check Supabase logs for errors
2. Verify OpenAI API key is valid
3. Check token balance
4. Review `flash_analytics` table for error messages

### Templates not appearing?

1. Run migration: `030_flash_automation_system.sql`
2. Check `editor_workflows` table
3. Verify `is_active = true` and `is_default = true`

---

## 🎓 Next Steps

### Phase 4: Advanced Features (Optional)

1. **Flash Preview Modal**: Show before/after comparison
2. **Progress Indicators**: Real-time Flash execution progress
3. **A/B Testing**: Test different Flash configurations
4. **Custom Templates**: User-defined Flash workflows
5. **Batch Processing**: Flash multiple posts at once
6. **Smart Recommendations**: AI suggests optimal templates

### Phase 5: Optimization

1. **Caching**: Reuse content structures
2. **Parallel Execution**: Run steps concurrently
3. **Token Optimization**: Use cheaper models where possible
4. **Rate Limiting**: Respect API limits
5. **Error Recovery**: Auto-retry failed steps

---

## 📞 Support

### Documentation
- OpenAI API: https://platform.openai.com/docs
- Supabase: https://supabase.com/docs
- Airtable: https://airtable.com/developers

### Logs
- **Vercel**: Check Function logs in dashboard
- **Supabase**: SQL logs in dashboard
- **Browser**: Console logs for client-side issues

---

## ✅ Verification Checklist

- [ ] Migration 030 applied to Supabase
- [ ] Airtable "Flash Template" field created
- [ ] Environment variables set in Vercel
- [ ] Code deployed to production
- [ ] 5 default workflows visible in EditorWorkflowManager
- [ ] Flash Template dropdown visible in Topics page
- [ ] Test content auto-triggers Flash workflow
- [ ] Analytics tracking in `flash_analytics` table
- [ ] No console errors in browser

---

🎉 **Congratulations!** Your Flash Automation system is ready to transform content creation!

