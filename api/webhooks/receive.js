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
    // Get webhook data
    const webhookData = await request.json()
    const headers = Object.fromEntries(request.headers.entries())
    
    // Extract user information from webhook data or headers
    const user_name = webhookData.user_name || headers['x-user-name'] || 'unknown'
    const title = webhookData.title || webhookData.subject || 'Webhook received'
    const content = webhookData.content || webhookData.body || webhookData.message || ''
    
    // Create webhook record in database
    const { data, error } = await supabaseAdmin
      .from('webhook_received')
      .insert({
        title,
        content,
        status: 'received',
        webhook_data: webhookData,
        user_name,
        processing_id: webhookData.processing_id || webhookData.id || null
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Trigger any processing workflows if needed
    if (webhookData.auto_process !== false) {
      // You can add webhook processing logic here
      // For now, we'll just mark it as ready for processing
      await supabaseAdmin
        .from('webhook_received')
        .update({ status: 'processing' })
        .eq('id', data.id)
    }

    return createSuccessResponse({
      id: data.id,
      status: data.status,
      processing_id: data.processing_id
    }, 'Webhook received successfully')

  } catch (error) {
    console.error('Webhook receive error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
}
