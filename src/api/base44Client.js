import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "689715479cd170f6c2aa04f2", 
  requiresAuth: true // Ensure authentication is required for all operations
});
