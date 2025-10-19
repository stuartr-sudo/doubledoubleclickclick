import { verifyAuth } from '../utils/auth.js'
import { createSuccessResponse, createErrorResponse, handleCors } from '../utils/response.js'
import { supabaseAdmin } from '../utils/auth.js'

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
    const { bucket, path, expiresIn = 3600 } = await request.json()

    if (!bucket || !path) {
      return createErrorResponse('bucket and path are required', 400)
    }

    // Validate that user can access this path
    if (!path.startsWith(`${user.user_name}/`)) {
      return createErrorResponse('Access denied: path must belong to user', 403)
    }

    // Generate signed URL
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      throw new Error(`Signed URL generation error: ${error.message}`)
    }

    return createSuccessResponse({
      signed_url: data.signedUrl,
      path,
      bucket,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
    }, 'Signed URL created successfully')

  } catch (error) {
    console.error('Create signed URL error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
}
