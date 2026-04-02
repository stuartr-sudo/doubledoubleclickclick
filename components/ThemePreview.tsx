'use client'

import { ThemeName, THEMES } from '@/lib/themes'

interface ThemePreviewProps {
  theme: ThemeName
}

/* ─── Static mock content for the preview ─── */
const MOCK = {
  brand: 'The Daily Blend',
  tagline: 'Stories worth savoring',
  categories: ['Culture', 'Wellness', 'Business', 'Travel', 'Food'],
  hero: {
    category: 'Culture',
    title: 'The Art of Slow Living in a Fast-Paced World',
    excerpt: 'How mindful practices are reshaping modern lifestyles across generations.',
    author: 'Sarah Mitchell',
    date: 'Apr 2, 2026',
    readTime: '6 min read',
  },
  posts: [
    { category: 'Wellness', title: 'Morning Routines That Actually Work', author: 'James Chen', date: 'Apr 1' },
    { category: 'Business', title: 'Remote Work Is Evolving Again', author: 'Priya Sharma', date: 'Mar 31' },
    { category: 'Travel', title: 'Hidden Gems of the Portuguese Coast', author: 'Leo Torres', date: 'Mar 30' },
  ],
}

/* ═══════════════════════════════════════
   EDITORIAL PREVIEW
   ═══════════════════════════════════════ */
