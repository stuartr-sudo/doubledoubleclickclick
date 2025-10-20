// Dynamic feature flag router - executes features based on feature_flag configuration
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  feature_name: z.string().min(1, 'feature_name is required'),
  payload: z.record(z.any()).optional().default({})
});

function ok(data) {
  let out = data;
  if (out == null || typeof out !== 'object') out = { output: out };
  if (out.success === undefined) out.success = true;
  return out;
}

export default async function handler(req, res) {
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
    const supabase = createClientFromRequest(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const parsed = requestSchema.parse(req.body);
    const { feature_name, payload } = parsed;

    console.log('[Feature Endpoint] Calling feature:', feature_name);

    // Load FeatureFlag configuration
    const { data: flags, error: flagError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('flag_name', feature_name)
      .limit(1);

    const flag = flags && flags[0];

    if (!flag) {
      console.warn('[Feature Endpoint] Feature flag not found:', feature_name);
      return res.status(404).json({
        success: false,
        error: `Feature "${feature_name}" not configured`
      });
    }

    // Check if feature is enabled
    if (flag.is_enabled === false) {
      return res.status(403).json({
        success: false,
        error: 'Feature is disabled globally',
        code: 'DISABLED'
      });
    }

    if (flag.is_coming_soon === true) {
      return res.status(403).json({
        success: false,
        error: 'Feature is marked as coming soon',
        code: 'COMING_SOON'
      });
    }

    const callType = flag.call_type || 'internal_function';
    const targetName = flag.target_name;

    console.log('[Feature Endpoint] Call type:', callType, 'Target:', targetName);

    // Route based on call_type
    if (callType === 'internal_function') {
      // Call a Vercel serverless function
      if (!targetName) {
        return res.status(400).json({
          success: false,
          error: 'target_name not configured for internal_function'
        });
      }

      const functionRes = await fetch(`${process.env.APP_URL}/api/${targetName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''
        },
        body: JSON.stringify(payload)
      });

      if (!functionRes.ok) {
        const errorText = await functionRes.text();
        console.error('[Feature Endpoint] Internal function error:', errorText);
        return res.status(functionRes.status).json({
          success: false,
          error: `Function "${targetName}" failed`,
          details: errorText
        });
      }

      const functionData = await functionRes.json();
      return res.status(200).json(ok(functionData));
    }

    if (callType === 'integration_core') {
      // Direct LLM/Core integration
      if (!targetName) {
        return res.status(400).json({
          success: false,
          error: 'target_name not configured for integration_core'
        });
      }

      // Route to appropriate Core integration
      const integrationMap = {
        InvokeLLM: '/api/ai/llm-router',
        SendEmail: '/api/email/send',
        UploadFile: '/api/media/upload',
        GenerateImage: '/api/media/generate-image'
      };

      const endpoint = integrationMap[targetName];
      if (!endpoint) {
        return res.status(400).json({
          success: false,
          error: `Unknown integration: ${targetName}`
        });
      }

      const integrationRes = await fetch(`${process.env.APP_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''
        },
        body: JSON.stringify(payload)
      });

      const integrationData = await integrationRes.json();
      return res.status(200).json(ok(integrationData));
    }

    if (callType === 'external_webhook') {
      const webhookUrl = targetName || flag.url;
      if (!webhookUrl) {
        return res.status(400).json({
          success: false,
          error: 'Missing webhook URL'
        });
      }

      const method = (flag.http_method || 'POST').toUpperCase();
      const headers = {
        'Content-Type': 'application/json',
        ...(flag.headers || {})
      };

      const webhookRes = await fetch(webhookUrl, {
        method: method,
        headers: headers,
        body: method === 'GET' ? undefined : JSON.stringify(payload)
      });

      const responseText = await webhookRes.text();
      let webhookData;
      try {
        webhookData = JSON.parse(responseText);
      } catch {
        webhookData = { output: responseText };
      }

      if (!webhookRes.ok) {
        const errMsg = webhookData?.error || webhookData?.message || responseText || 'Webhook error';
        return res.status(502).json({
          success: false,
          error: errMsg,
          status: webhookRes.status
        });
      }

      return res.status(200).json(ok(webhookData));
    }

    return res.status(400).json({
      success: false,
      error: `Unsupported call_type: ${callType}`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Feature Endpoint] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Feature execution failed'
    });
  }
}

