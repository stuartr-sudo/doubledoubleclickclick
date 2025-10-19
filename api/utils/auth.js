import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create service role client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Verify JWT token and get user
export const verifyAuth = async (request) => {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7)
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      throw new Error('Invalid token')
    }

    // Get user profile with extended fields
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error('Failed to fetch user profile')
    }

    return {
      ...user,
      ...profile,
      // Ensure backwards compatibility with Base44 user structure
      user_name: profile?.user_name || user.email?.split('@')[0],
      assigned_usernames: profile?.assigned_usernames || [],
      token_balance: profile?.token_balance || 20,
      plan_price_id: profile?.plan_price_id,
      is_superadmin: profile?.is_superadmin || false,
      role: profile?.role || 'user',
      completed_tutorial_ids: profile?.completed_tutorial_ids || [],
      topics_completed_at: profile?.topics_completed_at
    }
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`)
  }
}

// Check if user has required permissions
export const checkPermission = (user, requiredRole = 'user') => {
  const roleHierarchy = {
    'user': 0,
    'admin': 1,
    'superadmin': 2
  }

  const userLevel = roleHierarchy[user.role] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0

  return userLevel >= requiredLevel || user.is_superadmin
}

// Rate limiting helper
export const checkRateLimit = async (userId, action, limit = 100, window = 3600) => {
  // This would integrate with Redis/Upstash for production
  // For now, we'll implement a simple in-memory rate limiter
  // In production, use Upstash Redis for distributed rate limiting
  
  return true // Allow all requests for now
}

export { supabaseAdmin }
