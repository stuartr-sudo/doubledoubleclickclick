'use client'

import { Suspense } from 'react'
import LeadCaptureContent from './LeadCaptureContent'

export default function LeadCapturePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeadCaptureContent />
    </Suspense>
  )
}

