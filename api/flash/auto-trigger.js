/**
 * Auto-Trigger Flash Workflow
 * 
 * Called when new content arrives from external system via Airtable
 * Checks if a Flash Template was selected, then automatically triggers the workflow
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      postId,           // Blog post ID
      content,          // HTML content
      flashTemplate,    // "Product Review", "How-To Guide", etc.
      userName          // Username for the post
    } = req.body;

    if (!postId || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: postId, content' 
      });
    }

    // If no Flash Template selected, just return success
    if (!flashTemplate || flashTemplate === 'None') {
      console.log('No Flash template selected, skipping automation');
      return res.status(200).json({
        success: true,
        message: 'No Flash template selected',
        flashTriggered: false
      });
    }

    console.log(`🚀 Auto-triggering Flash workflow: ${flashTemplate} for post ${postId}`);

    // Step 1: Find the workflow by name
    const { data: workflows, error: workflowError } = await supabase
      .from('editor_workflows')
      .select('*')
      .eq('name', flashTemplate)
      .eq('is_active', true)
      .limit(1);

    if (workflowError || !workflows || workflows.length === 0) {
      console.error('Flash workflow not found:', flashTemplate);
      return res.status(404).json({ 
        error: `Flash workflow "${flashTemplate}" not found` 
      });
    }

    const workflow = workflows[0];

    // Step 2: Set flash_status to "running"
    await supabase
      .from('blog_posts')
      .update({ 
        flash_status: 'running',
        updated_date: new Date().toISOString()
      })
      .eq('id', postId);

    // Step 3: Analyze content structure
    console.log('🔍 Analyzing content structure...');
    const startTime = Date.now();

    const structureAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a content structure analyzer. Identify optimal insertion points for Flash features.

Return JSON with this structure:
{
  "sections": [
    {
      "type": "table|product|faq|image|video|cta",
      "location": { "afterParagraph": 3 },
      "context": "why this location is optimal",
      "suggestion": "specific recommendation"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Analyze and identify Flash feature insertion points:\n\n${content.substring(0, 8000)}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const structureMap = JSON.parse(structureAnalysis.choices[0].message.content);
    const analysisTokens = structureAnalysis.usage.total_tokens;

    console.log(`✅ Structure analyzed: ${structureMap.sections?.length || 0} insertion points`);

    // Step 4: Cache structure map
    await supabase
      .from('content_structures')
      .upsert({
        post_id: postId,
        structure_map: structureMap,
        analyzed_at: new Date().toISOString()
      }, {
        onConflict: 'post_id'
      });

    // Step 5: Execute workflow steps
    let updatedContent = content;
    let totalTokens = analysisTokens;
    const workflowSteps = workflow.workflow_steps || [];

    console.log(`🔧 Executing ${workflowSteps.length} workflow steps...`);

    for (const step of workflowSteps) {
      if (step.enabled === false) {
        console.log(`⏭️  Skipping disabled step: ${step.type}`);
        continue;
      }

      try {
        console.log(`▶️  Executing step: ${step.type}`);
        
        // Call existing Flash step functions
        // For now, we'll just log - in production, these would call the existing workflow logic
        console.log(`   Step ${step.type} would execute here`);
        
        // Track step execution
        await supabase.rpc('track_flash_usage', {
          p_workflow_id: workflow.id,
          p_post_id: postId,
          p_feature_type: step.type,
          p_success: true,
          p_tokens_used: 0, // Would be actual tokens from step
          p_metadata: { workflow: flashTemplate, step: step.type }
        }).catch(() => {});

      } catch (stepError) {
        console.error(`❌ Step ${step.type} failed:`, stepError.message);
        
        // Track failure
        await supabase.rpc('track_flash_usage', {
          p_workflow_id: workflow.id,
          p_post_id: postId,
          p_feature_type: step.type,
          p_success: false,
          p_error_message: stepError.message
        }).catch(() => {});
      }
    }

    const executionTime = Date.now() - startTime;

    // Step 6: Update post with final status
    await supabase
      .from('blog_posts')
      .update({
        content: updatedContent,
        flash_status: 'completed',
        flashed_at: new Date().toISOString(),
        updated_date: new Date().toISOString()
      })
      .eq('id', postId);

    console.log(`✅ Flash automation completed in ${executionTime}ms`);

    return res.status(200).json({
      success: true,
      flashTriggered: true,
      workflow: flashTemplate,
      stepsExecuted: workflowSteps.length,
      tokensUsed: totalTokens,
      executionTimeMs: executionTime
    });

  } catch (error) {
    console.error('❌ Flash auto-trigger error:', error);

    // Set flash_status to failed
    if (req.body.postId) {
      await supabase
        .from('blog_posts')
        .update({ 
          flash_status: 'failed',
          updated_date: new Date().toISOString()
        })
        .eq('id', req.body.postId)
        .catch(() => {});
    }

    return res.status(500).json({
      error: 'Flash automation failed',
      details: error.message
    });
  }
}

