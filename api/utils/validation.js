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

// Validation helper
export const validateRequest = (schema, data) => {
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
