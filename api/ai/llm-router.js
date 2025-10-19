import { validateRequest, validateSchema } from '../utils/validation';
import { sendResponse } from '../utils/response';
import { getSupabaseClient } from '../utils/supabase';

export default async function handler(req, res) {
  if (!validateRequest(req, res, 'POST')) {
    return;
  }

  const schema = {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
      model: { type: 'string', default: 'gpt-4' },
      maxTokens: { type: 'number', default: 1000 },
      temperature: { type: 'number', default: 0.7 },
      response_json_schema: { type: 'object' },
      add_context_from_internet: { type: 'boolean' }
    },
    required: ['prompt'],
    additionalProperties: false,
  };

  if (!validateSchema(req, res, schema)) {
    return;
  }

  const { prompt, model, maxTokens, temperature, response_json_schema, add_context_from_internet } = req.body;

  try {
    const supabase = getSupabaseClient(req);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return sendResponse(res, 401, { success: false, error: 'Not authenticated' });
    }

    // Check if user has sufficient tokens
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('token_balance')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return sendResponse(res, 500, { success: false, error: 'Failed to check token balance' });
    }

    if (!profile || profile.token_balance <= 0) {
      return sendResponse(res, 402, { success: false, error: 'Insufficient tokens' });
    }

    // Call OpenAI API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return sendResponse(res, 500, { success: false, error: 'OpenAI API key not configured' });
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        ...(response_json_schema && { response_format: { type: 'json_object' } })
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      return sendResponse(res, 500, { success: false, error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}` });
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      return sendResponse(res, 500, { success: false, error: 'No response from OpenAI' });
    }

    // Deduct tokens from user balance
    const tokensUsed = openaiData.usage?.total_tokens || 100;
    const newBalance = Math.max(0, profile.token_balance - tokensUsed);

    await supabase
      .from('user_profiles')
      .update({ token_balance: newBalance })
      .eq('id', user.id);

    // Parse JSON response if schema was provided
    let parsedContent = content;
    if (response_json_schema) {
      try {
        parsedContent = JSON.parse(content);
      } catch (parseError) {
        console.warn('Failed to parse JSON response:', parseError);
      }
    }

    return sendResponse(res, 200, { 
      success: true, 
      data: parsedContent,
      usage: {
        tokens_used: tokensUsed,
        remaining_tokens: newBalance
      }
    });

  } catch (error) {
    console.error('LLM router error:', error);
    return sendResponse(res, 500, { success: false, error: error.message || 'Internal server error' });
  }
}