import { makeAuthenticatedRequest } from './supabaseClient'

// Helper function to call Vercel API functions
const callVercelFunction = async (endpoint, data = {}) => {
  const response = await makeAuthenticatedRequest(`/api${endpoint}`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return response
}

// Webhook functions
export const webhook = {
  invoke: async (functionName, data) => callVercelFunction(`/webhooks/${functionName}`, data)
}

export const captureEmail = async (data) => callVercelFunction('/email/capture', data)
export const interestingFact = async (data) => callVercelFunction('/ai/interesting-fact', data)

// Airtable functions (CRITICAL)
export const publishToAirtable = async (data) => callVercelFunction('/airtable/publish', data)
export const airtableSync = async (data) => callVercelFunction('/airtable/sync', data)
export const airtableListRecords = async (data) => callVercelFunction('/airtable/list-records', data)
export const airtableCreateRecord = async (data) => callVercelFunction('/airtable/create-record', data)
export const airtableUpdateRecord = async (data) => callVercelFunction('/airtable/update-record', data)
export const airtableDeleteRecord = async (data) => callVercelFunction('/airtable/delete-record', data)
export const airtableListFields = async (data) => callVercelFunction('/airtable/list-fields', data)

export const receiveWebhook = async (data) => callVercelFunction('/webhooks/receive', data)

// Search functions
export const youtubeSearch = async (data) => callVercelFunction('/integrations/youtube/search', data)
export const tiktokSearch = async (data) => callVercelFunction('/integrations/tiktok/search', data)

// AI Image Generation functions
export const generateImageViaWebhook = async (data) => callVercelFunction('/ai/generate-image-webhook', data)
export const saveGeneratedImage = async (data) => callVercelFunction('/ai/save-generated-image', data)
export const getCallbackUrl = async (data) => callVercelFunction('/ai/get-callback-url', data)
export const saveGeneratedImageWebhook = async (data) => callVercelFunction('/ai/save-generated-image-webhook', data)
export const imageReceiverWebhook = async (data) => callVercelFunction('/webhooks/image-receiver', data)
export const authenticatedImageReceiver = async (data) => callVercelFunction('/webhooks/authenticated-image-receiver', data)
export const ingestImageWebhook = async (data) => callVercelFunction('/webhooks/ingest-image', data)
export const receiveImageByToken = async (data) => callVercelFunction('/webhooks/receive-image-by-token', data)
export const receiveString = async (data) => callVercelFunction('/webhooks/receive-string', data)
export const saveImageFromString = async (data) => callVercelFunction('/ai/save-image-from-string', data)

// AI Generation functions
export const generateImageFalAi = async (data) => callVercelFunction('/ai/generate-image-fal', data)
export const generateVideoFalAi = async (data) => callVercelFunction('/ai/generate-video-fal', data)
export const generateEnhancedPrompt = async (data) => callVercelFunction('/ai/generate-enhanced-prompt', data)
export const getVideoStatus = async (data) => callVercelFunction('/ai/get-video-status', data)
export const humanizeText = async (data) => callVercelFunction('/ai/humanize-text', data)
export const ingestSitemap = async (data) => callVercelFunction('/integrations/sitemap/ingest', data)
export const getTikTokOembed = async (data) => callVercelFunction('/integrations/tiktok/oembed', data)
export const generateInfographic = async (data) => callVercelFunction('/ai/generate-infographic', data)

export const scheduleWorker = async (data) => callVercelFunction('/scheduling/worker', data)
export const exportPosts = async (data) => callVercelFunction('/content/export-posts', data)

// Amazon functions
export const amazonProduct = async (data) => callVercelFunction('/integrations/amazon/product', data)
export const amazonReviews = async (data) => callVercelFunction('/integrations/amazon/reviews', data)
export const extractProductMeta = async (data) => callVercelFunction('/integrations/amazon/extract-meta', data)

// CMS functions
export const testContentCmsConnection = async (data) => callVercelFunction('/cms/test-connection', data)
export const publishContentToCms = async (data) => callVercelFunction('/cms/publish', data)

// KEI functions
export const generateKeiImage = async (data) => callVercelFunction('/ai/generate-kei-image', data)
export const getKeiJob = async (data) => callVercelFunction('/ai/get-kei-job', data)
export const generateKeiVideo = async (data) => callVercelFunction('/ai/generate-kei-video', data)

// Video generation functions
export const generateVeo3Video = async (data) => callVercelFunction('/ai/generate-veo3-video', data)
export const getVeo3Status = async (data) => callVercelFunction('/ai/get-veo3-status', data)
export const getVeo3HD = async (data) => callVercelFunction('/ai/get-veo3-hd', data)
export const generateRunwayVideo = async (data) => callVercelFunction('/ai/generate-runway-video', data)
export const getRunwayStatus = async (data) => callVercelFunction('/ai/get-runway-status', data)
export const generateFluxKontextImage = async (data) => callVercelFunction('/ai/generate-flux-kontext-image', data)
export const getFluxKontextStatus = async (data) => callVercelFunction('/ai/get-flux-kontext-status', data)
export const generateMidjourneyImage = async (data) => callVercelFunction('/ai/generate-midjourney-image', data)
export const getMidjourneyStatus = async (data) => callVercelFunction('/ai/get-midjourney-status', data)

export const getFaqRecommendations = async (data) => callVercelFunction('/ai/get-faq-recommendations', data)

// Stripe functions
export const createStripePaymentLink = async (data) => callVercelFunction('/stripe/create-payment-link', data)
export const createInvoiceCheckoutSession = async (data) => callVercelFunction('/stripe/create-invoice-checkout', data)
export const stripeWebhook = async (data) => callVercelFunction('/webhooks/stripe', data)
export const createCheckoutSession = async (data) => callVercelFunction('/stripe/create-checkout-session', data)
export const createCustomerPortalSession = async (data) => callVercelFunction('/stripe/create-customer-portal', data)
export const verifyStripePayment = async (data) => callVercelFunction('/stripe/verify-payment', data)
export const listStripeCoupons = async (data) => callVercelFunction('/stripe/list-coupons', data)
export const syncStripeDiscounts = async (data) => callVercelFunction('/stripe/sync-discounts', data)

// Publishing functions
export const publishToWebhook = async (data) => callVercelFunction('/content/publish-to-webhook', data)
export const upscaleMidjourneyImage = async (data) => callVercelFunction('/ai/upscale-midjourney-image', data)
export const stitchWithJson2Video = async (data) => callVercelFunction('/ai/stitch-json2video', data)
export const generateAceStepMusic = async (data) => callVercelFunction('/ai/generate-acestep-music', data)
export const generateWanEffectsVideo = async (data) => callVercelFunction('/ai/generate-wan-effects-video', data)
export const generateMareyI2V = async (data) => callVercelFunction('/ai/generate-marey-i2v', data)
export const externalStitchCallback = async (data) => callVercelFunction('/webhooks/external-stitch-callback', data)

export const createBrandPaymentLink = async (data) => callVercelFunction('/stripe/create-brand-payment-link', data)
export const callPromptWebhook = async (data) => callVercelFunction('/webhooks/call-prompt', data)

// Sitemap functions
export const listSitemaps = async (data) => callVercelFunction('/integrations/sitemap/list', data)
export const deleteSitemapById = async (data) => callVercelFunction('/integrations/sitemap/delete', data)

export const getSunoStatus = async (data) => callVercelFunction('/ai/get-suno-status', data)
export const publishContentToNotionEnhanced = async (data) => callVercelFunction('/integrations/notion/publish-enhanced', data)
export const findSourceAndCite = async (data) => callVercelFunction('/ai/find-source-and-cite', data)
export const publishToShopifyEnhanced = async (data) => callVercelFunction('/integrations/shopify/publish-enhanced', data)
export const extractWebsiteContent = async (data) => callVercelFunction('/integrations/website/extract-content', data)
export const executeEditorWorkflow = async (data) => callVercelFunction('/workflows/execute-editor', data)
export const generateArticleFaqs = async (data) => callVercelFunction('/ai/generate-article-faqs', data)
export const generatePageFromEndpoint = async (data) => callVercelFunction('/content/generate-page-from-endpoint', data)

// LLM Router functions
export const llmRouter = async (data) => callVercelFunction('/ai/llm-router', data)
export const llmRouterStatus = async (data) => callVercelFunction('/ai/llm-router-status', data)

export const securePublish = async (data) => callVercelFunction('/content/secure-publish', data)
export const checkAndConsumeTokens = async (data) => callVercelFunction('/utils/check-consume-tokens', data)
export const callFeatureEndpoint = async (data) => callVercelFunction('/utils/call-feature-endpoint', data)
export const listCallableFunctions = async (data) => callVercelFunction('/utils/list-callable-functions', data)

// TTS functions
export const generateElevenlabsTts = async (data) => callVercelFunction('/ai/generate-elevenlabs-tts', data)
export const getElevenlabsVoices = async (data) => callVercelFunction('/ai/get-elevenlabs-voices', data)
export const generateKeiTts = async (data) => callVercelFunction('/ai/generate-kei-tts', data)

export const autoAssignUsername = async (data) => callVercelFunction('/utils/auto-assign-username', data)

export const callFaqEndpoint = async (data) => callVercelFunction('/utils/call-faq-endpoint', data)
export const uploadUserCss = async (data) => callVercelFunction('/utils/upload-user-css', data)
export const manualUserFix = async (data) => callVercelFunction('/admin/manual-user-fix', data)

export const trackAffiliateReferral = async (data) => callVercelFunction('/affiliate/track-referral', data)

export const addTopicKeyword = async (data) => callVercelFunction('/content/add-topic-keyword', data)

// Google Drive functions
export const googleDriveAuth = async (data) => callVercelFunction('/integrations/google-drive/auth', data)
export const googleDriveFiles = async (data) => callVercelFunction('/integrations/google-drive/files', data)

export const trustpilotReviews = async (data) => callVercelFunction('/integrations/trustpilot/reviews', data)

export const sendResendEmail = async (data) => callVercelFunction('/email/send-resend', data)
export const sendNewUserNotification = async (data) => callVercelFunction('/email/send-new-user-notification', data)
export const newUserWebhook = async (data) => callVercelFunction('/webhooks/new-user', data)
export const executeInternalLinker = async (data) => callVercelFunction('/ai/execute-internal-linker', data)
export const generateExternalReferences = async (data) => callVercelFunction('/ai/generate-external-references', data)
export const generateNapkinInfographic = async (data) => callVercelFunction('/ai/generate-napkin-infographic', data)
export const checkEmailBlacklist = async (data) => callVercelFunction('/email/check-blacklist', data)
export const initiateImagineerGeneration = async (data) => callVercelFunction('/ai/initiate-imagineer-generation', data)
export const imagineerCallback = async (data) => callVercelFunction('/webhooks/imagineer-callback', data)
export const listContentFeed = async (data) => callVercelFunction('/content/list-feed', data)
export const backfillArticleKeywords = async (data) => callVercelFunction('/ai/backfill-article-keywords', data)
export const transcribeAudio = async (data) => callVercelFunction('/ai/transcribe-audio', data)
export const notifyFirecrawlWebsite = async (data) => callVercelFunction('/integrations/firecrawl/notify-website', data)
export const stylePreviewProxy = async (data) => callVercelFunction('/utils/style-preview-proxy', data)
export const generateTldr = async (data) => callVercelFunction('/ai/generate-tldr', data)
export const executeTldr = async (data) => callVercelFunction('/ai/execute-tldr', data)
export const scrapeWithFirecrawl = async (data) => callVercelFunction('/integrations/firecrawl/scrape', data)
export const getSitemapPages = async (data) => callVercelFunction('/integrations/sitemap/get-pages', data)
export const fetchShopifyBlogs = async (data) => callVercelFunction('/integrations/shopify/fetch-blogs', data)
export const analyzeWebsiteBrand = async (data) => callVercelFunction('/ai/analyze-website-brand', data)
export const generateBrandCSS = async (data) => callVercelFunction('/ai/generate-brand-css', data)
export const validateBrandSpecs = async (data) => callVercelFunction('/ai/validate-brand-specs', data)
export const exportBrandAssets = async (data) => callVercelFunction('/ai/export-brand-assets', data)
export const detectAiContent = async (data) => callVercelFunction('/ai/detect-ai-content', data)

// Gmail functions
export const createGmailDraft = async (data) => callVercelFunction('/integrations/gmail/create-draft', data)

// Video functions
export const generateWavespeedVideo = async (data) => callVercelFunction('/ai/generate-wavespeed-video', data)
export const getWavespeedResult = async (data) => callVercelFunction('/ai/get-wavespeed-result', data)