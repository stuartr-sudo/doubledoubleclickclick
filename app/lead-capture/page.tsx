'use client'

import { Suspense } from 'react'
import LeadCaptureContent from './LeadCaptureContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: {
    canonical: '/lead-capture',
  },
}

export default function LeadCapturePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeadCaptureContent />
    </Suspense>
  )
}

