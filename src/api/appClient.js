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
    updateMe: async () => { throw new Error('updateMe not implemented'); },
    me: async () => { throw new Error('me not implemented'); }
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


