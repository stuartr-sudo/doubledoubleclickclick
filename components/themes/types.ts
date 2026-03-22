import type { BlogPost } from '@/lib/posts'
import type { BrandData } from '@/lib/brand'
import type { TenantConfig } from '@/lib/tenant'

export type { TenantConfig }

export interface HomePageProps {
  brand: BrandData
  posts: BlogPost[]
  config: TenantConfig
}

export interface HeaderProps {
  brandName: string
  logoUrl?: string
  tagline?: string
  categories: string[]
}

export interface BlogPostPageProps {
  brand: BrandData
  post: BlogPost
  config: TenantConfig
}
