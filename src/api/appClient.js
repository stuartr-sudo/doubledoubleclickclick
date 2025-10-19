// Minimal app client to replace Base44 at runtime without changing call sites.
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
    logout: async () => { if (typeof window !== 'undefined') window.location.href = '/login'; },
    updateMe: async () => { return { id: 'stub', full_name: 'Stub User' }; },
    // TEMP: return a stubbed user so UI renders while auth is wired
    me: async () => ({
      id: 'stub-user-id',
      email: 'stub@example.com',
      full_name: 'Stub User',
      is_superadmin: true,
      role: 'admin',
      assigned_usernames: ['default'],
      token_balance: 20,
      completed_tutorial_ids: ['welcome_onboarding', 'getting_started_scrape']
    })
  },
  entities: new Proxy({}, {
    get: () => ({
      filter: async () => [],
      findById: async () => null,
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => true
    })
  })
};


