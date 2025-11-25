# Quiz Landing Page - Complete Section Component Library

## 🎨 20+ Reusable Section Components

This comprehensive library gives you maximum flexibility to build high-converting landing pages.

---

## **📊 Data & Stats Components**

### 1. **Stats Block (4-Column)**
**Use Case:** Build credibility with impressive numbers

```typescript
interface StatsBlockSection {
  section_type: 'stats_block'
  content: {
    stats: Array<{
      number: string      // "85%"
      label: string       // "of buyers use AI"
      description?: string
      icon?: string       // Optional icon/emoji
      color?: string      // Accent color
    }>
  }
}
```

**Visual:**
```
┌──────────────────────────────────────────┐
│        [85%]     [72%]     [3x]          │
│      Buyers    Growth    ROI             │
│    use AI     in 2024   Increase         │
└──────────────────────────────────────────┘
```

---

### 2. **Single Stat Hero**
**Use Case:** Emphasize ONE powerful statistic

```typescript
interface SingleStatSection {
  section_type: 'single_stat'
  content: {
    stat_number: string    // "85%"
    stat_label: string     // "of B2B buyers"
    description: string    // Full explanation
    source?: string        // "Source: Gartner 2024"
  }
}
```

**Visual:**
```
┌──────────────────────────────────────────┐
│              85%                         │
│      of B2B buyers now use AI            │
│      to research solutions before        │
│      talking to sales                    │
│                                          │
│      Source: Gartner 2024                │
└──────────────────────────────────────────┘
```

---

### 3. **Progress/Timeline Stats**
**Use Case:** Show growth or progression

```typescript
interface ProgressStatsSection {
  section_type: 'progress_stats'
  content: {
    timeline: Array<{
      year: string       // "2023"
      percentage: number // 45
      label: string      // "AI adoption"
    }>
  }
}
```

---

## **✅ Benefits & Features Components**

### 4. **Icon Benefits Grid (3-Column)**
**Use Case:** List key benefits with visual icons

```typescript
interface BenefitsGridSection {
  section_type: 'benefits_grid'
  content: {
    benefits: Array<{
      icon: string        // Emoji or Hugeicons name
      title: string       // "Get Your Score"
      description: string
      color?: string      // Accent color
    }>
  }
}
```

**Visual:**
```
┌──────────────────────────────────────────┐
│   🎯              📊              🚀     │
│  Discover      Benchmark       Get       │
│  Blind Spots   vs Competitors   Plan     │
│                                          │
│  Find gaps     See how you      Custom   │
│  in your AI    stack up          action  │
│  visibility    against rivals    steps   │
└──────────────────────────────────────────┘
```

---

### 5. **Checklist Benefits**
**Use Case:** Simple, scannable benefit list

```typescript
interface ChecklistSection {
  section_type: 'checklist'
  content: {
    heading: string
    items: Array<{
      text: string
      highlighted?: boolean  // Bold/colored
    }>
  }
}
```

**Visual:**
```
┌──────────────────────────────────────────┐
│  What You'll Get:                        │
│  ✓ Your AI Visibility Score              │
│  ✓ Personalized Action Plan              │
│  ✓ Competitor Comparison                 │
│  ✓ Expert Recommendations                │
│  ✓ Free Strategy Session                 │
└──────────────────────────────────────────┘
```

---

### 6. **Feature Comparison Table**
**Use Case:** Compare different tiers or options

```typescript
interface ComparisonTableSection {
  section_type: 'comparison_table'
  content: {
    columns: Array<{
      name: string           // "Free", "Pro", "Enterprise"
      highlighted?: boolean
      features: string[]
      cta_text?: string
      cta_link?: string
    }>
  }
}
```

---

## **🎓 Educational Components**

### 7. **How It Works (Step-by-Step)**
**Use Case:** Explain process or journey

