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
    const { action, tableId, recordId, fields, filters, sort } = await request.json()

    if (!action || !tableId) {
      return createErrorResponse('action and tableId are required', 400)
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

    let result

    switch (action) {
      case 'listRecords':
        result = await listRecords(airtableApiKey, airtableBaseId, tableId, filters, sort)
        break
      case 'createRecord':
        result = await createRecord(airtableApiKey, airtableBaseId, tableId, fields)
        break
      case 'updateRecord':
        if (!recordId) {
          return createErrorResponse('recordId is required for updateRecord', 400)
        }
        result = await updateRecord(airtableApiKey, airtableBaseId, tableId, recordId, fields)
        break
      case 'deleteRecord':
        if (!recordId) {
          return createErrorResponse('recordId is required for deleteRecord', 400)
        }
        result = await deleteRecord(airtableApiKey, airtableBaseId, tableId, recordId)
        break
      case 'listFields':
        result = await listFields(airtableApiKey, airtableBaseId, tableId)
        break
      default:
        return createErrorResponse(`Unknown action: ${action}`, 400)
    }

    return createSuccessResponse(result, `${action} completed successfully`)

  } catch (error) {
    console.error('Airtable sync error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
}

async function listRecords(apiKey, baseId, tableId, filters = {}, sort = []) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`
  
  const params = new URLSearchParams()
  
  // Add filters
  if (filters && Object.keys(filters).length > 0) {
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        params.append(`filterByFormula`, `{${field}} = "${value}"`)
      }
    })
  }
  
  // Add sorting
  if (sort && sort.length > 0) {
    sort.forEach(sortField => {
      params.append('sort[0][field]', sortField.field || sortField)
      params.append('sort[0][direction]', sortField.direction || 'asc')
    })
  }

  const response = await fetch(`${url}?${params}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Airtable API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.records || []
}

async function createRecord(apiKey, baseId, tableId, fields) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Airtable API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data
}

async function updateRecord(apiKey, baseId, tableId, recordId, fields) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Airtable API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data
}

async function deleteRecord(apiKey, baseId, tableId, recordId) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Airtable API error: ${response.status} - ${error}`)
  }

  return { success: true, deleted: true }
}

async function listFields(apiKey, baseId, tableId) {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
    throw new Error(`Table ${tableId} not found`)
  }

  return table.fields || []
}