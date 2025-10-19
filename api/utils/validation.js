import { z } from 'zod'

// Common validation schemas
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().optional()
})

export const usernameSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9-_]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores')
})

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc')
})

export const airtableSchema = z.object({
  tableId: z.string().min(1),
  recordId: z.string().optional(),
  fields: z.record(z.any()).optional()
})

export const webhookSchema = z.object({
  type: z.string(),
  data: z.record(z.any()),
  signature: z.string().optional(),
  timestamp: z.string().optional()
})

export const fileUploadSchema = z.object({
  file: z.any(),
  bucket: z.string().default('images'),
  path: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

// Validation helper for request validation
export const validateRequest = async (req, options = {}) => {
  const { requiredAuth = false, allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'] } = options;

  // Check method
  if (!allowedMethods.includes(req.method)) {
    return { success: false, error: { error: 'Method not allowed' }, status: 405 };
  }

  // Check authentication if required
  if (requiredAuth) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        return { success: false, error: { error: 'Server configuration error' }, status: 500 };
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get authorization header
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: { error: 'Missing or invalid authorization header' }, status: 401 };
      }

      const token = authHeader.substring(7);
      
      // Verify the JWT token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return { success: false, error: { error: 'Invalid or expired token' }, status: 401 };
      }

      return { success: true, user };
    } catch (error) {
      console.error('Auth validation error:', error);
      return { success: false, error: { error: 'Authentication failed' }, status: 401 };
    }
  }

  return { success: true };
}

// Validation helper for schema validation
export const validateSchema = (schema, data) => {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
}

// Sanitize HTML content
export const sanitizeHtml = (html) => {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

// Validate file type and size
export const validateFile = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 10 * 1024 * 1024) => {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`)
  }
  
  if (file.size > maxSize) {
    throw new Error(`File size ${file.size} exceeds maximum ${maxSize} bytes`)
  }
  
  return true
}
