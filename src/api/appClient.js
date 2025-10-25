import { supabase, getCurrentUser } from '@/lib/supabase';

// App client v1.4 - Added Stripe integration
const app = {
  functions: {
    invoke: async (functionName, data) => {
      const res = await fetch(`/api/${functionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      });
      if (!res.ok) throw new Error(`Function ${functionName} failed`);
      return res.json();
    },
    // Stripe functions
    createCheckoutSession: async (data) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Checkout session creation failed');
      return res.json();
    },
    verifyPayment: async (data) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    createCustomerPortalSession: async (data = {}) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/create-customer-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Customer portal session creation failed');
      return res.json();
    },
    checkAndConsumeTokens: async (data) => {
      const { userId, featureName } = data;
      const res = await fetch('/api/tokens/check-and-consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, featureName })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Token consumption failed');
      }
      return result;
    },
    getSitemapPages: async (data) => {
      const res = await fetch('/api/sitemap/get-sitemap-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
        notifyFirecrawlWebsite: async (data) => {
          const res = await fetch('/api/webhooks/notify-firecrawl-website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          return res.json();
        },
        createSitemap: async (data) => {
          const res = await fetch('/api/sitemap/create-sitemap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          return res.json();
        },
    amazonProduct: async (data) => {
      const res = await fetch('/api/products/amazon-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    airtableCreateRecord: async (data) => {
      const res = await fetch('/api/airtable/create-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    // Generic website extractor via Firecrawl v2
    extractWebsiteContent: async (data) => {
      const res = await fetch('/api/scrape/extract-website-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    }
  },
  auth: {
    loginWithRedirect: (returnTo) => {
      if (typeof window !== 'undefined') window.location.href = '/login';
    },
    logout: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Logout error:', error);
        }
      } catch (err) {
        console.error('Logout exception:', err);
      } finally {
        // Clear local storage and redirect regardless of error
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/login';
        }
      }
    },
    updateMe: async (updates) => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      return getCurrentUser();
    },
        // Back-compat for legacy calls
        updateMyUserData: async (updates) => {
          return app.auth.updateMe(updates);
        },
    me: async () => {
      return getCurrentUser();
    }
  },
  entities: new Proxy({}, {
    get: (target, entityName) => {
      let tableName = entityName
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
      
      // Complete table name mapping to match actual Supabase schema
      // This prevents auto-pluralization issues
      const tableNameOverrides = {
        // Irregular or already-plural tables
        'webhook_received': 'webhook_received',
        'airtable_sync_cache': 'airtable_sync_cache',
        'analytics_events': 'analytics_events',
        
        // Standard pluralization (explicit for clarity)
        'affiliate_pack': 'affiliate_packs',
        'affiliate': 'affiliates',
        'amazon_product_video': 'amazon_product_videos',
        'app_product': 'app_products',
        'app_setting': 'app_settings',
        'available_page': 'available_pages',
        'blog_category': 'blog_categories',
        'blog_post': 'blog_posts',
        'brand_guideline': 'brand_guidelines',
        'brand_specification': 'brand_specifications',
        'call_to_action': 'call_to_actions',
        'captured_email': 'captured_emails',
        'contact_message': 'contact_messages',
        'content_endpoint': 'content_endpoints',
        'content_variant': 'content_variants',
        'crm_credential': 'crm_credentials',
        'custom_content_template': 'custom_content_templates',
        'dashboard_banner': 'dashboard_banners',
        'editor_workflow': 'editor_workflows',
        'email_capture_form': 'email_capture_forms',
        'feature_flag': 'feature_flags',
        'generated_video': 'generated_videos',
        'image_library_item': 'image_library_items',
        'imagineer_job': 'imagineer_jobs',
        'infographic_visual_type_example': 'infographic_visual_type_examples',
        'integration_credential': 'integration_credentials',
        'invoice': 'invoices',
        'json2_video_template': 'json2video_templates',
        'landing_page_content': 'landing_page_content',
        'llm_model_label': 'llm_model_labels',
        'llm_setting': 'llm_settings',
        'onboarding_step': 'onboarding_steps',
        'onboarding_wizard': 'onboarding_wizards',
        'page_option': 'page_options',
        'page_style': 'page_styles',
        'pricing_faq': 'pricing_faqs',
        'product_style_template': 'product_style_templates',
        'promoted_product': 'promoted_products',
        'sales_page_content': 'sales_page_content',
        'scheduled_post': 'scheduled_posts',
        'service_item': 'service_items',
        'shopify_publish_log': 'shopify_publish_logs',
        'sitemap': 'sitemaps',
        'testimonial': 'testimonials',
        'tik_tok_video': 'tiktok_videos',
        'tutorial_video': 'tutorial_videos',
        'user_profile': 'user_profiles',
        'username': 'usernames',
        'video_project': 'video_projects',
        'video_scene': 'video_scenes',
        'waitlist_entry': 'waitlist_entries',
        'web_page': 'web_pages',
        'webhook_payload_template': 'webhook_payload_templates',
        'wordpress_publish_log': 'wordpress_publish_logs',
        'workflow_run_status': 'workflow_run_status',
        'writing_style': 'writing_styles',
        'you_tube_video': 'youtube_videos'
      };
      
      if (tableNameOverrides[tableName]) {
        tableName = tableNameOverrides[tableName];
      } else if (!tableName.endsWith('s')) {
        // Only add 's' if it doesn't already end with 's'
        tableName += 's';
      }
      
      return {
        filter: async (filters = {}, orderBy = null) => {
          let query = supabase.from(tableName).select('*');
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              // Handle arrays with .in() instead of .eq()
              if (Array.isArray(value)) {
                query = query.in(key, value);
              } else {
                query = query.eq(key, value);
              }
            }
          });
          // Handle orderBy if provided (e.g., "-updated_date")
          if (orderBy) {
            const desc = orderBy.startsWith('-');
            const field = desc ? orderBy.slice(1) : orderBy;
            query = query.order(field, { ascending: !desc });
          }
          const { data, error } = await query;
          if (error) throw error;
          return data || [];
        },
        findById: async (id) => {
          const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
          if (error) throw error;
          return data;
        },
        create: async (payload) => {
          const { data, error } = await supabase.from(tableName).insert(payload).select().single();
          if (error) throw error;
          return data;
        },
        update: async (id, payload) => {
          const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
          if (error) throw error;
          return data;
        },
        delete: async (id) => {
          const { error } = await supabase.from(tableName).delete().eq('id', id);
          if (error) throw error;
          return true;
        },
        list: async () => {
          const { data, error } = await supabase.from(tableName).select('*');
          if (error) throw error;
          return data || [];
        }
      };
    }
  }),
  integrations: {
    Core: {
      InvokeLLM: async (data) => {
        const res = await fetch('/api/ai/llm-router', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('LLM invocation failed');
        return res.json();
      },
      
      SendEmail: async (data) => {
        const res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Email send failed');
        return res.json();
      },
      UploadFile: async (data) => {
        const res = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      },
      GenerateImage: async (data) => {
        const res = await fetch('/api/media/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Image generation failed');
        return res.json();
      },
      ExtractDataFromUploadedFile: async (data) => {
        const res = await fetch('/api/media/extract-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Data extraction failed');
        return res.json();
      },
      CreateFileSignedUrl: async (data) => {
        const res = await fetch('/api/media/create-signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Signed URL creation failed');
        return res.json();
      },
      UploadPrivateFile: async (data) => {
        const res = await fetch('/api/media/upload-private', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Private upload failed');
        return res.json();
      }
    }
  },
  functions: new Proxy({}, {
    get: (target, functionName) => {
      // Return a function that calls the serverless API endpoint
      return async (body = {}) => {
        const endpoint = `/api/${functionName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}`;
        
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        if (!res.ok) {
          const error = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || `HTTP ${res.status}`);
        }
        
        return res.json();
      };
    }
  })
};

// Export app as both named and default export
export { app };
export default app;


