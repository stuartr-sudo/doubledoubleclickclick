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
    const bucket = formData.get('bucket') || 'images'
    const path = formData.get('path') || `${user.user_name}/${Date.now()}-${file.name}`

    if (!file) {
      return createErrorResponse('File is required', 400)
    }

    // Validate file type and size
    const allowedTypes = {
      'images': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      'videos': ['video/mp4', 'video/webm', 'video/quicktime'],
      'documents': ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'private': ['application/json', 'text/plain']
    }

    const maxSizes = {
      'images': 10 * 1024 * 1024, // 10MB
      'videos': 100 * 1024 * 1024, // 100MB
      'documents': 50 * 1024 * 1024, // 50MB
      'private': 10 * 1024 * 1024 // 10MB
    }

    if (!allowedTypes[bucket]?.includes(file.type)) {
      return createErrorResponse(`File type ${file.type} not allowed for bucket ${bucket}`, 400)
    }

    if (file.size > maxSizes[bucket]) {
      return createErrorResponse(`File size ${file.size} exceeds maximum ${maxSizes[bucket]} bytes for bucket ${bucket}`, 400)
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      throw new Error(`Storage upload error: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return createSuccessResponse({
      file_url: publicUrl,
      path: data.path,
      bucket,
      size: file.size,
      type: file.type
    }, 'File uploaded successfully')

  } catch (error) {
    console.error('File upload error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
}
