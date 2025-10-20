// Flash Workflow: Multi-step AI content enhancement orchestrator
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const STEP_TO_AGENT = {
  faq: 'faq_agent',
  faqs: 'faq_agent',
  brand_it: 'brand_it',
  brandit: 'brand_it',
  clean_html: 'html_cleanup_agent',
  html_cleanup: 'html_cleanup_agent',
  autolink: 'internal_linker',
  add_internal_links: 'internal_linker',
  autoscan: 'autoscanner',
  schema: 'schema_generator'
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureRun(supabase, runId, workflowId, totalSteps) {
  if (runId) return runId;
  
  const { data, error } = await supabase
    .from('workflow_run_statuses')
    .insert({
      workflow_id: workflowId,
      status: 'pending',
      total_steps: totalSteps || 0,
      current_step_index: -1,
      progress_message: 'Queued'
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

async function updateRun(supabase, runId, updates) {
  try {
    if (!runId) return;
    await supabase
      .from('workflow_run_statuses')
      .update(updates)
      .eq('id', runId);
  } catch (e) {
    console.error('[Flash Workflow] Run status update failed:', e?.message || e);
  }
}

async function callAgentSequential(openaiApiKey, agentName, htmlContent, timeoutSec = 120) {
  // Simplified agent call using OpenAI directly
  // In production, you'd route to specialized agents
  
  const systemPrompts = {
    faq_agent: 'Generate relevant FAQs from the content. Return JSON array: [{question, answer}]',
    brand_it: 'Apply brand styling and voice to the content. Return styled HTML.',
    html_cleanup_agent: 'Clean and optimize the HTML. Remove unnecessary tags and improve structure.',
    internal_linker: 'Identify opportunities for internal links. Return JSON: [{text, url, reason}]',
    autoscanner: 'Scan content for quality issues and suggest improvements.',
    schema_generator: 'Generate schema.org structured data for the content. Return JSON-LD.'
  };

  const systemPrompt = systemPrompts[agentName] || 'Process the content as requested.';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: htmlContent }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }),
    signal: AbortSignal.timeout(timeoutSec * 1000)
  });

  if (!response.ok) {
    throw new Error(`Agent "${agentName}" failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

const requestSchema = z.object({
  workflow_id: z.string().optional(),
  run_id: z.string().optional(),
  steps: z.array(z.string()).min(1, 'At least one step is required'),
  html_content: z.string().min(1, 'HTML content is required'),
  timeout_per_step: z.number().int().min(30).max(300).default(120)
});

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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = requestSchema.parse(req.body);

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const workflowId = payload.workflow_id || `workflow_${Date.now()}`;
    const runId = await ensureRun(supabase, payload.run_id, workflowId, payload.steps.length);

    console.log('[Flash Workflow] Starting:', {
      workflowId,
      runId,
      steps: payload.steps,
      userId: user.id
    });

    const results = [];
    let currentContent = payload.html_content;

    for (let i = 0; i < payload.steps.length; i++) {
      const step = payload.steps[i];
      const agentName = STEP_TO_AGENT[step] || step;

      await updateRun(supabase, runId, {
        current_step_index: i,
        progress_message: `Running step ${i + 1}/${payload.steps.length}: ${step}`,
        status: 'running'
      });

      console.log(`[Flash Workflow] Step ${i + 1}/${payload.steps.length}: ${step}`);

      try {
        const result = await callAgentSequential(
          openaiApiKey,
          agentName,
          currentContent,
          payload.timeout_per_step
        );

        results.push({
          step: step,
          agent: agentName,
          result: result,
          success: true
        });

        // Update content for next step (if result is HTML)
        if (result && result.includes('<')) {
          currentContent = result;
        }

      } catch (stepError) {
        console.error(`[Flash Workflow] Step "${step}" failed:`, stepError);
        
        results.push({
          step: step,
          agent: agentName,
          error: stepError.message,
          success: false
        });

        await updateRun(supabase, runId, {
          status: 'failed',
          progress_message: `Failed at step ${i + 1}: ${stepError.message}`
        });

        return res.status(500).json({
          success: false,
          error: `Workflow failed at step "${step}"`,
          results: results,
          runId: runId
        });
      }
    }

    await updateRun(supabase, runId, {
      current_step_index: payload.steps.length - 1,
      progress_message: 'Completed successfully',
      status: 'completed'
    });

    console.log('[Flash Workflow] Completed successfully');

    return res.status(200).json({
      success: true,
      workflow_id: workflowId,
      run_id: runId,
      results: results,
      final_content: currentContent
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Flash Workflow] Error:', error);
    return res.status(500).json({
      error: error.message || 'Workflow execution failed'
    });
  }
}

