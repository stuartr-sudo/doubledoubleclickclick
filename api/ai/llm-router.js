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
    const { 
      prompt, 
      model = 'gpt-4', 
      max_tokens = 1000, 
      temperature = 0.7,
      system_prompt,
      messages,
      streaming = false
    } = await request.json()

    if (!prompt && !messages) {
      return createErrorResponse('prompt or messages are required', 400)
    }

    // Check and consume tokens
    const tokenCost = Math.ceil((prompt?.length || 0) / 100) || 1
    const { data: hasTokens, error: tokenError } = await supabaseAdmin
      .rpc('check_and_consume_tokens', {
        feature_name: 'llm_router',
        token_cost: tokenCost
      })

    if (tokenError || !hasTokens) {
      return createErrorResponse('Insufficient tokens', 402)
    }

    let result

    // Route to appropriate LLM provider
    if (model.includes('gpt')) {
      result = await callOpenAI({ prompt, model, max_tokens, temperature, system_prompt, messages, streaming })
    } else if (model.includes('claude')) {
      result = await callAnthropic({ prompt, model, max_tokens, temperature, system_prompt, messages, streaming })
    } else {
      return createErrorResponse(`Unsupported model: ${model}`, 400)
    }

    return createSuccessResponse(result, 'LLM response generated successfully')

  } catch (error) {
    console.error('LLM router error:', error)
    return createErrorResponse(error.message || 'Internal server error', 500)
  }
}

async function callOpenAI({ prompt, model, max_tokens, temperature, system_prompt, messages, streaming }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const openaiMessages = []
  
  if (system_prompt) {
    openaiMessages.push({ role: 'system', content: system_prompt })
  }
  
  if (messages && Array.isArray(messages)) {
    openaiMessages.push(...messages)
  } else if (prompt) {
    openaiMessages.push({ role: 'user', content: prompt })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      max_tokens,
      temperature,
      stream: streaming
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
  }

  if (streaming) {
    return { streaming: true, response }
  }

  const data = await response.json()
  return {
    content: data.choices[0]?.message?.content || '',
    model: data.model,
    usage: data.usage,
    finish_reason: data.choices[0]?.finish_reason
  }
}

async function callAnthropic({ prompt, model, max_tokens, temperature, system_prompt, messages, streaming }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  let anthropicMessages = []
  
  if (messages && Array.isArray(messages)) {
    anthropicMessages = messages.filter(msg => msg.role !== 'system')
  } else if (prompt) {
    anthropicMessages = [{ role: 'user', content: prompt }]
  }

  const requestBody = {
    model,
    max_tokens,
    temperature,
    messages: anthropicMessages
  }

  if (system_prompt) {
    requestBody.system = system_prompt
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return {
    content: data.content[0]?.text || '',
    model: data.model,
    usage: data.usage,
    stop_reason: data.stop_reason
  }
}
