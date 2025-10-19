// Minimal stub client - no Supabase, no auth, just makes UI work
export const app = {
  functions: {
    invoke: async (functionName, data) => {
      console.warn(`[stub] Function invoked: ${functionName}`, data);
      return { success: true, data: {} };
    }
  },
  auth: {
    loginWithRedirect: (returnTo) => {
      console.warn('[stub] loginWithRedirect called');
    },
    logout: async () => {
      console.warn('[stub] logout called');
    },
    updateMe: async (updates) => {
      console.warn('[stub] updateMe called', updates);
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
      return {
        filter: async (filters = {}) => {
          console.warn(`[stub] ${entityName}.filter`, filters);
          return [];
        },
        findById: async (id) => {
          console.warn(`[stub] ${entityName}.findById`, id);
          return null;
        },
        create: async (payload) => {
          console.warn(`[stub] ${entityName}.create`, payload);
          return { id: `stub-${Date.now()}`, ...payload };
        },
        update: async (id, payload) => {
          console.warn(`[stub] ${entityName}.update`, id, payload);
          return { id, ...payload };
        },
        delete: async (id) => {
          console.warn(`[stub] ${entityName}.delete`, id);
          return true;
        },
        list: async () => {
          console.warn(`[stub] ${entityName}.list`);
          return [];
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


