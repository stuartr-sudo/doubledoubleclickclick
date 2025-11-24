import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client using the service role key.
// This is used exclusively for admin auth tables (admin_users, admin_sessions)
// and NEVER sent to the browser.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role env vars for admin auth')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}


