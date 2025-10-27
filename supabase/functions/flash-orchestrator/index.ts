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

    // For now, return success - the actual Flash features will be implemented
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Flash orchestrator ready',
        content_length: content.length,
        user_name: user_name
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