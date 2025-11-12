import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPassword, createSession, cleanExpiredSessions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch admin user
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, username, password_hash')
      .eq('username', username)
      .single()

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, admin.password_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Clean up expired sessions
    await cleanExpiredSessions()

    // Create new session
    const sessionToken = await createSession(admin.id)

    // Update last login time
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    return NextResponse.json({
      success: true,
      message: 'Login successful'
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}