function EditorialPreview() {
  const t = THEMES.editorial.variables
  return (
    <div style={{ background: t['--color-bg'], color: t['--color-text'], fontFamily: t['--font-body'], minHeight: '100%' }}>
      {/* Top date bar */}
      <div style={{ fontSize: 7, color: t['--color-text-muted'], padding: '4px 12px', borderBottom: `1px solid ${t['--color-border']}`, display: 'flex', justifyContent: 'space-between' }}>
        <span>Wednesday, April 2, 2026</span>
        <span style={{ color: t['--color-accent'] }}>Subscribe</span>
      </div>
      {/* Masthead */}
      <div style={{ textAlign: 'center', padding: '8px 0 4px', borderBottom: `2px solid ${t['--color-text']}`, margin: '0 12px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: t['--font-heading'], letterSpacing: -0.5 }}>{MOCK.brand}</div>
        <div style={{ fontSize: 6, color: t['--color-text-muted'], fontStyle: 'italic', marginTop: 1 }}>{MOCK.tagline}</div>
      </div>
      {/* Category nav */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${t['--color-border']}`, margin: '0 12px', flexWrap: 'wrap' }}>
        {MOCK.categories.map(c => (
          <span key={c} style={{ fontSize: 6, textTransform: 'uppercase', letterSpacing: 0.5, color: t['--color-text-secondary'] }}>{c}</span>
        ))}
      </div>
      {/* Hero */}
      <div style={{ padding: '10px 12px 8px' }}>
        <div style={{ background: t['--color-bg-warm'], height: 80, borderRadius: 0, marginBottom: 6 }} />
        <div style={{ fontSize: 6, textTransform: 'uppercase', color: t['--color-accent'], fontWeight: 600, letterSpacing: 0.5, marginBottom: 2 }}>{MOCK.hero.category}</div>
        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: t['--font-heading'], lineHeight: 1.2, marginBottom: 3 }}>{MOCK.hero.title}</div>
        <div style={{ fontSize: 7, color: t['--color-text-secondary'], lineHeight: 1.3, marginBottom: 4 }}>{MOCK.hero.excerpt}</div>
        <div style={{ fontSize: 6, color: t['--color-text-muted'] }}>By {MOCK.hero.author} · {MOCK.hero.date}</div>
      </div>
      {/* Divider */}
      <div style={{ borderTop: `1px solid ${t['--color-border']}`, margin: '0 12px' }} />
      {/* Post list */}
      <div style={{ padding: '6px 12px' }}>
        {MOCK.posts.map((p, i) => (
          <div key={i} style={{ padding: '5px 0', borderBottom: i < MOCK.posts.length - 1 ? `1px solid ${t['--color-border-light']}` : 'none' }}>
            <div style={{ fontSize: 5, textTransform: 'uppercase', color: t['--color-accent'], fontWeight: 600, letterSpacing: 0.5, marginBottom: 1 }}>{p.category}</div>
            <div style={{ fontSize: 8, fontWeight: 600, fontFamily: t['--font-heading'], lineHeight: 1.2, marginBottom: 1 }}>{p.title}</div>
            <div style={{ fontSize: 5.5, color: t['--color-text-muted'] }}>{p.author} · {p.date}</div>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div style={{ background: t['--color-footer-bg'], color: '#ccc', padding: '8px 12px', marginTop: 8 }}>
        <div style={{ fontSize: 7, fontWeight: 600, fontFamily: t['--font-heading'], color: '#fff', marginBottom: 2 }}>{MOCK.brand}</div>
        <div style={{ fontSize: 5, color: '#999' }}>© 2026 {MOCK.brand}. All rights reserved.</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   BOUTIQUE PREVIEW
   ═══════════════════════════════════════ */
function BoutiquePreview() {
  const t = THEMES.boutique.variables
  const radius = t['--border-radius']
  return (
    <div style={{ background: t['--color-bg'], color: t['--color-text'], fontFamily: t['--font-body'], minHeight: '100%' }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: t['--color-accent'] }} />
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '8px 12px 6px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: t['--font-heading'] }}>{MOCK.brand}</div>
        <div style={{ fontSize: 6, color: t['--color-text-muted'], marginTop: 1 }}>{MOCK.tagline}</div>
      </div>
      {/* Pill nav */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '0 12px 8px', flexWrap: 'wrap' }}>
        {MOCK.categories.map(c => (
          <span key={c} style={{ fontSize: 5.5, padding: '2px 6px', borderRadius: 99, background: t['--color-bg-warm'], color: t['--color-text-secondary'] }}>{c}</span>
        ))}
      </div>
      {/* Hero */}
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{ background: t['--color-bg-warm'], height: 80, borderRadius: radius, marginBottom: 8 }} />
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 5.5, padding: '2px 6px', borderRadius: 99, background: t['--color-accent'], color: '#fff', display: 'inline-block', marginBottom: 4 }}>{MOCK.hero.category}</span>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: t['--font-heading'], lineHeight: 1.2, marginBottom: 3 }}>{MOCK.hero.title}</div>
          <div style={{ fontSize: 7, color: t['--color-text-secondary'], lineHeight: 1.3, marginBottom: 4 }}>{MOCK.hero.excerpt}</div>
          <div style={{ fontSize: 6, color: t['--color-text-muted'] }}>{MOCK.hero.author} · {MOCK.hero.readTime}</div>
        </div>
      </div>
      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, padding: '4px 12px 12px' }}>
        {MOCK.posts.map((p, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: radius, boxShadow: t['--card-shadow'], overflow: 'hidden' }}>
            <div style={{ background: t['--color-bg-warm'], height: 32 }} />
            <div style={{ padding: '4px 5px 6px' }}>
              <span style={{ fontSize: 4.5, padding: '1px 4px', borderRadius: 99, background: `${t['--color-accent']}18`, color: t['--color-accent'], display: 'inline-block', marginBottom: 2 }}>{p.category}</span>
              <div style={{ fontSize: 6, fontWeight: 600, lineHeight: 1.2, marginBottom: 1 }}>{p.title}</div>
              <div style={{ fontSize: 4.5, color: t['--color-text-muted'] }}>{p.author}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div style={{ background: t['--color-footer-bg'], color: '#ccc', padding: '8px 12px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 7, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{MOCK.brand}</div>
          <div style={{ fontSize: 5, color: '#999' }}>© 2026 {MOCK.brand}. All rights reserved.</div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   MODERN PREVIEW
   ═══════════════════════════════════════ */
function ModernPreview() {
  const t = THEMES.modern.variables
  const radius = t['--border-radius']
  return (
    <div style={{ background: t['--color-bg'], color: t['--color-text'], fontFamily: t['--font-body'], minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: `1px solid ${t['--color-border']}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, fontFamily: t['--font-heading'] }}>{MOCK.brand}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {MOCK.categories.slice(0, 4).map(c => (
            <span key={c} style={{ fontSize: 5.5, textTransform: 'uppercase', letterSpacing: 0.8, color: t['--color-text-secondary'] }}>{c}</span>
          ))}
        </div>
      </div>
      {/* Hero */}
      <div style={{ padding: '10px 12px 8px' }}>
        <div style={{ width: 24, height: 1, background: t['--color-border'], marginBottom: 8 }} />
        <div style={{ background: t['--color-bg-warm'], height: 80, borderRadius: radius, marginBottom: 8 }} />
        <div style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 5, textTransform: 'uppercase', letterSpacing: 0.8, color: t['--color-accent'], marginBottom: 3 }}>{MOCK.hero.category}</div>
        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: t['--font-heading'], lineHeight: 1.15, marginBottom: 3, letterSpacing: -0.3 }}>{MOCK.hero.title}</div>
        <div style={{ fontSize: 7, color: t['--color-text-secondary'], lineHeight: 1.3, marginBottom: 4 }}>{MOCK.hero.excerpt}</div>
        <div style={{ fontSize: 5.5, color: t['--color-text-muted'] }}>{MOCK.hero.author} · {MOCK.hero.readTime}</div>
      </div>
      {/* Section label */}
      <div style={{ padding: '0 12px', marginBottom: 4 }}>
        <div style={{ fontSize: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: t['--color-text-muted'] }}>Latest</div>
      </div>
      {/* Three column grid with borders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0 12px 12px' }}>
        {MOCK.posts.map((p, i) => (
          <div key={i} style={{ padding: '4px 8px', borderLeft: i > 0 ? `1px solid ${t['--color-border']}` : 'none' }}>
            <div style={{ background: t['--color-bg-warm'], height: 30, borderRadius: radius, marginBottom: 4 }} />
            <div style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 4.5, textTransform: 'uppercase', letterSpacing: 0.5, color: t['--color-accent'], marginBottom: 2 }}>{p.category}</div>
            <div style={{ fontSize: 6.5, fontWeight: 600, lineHeight: 1.2, marginBottom: 1 }}>{p.title}</div>
            <div style={{ fontSize: 4.5, color: t['--color-text-muted'] }}>{p.author}</div>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div style={{ background: t['--color-footer-bg'], color: '#ccc', padding: '8px 12px', marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 7, fontWeight: 600, color: '#fff' }}>{MOCK.brand}</div>
          <div style={{ fontSize: 5, color: '#999' }}>© 2026</div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════ */
const PREVIEW_MAP: Record<ThemeName, () => JSX.Element> = {
  editorial: EditorialPreview,
  boutique: BoutiquePreview,
  modern: ModernPreview,
}

export default function ThemePreview({ theme }: ThemePreviewProps) {
  const Preview = PREVIEW_MAP[theme]
  const themeData = THEMES[theme]

  return (
    <div className="dc-theme-preview">
      <div className="dc-theme-preview-label">
        <span className="dc-theme-preview-label-dot" style={{ background: themeData.variables['--color-accent'] }} />
        {themeData.label} Preview
      </div>
      <div className="dc-theme-preview-frame">
        {/* Browser chrome */}
        <div className="dc-theme-preview-chrome">
          <div className="dc-theme-preview-dots">
            <span style={{ background: '#ff5f57' }} />
            <span style={{ background: '#ffbd2e' }} />
            <span style={{ background: '#28c840' }} />
          </div>
          <div className="dc-theme-preview-url">
            thedailyblend.com
          </div>
        </div>
        {/* Scaled viewport */}
        <div className="dc-theme-preview-viewport">
          <Preview />
        </div>
      </div>
    </div>
  )
}
