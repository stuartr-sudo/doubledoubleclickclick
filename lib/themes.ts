export type ThemeName = 'editorial' | 'boutique' | 'modern'

export interface ThemePreset {
  name: ThemeName
  label: string
  description: string
  fontFamily: 'serif' | 'sans-serif'
  googleFontUrl: string | null
  variables: Record<string, string>
}

export const THEMES: Record<ThemeName, ThemePreset> = {
  editorial: {
    name: 'editorial',
    label: 'Editorial',
    description: 'Classic newspaper feel. Best for authority, finance, and news sites.',
    fontFamily: 'serif',
    googleFontUrl: null,
    variables: {
      '--font-heading': "Georgia, 'Times New Roman', serif",
      '--font-body': "Georgia, 'Times New Roman', serif",
      '--font-sans': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--color-bg': '#fafaf8',
      '--color-bg-warm': '#f3f0ea',
      '--color-bg-article': '#f8f6f2',
      '--color-text': '#111111',
      '--color-text-body': '#333333',
      '--color-text-secondary': '#555555',
      '--color-text-muted': '#888888',
      '--color-text-faint': '#999999',
      '--color-accent': '#8b7355',
      '--color-border': '#e5e0d8',
      '--color-border-light': '#f0ece6',
      '--color-footer-bg': '#1a1a1a',
      '--border-radius': '0px',
      '--card-shadow': 'none',
      '--card-padding': '12px',
    },
  },
  boutique: {
    name: 'boutique',
    label: 'Boutique',
    description: 'Warm & personal for lifestyle, wellness, and education sites.',
    fontFamily: 'sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap',
    variables: {
      '--font-heading': "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-body': "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-sans': "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      '--color-bg': '#fdf8f4',
      '--color-bg-warm': '#f5ede5',
      '--color-bg-article': '#faf6f1',
      '--color-text': '#2d2d2d',
      '--color-text-body': '#3d3d3d',
      '--color-text-secondary': '#5a5a5a',
      '--color-text-muted': '#8a8a8a',
      '--color-text-faint': '#a0a0a0',
      '--color-accent': '#c97b6b',
      '--color-border': '#e8e0d8',
      '--color-border-light': '#f2ece5',
      '--color-footer-bg': '#2d2420',
      '--border-radius': '16px',
      '--card-shadow': '0 2px 12px rgba(0,0,0,0.07)',
      '--card-padding': '16px',
    },
  },
  modern: {
    name: 'modern',
    label: 'Modern',
    description: 'Clean & minimal for tech, SaaS, and professional brands.',
    fontFamily: 'sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    variables: {
      '--font-heading': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-body': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-sans': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      '--color-bg': '#ffffff',
      '--color-bg-warm': '#f8f9fa',
      '--color-bg-article': '#ffffff',
      '--color-text': '#0a0a0a',
      '--color-text-body': '#1a1a1a',
      '--color-text-secondary': '#4a4a4a',
      '--color-text-muted': '#6b7280',
      '--color-text-faint': '#9ca3af',
      '--color-accent': '#2563eb',
      '--color-border': '#e5e7eb',
      '--color-border-light': '#f3f4f6',
      '--color-footer-bg': '#111827',
      '--border-radius': '8px',
      '--card-shadow': 'none',
      '--card-padding': '12px',
    },
  },
}

export function getTheme(name: string | null | undefined): ThemePreset {
  return THEMES[(name as ThemeName)] || THEMES.editorial
}

export function getThemeNames(): ThemeName[] {
  return Object.keys(THEMES) as ThemeName[]
}
