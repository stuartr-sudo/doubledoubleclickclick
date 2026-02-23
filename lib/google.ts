import { GoogleAuth } from 'google-auth-library'

/**
 * Google API integrations for automated provisioning.
 *
 * All management APIs require a GCP service account. Set up:
 *
 *   GOOGLE_SERVICE_ACCOUNT_JSON — Full JSON key file contents (from GCP IAM)
 *   GOOGLE_CLOUD_PROJECT        — GCP project ID (e.g., gen-lang-client-0071841353)
 *   GOOGLE_ANALYTICS_ACCOUNT_ID — GA4 account ID (found in GA Admin → Account Settings)
 *   GOOGLE_TAG_MANAGER_ACCOUNT_ID — GTM account ID (found in GTM Admin → Account Settings)
 *
 * Service account permissions needed:
 *   - GA4: Add SA email as Editor on GA account
 *   - GTM: Add SA email as Editor on GTM account
 *   - Search Console: SA becomes verified owner via API
 *   - Cloud Domains: Grant roles/domains.admin IAM role on GCP project
 */

let cachedAuth: GoogleAuth | null = null

function getAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth

  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured')

  const credentials = JSON.parse(keyJson)
  cachedAuth = new GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/analytics.edit',
      'https://www.googleapis.com/auth/tagmanager.edit.containers',
      'https://www.googleapis.com/auth/tagmanager.readonly',
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/siteverification',
      'https://www.googleapis.com/auth/cloud-platform',
    ],
  })

  return cachedAuth
}

async function getAccessToken(): Promise<string> {
  const auth = getAuth()
  const client = await auth.getClient()
  const tokenRes = await client.getAccessToken()
  if (!tokenRes.token) throw new Error('Failed to get Google access token')
  return tokenRes.token
}

async function googleFetch(url: string, options: RequestInit = {}): Promise<any> {
  const token = await getAccessToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Google API error (${res.status}): ${err?.error?.message || res.statusText}`)
  }

  // Some endpoints (e.g., Search Console sites.add) return empty 204
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

/* ─────────────────────────────────────────────────
   Public helpers
   ───────────────────────────────────────────────── */

/** Returns true if service account credentials are configured. */
export function isGoogleServiceConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON
}

/* ─────────────────────────────────────────────────
   Google Analytics 4
   ───────────────────────────────────────────────── */

/**
 * Create a GA4 property + web data stream.
 * Returns the Measurement ID (G-XXXXXXX) to embed in the site.
 */
export async function createGA4Property(
  displayName: string,
  siteUrl: string,
  timeZone = 'America/New_York'
) {
  const accountId = process.env.GOOGLE_ANALYTICS_ACCOUNT_ID
  if (!accountId) throw new Error('GOOGLE_ANALYTICS_ACCOUNT_ID not configured')

  // Create the property
  const property = await googleFetch(
    'https://analyticsadmin.googleapis.com/v1alpha/properties',
    {
      method: 'POST',
      body: JSON.stringify({
        parent: `accounts/${accountId}`,
        displayName,
        timeZone,
        currencyCode: 'USD',
      }),
    }
  )

  // Create a web data stream on the property
  const stream = await googleFetch(
    `https://analyticsadmin.googleapis.com/v1alpha/${property.name}/dataStreams`,
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'WEB_DATA_STREAM',
        displayName: `${displayName} Web`,
        webStreamData: { defaultUri: siteUrl },
      }),
    }
  )

  return {
    propertyId: property.name?.split('/')[1],
    propertyName: property.name,
    measurementId: stream.webStreamData?.measurementId as string, // G-XXXXXXX
    streamName: stream.name,
  }
}

/* ─────────────────────────────────────────────────
   Google Tag Manager
   ───────────────────────────────────────────────── */

/**
 * Create a GTM web container.
 * Returns the Public ID (GTM-XXXXXXX) to embed in the site.
 */