```typescript
interface HowItWorksSection {
  section_type: 'how_it_works'
  content: {
    steps: Array<{
      number: number        // 1, 2, 3
      title: string         // "Answer Questions"
      description: string
      image?: string
      icon?: string
      estimated_time?: string  // "2 minutes"
    }>
  }
}
```

**Visual:**
```
┌──────────────────────────────────────────┐
│    1              2              3        │
│  Answer       Get Score    Take Action   │
│  Questions    & Report                    │
│                                           │
│  Quick 12     Instant      Custom        │
│  questions    analysis     roadmap       │
│  (3 mins)     with tips    to improve    │
└──────────────────────────────────────────┘
```

---

### 8. **Problem-Solution Block**
**Use Case:** Highlight pain point and your solution

```typescript
interface ProblemSolutionSection {
  section_type: 'problem_solution'
  content: {
    problem: {
      title: string
      description: string
      icon?: string
    }
    solution: {
      title: string
      description: string
      icon?: string
    }
  }
}
```

**Visual:**
```
┌──────────────────────────────────────────┐
│  ❌ PROBLEM              ✅ SOLUTION      │
│                                           │
│  Your competitors are    Our quiz        │
│  getting recommended     identifies      │
│  by AI while you're      exactly what    │
│  invisible               to fix          │
└──────────────────────────────────────────┘
```

---

### 9. **Before/After Comparison**
**Use Case:** Show transformation

```typescript
interface BeforeAfterSection {
  section_type: 'before_after'
  content: {
    before: {
      title: string
      points: string[]
      image?: string
    }
    after: {
      title: string
      points: string[]
      image?: string
    }
  }
}
```

---

## **💬 Social Proof Components**

### 10. **Testimonial Carousel**
**Use Case:** Customer success stories

```typescript
interface TestimonialCarouselSection {
  section_type: 'testimonial_carousel'
  content: {
    testimonials: Array<{
      quote: string
      author: string
      role: string
      company: string
      avatar?: string
      rating?: number      // 1-5 stars
      result?: string      // "Increased leads 300%"
    }>
  }
}
```

---

### 11. **Case Study Grid**
**Use Case:** Detailed success stories with metrics

```typescript
interface CaseStudyGridSection {
  section_type: 'case_study_grid'
  content: {
    case_studies: Array<{
      company: string
      logo?: string
      challenge: string
      solution: string
      results: Array<{
        metric: string    // "300%"
        label: string     // "Increase in leads"
      }>
      cta_text?: string
      cta_link?: string
    }>
  }
}
```

---

### 12. **Logo Cloud / Trust Bar**
**Use Case:** Show brands that trust you

```typescript
interface LogoCloudSection {
  section_type: 'logo_cloud'
  content: {
    heading?: string      // "Trusted by industry leaders"
    logos: Array<{
      name: string
      image_url: string
      link?: string
    }>
    layout: 'grid' | 'scroll' | 'marquee'
  }
}
```

---

### 13. **Review Stars / Rating**
**Use Case:** Aggregate rating display

```typescript
interface RatingSection {
  section_type: 'rating_display'
  content: {
    average_rating: number    // 4.9
    total_reviews: number     // 1,234
    platform?: string         // "G2", "Trustpilot"
    breakdown?: Array<{
      stars: number
      count: number
    }>
  }
}
```

---

## **📝 Content Components**

### 14. **Rich Text Block**
**Use Case:** Flexible content area with formatting

```typescript
interface RichTextSection {
  section_type: 'rich_text'
  content: {
    html: string          // Rich HTML content
    max_width?: string    // Container width
    text_align?: 'left' | 'center' | 'right'
  }
}
```

---

### 15. **Two-Column Text + Image**
**Use Case:** Feature explanation with visual

```typescript
interface TextImageSection {
  section_type: 'text_image'
  content: {
    image_position: 'left' | 'right'
    image_url: string
    title: string
    description: string
    list_items?: string[]
    cta_text?: string
    cta_link?: string
  }
}
```

