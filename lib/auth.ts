import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(adminId: string): Promise<string> {
  const supabase = createAdminClient()
  
  // Generate unique session token
  const sessionToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)
  
  // Store session in database
  const { error } = await supabase
    .from('admin_sessions')
    .insert({
      admin_id: adminId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString()
    })
  
  if (error) {
    throw new Error('Failed to create session')
  }
  
  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  })
  
  return sessionToken
}

export async function verifySession(): Promise<{ authenticated: boolean; adminId?: string }> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
    
    if (!sessionToken) {
      return { authenticated: false }
    }
    
    const supabase = createAdminClient()
    
    // Check if session exists and is valid
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select('admin_id, expires_at')
      .eq('session_token', sessionToken)
      .single()
    
    if (error || !session) {
      return { authenticated: false }
    }
    
    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('session_token', sessionToken)
      
      return { authenticated: false }
    }
    
    return { authenticated: true, adminId: session.admin_id }
  } catch (error) {
    console.error('Session verification error:', error)
    return { authenticated: false }
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (sessionToken) {
    const supabase = createAdminClient()
    
    // Delete session from database
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('session_token', sessionToken)
  }
  
  // Clear cookie
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function cleanExpiredSessions(): Promise<void> {
  const supabase = createAdminClient()
  
  await supabase
    .from('admin_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())
}

