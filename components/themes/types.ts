import type { BlogPost } from '@/lib/posts'
import type { BrandData } from '@/lib/brand'
import type { TenantConfig } from '@/lib/tenant'

export type { TenantConfig }

export interface HomePageProps {
  brand: BrandData
  posts: BlogPost[]
  config: TenantConfig
}

export interface PageLink {
  label: string
  href: string
}

export interface HeaderProps {
  brandName: string
  logoUrl?: string
  tagline?: string
  categories: string[]
  /** Static page links to render in the header nav (Blog, About, Contact, etc.).
   *  Always rendered after Home and any blog categories. */
  pages?: PageLink[]
}

export interface BlogPostPageProps {
  brand: BrandData
  post: BlogPost
  config: TenantConfig
}