---

### 16. **FAQ Accordion**
**Use Case:** Address common questions

```typescript
interface FAQSection {
  section_type: 'faq'
  content: {
    faqs: Array<{
      question: string
      answer: string
      category?: string    // For filtering
    }>
    layout: 'accordion' | 'grid'
  }
}
```

---

### 17. **Video Embed**
**Use Case:** Explainer or testimonial video

```typescript
interface VideoSection {
  section_type: 'video_embed'
  content: {
    video_url: string     // YouTube, Vimeo, or MP4
    title?: string
    description?: string
    thumbnail?: string
    autoplay?: boolean
  }
}
```

---

## **🎯 CTA Components**

### 18. **Hero CTA Block**
**Use Case:** Primary conversion section

```typescript
interface HeroCTASection {
  section_type: 'hero_cta'
  content: {
    headline: string
    subheadline?: string
    cta_primary: {
      text: string
      link: string
      style: 'primary' | 'secondary'
    }
    cta_secondary?: {
      text: string
      link: string
    }
    bg_gradient?: string
    bg_image?: string
  }
}
```

**Visual:**
```
┌──────────────────────────────────────────┐
│                                           │
│      Ready to Discover Your              │
│      AI Visibility Score?                 │
│                                           │
│      Join 500+ brands already improving   │
│      their AI presence                    │
│                                           │
│      [Take the Quiz Now]  [Learn More]   │
│                                           │
└──────────────────────────────────────────┘
```

---

### 19. **Inline CTA Bar**
**Use Case:** Sticky/persistent CTA

```typescript
interface InlineCTASection {
  section_type: 'inline_cta'
  content: {
    text: string
    cta_text: string
    cta_link: string
    icon?: string
    style: 'bar' | 'button' | 'banner'
  }
}
```

---

### 20. **Exit Intent Popup Trigger**
**Use Case:** Capture abandoning visitors

```typescript
interface ExitIntentSection {
  section_type: 'exit_intent'
  content: {
    enabled: boolean
    headline: string
    description: string
    offer?: string         // "Get 20% off"
    cta_text: string
  }
}
```

---

## **🎨 Design Components**

### 21. **Divider / Spacer**
**Use Case:** Visual separation between sections

```typescript
interface DividerSection {
  section_type: 'divider'
  content: {
    style: 'line' | 'gradient' | 'dots' | 'wave'
    height?: string
    color?: string
  }
}
```

---

### 22. **Quote/Callout Block**
**Use Case:** Highlight important information

```typescript
interface CalloutSection {
  section_type: 'callout'
  content: {
    text: string
    author?: string
    style: 'info' | 'warning' | 'success' | 'quote'
    icon?: string
  }
}
```

**Visual:**
```
┌──────────────────────────────────────────┐
│  💡                                      │
│  "85% of your prospects are already     │
│   using AI to research solutions.       │
│   Are you visible to them?"             │
│                                          │
│   - Industry Research 2024               │
└──────────────────────────────────────────┘
```

---

### 23. **Countdown Timer**
**Use Case:** Create urgency

```typescript
interface CountdownSection {
  section_type: 'countdown'
  content: {
    headline: string
    end_date: string       // ISO date
    end_message?: string   // Shown when expired
    cta_text?: string
    cta_link?: string
  }
}
```

---

### 24. **Progress Bar / Indicator**
**Use Case:** Show completion or achievement

```typescript
interface ProgressBarSection {
  section_type: 'progress_bar'
  content: {
    label: string
    current: number
    total: number
    show_percentage: boolean
    milestones?: Array<{
      value: number
      label: string
    }>
  }
}
```

---

## **📱 Interactive Components**

### 25. **Interactive Calculator**
**Use Case:** ROI or value calculator

