// Standardized response helper
export const createResponse = (data, status = 200, headers = {}) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers
    }
  })
}

// Error response helper
export const createErrorResponse = (message, status = 400, error = null) => {
  const errorData = {
    error: message,
    success: false,
    ...(error && { details: error })
  }

  return createResponse(errorData, status)
}

// Success response helper
export const createSuccessResponse = (data, message = 'Success') => {
  return createResponse({
    data,
    success: true,
    message
  })
}

// CORS preflight handler
export const handleCors = (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
  return null
}
