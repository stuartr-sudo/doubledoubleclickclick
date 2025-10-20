// llm-router: OpenAI LLM invocation for content generation
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      prompt, 
      response_json_schema, 
      add_context_from_internet = false,
      model = 'gpt-4o-mini',
      temperature = 0.7,
      max_tokens = 2000
    } = req.body;

    if (!prompt) {
      return res.status(200).json({
        success: false,
        error: 'Missing required parameter: prompt'
      });
    }

    if (!OPENAI_API_KEY) {
      return res.status(200).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    // Build OpenAI request
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant that generates structured content for marketing and SEO purposes.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens
    };

    // If JSON schema is provided, use response_format
    if (response_json_schema) {
      requestBody.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'response',
          strict: true,
          schema: response_json_schema
        }
      };
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(200).json({
        success: false,
        error: data.error?.message || 'OpenAI API error',
        details: data.error
      });
    }

    const content = data.choices?.[0]?.message?.content;

    // Parse JSON if schema was provided
    let result = content;
    if (response_json_schema && content) {
      try {
        result = JSON.parse(content);
      } catch (e) {
        return res.status(200).json({
          success: false,
          error: 'Failed to parse JSON response from LLM',
          raw_content: content
        });
      }
    }

    return res.status(200).json({
      success: true,
      result,
      usage: data.usage,
      model: data.model
    });

  } catch (error) {
    console.error('LLM router error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

