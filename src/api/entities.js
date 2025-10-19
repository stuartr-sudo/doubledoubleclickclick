import { supabase } from './supabaseClient'

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
      if (filters && typeof filters === 'object') {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              query = query.in(key, value)
            } else {
              query = query.eq(key, value)
            }
          }
        })
      }
      
      // Apply sorting
      if (sortBy) {
        if (sortBy.startsWith('-')) {
          query = query.order(sortBy.substring(1), { ascending: false })
        } else {
          query = query.order(sortBy, { ascending: true })
        }
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error(`Error fetching ${entityName}:`, error);
        throw new Error(`Failed to fetch ${entityName}: ${error.message}`)
      }
      
      return data || []
    },
    
    async create(data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to create ${entityName}: ${error.message}`)
      }
      
      return result
    },
    
    async update(id, data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to update ${entityName}: ${error.message}`)
      }
      
      return result
    },
    
    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
      
      if (error) {
        throw new Error(`Failed to delete ${entityName}: ${error.message}`)
      }
      
      return { success: true }
    },
    
    async findById(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        throw new Error(`Failed to find ${entityName}: ${error.message}`)
      }
      
      return data
    }
  }
}

// Export all entities with Base44-compatible interface
export const BlogPost = createEntityWrapper('BlogPost')
export const WebhookReceived = createEntityWrapper('WebhookReceived')

// Add missing functions that the Editor expects
WebhookReceived.update = async (id, updates) => {
  const response = await fetch('/api/webhooks?action=update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({ id, updates })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update webhook: ${response.statusText}`);
  }
  
  return response.json();
};

WebhookReceived.filter = async (filters = {}, sortBy = null) => {
  const response = await fetch('/api/webhooks?action=filter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({ filters, sortBy })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to filter webhooks: ${response.statusText}`);
  }
  
  return response.json();
};
export const AvailablePage = createEntityWrapper('AvailablePage')
export const YouTubeVideo = createEntityWrapper('YouTubeVideo')
export const PromotedProduct = createEntityWrapper('PromotedProduct')
export const ImageLibraryItem = createEntityWrapper('ImageLibraryItem')
export const Sitemap = createEntityWrapper('Sitemap')
export const CallToAction = createEntityWrapper('CallToAction')
export const EmailCaptureForm = createEntityWrapper('EmailCaptureForm')
export const CapturedEmail = createEntityWrapper('CapturedEmail')
export const TikTokVideo = createEntityWrapper('TikTokVideo')
export const GeneratedVideo = createEntityWrapper('GeneratedVideo')
export const LandingPageContent = createEntityWrapper('LandingPageContent')
export const WaitlistEntry = createEntityWrapper('WaitlistEntry')
export const ContactMessage = createEntityWrapper('ContactMessage')
export const Username = createEntityWrapper('Username')

// Add topics-specific methods to Username
Username.addTopic = async (usernameId, topic) => {
  const response = await fetch('/api/topics/add-keyword', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({ username_id: usernameId, keyword: topic })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add topic: ${response.statusText}`);
  }
  
  return response.json();
};
export const ScheduledPost = createEntityWrapper('ScheduledPost')
export const Testimonial = createEntityWrapper('Testimonial')
export const ContentVariant = createEntityWrapper('ContentVariant')
export const IntegrationCredential = createEntityWrapper('IntegrationCredential')
export const OnboardingWizard = createEntityWrapper('OnboardingWizard')
export const Invoice = createEntityWrapper('Invoice')
export const ServiceItem = createEntityWrapper('ServiceItem')
export const VideoProject = createEntityWrapper('VideoProject')
export const VideoScene = createEntityWrapper('VideoScene')
export const Json2VideoTemplate = createEntityWrapper('Json2VideoTemplate')
export const BlogCategory = createEntityWrapper('BlogCategory')
export const BrandGuidelines = createEntityWrapper('BrandGuidelines')
export const FeatureFlag = createEntityWrapper('FeatureFlag')
export const EditorWorkflow = createEntityWrapper('EditorWorkflow')
export const WorkflowRunStatus = createEntityWrapper('WorkflowRunStatus')
export const SalesPageContent = createEntityWrapper('SalesPageContent')
export const ProductStyleTemplate = createEntityWrapper('ProductStyleTemplate')
export const AppProduct = createEntityWrapper('AppProduct')
export const ShopifyPublishLog = createEntityWrapper('ShopifyPublishLog')
export const PageOption = createEntityWrapper('PageOption')
export const PageStyle = createEntityWrapper('PageStyle')
export const WritingStyle = createEntityWrapper('WritingStyle')
export const ContentEndpoint = createEntityWrapper('ContentEndpoint')
export const WebPage = createEntityWrapper('WebPage')
export const LlmModelLabel = createEntityWrapper('LlmModelLabel')
export const LlmSettings = createEntityWrapper('LlmSettings')
export const CrmCredential = createEntityWrapper('CrmCredential')
export const WebhookPayloadTemplate = createEntityWrapper('WebhookPayloadTemplate')
export const CustomContentTemplate = createEntityWrapper('CustomContentTemplate')
export const TutorialVideo = createEntityWrapper('TutorialVideo')
export const PricingFaq = createEntityWrapper('PricingFaq')
export const OnboardingStep = createEntityWrapper('OnboardingStep')
export const Affiliate = createEntityWrapper('Affiliate')
export const AffiliatePack = createEntityWrapper('AffiliatePack')
export const AppSettings = createEntityWrapper('AppSettings')
export const AmazonProductVideo = createEntityWrapper('AmazonProductVideo')
export const DashboardBanner = createEntityWrapper('DashboardBanner')
export const WordPressPublishLog = createEntityWrapper('WordPressPublishLog')
export const ImagineerJob = createEntityWrapper('ImagineerJob')
export const InfographicVisualTypeExample = createEntityWrapper('InfographicVisualTypeExample')
export const BrandSpecifications = createEntityWrapper('BrandSpecifications')

// Export User from auth hook for backwards compatibility
export { User } from '../hooks/useAuth.js'