// Mock Base44 client for backwards compatibility during migration
// This provides the interface that TopicsOnboardingModal expects

export const base44 = {
  functions: {
    invoke: async (functionName, data) => {
      // Map Base44 function calls to new Vercel API calls
      const functionMap = {
        'scrapeWithFirecrawl': () => fetch('/api/scraping/firecrawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }),
        'extractWebsiteContent': () => fetch('/api/scraping/extract-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }),
        'notifyFirecrawlWebsite': () => fetch('/api/integrations/firecrawl/notify-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      };

      const apiCall = functionMap[functionName];
      if (!apiCall) {
        throw new Error(`Function ${functionName} not implemented`);
      }

      const response = await apiCall();
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return { data: await response.json() };
    }
  },

  auth: {
    updateMe: async (updates) => {
      // Use the User entity for auth updates
      const { User } = await import('./entities');
      return await User.updateMyUserData(updates);
    }
  },

  integrations: {
    Core: {
      InvokeLLM: async (params) => {
        // Use the LLM router for AI calls
        const response = await fetch('/api/ai/llm-router', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });

        if (!response.ok) {
          throw new Error(`LLM call failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data || result;
      }
    }
  }
};
