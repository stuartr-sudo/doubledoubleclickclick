import type { HomePageProps, HeaderProps, BlogPostPageProps } from './types'

import EditorialHeader from './editorial/Header'
import EditorialHomePage from './editorial/HomePage'
import EditorialBlogPost from './editorial/BlogPost'

const HEADERS: Record<string, React.ComponentType<HeaderProps>> = {
  editorial: EditorialHeader,
}

const HOME_PAGES: Record<string, React.ComponentType<HomePageProps>> = {
  editorial: EditorialHomePage,
}

const BLOG_POSTS: Record<string, React.ComponentType<BlogPostPageProps>> = {
  editorial: EditorialBlogPost,
}

export function ThemeHeader({ theme, ...props }: HeaderProps & { theme: string }) {
  const Component = HEADERS[theme] || HEADERS.editorial
  return <Component {...props} />
}

export function ThemeHomePage({ theme, ...props }: HomePageProps & { theme: string }) {
  const Component = HOME_PAGES[theme] || HOME_PAGES.editorial
  return <Component {...props} />
}

export function ThemeBlogPost({ theme, ...props }: BlogPostPageProps & { theme: string }) {
  const Component = BLOG_POSTS[theme] || BLOG_POSTS.editorial
  return <Component {...props} />
}
