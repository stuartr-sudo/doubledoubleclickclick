# Flash Workflows - Complete Implementation Explanation

## ✅ YES, I Understand It Completely

Let me explain exactly how Flash workflows are implemented in your DoubleClick platform:

---

## 🎯 What Are Flash Workflows?

**Flash workflows are automated, multi-step AI enhancement sequences** that transform written content by applying a series of AI features in a specific order. Think of it like a production line for content enhancement.

---

## 📍 Where Flash Workflows Exist:

### 1. **Topics Page** (Pre-Writing Selection)
**Location**: `/src/pages/Topics.jsx` + `/src/components/topics/GroupedFaqTable.jsx`

**Purpose**: Select Flash template BEFORE content is written externally

**How It Works**:
- User goes to Topics page
- Sees list of keywords/questions from Airtable
- For each question, there's a **"Flash Template" dropdown** with options:
  - None
  - Product Review
  - How-To Guide
  - Listicle
  - Educational
  - News & Blog

**What Happens**:
```javascript
1. User selects "Product Review" for a keyword
2. Flash Template is saved to Airtable record field: "Flash Template"
3. Content gets written externally (by your writers)
4. When "Body Content" field is populated in Airtable...
5. useFlashAutoTrigger() detects the change
6. Automatically triggers Flash workflow for that content
```

### 2. **Content Feed Page** (Post-Writing Execution)
**Location**: `/src/pages/Content.jsx` + `/src/components/content/FlashButton.jsx`

**Purpose**: Apply Flash template to EXISTING content (self-written or imported)

**How It Works**:
- User sees list of blog posts/articles
- Each item has a **Flash button** (⚡ icon) with 4 states:
  - **Pink/Rose**: Ready to flash (click to select template)
  - **Blue + Spinning**: Currently flashing (in progress)
  - **Green + Checkmark**: Already flashed (completed)
  - **Orange/Amber**: Flash failed (can retry)

**What Happens**:
```javascript
1. User clicks Flash button on an article
2. Modal opens showing Flash template dropdown
3. User selects template (e.g., "How-To Guide")
4. Template is saved to blog_posts.flash_template
5. Flash automation is triggered
6. Article gets enhanced with AI features
```

**Validations**:
- ✅ Content must have at least **400 words**
- ✅ Content cannot be empty
- ✅ Cannot re-flash already completed items
- ✅ Shows tooltip with completion timestamp

---

## 🔧 How Flash Automation Actually Works:

### Component Architecture:

```
Topics Page Flow:
┌─────────────────┐
│   Topics.jsx    │ User selects Flash Template for keyword
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Airtable      │ Flash Template saved to record
└────────┬────────┘
         │
         ▼ (External writer adds content)
┌─────────────────┐
│ "Body Content"  │ Content field populated
│   populated     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ useFlashAutoTrigger()   │ Polls every 10 seconds
│ Detects content change  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Creates blog_post       │ content + flash_template
│ flash_status: "pending" │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ POST /api/flash/        │ Triggers workflow
│      auto-trigger       │
└─────────────────────────┘


Content Page Flow:
┌─────────────────┐
│  Content.jsx    │ User clicks Flash button
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FlashButton    │ Shows validation checks
└────────┬────────┘
         │
         ▼
┌───────────────────────┐
│ FlashTemplateModal    │ User selects template
└────────┬──────────────┘
         │
         ▼
┌───────────────────────┐
│ Saves flash_template  │ to blog_posts table
│ to database           │
└────────┬──────────────┘
         │
         ▼
┌───────────────────────┐
│ Flash automation      │ Workflow executes
│ triggered             │
└───────────────────────┘
```

---

## 🎬 What Happens During Flash Execution:

### Step 1: Workflow Definition
Flash workflows are stored in `editor_workflows` table with:
- `workflow_name`: e.g., "Product Review Flash"
- `workflow_steps`: JSON array of AI features to apply
- `is_default`: true (available to all users)
- `created_by_role`: 'admin' (admin-only creation)

### Step 2: RunWorkflowModal Component
**File**: `/src/components/editor/RunWorkflowModal.jsx`

This is the **engine** that executes Flash workflows:

```javascript
const STEP_LABELS = {
  tldr: "Key Takeaway",
  faq: "FAQs",
  brand_it: "Brand It",
  html_cleanup: "Clean HTML",
  autolink: "AutoLink",
  autoscan: "AutoScan",
  seo: "SEO",
  schema: "Schema",
  links_references: "Links + References",
  humanize: "Humanize"
};
```

**What It Does**:
1. Fetches content HTML
2. Loads selected Flash workflow
3. **Consumes balance** based on workflow cost
4. Executes each step sequentially:
   - Sends content to AI service
   - Gets enhanced content back
   - Applies to article
   - Moves to next step
5. Shows progress with animated UI
6. Updates `flash_status` to "completed"
7. Sets `flashed_at` timestamp

---

## 🗄️ Database Schema:

### Tables Used:

**`blog_posts` / `webhook_received`**:
```sql
flash_template TEXT,          -- Selected template name
flash_status TEXT,             -- idle, pending, running, completed, failed
flashed_at TIMESTAMP,          -- When Flash completed
processing_id TEXT             -- Links to Airtable record
```

