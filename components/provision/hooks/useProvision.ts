'use client'

import { useCallback, useRef } from 'react'
import {
  useProvisionContext,
  type ProvisionState,
  type PipelineStatus,
  type PipelineStep,
} from '../ProvisionContext'

/* ═══════════════════════════════════════════════════════════
   PAYLOAD BUILDER
   ═══════════════════════════════════════════════════════════ */

/**
 * Derives a URL-safe username from a display name.
 * Lowercase, hyphenated, no special chars.
 */
function deriveUsername(displayName: string): string {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Converts an array of social URLs into a platform-keyed object,
 * matching the existing ProvisionForm behaviour.
 */
function buildSocialUrlsMap(
  urls: string[],
): Record<string, string> | undefined {
  const filtered = urls.filter(Boolean)
  if (filtered.length === 0) return undefined

  return filtered.reduce<Record<string, string>>((acc, url, i) => {
    const platform = url.includes('twitter.com') || url.includes('x.com')
      ? 'twitter'
      : url.includes('linkedin.com')
        ? 'linkedin'
        : url.includes('instagram.com')
          ? 'instagram'
          : url.includes('youtube.com')
            ? 'youtube'
            : url.includes('facebook.com')
              ? 'facebook'
              : url.includes('tiktok.com')
                ? 'tiktok'
                : `social_${i}`
    return { ...acc, [platform]: url }
  }, {})
}

/**
 * Maps camelCase ProvisionState fields to the snake_case payload
 * expected by POST /api/provision.
 */
export function buildProvisionPayload(state: ProvisionState) {
  const resolvedUsername =
    state.username || deriveUsername(state.displayName)

  return {
    // Identity
    username: resolvedUsername.trim().toLowerCase(),
    display_name: state.displayName.trim(),
    website_url: state.websiteUrl.trim() || undefined,
    contact_email:
      state.contactEmail.trim() ||
      (state.domain
        ? `contact@${state.domain.trim()}`
        : `contact@${resolvedUsername.trim().toLowerCase()}.com`),
    domain: state.domain.trim() || undefined,
    niche: state.niche.trim() || undefined,
    tagline: state.tagline.trim() || undefined,

    // Brand voice
    blurb: state.brandBlurb.trim() || undefined,
    target_market: state.targetMarket.trim() || undefined,
    brand_voice_tone: state.brandVoice.trim() || undefined,
    seed_keywords: state.seedKeywords
      ? state.seedKeywords
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,

    // Research
    research_context: state.researchContext || undefined,
    ica_profile: state.icaProfile || undefined,
    style_guide: state.styleGuide || undefined,

    // Visual
    primary_color: state.primaryColor || undefined,
    secondary_color: state.secondaryColor || undefined,
    accent_color: state.accentColor || undefined,
    heading_font: state.headingFont || undefined,
    body_font: state.bodyFont || undefined,
    theme: state.theme || undefined,
    logo_url: state.logoUrl.trim() || undefined,
    image_style: state.imageStyle,

    // Author
    author_name: state.authorName.trim() || undefined,
    author_bio: state.authorBio.trim() || undefined,
    author_image_url: state.authorImageUrl.trim() || undefined,
    author_url: state.authorPageUrl.trim() || undefined,
    author_social_urls: buildSocialUrlsMap(state.authorSocials),

    // Deploy config
    stitch_enabled: state.stitchEnabled,
    fly_region: state.flyRegion,
    publishing_provider: 'supabase_blog',
    skip_pipeline: state.skipPipeline,
    skip_deploy: false,

    // Google services
    setup_google_analytics: state.setupGoogleAnalytics,
    setup_google_tag_manager: state.setupGoogleTagManager,
    setup_search_console: state.setupSearchConsole,

    // Domain purchase
    purchase_domain:
      !!state.selectedDomainData && !state.manualDns,
    manual_dns: state.manualDns,
    domain_yearly_price:
      state.selectedDomainData?.yearlyPrice || undefined,
    domain_notices:
      state.selectedDomainData?.domainNotices || undefined,

    // Products
    is_affiliate: state.isAffiliate,
    affiliate_link: state.isAffiliate
      ? state.affiliateLink.trim() || state.productUrl.trim() || undefined
      : undefined,
    product_url: state.productUrl.trim() || undefined,
    product_name: state.productName.trim() || undefined,
    approved_products: [
      ...(state.productName.trim() || state.productUrl.trim()
        ? [
            {
              name: state.productName.trim(),
              url: state.productUrl.trim(),
              description: '',
            },
          ]
        : []),
    ].filter((p) => p.name || p.url),

    // Content config
    languages:
      state.translationEnabled && state.selectedLanguages.length > 0
        ? state.selectedLanguages
        : undefined,
    articles_per_day: state.articlesPerDay,

    // Network
    network_partners:
      state.networkPartners.length > 0
        ? state.networkPartners
        : undefined,
  }
}

/* ═══════════════════════════════════════════════════════════
   PROVISION RESULT TYPE (matches API response shape)
   ═══════════════════════════════════════════════════════════ */

export interface PhaseResult {
  phase: string
  status: 'success' | 'warning' | 'error' | 'skipped'
  severity: 'critical' | 'important' | 'optional' | 'silent'
  message?: string
  data?: Record<string, unknown>
  duration_ms: number
}

export interface ProvisionResult {
  success: boolean
  error?: string
  warnings?: string[]
  phase_results?: PhaseResult[]
  notifications?: Record<string, Record<string, unknown>>
  fly?: {
    app?: string
    url?: string
    ipv4?: string
    ipv6?: string
  }
  google?: {
    ga_measurement_id?: string
    gtm_public_id?: string
  }
  dns_records?: unknown[]
  [key: string]: unknown
}

/* ═══════════════════════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════════════════════ */

export function useProvision() {
  const { state } = useProvisionContext()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const seenStepsRef = useRef<Set<string>>(new Set())

  /**
   * Sends the full provision payload to POST /api/provision.
   * Returns the parsed response.
   */
  const handleProvision = useCallback(
    async (stateOverride?: ProvisionState): Promise<ProvisionResult> => {
      const s = stateOverride ?? state

      const payload = buildProvisionPayload(s)

      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s.provisionSecret}`,
        },
        body: JSON.stringify(payload),
      })

      const data: ProvisionResult = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Provisioning failed')
      }

      return data
    },
    [state],
  )

  /**
   * Polls `/api/admin/pipeline-status` every 5 seconds.
   * Calls `onUpdate` with the current pipeline status on each tick.
   * Automatically stops when the pipeline reaches a terminal state.
   */
  const startPolling = useCallback(
    (
      trackingPath: string,
      onUpdate: (status: PipelineStatus, newSteps: PipelineStep[]) => void,
    ) => {
      // Reset seen steps for this polling session
      seenStepsRef.current = new Set()

      const poll = async () => {
        try {
          const res = await fetch(
            `/api/admin/pipeline-status?path=${encodeURIComponent(trackingPath)}`,
          )
          const data = await res.json()

          if (data.success && data.pipeline) {
            const pipeline: PipelineStatus = data.pipeline

            // Find newly-seen steps
            const completed: PipelineStep[] =
              pipeline.steps_completed || []
            const newSteps: PipelineStep[] = []
            for (const s of completed) {
              const key = `${s.step}-${s.status}`
              if (!seenStepsRef.current.has(key)) {
                seenStepsRef.current.add(key)
                newSteps.push(s)
              }
            }

            onUpdate(pipeline, newSteps)

            // Auto-stop on terminal states
            if (
              ['completed', 'completed_with_errors', 'failed'].includes(
                pipeline.status,
              )
            ) {
              if (pollRef.current) {
                clearInterval(pollRef.current)
                pollRef.current = null
              }
            }
          }
        } catch {
          // Silently ignore polling errors — will retry next tick
        }
      }

      // Immediate first poll, then every 5 seconds
      poll()
      pollRef.current = setInterval(poll, 5000)
    },
    [],
  )

  /**
   * Stops polling by clearing the interval.
   */
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  return { handleProvision, startPolling, stopPolling }
}
