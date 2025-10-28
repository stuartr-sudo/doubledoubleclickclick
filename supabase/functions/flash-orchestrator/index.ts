import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, user_name, post_id } = await req.json()

    if (!content || !user_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Log the Flash execution
    const { error: logError } = await supabase
      .from('flash_execution_log')
      .insert({
        post_id: post_id,
        user_name: user_name,
        execution_type: 'orchestrator',
        status: 'started',
        metadata: { content_length: content.length }
      })

    if (logError) {
      console.error('Failed to log execution:', logError)
    }

    // Create Flash placeholders for the editor
    const placeholders = [
      { type: 'image', position: 1, context: 'Hero image for the article' },
      { type: 'image', position: 2, context: 'Supporting image in the middle' },
      { type: 'video', position: 3, context: 'Explanatory video' },
      { type: 'product', position: 4, context: 'Promoted product section' },
      { type: 'opinion', position: 5, context: 'Expert opinion on the topic' },
      { type: 'opinion', position: 6, context: 'Personal experience or insight' }
    ];

    // Insert placeholders into the database
    const { error: placeholderError } = await supabase
      .from('content_placeholders')
      .insert(
        placeholders.map(placeholder => ({
          post_id: post_id,
          type: placeholder.type,
          position: placeholder.position,
          context: placeholder.context,
          fulfilled: false
        }))
      );

    if (placeholderError) {
      console.error('Failed to create placeholders:', placeholderError);
    }

    // Update the execution log to completed
    await supabase
      .from('flash_execution_log')
      .update({ status: 'completed' })
      .eq('post_id', post_id)
      .eq('execution_type', 'orchestrator');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Flash orchestrator completed - placeholders created',
        content_length: content.length,
        user_name: user_name,
        placeholders_created: placeholders.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Flash orchestrator error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})