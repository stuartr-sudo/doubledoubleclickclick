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
        }
      };
    }
  })
};

// Alias for legacy code still importing 'base44'
export const base44 = app;


