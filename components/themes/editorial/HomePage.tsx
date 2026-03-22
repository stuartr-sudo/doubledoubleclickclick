import type { HomePageProps } from '../types'
import HomeHero from '@/components/HomeHero'
import LatestGrid from '@/components/LatestGrid'
import NewsletterBanner from '@/components/NewsletterBanner'
import MoreStories from '@/components/MoreStories'
import ProductSpotlight from '@/components/ProductSpotlight'

export default function EditorialHomePage({ brand, posts, config }: HomePageProps) {
  return (
    <div className="container" style={{ paddingTop: '24px' }}>
      <HomeHero posts={posts.slice(0, 4)} />
      <LatestGrid posts={posts.slice(4, 7)} />
      <div style={{ marginBottom: '24px' }}>
        <ProductSpotlight limit={1} offset={1} />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <NewsletterBanner username={config.username} />
      </div>
      <MoreStories posts={posts.slice(7)} />
    </div>
  )
}
