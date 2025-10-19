import { supabase } from './supabaseClient';
import { callVercelFunction } from './functions';

// Helper function to convert table names to entity names
const getTableName = (entityName) => {
  return entityName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/s$/, '') + 's'
}

// Generic entity wrapper that maintains Base44 API compatibility
const createEntityWrapper = (entityName) => {
  const tableName = getTableName(entityName)
  
  return {
    async filter(filters = {}, sortBy = null) {
      let query = supabase.from(tableName).select('*')
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && value.operator) {
            query = query[value.operator](key, value.value)
          } else {
            query = query.eq(key, value)
          }
        }
      })
      
      // Apply sorting
      if (sortBy) {
        const { column, ascending = true } = sortBy
        query = query.order(column, { ascending })
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
    
    async findById(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    
    async create(data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single()
      
      if (error) throw error
      return result
    },
    
    async update(id, data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return result
    },
    
    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    },

    async list(sortBy = null) {
      let query = supabase.from(tableName).select('*')
      
      if (sortBy) {
        const { column, ascending = true } = sortBy
        query = query.order(column, { ascending })
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    }
  }
}

// Create a client that mimics Base44 structure but uses Supabase
export const base44 = {
  functions: {
    invoke: async (functionName, data) => {
      console.warn(`[base44Client] Invoking function: ${functionName}`, data);
      // Map Base44 function names to Vercel API routes
      switch (functionName) {
        case 'notifyFirecrawlWebsite':
          return callVercelFunction('/integrations/firecrawl/notify-website', data);
        case 'autoAssignUsername':
          return callVercelFunction('/auto-assign-username', data);
        case 'getSitemapPages':
          return callVercelFunction('/getSitemapPages', data);
        case 'scrapeWithFirecrawl':
          return callVercelFunction('/scraping/firecrawl', data);
        case 'extractWebsiteContent':
          return callVercelFunction('/scraping/extract-content', data);
        // Add other mappings as needed
        default:
          console.error(`[base44Client] Unknown Base44 function invoked: ${functionName}`);
          throw new Error(`Unknown Base44 function: ${functionName}`);
      }
    },
  },
  auth: {
    updateMe: async (updates) => {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) throw error;
      return data.user;
    }
  },
  integrations: {
    Core: {
      InvokeLLM: async (data) => {
        return callVercelFunction('/ai/llm-router', data);
      }
    }
  },
  entities: {
    // Create entity wrappers that mimic Base44 structure
    BlogPost: createEntityWrapper('BlogPost'),
    WebhookReceived: createEntityWrapper('WebhookReceived'),
    AvailablePage: createEntityWrapper('AvailablePage'),
    YouTubeVideo: createEntityWrapper('YouTubeVideo'),
    PromotedProduct: createEntityWrapper('PromotedProduct'),
    ImageLibraryItem: createEntityWrapper('ImageLibraryItem'),
    Sitemap: createEntityWrapper('Sitemap'),
    CallToAction: createEntityWrapper('CallToAction'),
    EmailCaptureForm: createEntityWrapper('EmailCaptureForm'),
    CapturedEmail: createEntityWrapper('CapturedEmail'),
    TikTokVideo: createEntityWrapper('TikTokVideo'),
    GeneratedVideo: createEntityWrapper('GeneratedVideo'),
    LandingPageContent: createEntityWrapper('LandingPageContent'),
    WaitlistEntry: createEntityWrapper('WaitlistEntry'),
    ContactMessage: createEntityWrapper('ContactMessage'),
    Username: createEntityWrapper('Username'),
    ScheduledPost: createEntityWrapper('ScheduledPost'),
    Testimonial: createEntityWrapper('Testimonial'),
    ContentVariant: createEntityWrapper('ContentVariant'),
    IntegrationCredential: createEntityWrapper('IntegrationCredential'),
    OnboardingWizard: createEntityWrapper('OnboardingWizard'),
    Invoice: createEntityWrapper('Invoice'),
    ServiceItem: createEntityWrapper('ServiceItem'),
    VideoProject: createEntityWrapper('VideoProject'),
    VideoScene: createEntityWrapper('VideoScene'),
    Json2VideoTemplate: createEntityWrapper('Json2VideoTemplate'),
    BlogCategory: createEntityWrapper('BlogCategory'),
    BrandGuidelines: createEntityWrapper('BrandGuidelines'),
    FeatureFlag: createEntityWrapper('FeatureFlag'),
    EditorWorkflow: createEntityWrapper('EditorWorkflow'),
    WorkflowRunStatus: createEntityWrapper('WorkflowRunStatus'),
    SalesPageContent: createEntityWrapper('SalesPageContent'),
    ProductStyleTemplate: createEntityWrapper('ProductStyleTemplate'),
    AppProduct: createEntityWrapper('AppProduct'),
    ShopifyPublishLog: createEntityWrapper('ShopifyPublishLog'),
    PageOption: createEntityWrapper('PageOption'),
    PageStyle: createEntityWrapper('PageStyle'),
    WritingStyle: createEntityWrapper('WritingStyle'),
    ContentEndpoint: createEntityWrapper('ContentEndpoint'),
    WebPage: createEntityWrapper('WebPage'),
    LlmModelLabel: createEntityWrapper('LlmModelLabel'),
    LlmSettings: createEntityWrapper('LlmSettings'),
    CrmCredential: createEntityWrapper('CrmCredential'),
    WebhookPayloadTemplate: createEntityWrapper('WebhookPayloadTemplate'),
    CustomContentTemplate: createEntityWrapper('CustomContentTemplate'),
    TutorialVideo: createEntityWrapper('TutorialVideo'),
    PricingFaq: createEntityWrapper('PricingFaq'),
    OnboardingStep: createEntityWrapper('OnboardingStep'),
    Affiliate: createEntityWrapper('Affiliate'),
    AffiliatePack: createEntityWrapper('AffiliatePack'),
    AppSettings: createEntityWrapper('AppSettings'),
    AmazonProductVideo: createEntityWrapper('AmazonProductVideo'),
    DashboardBanner: createEntityWrapper('DashboardBanner'),
    WordPressPublishLog: createEntityWrapper('WordPressPublishLog'),
    ImagineerJob: createEntityWrapper('ImagineerJob'),
    InfographicVisualTypeExample: createEntityWrapper('InfographicVisualTypeExample'),
    BrandSpecifications: createEntityWrapper('BrandSpecifications')
  }
};