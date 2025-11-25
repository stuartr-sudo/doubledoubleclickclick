import { createClient } from '@/lib/supabase/client'

// Simple in-memory cache for rate limiting (resets on server restart)
const submissionCache = new Map<string, number>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

export function getClientIP(request: Request): string {
  // Try to get IP from Vercel headers first
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback
  return 'unknown'
}

export function isRateLimited(identifier: string): boolean {
  const now = Date.now()
  const lastSubmission = submissionCache.get(identifier)
  
  if (lastSubmission && (now - lastSubmission) < RATE_LIMIT_WINDOW) {
    return true
  }
  
  submissionCache.set(identifier, now)
  return false
}

export async function checkEmailExists(email: string, source: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('lead_captures')
    .select('id')
    .eq('email', email)
    .eq('source', source)
    .limit(1)
  
  if (error) {
    console.error('Error checking email:', error)
    return false
  }
  
  return (data && data.length > 0)
}

export async function checkIPExists(ipAddress: string, source: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('lead_captures')
    .select('id')
    .eq('ip_address', ipAddress)
    .eq('source', source)
    .limit(1)
  
  if (error) {
    console.error('Error checking IP:', error)
    return false
  }
  
  return (data && data.length > 0)
}

