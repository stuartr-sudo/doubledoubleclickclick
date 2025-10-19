import { verifyAuth } from './auth.js'
import { createSuccessResponse, createErrorResponse, handleCors } from './response.js'
import { supabaseAdmin } from './auth.js'

export default async function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Verify authentication
    const user = await verifyAuth(request)
    
    // Parse request body
    const { preferred_user_name, display_name } = await request.json()

    if (!preferred_user_name) {
      return createErrorResponse('preferred_user_name is required', 400)
    }

    // Clean the preferred username
    let baseName = preferred_user_name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/(^-+|-$)/g, '')
      .slice(0, 24)

    if (!baseName) {
      baseName = 'user'
    }

    let candidateName = baseName
    let counter = 1

    // Try to find an available username
    while (counter <= 1000) {
      // Check if username is available
      const { data: existingUsername, error: checkError } = await supabaseAdmin
        .from('usernames')
        .select('id, is_available, assigned_to')
        .eq('username', candidateName)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (!existingUsername || existingUsername.is_available) {
        // Username is available
        if (existingUsername) {
          // Update existing record
          const { error: updateError } = await supabaseAdmin
            .from('usernames')
            .update({
              is_available: false,
              assigned_to: user.id,
              display_name: display_name || candidateName,
              updated_date: new Date().toISOString()
            })
            .eq('id', existingUsername.id)

          if (updateError) throw updateError
        } else {
          // Create new record
          const { error: insertError } = await supabaseAdmin
            .from('usernames')
            .insert({
              username: candidateName,
              display_name: display_name || candidateName,
              is_available: false,
              assigned_to: user.id
            })

          if (insertError) throw insertError
        }

        // Update user profile with assigned username
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            user_name: candidateName,
            assigned_usernames: [candidateName],
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (profileError) throw profileError

        return createSuccessResponse({
          username: candidateName,
          display_name: display_name || candidateName
        }, 'Username assigned successfully')

      } else {
        // Username is taken, try next variation
        counter++
        candidateName = `${baseName}-${counter}`
      }
    }

    return createErrorResponse('Unable to find available username', 409)

  } catch (error) {
    console.error('Auto-assign username error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
}
