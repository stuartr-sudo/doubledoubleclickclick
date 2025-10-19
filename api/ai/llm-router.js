import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '../utils/validation.js';
import { createResponse } from '../utils/response.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    const { method } = req;

    // Validate request
    const validation = await validateRequest(req, {
      requiredAuth: true,
      allowedMethods: ['POST']
    });

    if (!validation.success) {
      return createResponse(res, validation.error, 401);
    }

    const { user } = validation;
    const { prompt, model = 'gpt-4', maxTokens = 1000, temperature = 0.7 } = req.body;

    if (!prompt) {
      return createResponse(res, { error: 'Prompt is required' }, 400);
    }

    // Check user token balance
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('token_balance')
      .eq('id', user.id)
      .single();

    if (!profile || profile.token_balance < 1) {
      return createResponse(res, { error: 'Insufficient tokens' }, 402);
    }

    // Route to appropriate LLM provider
    let response;
    let tokenCost = 1;

    if (model.includes('gpt') || model.includes('openai')) {
      response = await callOpenAI(prompt, model, maxTokens, temperature);
      tokenCost = Math.ceil(maxTokens / 100); // Rough token cost calculation
    } else if (model.includes('claude') || model.includes('anthropic')) {
      response = await callAnthropic(prompt, model, maxTokens, temperature);
      tokenCost = Math.ceil(maxTokens / 100);
    } else {
      return createResponse(res, { error: 'Unsupported model' }, 400);
    }

    // Deduct tokens from user balance
    await supabase
      .from('user_profiles')
      .update({ 
        token_balance: Math.max(0, profile.token_balance - tokenCost)
      })
      .eq('id', user.id);

    return createResponse(res, {
      response: response,
      tokensUsed: tokenCost,
      model: model
    });

  } catch (error) {
    console.error('LLM Router error:', error);
    return createResponse(res, { error: 'Internal server error' }, 500);
  }
}

async function callOpenAI(prompt, model, maxTokens, temperature) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: temperature
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${errorData}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(prompt, model, maxTokens, temperature) {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Anthropic API error: ${errorData}`);
  }

  const data = await response.json();
  return data.content[0].text;
}