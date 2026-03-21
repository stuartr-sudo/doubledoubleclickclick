import { createServiceClient } from '@/lib/supabase/service'
import DraftReview from './DraftReview'
import type { DraftRecord } from '@/lib/draft-types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Site Drafts Review',
  robots: 'noindex, nofollow',
}

export default async function DraftsPage() {
  const supabase = createServiceClient()
  const { data: drafts } = await supabase
    .from('site_drafts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Site Drafts
      </h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
        Review submitted site concepts, select domains, and provision.
      </p>
      <DraftReview initialDrafts={(drafts || []) as DraftRecord[]} />
    </main>
  )
}