**`editor_workflows`**:
```sql
id UUID,
workflow_name TEXT,
workflow_description TEXT,
workflow_steps JSONB,          -- Array of step objects
is_default BOOLEAN,            -- true = available to all
created_by_role TEXT,          -- 'admin' for Flash templates
token_cost INTEGER             -- Total cost to run workflow
```

**`workflow_run_status`**:
```sql
id UUID,
workflow_id UUID,
post_id UUID,
status TEXT,                   -- running, completed, failed
current_step INTEGER,
result_html TEXT,
error_message TEXT
```

---

## 🎨 Flash Templates Available:

1. **None** - No Flash automation
2. **Product Review** - Optimized for product reviews
3. **How-To Guide** - Step-by-step instructional content
4. **Listicle** - List-based articles
5. **Educational** - Teaching/learning content
6. **News & Blog** - News articles and blog posts

Each template maps to a specific workflow in `editor_workflows` with pre-configured AI steps.

---

## 🔄 Auto-Trigger System:

**Component**: `useFlashAutoTrigger` hook

**How It Works**:
```javascript
1. Every 10 seconds, polls Airtable records
2. Checks each record for:
   - Has "Body Content" field populated? ✅
   - Has "Flash Template" selected? ✅
   - Already processed? ❌
3. If all checks pass:
   - Creates blog_post in Supabase
   - Calls /api/flash/auto-trigger
   - Marks record as processed
4. Flash workflow executes automatically
5. User sees completed content in Content feed
```

**Why This Matters**:
- Writers work in Airtable (their familiar tool)
- When they finish writing, Flash happens automatically
- No manual button clicking needed
- Content arrives "ready to publish" with all AI enhancements

---

## 💰 Balance Consumption:

**Critical**: Flash workflows consume balance!

Each workflow step costs money:
- FAQ Generation: $0.12
- SEO Optimization: $0.12
- Brand It: $0.12
- HTML Cleanup: $0.05
- AutoLink: $0.08
- etc.

**Total workflow cost** = Sum of all step costs

Example "Product Review Flash" workflow:
```
1. FAQ ($0.12)
2. SEO ($0.12)
3. Brand It ($0.12)
4. AutoLink ($0.08)
TOTAL: $0.44 per article
```

Balance is checked BEFORE workflow starts. If insufficient funds, workflow doesn't run.

---

## 🚫 What Flash Workflows Are NOT:

❌ NOT in the Editor directly (no Flash button in Editor.jsx)
❌ NOT for real-time editing while writing
❌ NOT for generating content from scratch
❌ NOT user-configurable (admin-only creation via EditorWorkflowManager)

---

## ✅ What Flash Workflows ARE:

✅ Post-processing automation for finished content
✅ Pre-defined enhancement sequences
✅ Applied from Topics page (pre-writing) or Content page (post-writing)
✅ Admin-controlled templates
✅ Automated when content arrives from external writers
✅ Balance-consuming AI enhancements

---

## 🎯 User Journey Summary:

### Scenario 1: External Writing (Topics → Airtable → Auto-Flash)
```
1. User selects keyword on Topics page
2. User picks "Product Review" Flash template
3. Assignment sent to external writer (Airtable)
4. Writer completes content in Airtable
5. useFlashAutoTrigger detects new content
6. Blog post created with flash_template = "Product Review"
7. Flash automation runs automatically
8. Enhanced content appears in Content feed
```

### Scenario 2: Self-Written Content (Content Page → Manual Flash)
```
1. User writes content in Editor or imports from elsewhere
2. Content appears in Content feed
3. User clicks Flash button (⚡)
4. Selects "How-To Guide" template
5. Flash automation triggered manually
6. Content gets enhanced with AI features
7. Flash button turns green (completed)
```

---

## 🔧 Admin Controls:

**EditorWorkflowManager** (`/src/pages/EditorWorkflowManager.jsx`):
- **Superadmin-only** access
- Create/edit/delete Flash workflow templates
- Define which AI steps to include
- Set step order and configuration
- Mark workflows as "default" (visible to all users)
- Set total workflow cost

**Important**: Regular users CANNOT create workflows. They can only:
- Select from pre-defined Flash templates
- Execute existing workflows
- View workflow progress

---

## 📊 Current State:

✅ Flash button on Content page working
✅ Flash template dropdown on Topics page working
✅ Auto-trigger watching Airtable for content changes
✅ Balance consumption integrated
✅ Workflow execution via RunWorkflowModal
✅ Admin-only workflow creation
✅ Status tracking (idle → running → completed/failed)
✅ Validation (400 word minimum, no re-flashing)

---

## 🎉 Summary:

**Flash workflows = Post-processing AI automation for content enhancement**

- Selected on **Topics page** (before writing) or **Content page** (after writing)
- Executed by **RunWorkflowModal** component
- Monitored by **useFlashAutoTrigger** for automatic execution
- Controlled by **admins** via EditorWorkflowManager
- Consume **balance** based on AI steps included
- Transform **finished content** with sequential AI enhancements
- NOT for real-time editing or content generation

---

**Does this match your understanding? Any corrections needed?**

