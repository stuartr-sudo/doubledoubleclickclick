import type { HomePageProps, HeaderProps, BlogPostPageProps } from './types'

// Placeholder imports — will be replaced as editorial components are built
// For now, create minimal stubs so the file parses

const Placeholder = ({ children }: { children?: React.ReactNode }) => <div>{children || 'Loading theme...'}</div>

const HEADERS: Record<string, React.ComponentType<HeaderProps>> = {}
const HOME_PAGES: Record<string, React.ComponentType<HomePageProps>> = {}
const BLOG_POSTS: Record<string, React.ComponentType<BlogPostPageProps>> = {}

export function ThemeHeader({ theme, ...props }: HeaderProps & { theme: string }) {
  const Component = HEADERS[theme] || HEADERS.editorial || Placeholder
  return <Component {...props} />
}

export function ThemeHomePage({ theme, ...props }: HomePageProps & { theme: string }) {
  const Component = HOME_PAGES[theme] || HOME_PAGES.editorial || Placeholder
  return <Component {...props} />
}

export function ThemeBlogPost({ theme, ...props }: BlogPostPageProps & { theme: string }) {
  const Component = BLOG_POSTS[theme] || BLOG_POSTS.editorial || Placeholder
  return <Component {...props} />
}
