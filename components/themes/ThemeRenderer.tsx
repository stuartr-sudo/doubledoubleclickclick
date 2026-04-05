import type { HomePageProps, HeaderProps, BlogPostPageProps } from './types'

import EditorialHeader from './editorial/Header'
import BoutiqueHeader from './boutique/Header'
import ModernHeader from './modern/Header'
import EditorialHomePage from './editorial/HomePage'
import BoutiqueHomePage from './boutique/HomePage'
import ModernHomePage from './modern/HomePage'
import EditorialBlogPost from './editorial/BlogPost'
import BoutiqueBlogPost from './boutique/BlogPost'
import ModernBlogPost from './modern/BlogPost'

const HEADERS: Record<string, React.ComponentType<HeaderProps>> = {
  editorial: EditorialHeader,
  boutique: BoutiqueHeader,
  modern: ModernHeader,
}

const HOME_PAGES: Record<string, React.ComponentType<HomePageProps>> = {
  editorial: EditorialHomePage,
  boutique: BoutiqueHomePage,
  modern: ModernHomePage,
}

const BLOG_POSTS: Record<string, React.ComponentType<BlogPostPageProps>> = {
  editorial: EditorialBlogPost,
  boutique: BoutiqueBlogPost,
  modern: ModernBlogPost,
}

export function ThemeHeader({ theme, ...props }: HeaderProps & { theme: string }) {
  if (!HEADERS[theme]) {
    console.warn(`[ThemeRenderer] Unknown theme "${theme}", falling back to editorial`)
  }
  const Component = HEADERS[theme] || HEADERS.editorial
  return <Component {...props} />
}

export function ThemeHomePage({ theme, ...props }: HomePageProps & { theme: string }) {
  if (!HOME_PAGES[theme]) {
    console.warn(`[ThemeRenderer] Unknown theme "${theme}", falling back to editorial`)
  }
  const Component = HOME_PAGES[theme] || HOME_PAGES.editorial
  return <Component {...props} />
}

export function ThemeBlogPost({ theme, ...props }: BlogPostPageProps & { theme: string }) {
  if (!BLOG_POSTS[theme]) {
    console.warn(`[ThemeRenderer] Unknown theme "${theme}", falling back to editorial`)
  }
  const Component = BLOG_POSTS[theme] || BLOG_POSTS.editorial
  return <Component {...props} />
}
