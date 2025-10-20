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
      
      // Only add 's' if it doesn't already end with 's'
      if (!tableName.endsWith('s')) {
        tableName += 's';
      }
      
      return {
        filter: async (filters = {}) => {
          let query = supabase.from(tableName).select('*');
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) query = query.eq(key, value);
          });
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
  }
};

// Export app as both named and default export
export { app };
export default app;


