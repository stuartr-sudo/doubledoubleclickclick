# Quiz Landing Page Architecture

## 🎯 Goal
Create a dedicated `/quiz` landing page with:
- Embedded quiz in hero section
- Flexible, admin-editable sections
- Conversion-focused design
- Reusable component system

---

## 🏗️ Recommended Architecture

### **Option A: Component-Based Sections (RECOMMENDED)**
✅ **Best for:** Flexibility + Ease of Use
✅ **Admin Experience:** Visual section builder with pre-made blocks

**Structure:**
```
/quiz page
├── Hero (Quiz Embed)
├── Dynamic Sections Array (from Supabase)
│   ├── Section 1: Stats Block
│   ├── Section 2: Benefits List
│   ├── Section 3: How It Works
│   ├── Section 4: Social Proof
│   ├── Section 5: FAQ
│   └── Section 6: Final CTA
└── Footer
```

**Supabase Table:**
```sql
CREATE TABLE quiz_landing_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_type TEXT NOT NULL, -- 'stats', 'benefits', 'how_it_works', 'testimonials', 'faq', 'cta'
  title TEXT,
  subtitle TEXT,
  content JSONB, -- Flexible data for each section type
  image_url TEXT,
  cta_text TEXT,
  cta_link TEXT,
  order_index INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **Option B: Notion-Style Block System**
✅ **Best for:** Maximum flexibility
⚠️ **More complex to build**

Each section is a "block" with its own type, content, and styling options.

---

### **Option C: Fixed Sections with Toggle Visibility**
✅ **Best for:** Quick implementation
⚠️ **Less flexible long-term**

Pre-built sections that can be shown/hidden and edited.

---

## 📐 Proposed Implementation (Option A)

### **1. Database Schema**

```sql
-- Quiz landing page configuration
CREATE TABLE quiz_landing_page (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hero_title TEXT DEFAULT 'Discover Your AI Visibility Score',
  hero_subtitle TEXT DEFAULT 'Take our 3-minute assessment',
  hero_bg_color TEXT DEFAULT '#0f172a',
  meta_title TEXT DEFAULT 'AI Visibility Quiz | SEWO',
  meta_description TEXT DEFAULT 'Find out how visible your brand is to AI',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Available section types (reusable components)
CREATE TABLE quiz_section_types (
  id TEXT PRIMARY KEY, -- 'stats', 'benefits', 'how_it_works', etc.
  name TEXT NOT NULL,
  description TEXT,
  default_config JSONB,
  preview_image TEXT
);

-- Actual sections on the page
CREATE TABLE quiz_landing_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_type TEXT REFERENCES quiz_section_types(id),
  title TEXT,
  subtitle TEXT,
  content JSONB, -- Type-specific data
  bg_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#1e293b',
  order_index INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quiz_sections_order ON quiz_landing_sections(order_index, is_visible);
```

---

### **2. Section Component Types**

#### **Stats Block**
```typescript
interface StatsSection {
  section_type: 'stats'
  content: {
    stats: Array<{
      number: string // "85%"
      label: string  // "of buyers use AI"
      description?: string
    }>
  }
}
```

#### **Benefits List**
```typescript
interface BenefitsSection {
  section_type: 'benefits'
  content: {
    benefits: Array<{
      icon?: string // emoji or icon name
      title: string
      description: string
    }>
  }
}
```

#### **How It Works**
```typescript
interface HowItWorksSection {
  section_type: 'how_it_works'
  content: {
    steps: Array<{
      number: number
      title: string
      description: string
      image?: string
    }>
  }
}
```

#### **Social Proof / Testimonials**
```typescript
interface TestimonialsSection {
  section_type: 'testimonials'
  content: {
    testimonials: Array<{
      quote: string
      author: string
      role: string
      company: string
      avatar?: string
    }>
  }
}
```

#### **FAQ**
```typescript
interface FAQSection {
  section_type: 'faq'
  content: {
    faqs: Array<{
      question: string
      answer: string
    }>
  }
}
```

#### **CTA Block**
```typescript
interface CTASection {
  section_type: 'cta'
  content: {
    heading: string
    subheading: string
    cta_text: string
    cta_link: string
    bg_gradient?: string
  }
}
```

---

### **3. File Structure**

```
app/
├── quiz/
│   ├── page.tsx                    // Main quiz landing page
│   └── QuizLandingClient.tsx       // Client component with sections
├── admin/
│   └── quiz-landing/
│       ├── page.tsx                // Admin editor for quiz page
│       └── components/
│           ├── SectionEditor.tsx   // Edit individual sections
│           └── SectionPicker.tsx   // Add new sections
└── api/
    └── quiz-landing/
        └── route.ts                // API for fetching/updating

components/
└── quiz-landing/
    ├── StatsSection.tsx
    ├── BenefitsSection.tsx
    ├── HowItWorksSection.tsx
    ├── TestimonialsSection.tsx
    ├── FAQSection.tsx
    └── CTASection.tsx
```

---

### **4. Admin Interface Features**

**Section Management:**
- ✅ Add/Remove sections
- ✅ Drag-and-drop reordering
- ✅ Toggle visibility
- ✅ Duplicate sections
- ✅ Preview mode

**Section Editor:**
- ✅ Type-specific form fields
- ✅ Rich text editor for descriptions
- ✅ Image upload for relevant sections
- ✅ Color pickers for backgrounds
- ✅ AI text enhancement (like homepage editor)

**Hero Customization:**
- ✅ Edit quiz intro text
- ✅ Change background colors/gradients
- ✅ Toggle quiz visibility

---

## 🎨 Example Landing Page Flow

```
┌─────────────────────────────────────┐
│  HERO SECTION                       │
│  ┌───────────────────────────────┐  │
│  │  AI Visibility Quiz           │  │
│  │  Embedded Quiz Component      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  STATS SECTION                      │
│  [85%]  [72%]  [3x]               │
│  Buyers  Growth  ROI               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  WHY TAKE THIS QUIZ?                │
│  ✓ Discover blind spots            │
│  ✓ Get personalized plan           │
│  ✓ Benchmark vs competitors        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  HOW IT WORKS                       │
│  1 → 2 → 3                         │
│  Answer | Get Score | Take Action  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  WHAT YOU'LL DISCOVER               │
│  • Your AI visibility score         │
│  • Competitor comparison            │
│  • Actionable next steps            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  SOCIAL PROOF                       │
│  "This quiz revealed..."            │
│  - Customer testimonials            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  FAQ                                │
│  Common questions answered          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  FINAL CTA                          │
│  Ready to Get Started?              │
│  [Take the Quiz Now]                │
└─────────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### Phase 1: Core Setup (Day 1)
1. Create `/quiz` page route
2. Set up Supabase tables
3. Build basic QuizLandingClient component
4. Embed quiz in hero section

### Phase 2: Section Components (Day 2)
1. Build reusable section components
2. Create section type registry
3. Implement section rendering logic
4. Add default sections

### Phase 3: Admin Interface (Day 3)
1. Create `/admin/quiz-landing` page
2. Build section editor UI
3. Add drag-and-drop reordering
4. Implement save/publish functionality

### Phase 4: Polish (Day 4)
1. Add animations and transitions
2. Mobile optimization
3. SEO metadata
4. Analytics tracking

---

## 💡 Key Benefits of This Approach

✅ **Flexibility**: Add/remove/reorder sections easily
✅ **Reusable**: Section components can be used elsewhere
✅ **Scalable**: Easy to add new section types
✅ **Admin-Friendly**: Non-technical users can manage content
✅ **Performance**: Only load visible sections
✅ **SEO**: Dynamic metadata per page

---

## 🎯 Recommended Section Types to Start With

**Must-Have (Launch Day):**
1. Stats Block - Build credibility
2. Benefits List - Why take the quiz
3. How It Works - Reduce friction
4. CTA Block - Final conversion push

**Nice-to-Have (Post-Launch):**
5. Testimonials - Social proof
6. FAQ - Address objections
7. Logo Carousel - Brand trust
8. Video Embed - Explainer content

---

## 📊 Conversion Optimization Tips

1. **Above the fold**: Quiz should be immediately visible
2. **Progress indicators**: Show how quick (3 minutes)
3. **Social proof**: "Join 500+ brands" near quiz
4. **Exit intent**: Trigger popup if they try to leave
5. **Mobile-first**: Most traffic will be mobile

---

## 🤔 Alternative: Landing Page Builder Integration

If you want even more flexibility, consider integrating:
- **Unlayer**: Drag-and-drop builder
- **GrapesJS**: Open-source page builder
- **Builder.io**: Visual CMS

**Trade-offs:**
- ✅ More flexibility
- ❌ More complexity
- ❌ Higher cost
- ❌ Potential performance impact

---

## My Recommendation

**Start with Option A (Component-Based Sections)** because:

1. ✅ Quick to implement (2-3 days)
2. ✅ Easy to maintain
3. ✅ Fast page load times
4. ✅ Admin-friendly
5. ✅ Can always add more section types later

Once you validate the quiz landing page converts, you can add more sophisticated features like A/B testing different section orders or layouts.

---

**Ready to build this? I can start with the database schema and basic page structure!** 🚀

