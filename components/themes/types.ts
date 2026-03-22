import type { BlogPost } from '@/lib/posts'
import type { BrandData } from '@/lib/brand'

export interface TenantConfig {
  username: string
  siteName: string
  siteUrl: string
}

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
