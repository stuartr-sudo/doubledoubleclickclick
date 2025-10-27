# 🧪 Testing Flash Button in Editor

## ⚠️ Prerequisites

Before testing, ensure the database columns exist:

### 1. Check Columns
Run in Supabase SQL Editor:
```sql
-- Copy and run: CHECK_FLASH_TEMPLATE_COLUMN.sql
```

### 2. Add Columns (if missing)
Run in Supabase SQL Editor:
```sql
-- Copy and run: ADD_FLASH_TEMPLATE_COLUMNS.sql
```

---

## 🧪 Test Steps

### Test 1: Open Flash Modal from Ask AI Bar

1. **Open any blog post** in the Editor
2. **Select/highlight some text** (or just double-click anywhere)
3. **Ask AI floating bar should appear** with 3 buttons:
   - Edit
   - Flash ⚡ (with Sparkles icon)
   - Ask AI
4. **Click the "Flash" button**
5. **Expected**: Flash Template Modal opens

---

### Test 2: Select a Flash Template

1. **Modal should show**:
   - Title: "Select Flash Template"
   - Description about choosing template
   - Dropdown with current selection
   - Apply button

2. **Click the dropdown**
3. **Should see options**:
   - None
   - Product Review
   - How-To Guide
   - Listicle
   - Educational
   - News & Blog

4. **Select "Product Review"**
5. **Click "Apply"**
6. **Expected**:
   - Modal closes
   - Toast message: "Flash template set to: Product Review"
   - Template saved to database

---

### Test 3: Verify Persistence

1. **Refresh the page**
2. **Open the same post**
3. **Click Flash button again**
4. **Expected**: 
   - Modal shows "Product Review" as the current selection
   - Template persisted correctly

---

### Test 4: Remove Template

1. **Click Flash button**
2. **Select "None" from dropdown**
3. **Click "Apply"**
4. **Expected**:
   - Toast message: "Flash template removed."
   - Template reset to "None"

---

### Test 5: Test with Webhook Content

1. **Open a webhook item** (if you have any)
2. **Repeat Tests 2-4**
3. **Expected**: Same behavior as blog posts

---

## 🐛 Common Issues

### Issue: Flash Button Does Nothing
**Cause**: `flash_template` column doesn't exist
**Fix**: Run `ADD_FLASH_TEMPLATE_COLUMNS.sql`

### Issue: Modal Doesn't Open
**Check**:
1. Browser console for errors
2. Verify `FlashTemplateModal` component exists
3. Check import path in `Editor.jsx`

### Issue: Template Doesn't Save
**Check**:
1. Network tab for 400/500 errors
2. Supabase logs for RLS policy errors
3. Verify user has permission to update posts

### Issue: Rate Limit Error
**Cause**: Too many rapid API calls
**Fix**: Wait 1-2 seconds and try again

---

## ✅ Success Criteria

- [ ] Flash button appears in Ask AI floating bar
- [ ] Clicking Flash opens modal with dropdown
- [ ] All 6 template options are visible
- [ ] Selecting template shows success toast
- [ ] Template persists after page refresh
- [ ] "None" removes the template
- [ ] Works for both blog posts and webhooks

---

## 📊 What Gets Saved

When you select a template, the following is saved to the database:

**For Blog Posts:**
```sql
UPDATE blog_posts SET flash_template = 'Product Review' WHERE id = ...;
```

**For Webhooks:**
```sql
UPDATE webhook_received SET flash_template = 'Product Review' WHERE id = ...;
```

---

## 🔮 Future Integration

Once Flash automation is implemented, this template will:

1. **Trigger automatically** when external content is returned
2. **Execute AI enhancements** based on template type
3. **Apply specific workflow steps** for each template
4. **Update flash_status** through the workflow lifecycle

For now, it's just setting the template preference. The automation logic will be added separately.

---

## 🎯 Status Check

After testing, verify:
- ✅ Editor implementation working
- ✅ Topics page Flash dropdown working
- ✅ Content feed Flash button working
- ✅ All 3 locations use same FlashTemplateModal
- ✅ Consistent UX across platform

