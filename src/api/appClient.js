import { supabase, getCurrentUser } from './supabaseClient';

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
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      return getCurrentUser();
    },
    me: async () => {
      return getCurrentUser();
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


