import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug environment variables
console.log('Environment check:', {
  VITE_SUPABASE_URL: supabaseUrl,
  VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Present' : 'Missing',
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey
  })
  
  // Create a fallback client with dummy values to prevent app crash
  supabase = createClient('https://dummy.supabase.co', 'dummy-key');
  console.warn('Using fallback Supabase client due to missing environment variables');
} else {
  // Create Supabase client with enhanced session persistence
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce'
    }
  });
  console.log('Supabase client created successfully');
}

export { supabase };

// Helper function to get auth headers for API calls
export const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No active session')
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
}

// Helper function to make authenticated API calls
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const headers = await getAuthHeaders()
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// Export for backwards compatibility with Base44 patterns
export default supabase