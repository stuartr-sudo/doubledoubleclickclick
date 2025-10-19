import { validateRequest, validateSchema } from '../../utils/validation.js'
import { successResponse, errorResponse } from '../../utils/response.js'
import { z } from 'zod'

const notifyWebsiteSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  website_url: z.string().url('Invalid website URL format')
})

export default async function handler(req, res) {
  try {
    // Validate request method and authentication
    await validateRequest(req, { method: 'POST', requireAuth: true })
    
    // Validate request body
    const validatedData = await validateSchema(notifyWebsiteSchema, req.body)
    
    const { username, website_url } = validatedData
    
    // Get Firecrawl API key from environment
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY
    if (!firecrawlApiKey) {
      return errorResponse(res, 'Firecrawl API key not configured', 500)
    }
    
    // For now, we'll just log the notification
    // In the future, this could send data to Firecrawl for website monitoring
    console.log(`[Firecrawl] Website notification for username: ${username}, URL: ${website_url}`)
    
    // You could implement actual Firecrawl notification logic here
    // For example, sending a webhook or API call to register the website
    
    return successResponse(res, {
      success: true,
      message: 'Website notification sent successfully',
      data: {
        username,
        website_url,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Firecrawl website notification error:', error)
    return errorResponse(res, error.message, 500)
  }
}
