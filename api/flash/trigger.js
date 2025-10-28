import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { postId, postType, content, userName } = req.body

    if (!postId || !content) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log('🚀 Flash trigger called:', { postId, postType, userName })

    // Call the Flash orchestrator Edge Function
    const { data, error } = await supabase.functions.invoke('flash-orchestrator', {
      body: {
        postId,
        postType,
        content,
        userName,
        features: [
          'tldr',
          'table', 
          'cta',
          'faq',
          'citations',
          'internal-links',
          'anchor-menu',
          'brand-voice',
          'humanize',
          'structure',
          'clean-html'
        ]
      }
    })

    if (error) {
      console.error('Flash orchestrator error:', error)
      return res.status(500).json({ error: 'Flash processing failed', details: error.message })
    }

    console.log('✅ Flash orchestrator completed:', data)

    return res.status(200).json({ 
      success: true, 
      message: 'Flash processing completed',
      data 
    })

  } catch (error) {
    console.error('Flash trigger error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
