import { supabase, getCurrentUser } from './supabaseClient';

// Export both 'app' and 'base44' (alias) to support gradual migration
export const app = {
  functions: {
    invoke: async (functionName, data) => {
      const res = await fetch(`/api/${functionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      });
      if (!res.ok) throw new Error(`Function ${functionName} failed`);
      return res.json();
    }
  },
  auth: {
    loginWithRedirect: (returnTo) => {
      if (typeof window !== 'undefined') window.location.href = '/login';
    },
    logout: async () => {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') window.location.href = '/login';
    },
    updateMe: async (updates) => {
      // Stub: return fake user until Supabase is configured
      console.warn('[appClient] updateMe is stubbed');
      return {
        id: 'stub-user-id',
        email: 'stub@example.com',
        full_name: 'Stub User',
        is_superadmin: true,
        role: 'admin',
        assigned_usernames: ['default'],
        token_balance: 20,
        completed_tutorial_ids: ['welcome_onboarding', 'getting_started_scrape']
      };
    },
    me: async () => {
      // Stub: return fake user until Supabase is configured
      return {
        id: 'stub-user-id',
        email: 'stub@example.com',
        full_name: 'Stub User',
        is_superadmin: true,
        role: 'admin',
        assigned_usernames: ['default'],
        token_balance: 20,
        completed_tutorial_ids: ['welcome_onboarding', 'getting_started_scrape']
      };
    }
  },
  entities: new Proxy({}, {
    get: (target, entityName) => {
      const tableName = entityName
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '') + 's';
      
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

// Alias for legacy code still importing 'base44'
export const base44 = app;