export async function createGTMContainer(containerName: string) {
  const accountId = process.env.GOOGLE_TAG_MANAGER_ACCOUNT_ID
  if (!accountId) throw new Error('GOOGLE_TAG_MANAGER_ACCOUNT_ID not configured')

  const container = await googleFetch(
    `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: containerName,
        usageContext: ['web'],
      }),
    }
  )

  return {
    containerId: container.containerId as string,
    publicId: container.publicId as string, // GTM-XXXXXXX
    path: container.path as string,
  }
}

/* ─────────────────────────────────────────────────
   Google Search Console
   ───────────────────────────────────────────────── */

/**
 * Add a site to Search Console and get a DNS TXT verification token.
 * The token should be added as a TXT record on the domain root.
 * After DNS propagates, call verifySearchConsoleSite() to complete verification.
 */
export async function addSearchConsoleSite(siteUrl: string) {
  // Get a DNS TXT verification token
  const tokenData = await googleFetch(
    'https://www.googleapis.com/siteVerification/v1/token',
    {
      method: 'POST',
      body: JSON.stringify({
        site: { type: 'SITE', identifier: siteUrl },
        verificationMethod: 'DNS_TXT',
      }),
    }
  )

  // Add the site to Search Console (may fail if not yet verified, that's ok)
  try {
    await googleFetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`,
      { method: 'PUT' }
    )
  } catch {
    // Will succeed after verification
  }

  return {
    siteUrl,
    verificationToken: tokenData.token as string,
    verificationMethod: 'DNS_TXT',
  }
}

/**
 * Verify a previously added Search Console site (call after DNS TXT record is live).
 */
export async function verifySearchConsoleSite(siteUrl: string) {
  return googleFetch(
    'https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=DNS_TXT',
    {
      method: 'POST',
      body: JSON.stringify({
        site: { type: 'SITE', identifier: siteUrl },
      }),
    }
  )
}

/* ─────────────────────────────────────────────────
   Google Cloud Domains — Domain Registration
   ───────────────────────────────────────────────── */

/**
 * Retrieve registration parameters (price, availability, notices) for a domain.
 * Uses the service account auth (not API key) for consistency.
 */
export async function getRegistrationParams(domainName: string) {
  const project = process.env.GOOGLE_CLOUD_PROJECT
  if (!project) throw new Error('GOOGLE_CLOUD_PROJECT not configured')

  const location = `projects/${project}/locations/global`
  return googleFetch(
    `https://domains.googleapis.com/v1/${location}/registrations:retrieveRegisterParameters?domainName=${encodeURIComponent(domainName)}`
  )
}

/**
 * Register (purchase) a domain via Google Cloud Domains.
 * Charges the billing account linked to the GCP project.
 * Returns a long-running operation — domain becomes ACTIVE within 1-2 minutes.
 */
export async function registerDomain(
  domainName: string,
  contactEmail: string,
  yearlyPrice: { currencyCode: string; units: string; nanos?: number },
  domainNotices: string[] = []
) {
  const project = process.env.GOOGLE_CLOUD_PROJECT
  if (!project) throw new Error('GOOGLE_CLOUD_PROJECT not configured')

  const location = `projects/${project}/locations/global`

  const result = await googleFetch(
    `https://domains.googleapis.com/v1/${location}/registrations:register`,
    {
      method: 'POST',
      body: JSON.stringify({
        registration: {
          domainName,
          contactSettings: {
            privacy: 'REDACTED_CONTACT_DATA',
            registrantContact: {
              email: contactEmail,
              postalAddress: { regionCode: 'US' },
            },
            adminContact: {
              email: contactEmail,
              postalAddress: { regionCode: 'US' },
            },
            technicalContact: {
              email: contactEmail,
              postalAddress: { regionCode: 'US' },
            },
          },
        },
        yearlyPrice,
        domainNotices,
      }),
    }
  )

  return {
    domainName,
    operationName: result.name as string,
    status: 'REGISTRATION_PENDING',
  }
}
