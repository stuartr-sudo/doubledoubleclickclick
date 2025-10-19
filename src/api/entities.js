import { supabase } from './supabaseClient';

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

    // Add specific methods for certain entities
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

// Create all entities
export const BlogPost = createEntityWrapper('BlogPost')
export const WebhookReceived = createEntityWrapper('WebhookReceived')
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

// Add specific methods for certain entities
BlogPost.findById = async (id) => {
  const response = await fetch('/api/blog-posts/find', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await (await import('@/api/supabaseClient')).supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({ id })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to find blog post: ${response.statusText}`);
  }
  
  return response.json();
};

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

// User entity with auth methods
export const User = {
  async me() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async loginWithRedirect(redirectUrl) {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
  },

  async updateMe(updates) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (error) throw error;
    return data.user;
  }
};

// Export createEntityWrapper for individual entity files
export { createEntityWrapper }