```typescript
interface CalculatorSection {
  section_type: 'calculator'
  content: {
    title: string
    inputs: Array<{
      label: string
      type: 'number' | 'slider' | 'select'
      default_value: number
      min?: number
      max?: number
    }>
    formula: string        // JavaScript formula
    result_label: string
  }
}
```

---

### 26. **Quiz Teaser**
**Use Case:** Show sample questions

```typescript
interface QuizTeaserSection {
  section_type: 'quiz_teaser'
  content: {
    sample_questions: Array<{
      question: string
      options: string[]
    }>
    cta_text: string
    cta_link: string
  }
}
```

---

### 27. **Email Capture Form**
**Use Case:** Lead generation

```typescript
interface EmailCaptureSection {
  section_type: 'email_capture'
  content: {
    headline: string
    description?: string
    placeholder: string
    button_text: string
    gdpr_text?: string
    success_message: string
    redirect_url?: string
  }
}
```

---

## **🎁 Bonus: Advanced Components**

### 28. **Pricing Table**
```typescript
interface PricingTableSection {
  section_type: 'pricing_table'
  content: {
    plans: Array<{
      name: string
      price: string
      period: string
      features: string[]
      highlighted?: boolean
      cta_text: string
      cta_link: string
    }>
  }
}
```

---

### 29. **Team/About Section**
```typescript
interface TeamSection {
  section_type: 'team'
  content: {
    members: Array<{
      name: string
      role: string
      bio: string
      avatar?: string
      social_links?: {
        linkedin?: string
        twitter?: string
      }
    }>
  }
}
```

---

### 30. **News/Blog Feed**
```typescript
interface BlogFeedSection {
  section_type: 'blog_feed'
  content: {
    heading: string
    post_count: number
    show_images: boolean
    show_excerpts: boolean
    cta_text?: string
    cta_link?: string
  }
}
```

---

## 📋 Component Categories Summary

**Data & Stats (3):**
- Stats Block, Single Stat, Progress Stats

**Benefits & Features (3):**
- Benefits Grid, Checklist, Comparison Table

**Educational (3):**
- How It Works, Problem-Solution, Before/After

**Social Proof (4):**
- Testimonials, Case Studies, Logo Cloud, Ratings

**Content (4):**
- Rich Text, Text+Image, FAQ, Video

**CTAs (3):**
- Hero CTA, Inline CTA, Exit Intent

**Design (4):**
- Divider, Callout, Countdown, Progress Bar

**Interactive (3):**
- Calculator, Quiz Teaser, Email Capture

**Advanced (3):**
- Pricing, Team, Blog Feed

---

## 🎨 Design System Integration

All components support:
- ✅ Custom background colors/gradients
- ✅ Custom text colors
- ✅ Padding/spacing controls
- ✅ Mobile responsive layouts
- ✅ Animation options (fade-in, slide-up, etc.)
- ✅ Conditional visibility rules

---

## 🚀 Implementation Priority

**Phase 1 (Launch):**
1. Stats Block
2. Benefits Grid
3. How It Works
4. Hero CTA
5. FAQ
6. Testimonials

**Phase 2 (Week 2):**
7. Text+Image
8. Logo Cloud
9. Checklist
10. Video Embed

**Phase 3 (As Needed):**
11-30. Add based on user feedback

---

## 💡 Usage Examples

### High-Converting Quiz Landing Page:
```
1. Hero (Quiz Embed)
2. Stats Block (Build credibility)
3. Benefits Grid (Why take quiz)
4. How It Works (Reduce friction)
5. Testimonial Carousel (Social proof)
6. FAQ (Handle objections)
7. Hero CTA (Final push)
```

### Educational Landing Page:
```
1. Hero (Quiz Embed)
2. Problem-Solution (Identify pain)
3. Text+Image (Explain solution)
4. Logo Cloud (Trust signals)
5. Case Study Grid (Proof)
6. FAQ
7. Email Capture
```

---

**Ready to start implementing? Let me know which components you want first!** 🚀

