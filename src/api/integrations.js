import { makeAuthenticatedRequest } from './supabaseClient'

// Helper function to call Vercel API functions
const callVercelFunction = async (endpoint, data = {}) => {
  const response = await makeAuthenticatedRequest(`/api${endpoint}`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return response
}

// Core integrations wrapper that maintains Base44 API compatibility
export const Core = {
  // LLM integration
  InvokeLLM: async (data) => callVercelFunction('/ai/llm-router', data),
  
  // Email integration
  SendEmail: async (data) => callVercelFunction('/email/send', data),
  
  // File upload integration
  UploadFile: async (data) => {
    // Convert to FormData for file upload
    const formData = new FormData()
    
    if (data.file) {
      formData.append('file', data.file)
    }
    
    if (data.bucket) {
      formData.append('bucket', data.bucket)
    }
    
    if (data.path) {
      formData.append('path', data.path)
    }
    
    const response = await makeAuthenticatedRequest('/api/media/upload', {
      method: 'POST',
      body: formData
    })
    
    return { data: response }
  },
  
  // Image generation integration
  GenerateImage: async (data) => callVercelFunction('/ai/generate-image', data),
  
  // File extraction integration
  ExtractDataFromUploadedFile: async (data) => callVercelFunction('/media/extract-data', data),
  
  // Signed URL creation
  CreateFileSignedUrl: async (data) => callVercelFunction('/media/create-signed-url', data),
  
  // Private file upload
  UploadPrivateFile: async (data) => {
    // Convert to FormData for file upload
    const formData = new FormData()
    
    if (data.file) {
      formData.append('file', data.file)
    }
    
    if (data.bucket) {
      formData.append('bucket', data.bucket)
    }
    
    if (data.path) {
      formData.append('path', data.path)
    }
    
    const response = await makeAuthenticatedRequest('/api/media/upload-private', {
      method: 'POST',
      body: formData
    })
    
    return { data: response }
  }
}

// Export individual functions for backwards compatibility
export const InvokeLLM = Core.InvokeLLM
export const SendEmail = Core.SendEmail
export const UploadFile = Core.UploadFile
export const GenerateImage = Core.GenerateImage
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile
export const CreateFileSignedUrl = Core.CreateFileSignedUrl
export const UploadPrivateFile = Core.UploadPrivateFile