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
    
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file')
    const bucket = formData.get('bucket') || 'private'
    const path = formData.get('path') || `${user.user_name}/${Date.now()}-${file.name}`

    if (!file) {
      return createErrorResponse('File is required', 400)
    }

    // Validate file type and size for private bucket
    const allowedTypes = ['application/json', 'text/plain']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse(`File type ${file.type} not allowed for private bucket`, 400)
    }

    if (file.size > maxSize) {
      return createErrorResponse(`File size ${file.size} exceeds maximum ${maxSize} bytes`, 400)
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage (private bucket)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      throw new Error(`Storage upload error: ${error.message}`)
    }

    // Generate signed URL for private file access
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(data.path, 3600) // 1 hour expiry

    if (signedUrlError) {
      throw new Error(`Signed URL generation error: ${signedUrlError.message}`)
    }

    return createSuccessResponse({
      file_url: signedUrlData.signedUrl,
      path: data.path,
      bucket,
      size: file.size,
      type: file.type,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
    }, 'Private file uploaded successfully')

  } catch (error) {
    console.error('Private file upload error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
}
