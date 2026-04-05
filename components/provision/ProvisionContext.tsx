'use client'

import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import type { ThemeName } from '@/lib/themes'

/* ═══════════════════════════════════════════════════════════
   SUPPORTING TYPES
   ═══════════════════════════════════════════════════════════ */

export interface ImageStyleConfig {
  style_name: string
  visual_style: string
  color_palette: string
  mood_and_atmosphere: string
  composition_style: string
  lighting_preferences: string
  image_type_preferences: string
  subject_guidelines: string
  preferred_elements: string
  prohibited_elements: string
  ai_prompt_instructions: string
}

export interface DomainData {
  domain: string
  available: boolean
  price: number
  currency: string
  yearlyPrice?: { currencyCode: string; units: string; nanos?: number }
  domainNotices?: string[]
}

export interface ProductEntry {
  name: string
  url: string
  description: string
  isAffiliate: boolean
  affiliateLink: string
  createPage: boolean
  additionalUrls: string[]
  signalUrls: string[]
}

export interface NetworkPartner {
  username: string
  displayName: string
  domain: string
  niche: string
  relationship: string
}

export interface LogEntry {
  timestamp: string
  message: string
}

export interface PipelineStep {
  step: string
  label: string
  status: 'completed' | 'running' | 'failed' | 'pending' | 'skipped'
  detail?: string
}

export interface PipelineStatus {
  status: string
  current_step: string
  current_step_index: number
  total_steps: number
  steps_completed: PipelineStep[]
  errors: string[]
}

/* ═══════════════════════════════════════════════════════════
   PROVISION STATE
   ═══════════════════════════════════════════════════════════ */

export type ProvisionMode = 'niche' | 'brand' | 'upload' | null

export type ProvisionPhase = 'form' | 'provisioning' | 'tracking' | 'done'

export type ProvisionState = {
  // Auth
  provisionSecret: string

  // Mode
  mode: ProvisionMode
  activeStep: number

  // Brand identity
  niche: string
  displayName: string
  username: string
  domain: string
  websiteUrl: string
  contactEmail: string
  tagline: string

  // Brand voice
  brandVoice: string
  targetMarket: string
  brandBlurb: string
  seedKeywords: string

  // Author
  authorName: string
  authorBio: string
  authorImageUrl: string
  authorPageUrl: string
  authorSocials: string[]

  // Visual / Image style
  logoUrl: string
  logoPrompt: string
  imageStyle: ImageStyleConfig
  primaryColor: string
  secondaryColor: string
  accentColor: string
  headingFont: string
  bodyFont: string
  theme: ThemeName

  // Deploy config
  flyRegion: string
  stitchEnabled: boolean
  setupGoogleAnalytics: boolean
  setupGoogleTagManager: boolean
  setupSearchConsole: boolean
  translationEnabled: boolean
  selectedLanguages: string[]
  articlesPerDay: number

  // Domain purchase
  purchaseDomain: boolean
  selectedDomainData: DomainData | null
  manualDns: boolean

  // Domain suggestions (UI-only)
  domainSuggestions: DomainData[]
  loadingDomains: boolean

  // Research context
  researchContext: Record<string, unknown> | null
  icaProfile: Record<string, unknown> | null
  styleGuide: Record<string, unknown> | null

  // Products (current single-product form fields from existing form)
  productName: string
  productUrl: string
  isAffiliate: boolean
  affiliateLink: string
  createProductPage: boolean
  additionalUrls: string[]
  signalUrls: string[]

  // Structured products list (for future multi-product support)
  products: ProductEntry[]

  // Content config
  skipPipeline: boolean
  preferredElements: string
  prohibitedElements: string
  aiInstructionsOverride: string

  // Network
  networkPartners: NetworkPartner[]

  // Upload mode
  uploadFile: File | null
  parseJobId: string | null
  parseStatus: string
  parsedSite: Record<string, unknown> | null

  // UI state
  phase: ProvisionPhase
  provisionResult: Record<string, unknown> | null
  pipelineStatus: PipelineStatus | null
  logs: LogEntry[]
  error: string | null
  generating: Record<string, boolean>
  saved: Record<string, boolean>
}

/* ═══════════════════════════════════════════════════════════
   EMPTY IMAGE STYLE DEFAULT
   ═══════════════════════════════════════════════════════════ */

