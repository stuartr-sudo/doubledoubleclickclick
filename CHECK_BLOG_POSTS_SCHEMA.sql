-- Check blog_posts schema and compare with what Editor expects

-- Show all columns in blog_posts table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'blog_posts'
ORDER BY ordinal_position;

-- Check for specific columns the Editor uses
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  required_columns TEXT[] := ARRAY[
    'id',
    'title',
    'content',
    'status',
    'user_name',
    'user_id',
    'assigned_to_email',
    'processing_id',
    'reading_time',
    'priority',
    'client_session_key',
    'meta_title',
    'meta_description',
    'slug',
    'tags',
    'focus_keyword',
    'featured_image',
    'generated_llm_schema',
    'created_date',
    'updated_date'
  ];
  col TEXT;
  col_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BLOG_POSTS SCHEMA CHECK';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  FOREACH col IN ARRAY required_columns
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'blog_posts'
        AND column_name = col
    ) INTO col_exists;
    
    IF col_exists THEN
      RAISE NOTICE '✅ %', col;
    ELSE
      RAISE NOTICE '❌ MISSING: %', col;
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '🎉 All required columns exist!';
  ELSE
    RAISE NOTICE '⚠️  Missing % column(s)', array_length(missing_columns, 1);
    RAISE NOTICE 'Missing columns: %', array_to_string(missing_columns, ', ');
  END IF;
  RAISE NOTICE '========================================';
END $$;
