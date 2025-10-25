-- ============================================================================
-- FLASH AUTOMATION SYSTEM
-- Creates tables and functions for intelligent Flash content enhancement
-- ============================================================================

-- 1. Content Structure Cache Table
-- Stores AI-analyzed content structure maps for fast re-use
CREATE TABLE IF NOT EXISTS public.content_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  structure_map JSONB NOT NULL,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast post lookups
CREATE INDEX IF NOT EXISTS idx_content_structures_post_id 
ON public.content_structures(post_id);

-- Index for recent analyses
CREATE INDEX IF NOT EXISTS idx_content_structures_analyzed_at 
ON public.content_structures(analyzed_at DESC);

COMMENT ON TABLE public.content_structures IS 'Caches AI-analyzed content structure maps for Flash feature insertion';
COMMENT ON COLUMN public.content_structures.structure_map IS 'JSON map of where to insert Flash features (tables, images, FAQs, etc.)';

-- 2. Flash Analytics Table
-- Tracks success rates, token usage, and performance metrics
CREATE TABLE IF NOT EXISTS public.flash_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES public.editor_workflows(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  tokens_used INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Index for workflow analytics
CREATE INDEX IF NOT EXISTS idx_flash_analytics_workflow_id 
ON public.flash_analytics(workflow_id);

-- Index for post analytics
CREATE INDEX IF NOT EXISTS idx_flash_analytics_post_id 
ON public.flash_analytics(post_id);

-- Index for feature type analytics
CREATE INDEX IF NOT EXISTS idx_flash_analytics_feature_type 
ON public.flash_analytics(feature_type);

-- Index for success rate queries
CREATE INDEX IF NOT EXISTS idx_flash_analytics_success 
ON public.flash_analytics(success);

-- Index for time-series analytics
CREATE INDEX IF NOT EXISTS idx_flash_analytics_created_date 
ON public.flash_analytics(created_date DESC);

COMMENT ON TABLE public.flash_analytics IS 'Tracks Flash workflow execution metrics for optimization and monitoring';
COMMENT ON COLUMN public.flash_analytics.feature_type IS 'Type of Flash feature (table, image, faq, product, etc.)';
COMMENT ON COLUMN public.flash_analytics.metadata IS 'Additional context (prompt used, model, settings, etc.)';

-- 3. Enable RLS on new tables
ALTER TABLE public.content_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_structures
CREATE POLICY "Authenticated users can view content structures"
ON public.content_structures
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create content structures"
ON public.content_structures
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update their content structures"
ON public.content_structures
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for flash_analytics
CREATE POLICY "Superadmins can view all flash analytics"
ON public.flash_analytics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND (role = 'superadmin' OR is_superadmin = true)
  )
);

CREATE POLICY "System can insert flash analytics"
ON public.flash_analytics
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Create function to track Flash usage
CREATE OR REPLACE FUNCTION public.track_flash_usage(
  p_workflow_id UUID,
  p_post_id UUID,
  p_feature_type TEXT,
  p_success BOOLEAN,
  p_tokens_used INTEGER DEFAULT 0,
  p_execution_time_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_analytics_id UUID;
BEGIN
  INSERT INTO public.flash_analytics (
    workflow_id,
    post_id,
    feature_type,
    success,
    tokens_used,
    execution_time_ms,
    error_message,
    metadata
  ) VALUES (
    p_workflow_id,
    p_post_id,
    p_feature_type,
    p_success,
    p_tokens_used,
    p_execution_time_ms,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO v_analytics_id;
  
  RETURN v_analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.track_flash_usage(UUID, UUID, TEXT, BOOLEAN, INTEGER, INTEGER, TEXT, JSONB) TO authenticated;

-- 5. Create default Flash workflow templates
DO $$
DECLARE
  v_workflow_id UUID;
BEGIN
  -- Template 1: Product Review Workflow
  INSERT INTO public.editor_workflows (
    name,
    description,
    workflow_steps,
    token_cost,
    is_active,
    is_default,
    created_date,
    updated_date
  ) VALUES (
    'Product Review',
    'Comprehensive product review with comparison tables, images, FAQs, and product cards',
    ARRAY[
      '{"type": "html_cleanup", "enabled": true}'::jsonb,
      '{"type": "tldr", "enabled": true}'::jsonb,
      '{"type": "faq", "enabled": true}'::jsonb,
      '{"type": "seo", "enabled": true}'::jsonb
    ]::jsonb[],
    150,
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Template 2: How-To Guide Workflow
  INSERT INTO public.editor_workflows (
    name,
    description,
    workflow_steps,
    token_cost,
    is_active,
    is_default,
    created_date,
    updated_date
  ) VALUES (
    'How-To Guide',
    'Step-by-step tutorial with instructional images, step tables, and CTAs',
    ARRAY[
      '{"type": "html_cleanup", "enabled": true}'::jsonb,
      '{"type": "tldr", "enabled": true}'::jsonb,
      '{"type": "faq", "enabled": true}'::jsonb,
      '{"type": "seo", "enabled": true}'::jsonb
    ]::jsonb[],
    140,
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Template 3: Listicle Workflow
  INSERT INTO public.editor_workflows (
    name,
    description,
    workflow_steps,
    token_cost,
    is_active,
    is_default,
    created_date,
    updated_date
  ) VALUES (
    'Listicle',
    'Numbered list article with product highlights, comparison tables, and summaries',
    ARRAY[
      '{"type": "html_cleanup", "enabled": true}'::jsonb,
      '{"type": "tldr", "enabled": true}'::jsonb,
      '{"type": "seo", "enabled": true}'::jsonb
    ]::jsonb[],
    120,
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Template 4: Educational Content Workflow
  INSERT INTO public.editor_workflows (
    name,
    description,
    workflow_steps,
    token_cost,
    is_active,
    is_default,
    created_date,
    updated_date
  ) VALUES (
    'Educational',
    'In-depth educational content with definitions, examples, FAQs, and resources',
    ARRAY[
      '{"type": "html_cleanup", "enabled": true}'::jsonb,
      '{"type": "faq", "enabled": true}'::jsonb,
      '{"type": "links_references", "enabled": true}'::jsonb,
      '{"type": "seo", "enabled": true}'::jsonb
    ]::jsonb[],
    160,
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Template 5: News/Blog Workflow
  INSERT INTO public.editor_workflows (
    name,
    description,
    workflow_steps,
    token_cost,
    is_active,
    is_default,
    created_date,
    updated_date
  ) VALUES (
    'News & Blog',
    'Quick news or blog post with key takeaways, links, and social CTAs',
    ARRAY[
      '{"type": "html_cleanup", "enabled": true}'::jsonb,
      '{"type": "tldr", "enabled": true}'::jsonb,
      '{"type": "seo", "enabled": true}'::jsonb
    ]::jsonb[],
    100,
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Created 5 default Flash workflow templates';
END $$;

-- 6. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FLASH AUTOMATION SYSTEM INSTALLED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  • content_structures (AI analysis cache)';
  RAISE NOTICE '  • flash_analytics (metrics tracking)';
  RAISE NOTICE '';
  RAISE NOTICE 'Default workflows created:';
  RAISE NOTICE '  • Product Review';
  RAISE NOTICE '  • How-To Guide';
  RAISE NOTICE '  • Listicle';
  RAISE NOTICE '  • Educational';
  RAISE NOTICE '  • News & Blog';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Ready for Flash automation!';
  RAISE NOTICE '========================================';
END $$;

