# ⚡ Flash System - Quick Reference

## 🎯 What is Flash?

Flash is a **template-based AI enhancement system** that allows users to select a content template type. In the future, this will trigger automated AI workflows to enhance content based on the selected template.

---

## 📍 Where Can Users Set Flash Templates?

| Location | How to Access | What Happens |
|----------|---------------|--------------|
| **Topics Page** | Questions table → Flash Template column | Dropdown to select template for each question |
| **Content Feed** | Flash button (⚡) on each content item | Opens FlashTemplateModal to select template |
| **Editor** | Double-click text → Ask AI bar → Flash button | Opens FlashTemplateModal to select template |

---

## 🎨 Available Flash Templates

1. **None** (default) - No Flash enhancements
2. **Product Review** - For product comparison/review content
3. **How-To Guide** - For tutorial/instructional content
4. **Listicle** - For list-based content
5. **Educational** - For educational/informative content
6. **News & Blog** - For news articles and blog posts

---

## 🗄️ Database Schema

### Tables with Flash Support

```sql
-- Blog posts
blog_posts.flash_template TEXT DEFAULT 'None'
blog_posts.flash_status TEXT DEFAULT 'idle'
blog_posts.flashed_at TIMESTAMP

-- Webhook received
webhook_received.flash_template TEXT DEFAULT 'None'
webhook_received.flash_status TEXT DEFAULT 'idle'
webhook_received.flashed_at TIMESTAMP
```

### Flash Status Values

- `idle` - No Flash process started
- `queued` - Flash process queued
- `running` - Flash AI enhancements in progress
- `completed` - Flash completed successfully
- `failed` - Flash process failed

---

## 🔄 Flash Workflow (Future Implementation)

```
User selects template
        ↓
Template saved to database
        ↓
[FUTURE] External content returned
        ↓
[FUTURE] System detects flash_template is set
        ↓
[FUTURE] Triggers automated AI workflow
        ↓
[FUTURE] Applies template-specific enhancements
        ↓
[FUTURE] Updates flash_status to 'completed'
```

---

## 🚀 Current Implementation Status

### ✅ Phase 1: Template Selection (COMPLETE)
- [x] Topics page dropdown
- [x] Content feed Flash button
- [x] Editor Ask AI Flash button
- [x] Template persistence in database
- [x] Consistent UI across all locations

### ⏳ Phase 2: Flash Automation (PENDING)
- [ ] Airtable content monitoring
- [ ] Automatic Flash trigger when content returns
- [ ] Template-specific AI workflows
- [ ] Flash status tracking
- [ ] Progress indicators

---

## 📦 Component Structure

```
FlashTemplateModal (shared component)
    ├── Used by: Topics page
    ├── Used by: Content feed (FlashButton)
    └── Used by: Editor (Ask AI → Flash)

FlashButton (Content feed only)
    ├── Shows Flash status icon
    ├── Validates content (400 word minimum)
    ├── Opens FlashTemplateModal
    └── Handles template selection
```

---

## 🎯 User Permissions

### Content Feed Flash Button Restrictions:
- ❌ Disabled if content is empty
- ❌ Disabled if content < 400 words
- ❌ Disabled if flash_status = "completed"
- ❌ Disabled if flash_status = "running"
- ✅ Enabled for all other cases

### Editor Flash Button:
- ✅ Always enabled
- No content validation required
- Can be set before content is written

### Topics Page Flash Dropdown:
- ✅ Always enabled
- Sets template for future content generation

---

## 🧪 Testing Checklist

- [ ] Topics page: Select Flash template in Questions table
- [ ] Content feed: Click Flash button on content item
- [ ] Editor: Double-click text, click Flash in Ask AI bar
- [ ] Verify template saves to database
- [ ] Verify template persists after page refresh
- [ ] Verify "None" removes the template
- [ ] Test with both blog_posts and webhook_received

---

## 📁 Key Files

```
Frontend:
├── src/components/content/FlashTemplateModal.jsx
├── src/components/content/FlashButton.jsx
├── src/components/topics/GroupedFaqTable.jsx (Flash dropdown)
└── src/pages/Editor.jsx (Flash integration)

Backend:
├── supabase/migrations/030_flash_automation_system.sql
└── ADD_FLASH_TEMPLATE_COLUMNS.sql (setup script)

Documentation:
├── FLASH_EDITOR_COMPLETE.md (implementation details)
├── TEST_FLASH_EDITOR.md (testing guide)
└── FLASH_QUICK_REFERENCE.md (this file)
```

---

## 🐛 Troubleshooting

### Flash button does nothing
→ Run `ADD_FLASH_TEMPLATE_COLUMNS.sql`

### Template doesn't save
→ Check RLS policies on blog_posts/webhook_received

### Template doesn't persist
→ Check browser console for API errors

### Flash button always disabled
→ Check content word count (minimum 400 words)

---

## 💡 Best Practices

1. **Set template early** - Users can set Flash template before writing content
2. **Content feed validation** - Only Flash content with 400+ words
3. **Topics pre-configuration** - Set Flash template when creating questions
4. **Template consistency** - Use the same template for related content

---

## 🎉 Success Metrics

- Template selection works in all 3 locations
- Templates persist correctly in database
- UI is consistent across platform
- No Base44 dependencies
- Ready for future automation integration