export const emptyImageStyle: ImageStyleConfig = {
  style_name: 'Default Style',
  visual_style: '',
  color_palette: '',
  mood_and_atmosphere: '',
  composition_style: '',
  lighting_preferences: '',
  image_type_preferences: '',
  subject_guidelines: '',
  preferred_elements: '',
  prohibited_elements: '',
  ai_prompt_instructions: '',
}

/* ═══════════════════════════════════════════════════════════
   INITIAL STATE
   ═══════════════════════════════════════════════════════════ */

export const initialState: ProvisionState = {
  // Auth
  provisionSecret: '',

  // Mode
  mode: null,
  activeStep: 0,

  // Brand identity
  niche: '',
  displayName: '',
  username: '',
  domain: '',
  websiteUrl: '',
  contactEmail: '',
  tagline: '',

  // Brand voice
  brandVoice: '',
  targetMarket: '',
  brandBlurb: '',
  seedKeywords: '',

  // Author
  authorName: '',
  authorBio: '',
  authorImageUrl: '',
  authorPageUrl: '',
  authorSocials: [''],

  // Visual
  logoUrl: '',
  logoPrompt: '',
  imageStyle: { ...emptyImageStyle },
  primaryColor: '#0F172A',
  secondaryColor: '',
  accentColor: '#0066ff',
  headingFont: '',
  bodyFont: '',
  theme: 'editorial',

  // Deploy config
  flyRegion: 'syd',
  stitchEnabled: false,
  setupGoogleAnalytics: true,
  setupGoogleTagManager: true,
  setupSearchConsole: true,
  translationEnabled: false,
  selectedLanguages: [],
  articlesPerDay: 5,

  // Domain purchase
  purchaseDomain: false,
  selectedDomainData: null,
  manualDns: false,

  // Domain suggestions
  domainSuggestions: [],
  loadingDomains: false,

  // Research context
  researchContext: null,
  icaProfile: null,
  styleGuide: null,

  // Products (single-product form fields)
  productName: '',
  productUrl: '',
  isAffiliate: false,
  affiliateLink: '',
  createProductPage: false,
  additionalUrls: [''],
  signalUrls: [''],

  // Structured products list
  products: [],

  // Content config
  skipPipeline: false,
  preferredElements: '',
  prohibitedElements: '',
  aiInstructionsOverride: '',

  // Network
  networkPartners: [],

  // Upload mode
  uploadFile: null,
  parseJobId: null,
  parseStatus: '',
  parsedSite: null,

  // UI state
  phase: 'form',
  provisionResult: null,
  pipelineStatus: null,
  logs: [],
  error: null,
  generating: {},
  saved: {},
}

/* ═══════════════════════════════════════════════════════════
   ACTIONS
   ═══════════════════════════════════════════════════════════ */

export type ProvisionAction =
  | { type: 'SET_FIELD'; field: keyof ProvisionState; value: ProvisionState[keyof ProvisionState] }
  | { type: 'SET_FIELDS'; fields: Partial<ProvisionState> }
  | { type: 'ADD_LOG'; log: LogEntry }
  | { type: 'SET_GENERATING'; key: string; value: boolean }
  | { type: 'SET_SAVED'; key: string; value: boolean }
  | { type: 'RESET' }

/* ═══════════════════════════════════════════════════════════
   REDUCER
   ═══════════════════════════════════════════════════════════ */

export function provisionReducer(
  state: ProvisionState,
  action: ProvisionAction,
): ProvisionState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }

    case 'SET_FIELDS':
      return { ...state, ...action.fields }

    case 'ADD_LOG':
      return { ...state, logs: [...state.logs, action.log] }

    case 'SET_GENERATING':
      return {
        ...state,
        generating: { ...state.generating, [action.key]: action.value },
      }

    case 'SET_SAVED':
      return {
        ...state,
        saved: { ...state.saved, [action.key]: action.value },
      }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}

/* ═══════════════════════════════════════════════════════════
   CONTEXT + PROVIDER + HOOK
   ═══════════════════════════════════════════════════════════ */

interface ProvisionContextValue {
  state: ProvisionState
  dispatch: Dispatch<ProvisionAction>
}

export const ProvisionContext = createContext<ProvisionContextValue | null>(null)

export function ProvisionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(provisionReducer, initialState)

  return (
    <ProvisionContext.Provider value={{ state, dispatch }}>
      {children}
    </ProvisionContext.Provider>
  )
}

export function useProvisionContext(): ProvisionContextValue {
  const ctx = useContext(ProvisionContext)
  if (!ctx) {
    throw new Error(
      'useProvisionContext must be used within a <ProvisionProvider>',
    )
  }
  return ctx
}
