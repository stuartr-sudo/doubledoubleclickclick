# DoubleClick UI Design System

## 🎨 Color Palette (Modern & Professional)

### Primary Colors
- **Brand Purple**: `#8B5CF6` (Vibrant, tech-forward)
- **Brand Blue**: `#3B82F6` (Trust, stability)
- **Accent Gradient**: `from-purple-600 to-blue-600`

### Semantic Colors
- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)
- **Info**: `#3B82F6` (Blue)

### Neutrals (Modern Gray Scale)
- **Gray 950**: `#0A0A0A` (Deepest dark)
- **Gray 900**: `#171717`
- **Gray 800**: `#262626`
- **Gray 700**: `#404040`
- **Gray 50**: `#FAFAFA` (Lightest)

## 🔲 Component Standards

### Loading States
**Unified Pattern:**
```jsx
// Skeleton loaders for content
<Skeleton className="h-4 w-[250px]" />

// Spinner for actions
<Loader2 className="h-4 w-4 animate-spin" />

// Full page loader
<PageLoader />
```

### Modal/Dialog Standards
- **Max Width**: `max-w-2xl` (default), `max-w-4xl` (large), `max-w-md` (small)
- **Backdrop**: `backdrop-blur-sm bg-black/50`
- **Border**: `border border-purple-500/20`
- **Padding**: Consistent `p-6` for content
- **Animation**: Smooth fade + scale

### Cards
- **Background**: `bg-white dark:bg-gray-900`
- **Border**: `border border-gray-200 dark:border-gray-800`
- **Hover**: `hover:border-purple-500/50 transition-all duration-200`
- **Shadow**: `shadow-sm hover:shadow-md`

### Buttons
**Primary**: Purple gradient with glow
**Secondary**: Gray outline
**Destructive**: Red with confirmation
**Ghost**: Transparent with hover

## 🎭 Animation Standards

### Transitions
- **Fast**: `150ms` (button hovers)
- **Normal**: `200ms` (cards, inputs)
- **Slow**: `300ms` (modals, page transitions)

### Easing
- Default: `ease-out`
- Bouncy: `ease-in-out`
- Smooth: `cubic-bezier(0.4, 0, 0.2, 1)`

## 📱 Responsive Breakpoints
- **Mobile**: `< 640px`
- **Tablet**: `640px - 1024px`
- **Desktop**: `> 1024px`
- **Wide**: `> 1536px`

## 🎯 Typography
- **Headings**: `font-bold tracking-tight`
- **Body**: `font-normal leading-relaxed`
- **Code**: `font-mono text-sm`
- **Scale**: 
  - H1: `text-4xl md:text-5xl`
  - H2: `text-3xl md:text-4xl`
  - H3: `text-2xl md:text-3xl`
  - Body: `text-base`
  - Small: `text-sm`
  - Tiny: `text-xs`

## ✨ Special Effects
- **Glass Morphism**: `backdrop-blur-md bg-white/10`
- **Gradient Text**: `bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600`
- **Glow Effect**: `shadow-[0_0_30px_rgba(139,92,246,0.3)]`

