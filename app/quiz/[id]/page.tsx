import { getQuizById } from '@/lib/quiz'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import SiteHeader from '@/components/SiteHeader'
import QuizPlayer from '@/components/QuizPlayer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface QuizPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const { id } = await params
  const quiz = await getQuizById(id)
  const config = getTenantConfig()
  return {
    title: quiz ? `${quiz.title} | ${config.siteName}` : 'Quiz Not Found',
    description: quiz?.description || '',
    robots: 'noindex, nofollow',
  }
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params
  const config = getTenantConfig()
  const brand = await getBrandData()
  const brandName = brand.guidelines?.name || config.siteName
  const quiz = await getQuizById(id)

  if (!quiz) {
    return (
      <>
        <SiteHeader logoText={brandName} logoImage={brand.specs?.logo_url || undefined} />
        <main style={{ paddingTop: '120px' }}>
          <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <h1>Quiz Not Found</h1>
            <p style={{ color: 'var(--color-text-light)', marginTop: '0.5rem' }}>
              This quiz does not exist or is not available.
            </p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
              Back to Home
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <SiteHeader logoText={brandName} logoImage={brand.specs?.logo_url || undefined} />
      <main style={{ paddingTop: '100px' }}>
        <QuizPlayer quiz={quiz} brandId={config.username} />
      </main>
    </>
  )
}
