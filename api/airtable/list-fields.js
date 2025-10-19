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
    const { tableId } = await request.json()

    if (!tableId) {
      return createErrorResponse('tableId is required', 400)
    }

    // Get Airtable credentials for the user
    const { data: credentials, error: credError } = await supabaseAdmin
      .from('integration_credentials')
      .select('credential_data')
      .eq('user_name', user.user_name)
      .eq('integration_type', 'airtable')
      .eq('is_active', true)
      .single()

    if (credError || !credentials) {
      return createErrorResponse('Airtable credentials not found', 404)
    }

    const airtableApiKey = credentials.credential_data.api_key
    const airtableBaseId = credentials.credential_data.base_id

    if (!airtableApiKey || !airtableBaseId) {
      return createErrorResponse('Invalid Airtable credentials', 400)
    }

    // Get table schema from Airtable
    const url = `https://api.airtable.com/v0/meta/bases/${airtableBaseId}/tables`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Airtable API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const table = data.tables?.find(t => t.id === tableId || t.name === tableId)
    
    if (!table) {
      return createErrorResponse(`Table ${tableId} not found`, 404)
    }

    return createSuccessResponse({
      tableId: table.id,
      tableName: table.name,
      fields: table.fields || []
    }, 'Table fields retrieved successfully')

  } catch (error) {
    console.error('Airtable list fields error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
}